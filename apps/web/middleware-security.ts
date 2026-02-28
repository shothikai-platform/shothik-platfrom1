import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/security/api-keys";
import { owaspMiddleware, addSecurityHeaders } from "@/lib/security/owasp-compliance";
import { detectSuspiciousActivity, isIPBlocked, logSecurityEvent } from "@/lib/security/monitoring";

/**
 * Combined security middleware
 * Implements all missing security features from the checklist
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // 1. Check if IP is blocked
  const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  const blockCheck = await isIPBlocked(clientIP);
  
  if (blockCheck.blocked) {
    await logSecurityEvent({
      type: "violation",
      severity: "medium",
      source: { ip: clientIP },
      details: {
        path: request.nextUrl.pathname,
        method: request.method,
        description: `Blocked IP attempted access: ${blockCheck.reason}`,
      },
    });
    
    return NextResponse.json(
      { error: "Access denied" },
      { status: 403 }
    );
  }
  
  // 2. OWASP API Security checks
  const owaspResult = await owaspMiddleware(request);
  if (owaspResult) {
    return owaspResult;
  }
  
  // 3. Detect suspicious activity
  const suspiciousCheck = await detectSuspiciousActivity(request);
  
  if (suspiciousCheck.action === "block") {
    await logSecurityEvent({
      type: "suspicious",
      severity: "high",
      source: { ip: clientIP },
      details: {
        path: request.nextUrl.pathname,
        method: request.method,
        description: suspiciousCheck.reasons.join("; "),
      },
    });
    
    return NextResponse.json(
      { error: "Suspicious activity detected" },
      { status: 403 }
    );
  }
  
  // 4. API Key authentication (if Bearer token present)
  const authHeader = request.headers.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const apiKeyResult = await authenticateApiKey(request);
    
    if (!apiKeyResult.success) {
      await logSecurityEvent({
        type: "auth_failure",
        severity: "medium",
        source: { ip: clientIP },
        details: {
          path: request.nextUrl.pathname,
          method: request.method,
          description: apiKeyResult.error || "API key authentication failed",
        },
      });
      
      const response = NextResponse.json(
        { error: apiKeyResult.error },
        { status: apiKeyResult.status || 401 }
      );
      
      // Add rate limit headers if present
      if (apiKeyResult.headers) {
        Object.entries(apiKeyResult.headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }
      
      return response;
    }
    
    // Add user context to request
    (request as any).apiKeyUser = {
      userId: apiKeyResult.userId,
      permissions: apiKeyResult.permissions,
    };
    
    // Add rate limit headers to successful response
    const requestHeaders = new Headers(request.headers);
    if (apiKeyResult.headers) {
      Object.entries(apiKeyResult.headers).forEach(([key, value]) => {
        requestHeaders.set(key, value);
      });
    }
  }
  
  // 5. Continue to handler
  const response = NextResponse.next();
  
  // 6. Add security headers
  addSecurityHeaders(response);
  
  // 7. Log request duration
  const duration = Date.now() - startTime;
  response.headers.set("X-Response-Time", `${duration}ms`);
  
  return response;
}

/**
 * Configure which paths the middleware runs on
 */
export const config = {
  matcher: [
    // API routes
    "/api/:path*",
    
    // Exclude static files and public routes
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
