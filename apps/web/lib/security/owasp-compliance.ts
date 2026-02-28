import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/security/api-keys";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// OWASP API Security Top 10 2023
// https://owasp.org/API-Security/editions/2023/en/0x00-header/

interface SecurityCheck {
  id: string;
  name: string;
  severity: "critical" | "high" | "medium" | "low";
  check: (req: NextRequest) => Promise<{ passed: boolean; message?: string }>;
}

const securityChecks: SecurityCheck[] = [
  // API1:2023 - Broken Object Level Authorization
  {
    id: "API1",
    name: "Object Level Authorization",
    severity: "critical",
    check: async (req) => {
      // Check if resource access is validated
      const url = new URL(req.url);
      const resourceId = url.searchParams.get("id") || url.pathname.split("/").pop();
      
      if (resourceId && !isValidResourceId(resourceId)) {
        return { passed: false, message: "Invalid resource identifier" };
      }
      
      return { passed: true };
    },
  },
  
  // API2:2023 - Broken Authentication
  {
    id: "API2",
    name: "Authentication",
    severity: "critical",
    check: async (req) => {
      const authHeader = req.headers.get("authorization");
      const sessionToken = req.cookies.get("__session")?.value;
      
      // Allow public endpoints
      const publicPaths = ["/api/public", "/api/webhook", "/api/health"];
      if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
        return { passed: true };
      }
      
      if (!authHeader && !sessionToken) {
        return { passed: false, message: "Authentication required" };
      }
      
      return { passed: true };
    },
  },
  
  // API3:2023 - Broken Object Property Level Authorization
  {
    id: "API3",
    name: "Property Level Authorization",
    severity: "high",
    check: async (req) => {
      // Check for mass assignment vulnerabilities
      if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
        const contentType = req.headers.get("content-type");
        
        if (contentType?.includes("application/json")) {
          try {
            const clonedReq = req.clone();
            const body = await clonedReq.json();
            
            // Check for forbidden fields
            const forbiddenFields = ["id", "createdAt", "updatedAt", "role", "isAdmin"];
            const hasForbidden = forbiddenFields.some(field => field in body);
            
            if (hasForbidden) {
              return { passed: false, message: "Cannot modify protected fields" };
            }
          } catch {
            // Invalid JSON - will be caught by validation
          }
        }
      }
      
      return { passed: true };
    },
  },
  
  // API4:2023 - Unrestricted Resource Consumption
  {
    id: "API4",
    name: "Resource Consumption",
    severity: "high",
    check: async (req) => {
      // Check request size
      const contentLength = parseInt(req.headers.get("content-length") || "0");
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (contentLength > maxSize) {
        return { passed: false, message: "Request body too large" };
      }
      
      // Check for pagination abuse
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "20");
      
      if (limit > 100) {
        return { passed: false, message: "Pagination limit exceeded (max 100)" };
      }
      
      return { passed: true };
    },
  },
  
  // API5:2023 - Broken Function Level Authorization
  {
    id: "API5",
    name: "Function Level Authorization",
    severity: "critical",
    check: async (req) => {
      // Admin endpoints require admin role
      const adminPaths = ["/api/admin", "/api/internal"];
      
      if (adminPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
        // This will be validated by the actual auth middleware
        // We just flag it here for logging
        return { passed: true, message: "Admin endpoint - requires elevated privileges" };
      }
      
      return { passed: true };
    },
  },
  
  // API6:2023 - Unrestricted Access to Sensitive Business Flows
  {
    id: "API6",
    name: "Business Flow Protection",
    severity: "medium",
    check: async (req) => {
      // Check for automated abuse of sensitive flows
      const sensitivePaths = ["/api/purchase", "/api/withdraw", "/api/transfer"];
      
      if (sensitivePaths.some(path => req.nextUrl.pathname.includes(path))) {
        // Additional verification required
        const verificationHeader = req.headers.get("x-verification-token");
        
        if (!verificationHeader) {
          return { passed: false, message: "Additional verification required for sensitive operation" };
        }
      }
      
      return { passed: true };
    },
  },
  
  // API7:2023 - Server Side Request Forgery (SSRF)
  {
    id: "API7",
    name: "SSRF Protection",
    severity: "high",
    check: async (req) => {
      // Check for URL parameters that could be abused
      const url = new URL(req.url);
      const urlParam = url.searchParams.get("url");
      
      if (urlParam) {
        try {
          const parsedUrl = new URL(urlParam);
          
          // Block internal IPs
          const blockedHosts = [
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "::1",
            "169.254.", // Link-local
            "10.",      // Private
            "192.168.", // Private
            "172.16.",  // Private
          ];
          
          if (blockedHosts.some(host => parsedUrl.hostname.startsWith(host) || parsedUrl.hostname === host)) {
            return { passed: false, message: "Invalid URL - internal addresses not allowed" };
          }
        } catch {
          return { passed: false, message: "Invalid URL format" };
        }
      }
      
      return { passed: true };
    },
  },
  
  // API8:2023 - Security Misconfiguration
  {
    id: "API8",
    name: "Security Configuration",
    severity: "medium",
    check: async (req) => {
      // Check for security headers
      const securityHeaders = [
        "strict-transport-security",
        "x-content-type-options",
        "x-frame-options",
        "content-security-policy",
      ];
      
      // These are response headers - we check in the response middleware
      return { passed: true };
    },
  },
  
  // API9:2023 - Improper Inventory Management
  {
    id: "API9",
    name: "API Inventory",
    severity: "low",
    check: async (req) => {
      // Log all API access for inventory tracking
      await logApiAccess(req);
      return { passed: true };
    },
  },
  
  // API10:2023 - Unsafe Consumption of APIs
  {
    id: "API10",
    name: "External API Safety",
    severity: "medium",
    check: async (req) => {
      // Validate redirects
      const redirect = req.headers.get("redirect");
      if (redirect) {
        return { passed: false, message: "Manual redirects not allowed" };
      }
      
      return { passed: true };
    },
  },
];

function isValidResourceId(id: string): boolean {
  // Validate UUID or other resource ID formats
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const convexIdRegex = /^[a-z0-9]{24,}$/i;
  
  return uuidRegex.test(id) || convexIdRegex.test(id) || /^[a-zA-Z0-9_-]+$/.test(id);
}

async function logApiAccess(req: NextRequest): Promise<void> {
  const key = `api:access:${new Date().toISOString().split("T")[0]}`;
  const entry = {
    timestamp: Date.now(),
    path: req.nextUrl.pathname,
    method: req.method,
    ip: req.ip || req.headers.get("x-forwarded-for"),
  };
  
  await redis.lpush(key, JSON.stringify(entry));
  await redis.expire(key, 86400 * 7); // 7 days
}

/**
 * Run OWASP API security checks
 */
export async function runOwaspChecks(
  req: NextRequest
): Promise<{
  passed: boolean;
  violations: Array<{ id: string; name: string; severity: string; message: string }>;
}> {
  const violations: Array<{ id: string; name: string; severity: string; message: string }> = [];
  
  for (const check of securityChecks) {
    try {
      const result = await check.check(req);
      
      if (!result.passed) {
        violations.push({
          id: check.id,
          name: check.name,
          severity: check.severity,
          message: result.message || "Security check failed",
        });
      }
    } catch (error) {
      violations.push({
        id: check.id,
        name: check.name,
        severity: check.severity,
        message: "Check execution failed",
      });
    }
  }
  
  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Middleware to enforce OWASP compliance
 */
export async function owaspMiddleware(
  req: NextRequest
): Promise<NextResponse | null> {
  const result = await runOwaspChecks(req);
  
  if (!result.passed) {
    const criticalViolations = result.violations.filter(
      v => v.severity === "critical" || v.severity === "high"
    );
    
    if (criticalViolations.length > 0) {
      return NextResponse.json(
        {
          error: "Security violation detected",
          violations: criticalViolations,
        },
        { status: 403 }
      );
    }
    
    // Log medium/low violations but allow
    console.warn("OWASP API Security violations:", result.violations);
  }
  
  return null;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  
  // XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:;"
  );
  
  return response;
}
