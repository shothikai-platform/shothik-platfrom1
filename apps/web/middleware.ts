import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import {
  getRateLimitForPath,
  getMaxWindowMs,
  MAX_RATE_LIMIT_STORE_SIZE,
} from "./lib/rate-limit-config";
import { incrementCounter, setGauge, maybeLogMetrics } from "./lib/runtime-metrics";
import { authenticateApiKey } from "./lib/security/api-keys";
import { owaspMiddleware, addSecurityHeaders as addOwaspHeaders } from "./lib/security/owasp-compliance";
import { detectSuspiciousActivity, isIPBlocked, logSecurityEvent } from "./lib/security/monitoring";
import { checkDDoSProtection } from "./lib/security/ddos-protection";

const RATE_LIMIT_STORE = new Map<string, { timestamps: number[] }>();

// JWKS URL for JWT verification
const JWKS_URL = process.env.NEXT_PUBLIC_CONVEX_URL
  ? `${process.env.NEXT_PUBLIC_CONVEX_URL}/.well-known/jwks.json`
  : null;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
if (JWKS_URL) {
  jwks = createRemoteJWKSet(new URL(JWKS_URL));
}

function getClientId(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(
  key: string,
  config: { windowMs: number; maxRequests: number }
): { limited: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  let entry = RATE_LIMIT_STORE.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    RATE_LIMIT_STORE.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > now - config.windowMs);

  if (entry.timestamps.length >= config.maxRequests) {
    incrementCounter("ratelimit.rejected");
    return {
      limited: true,
      remaining: 0,
      resetAt: entry.timestamps[0] + config.windowMs,
    };
  }

  entry.timestamps.push(now);
  return {
    limited: false,
    remaining: config.maxRequests - entry.timestamps.length,
    resetAt: now + config.windowMs,
  };
}

let lastCleanup = Date.now();
function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;

  const maxWindowMs = getMaxWindowMs();

  for (const [key, entry] of RATE_LIMIT_STORE) {
    entry.timestamps = entry.timestamps.filter((t) => t > now - maxWindowMs);
    if (entry.timestamps.length === 0) {
      RATE_LIMIT_STORE.delete(key);
    }
  }

  if (RATE_LIMIT_STORE.size > MAX_RATE_LIMIT_STORE_SIZE) {
    const excess = RATE_LIMIT_STORE.size - MAX_RATE_LIMIT_STORE_SIZE;
    const keys = RATE_LIMIT_STORE.keys();
    for (let i = 0; i < excess; i++) {
      const next = keys.next();
      if (!next.done) RATE_LIMIT_STORE.delete(next.value);
    }
    incrementCounter("ratelimit.store_evictions", excess);
  }

  setGauge("ratelimit.store_size", RATE_LIMIT_STORE.size);
  maybeLogMetrics();
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(self), payment=(self)",
};

function addSecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

async function verifyJWT(token: string): Promise<{ valid: boolean; payload?: any; error?: string }> {
  if (!jwks) {
    return { valid: false, error: "JWKS not configured" };
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      algorithms: ["RS256"],
      issuer: process.env.NEXT_PUBLIC_CONVEX_URL,
    });
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: (error as Error).message };
  }
}

export async function middleware(req: NextRequest) {
  const startTime = Date.now();
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("jwt_token")?.value;
  const clientIP = getClientId(req);

  // 0. DDoS Protection (Layer 0 - First line of defense)
  const ddosCheck = await checkDDoSProtection(req);
  if (!ddosCheck.allowed) {
    await logSecurityEvent({
      type: "violation",
      severity: "high",
      source: { ip: clientIP },
      details: {
        path: pathname,
        method: req.method,
        description: `DDoS protection triggered: ${ddosCheck.reason}`,
      },
    });

    const response = new NextResponse(
      JSON.stringify({ 
        error: "Request blocked", 
        reason: ddosCheck.reason,
        retryAfter: ddosCheck.retryAfter 
      }), 
      { 
        status: ddosCheck.action === "challenge" ? 403 : 429,
        headers: {
          "Content-Type": "application/json",
          ...(ddosCheck.retryAfter ? { "Retry-After": String(ddosCheck.retryAfter) } : {})
        }
      }
    );
    return addSecurityHeaders(response);
  }

  // 1. Check if IP is blocked
  const blockCheck = await isIPBlocked(clientIP);
  if (blockCheck.blocked) {
    await logSecurityEvent({
      type: "violation",
      severity: "medium",
      source: { ip: clientIP },
      details: {
        path: pathname,
        method: req.method,
        description: `Blocked IP attempted access: ${blockCheck.reason}`,
      },
    });
    return addSecurityHeaders(
      new NextResponse(JSON.stringify({ error: "Access denied" }), { status: 403 })
    );
  }

  // 2. Detect suspicious activity
  const suspiciousCheck = await detectSuspiciousActivity(req);
  if (suspiciousCheck.action === "block") {
    await logSecurityEvent({
      type: "suspicious",
      severity: "high",
      source: { ip: clientIP },
      details: {
        path: pathname,
        method: req.method,
        description: suspiciousCheck.reasons.join("; "),
      },
    });
    return addSecurityHeaders(
      new NextResponse(JSON.stringify({ error: "Suspicious activity detected" }), { status: 403 })
    );
  }

  // API routes - apply rate limiting, auth, and OWASP checks
  if (pathname.startsWith("/api/")) {
    cleanupStore();

    // 3. OWASP API Security checks
    const owaspResult = await owaspMiddleware(req);
    if (owaspResult) return owaspResult;

    // Public health check endpoints
    if (pathname === "/api/health" || pathname.startsWith("/api/.well-known")) {
      return addSecurityHeaders(NextResponse.next());
    }

    // 4. API Key authentication (if Bearer token present)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const apiKeyResult = await authenticateApiKey(req);
      if (!apiKeyResult.success) {
        await logSecurityEvent({
          type: "auth_failure",
          severity: "medium",
          source: { ip: clientIP },
          details: {
            path: pathname,
            method: req.method,
            description: apiKeyResult.error || "API key authentication failed",
          },
        });

        const response = new NextResponse(
          JSON.stringify({ error: apiKeyResult.error }),
          { status: apiKeyResult.status || 401 }
        );

        if (apiKeyResult.headers) {
          Object.entries(apiKeyResult.headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        }
        return addSecurityHeaders(response);
      }

      // Add API key user context
      (req as any).apiKeyUser = {
        userId: apiKeyResult.userId,
        permissions: apiKeyResult.permissions,
      };
    }

    // Auth endpoints - stricter rate limiting
    if (pathname.startsWith("/api/auth/")) {
      const rateLimitKey = `auth:${clientIP}`;
      const { limited, resetAt } = checkRateLimit(rateLimitKey, {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10, // 10 attempts
      });

      if (limited) {
        const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
        await logSecurityEvent({
          type: "rate_limit",
          severity: "low",
          source: { ip: clientIP },
          details: {
            path: pathname,
            method: req.method,
            description: "Auth rate limit exceeded",
          },
        });
        return addSecurityHeaders(
          new NextResponse(
            JSON.stringify({
              error: "Too many authentication attempts",
              message: "Please try again later",
              retryAfter,
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(retryAfter),
              },
            }
          )
        );
      }
    }

    // Protected API routes - verify JWT
    const protectedRoutes = [
      "/api/writing/",
      "/api/studio/",
      "/api/publishing/",
      "/api/billing/",
      "/api/admin/",
    ];

    const isProtected = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isProtected) {
      if (!token) {
        return addSecurityHeaders(
          new NextResponse(
            JSON.stringify({ error: "Authentication required" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }

      const { valid, error } = await verifyJWT(token);

      if (!valid) {
        await logSecurityEvent({
          type: "auth_failure",
          severity: "medium",
          source: { ip: clientIP },
          details: {
            path: pathname,
            method: req.method,
            description: `JWT verification failed: ${error}`,
          },
        });
        return addSecurityHeaders(
          new NextResponse(
            JSON.stringify({ error: "Invalid token", details: error }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }
    }

    // General rate limiting
    const routePrefix = "/" + pathname.split("/").slice(1, 3).join("/");
    const rateLimitKey = `${clientIP}:${routePrefix}`;
    const rateConfig = getRateLimitForPath(pathname);

    const { limited, remaining, resetAt } = checkRateLimit(
      rateLimitKey,
      rateConfig
    );

    if (limited) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      await logSecurityEvent({
        type: "rate_limit",
        severity: "low",
        source: { ip: clientIP },
        details: {
          path: pathname,
          method: req.method,
          description: "General rate limit exceeded",
        },
      });
      return addSecurityHeaders(
        new NextResponse(
          JSON.stringify({
            error: "Too many requests",
            message: "Please wait before trying again",
            retryAfter,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
            },
          }
        )
      );
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(resetAt / 1000))
    );
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
    return addSecurityHeaders(response);
  }

  // Dashboard routes - check token exists (will be verified by API calls)
  if (pathname.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // Auth routes - redirect if already logged in
  if (pathname.startsWith("/auth") && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);
  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*",
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};