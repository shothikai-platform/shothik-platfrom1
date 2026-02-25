# Shothik AI - Critical Issues Fix Plan

## Issues Identified (Priority Order)

### 🔴 CRITICAL - Security (Must Fix Before ANY Launch)
1. JWT authentication bypass vulnerability
2. Hardcoded secrets in source code
3. CORS allows any origin
4. No rate limiting on API endpoints
5. Unprotected admin/vector API routes
6. No input validation/XSS protection

### 🟡 HIGH - Backend Infrastructure
7. Convex production deploy (stable URL)
8. Redis caching not configured
9. AI Detector not converted to ONNX (slow)
10. Writing Studio uses localStorage (data loss risk)
11. Stripe live keys not set up

### 🟢 MEDIUM - Code Quality
12. 2000+ line components need refactoring
13. Mixed JS/TS files
14. No test coverage
15. No error boundaries

---

## Execution Plan

### Phase 1: Security Hardening (Week 1)
- [ ] Fix JWT bypass vulnerability
- [ ] Remove hardcoded secrets
- [ ] Fix CORS configuration
- [ ] Add rate limiting (Redis)
- [ ] Add input validation (Zod)
- [ ] Add XSS protection (DOMPurify)

### Phase 2: Backend Infrastructure (Week 2)
- [ ] Set up Redis
- [ ] Configure rate limiting tiers
- [ ] Set up Convex production deploy
- [ ] Migrate Writing Studio to Convex

### Phase 3: AI/ML Optimization (Week 3)
- [ ] ONNX conversion for AI Detector
- [ ] Implement circuit breakers
- [ ] Set up caching layer
- [ ] AI Gateway with fallbacks

### Phase 4: Payments & Publishing (Week 4)
- [ ] Stripe Connect integration
- [ ] Royalty calculation engine
- [ ] Sales data import pipeline

### Phase 5: Code Quality (Week 5-6)
- [ ] Add error boundaries
- [ ] Refactor large components
- [ ] Add basic test coverage

---

## Immediate Actions (Today)

1. Security audit - find all vulnerable code
2. Fix JWT authentication
3. Remove hardcoded secrets
4. Fix CORS

Let me begin.
