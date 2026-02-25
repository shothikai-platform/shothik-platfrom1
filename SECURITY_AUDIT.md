# Security Audit Report - Shothik AI

## Date: February 24, 2026
## Auditor: Kimi Claw

---

## 🔴 CRITICAL Issues Found

### 1. Hardcoded JWKS in Source Code
**File:** `convex/http.ts`
**Issue:** RSA public key is hardcoded in the source code
**Risk:** Private key could be exposed if repo is public; keys cannot be rotated
**Fix:** Move to environment variable

### 2. CORS Allows Any Origin (Fallback)
**File:** `backend-services/nlp-inference-service/main.py`
**Issue:** If ALLOWED_ORIGINS is not set, CORS defaults to empty list but the middleware still allows all origins in development
**Risk:** CSRF attacks, unauthorized API access
**Fix:** Explicitly set allowed origins, no fallback to open

### 3. No JWT Verification in Middleware
**File:** `apps/web/middleware.ts`
**Issue:** Token is checked for existence but not verified
**Risk:** Anyone can set a fake cookie and access protected routes
**Fix:** Verify JWT signature and expiration

### 4. Missing Rate Limiting on Critical Routes
**File:** Various API routes
**Issue:** No rate limiting on auth endpoints, AI tool endpoints
**Risk:** Brute force attacks, API abuse, high costs
**Fix:** Implement tier-based rate limiting with Redis

### 5. No Input Validation
**File:** Multiple API routes
**Issue:** No Zod/Joi validation on request bodies
**Risk:** Injection attacks, malformed data crashes
**Fix:** Add schema validation to all endpoints

---

## 🟡 HIGH Priority Issues

### 6. localStorage for Project Data
**File:** Writing Studio components
**Issue:** Projects stored in browser localStorage
**Risk:** Data loss, no cross-device sync
**Fix:** Migrate to Convex persistence

### 7. No Error Boundaries
**File:** React components
**Issue:** No React error boundaries
**Risk:** White screen crashes, poor UX
**Fix:** Add error boundaries at page and component level

### 8. XSS Vulnerabilities
**File:** Components using dangerouslySetInnerHTML
**Issue:** ~30 instances without DOMPurify
**Risk:** XSS attacks
**Fix:** Sanitize all HTML before rendering

---

## Recommended Fix Priority

1. **Immediate (Today):**
   - Fix hardcoded JWKS
   - Add JWT verification to middleware
   - Fix CORS configuration

2. **This Week:**
   - Implement rate limiting
   - Add input validation
   - Add XSS protection

3. **Next Week:**
   - Migrate localStorage to Convex
   - Add error boundaries
   - Set up monitoring
