# Shothik AI — Backend Implementation Plan
**Date:** February 23, 2026  
**Document Version:** 1.0  
**Scope:** All backend systems needed to bring Shothik AI from "frontend-complete" to "production-ready"  
**Target:** Launch-ready platform within 12-16 weeks  
**Primary Backend:** DigitalOcean (Droplets, Managed Redis, Managed MongoDB)  
**Publishing Backend:** Convex Cloud (currently preview deploy at `healthy-mastiff-358.convex.cloud`)  
**Frontend API Proxy:** Next.js API Routes (already 22 routes exist)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Backend State Audit](#2-current-backend-state-audit)
3. [Backend Architecture Overview](#3-backend-architecture-overview)
4. [Phase 1: Security & Infrastructure (Weeks 1-3)](#phase-1)
5. [Phase 2: Core Tool Services Hardening (Weeks 3-6)](#phase-2)
6. [Phase 3: Publishing Platform Backend (Weeks 5-8)](#phase-3)
7. [Phase 4: Payments & Payouts (Weeks 7-10)](#phase-4)
8. [Phase 5: Automation & Scaling (Weeks 10-14)](#phase-5)
9. [Phase 6: Analytics, Monitoring & Admin (Weeks 12-16)](#phase-6)
10. [API Specification Summary](#7-api-specification)
11. [Database Schema Master Plan](#8-database-schema)
12. [Environment Variables & Secrets](#9-env-vars)
13. [Dependency Graph](#10-dependency-graph)
14. [Risk Matrix](#11-risk-matrix)
15. [Team & Effort Estimates](#12-team-effort)

---

<a name="1-executive-summary"></a>
## 1. Executive Summary

### The Problem

Shothik AI has a feature-rich frontend (886 components, 93 hooks, 31 services) but the backend is incomplete for production launch:

- **5 AI tools** call `prod-api.shothik.ai` — these endpoints exist but need hardening (rate limiting, circuit breakers, caching, ONNX speed improvements)
- **Publishing platform** uses Convex (preview deploy) — needs production deploy key and proper persistence
- **Writing Studio** stores projects in localStorage — data loss risk
- **Payments** (Stripe Connect, Payoneer) — API routes exist but no live keys or real integration
- **Security** — QA audit (Jan 2026) found critical JWT bypass, CORS issues, no route authentication

### The Solution

A 6-phase backend implementation plan that takes the platform from "frontend-complete" to "production-ready":

```
Phase 1: Security & Infrastructure       (Weeks 1-3)   — JWT fix, CORS, rate limiting, monitoring
Phase 2: Core Tool Services Hardening    (Weeks 3-6)   — Circuit breakers, caching, ONNX, model routing
Phase 3: Publishing Platform Backend     (Weeks 5-8)   — Convex production, file validation, review pipeline
Phase 4: Payments & Payouts              (Weeks 7-10)  — Stripe Connect, Payoneer, royalty engine
Phase 5: Automation & Scaling            (Weeks 10-14) — ONIX feeds, PublishDrive, sales import, queues
Phase 6: Analytics, Monitoring & Admin   (Weeks 12-16) — Dashboard, alerting, admin tools
```

**Total estimated effort:** ~280-350 engineering hours across 16 weeks

---

<a name="2-current-backend-state-audit"></a>
## 2. Current Backend State Audit

### What Exists (Backend — DigitalOcean)

| Component | Status | Details |
|-----------|--------|---------|
| Primary API (`prod-api.shothik.ai`) | Running | Serves 5 AI tools (paraphrase, plagiarism, AI detector, grammar, humanize) |
| QA API (`api-qa.shothik.ai`) | Running | QA environment — unreachable from Replit |
| MongoDB | Running | User data, tool history, wallet transactions |
| Redis | Unknown | Referenced in Implementation_Plan.md but status unclear |
| RabbitMQ | Configured | In codebase but underutilized (per Agent 16 audit) |
| JWT Auth | Broken | `jwt.decode` fallback bypasses verification (Jan 2026 QA audit) |
| CORS | Overly permissive | Allows requests from any origin |
| Rate Limiting | None | Zero rate limiting on any endpoint |
| Secrets | Hardcoded | Found in source code (Jan 2026 QA audit) |

### What Exists (Convex — Publishing Backend)

| Component | Status | Details |
|-----------|--------|---------|
| Schema | Done | 6 tables: projects, projectVersions, books, salesRecords, payouts, payoutAccounts |
| Books CRUD | Done | `convex/books.ts` — 436 lines, full lifecycle |
| Earnings Queries | Done | `convex/earnings.ts` — 327 lines, summary/per-book/monthly |
| Admin Functions | Done | `convex/admin.ts` — 339 lines, review/approve/reject/publish |
| Auth (RS256 JWT) | Done | `convex/auth.config.ts` + `convex/http.ts` — JWKS verification |
| Deploy | Preview only | URL changes on every deploy — needs production key |

### What Exists (Next.js API Routes — Frontend Proxy)

| Route | Purpose | Status |
|-------|---------|--------|
| `/api/auth/convex-token` | JWT exchange for Convex auth | Done |
| `/api/.well-known/jwks.json` | JWKS public key endpoint | Done |
| `/api/stripe/connect` | Stripe Connect OAuth onboarding | Exists, not tested |
| `/api/stripe/payout` | Stripe payout initiation | Exists, not tested |
| `/api/ai-cowriter` | Gemini AI co-writer for Writing Studio | Done, no rate limiting |
| `/api/latex/*` | LaTeX compilation (convert, status, download) | Done, 4 routes |
| `/api/research/*` | Deep research chat CRUD | Done, 5 routes |
| `/api/sheet/*` | Sheet AI conversation CRUD | Done, 2 routes |
| `/api/templates` | Writing templates | Done |
| `/api/health` | Health check | Done |
| `/api/geolocation` | IP geolocation | Done |

### What Does NOT Exist (Gaps)

| Gap | Priority | Impact |
|-----|----------|--------|
| Production Convex deploy (stable URL) | P0 | Publishing platform breaks on every deploy |
| Stripe API keys (live mode) | P0 | Payouts cannot process |
| ONNX runtime for AI Detector | P0 | Detection speed is ~2s, target <500ms |
| Backend security fixes (JWT, CORS, secrets) | P0 | Platform is not production-safe |
| API rate limiting | P0 | Abuse risk on all endpoints |
| Redis cache infrastructure | P1 | No caching on AI tool results |
| Circuit breaker / model routing | P1 | No fallback when DeepSeek or Gemini fails |
| Sales data import pipeline | P1 | No way to ingest Google Play sales reports |
| Royalty calculation engine | P1 | Earnings dashboard has no real data |
| ONIX feed generation | P2 | Manual Google Play uploads only |
| PublishDrive API integration | P2 | Single-store distribution only |
| Email notification system | P2 | No transactional emails (status updates, payouts) |
| Admin analytics dashboard | P2 | No visibility into platform metrics |
| Route-level error/loading boundaries | P1 | White screen on crashes |
| DOMPurify XSS protection | P0 | ~30 `dangerouslySetInnerHTML` without sanitization |

---

<a name="3-backend-architecture-overview"></a>
## 3. Backend Architecture Overview

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 16 — Replit / Vercel)                       │
│  ├── 886 components, 93 hooks, 31 services                     │
│  ├── Next.js API Routes (proxy + auth)                         │
│  │   ├── /api/auth/*          (JWT exchange, JWKS)             │
│  │   ├── /api/stripe/*        (Stripe Connect, Payouts)        │
│  │   ├── /api/ai-cowriter     (Gemini proxy)                   │
│  │   ├── /api/latex/*         (LaTeX compilation)              │
│  │   ├── /api/research/*      (Deep research CRUD)             │
│  │   └── /api/admin/*         (Admin endpoints — NEW)          │
│  └── RTK Query + Service Layer → Backend API                   │
└────────────────────┬────────────────────┬──────────────────────┘
                     │                    │
           ┌─────────▼────────┐  ┌───────▼────────────────┐
           │  BACKEND API     │  │  CONVEX CLOUD          │
           │  (DigitalOcean)  │  │  (Publishing Backend)  │
           │                  │  │                        │
           │  ├── Auth/JWT    │  │  ├── books (CRUD)      │
           │  ├── Paraphrase  │  │  ├── earnings          │
           │  ├── Plagiarism  │  │  ├── admin (review)    │
           │  ├── AI Detector │  │  ├── projects          │
           │  ├── Grammar     │  │  ├── payouts           │
           │  ├── Humanize    │  │  ├── payoutAccounts    │
           │  ├── Summarize   │  │  └── salesRecords      │
           │  └── Wallet      │  │                        │
           │                  │  │  Auth: RS256 JWT/JWKS  │
           │  ┌── Redis ──┐   │  │  Storage: Convex Files │
           │  │ Caching    │  │  └────────────────────────┘
           │  │ Rate Limit │  │
           │  │ Sessions   │  │           ┌──────────────┐
           │  └────────────┘  │           │  EXTERNAL    │
           │                  │           │              │
           │  ┌── MongoDB ─┐  │           │ Stripe       │
           │  │ Users       │  │           │ Payoneer     │
           │  │ History     │  │           │ Google Play  │
           │  │ Wallet      │  │           │ PublishDrive │
           │  └────────────┘  │           │ Gemini/DS    │
           │                  │           └──────────────┘
           │  ┌── RabbitMQ ┐  │
           │  │ Job Queue   │  │
           │  └────────────┘  │
           └──────────────────┘
```

### Backend Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| API Framework | Express.js or Fastify (existing) | REST API server |
| Database | MongoDB (managed) | Users, history, wallet, analytics |
| Cache | Redis (managed) | Result caching, rate limiting, sessions |
| Queue | RabbitMQ (existing) | Background jobs (file validation, notifications) |
| AI Gateway | Custom + Cockatiel (circuit breaker) | Model routing: DeepSeek → Gemini fallback |
| Auth | JWT (RS256) | Token-based authentication |
| File Storage | Convex Files + Cloudinary | Manuscripts, covers, exports |
| Publishing DB | Convex | Books, sales, payouts, projects |
| Payments | Stripe Connect + Payoneer API | Author royalty payouts |
| Monitoring | Prometheus + Grafana (or Datadog) | Metrics, alerting |

---

<a name="phase-1"></a>
## Phase 1: Security & Infrastructure (Weeks 1-3)

**Goal:** Fix all critical security vulnerabilities and establish infrastructure for production

### P0: JWT Authentication Fix (8 hours)

**Problem:** `jwt.decode` fallback allows authentication bypass.

**Fix:**
```typescript
// BEFORE (BROKEN):
try {
  const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
} catch {
  const decoded = jwt.decode(token); // BYPASS — accepts ANY token
}

// AFTER (FIXED):
const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
// If verify fails, reject the request — no fallback
```

**Tasks:**
1. Remove all `jwt.decode` fallbacks — use `jwt.verify` only
2. Implement proper key rotation with JWKS endpoint
3. Add token expiry validation (reject expired tokens)
4. Add audience (`aud`) and issuer (`iss`) claims validation
5. Create auth middleware that rejects invalid tokens with 401

**Verification:** Attempt API call with tampered/expired token → should get 401

---

### P0: CORS Hardening (2 hours)

**Problem:** CORS allows any origin.

**Fix:**
```typescript
const ALLOWED_ORIGINS = [
  'https://shothik.ai',
  'https://www.shothik.ai',
  'https://app.shothik.ai',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000',
  process.env.NODE_ENV === 'development' && 'http://localhost:5000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));
```

---

### P0: Secret Management (4 hours)

**Problem:** Secrets hardcoded in source code.

**Tasks:**
1. Audit entire codebase for hardcoded secrets (`grep -r "sk-" "sk_live" "sk_test" "apiKey"`)
2. Move all secrets to environment variables
3. Add `.env.example` with placeholder values
4. Implement secret rotation mechanism for API keys
5. Add pre-commit hook to prevent secret commits

---

### P0: Rate Limiting (6 hours)

**Implementation:**

```typescript
// Sliding window rate limiter using Redis
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiters = {
  // AI tool endpoints — per user per tool
  aiTool: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl:ai',
    points: 50,          // 50 requests
    duration: 3600,      // per hour
    blockDuration: 300,  // block 5 min if exceeded
  }),
  
  // Auth endpoints — stricter
  auth: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl:auth',
    points: 10,
    duration: 900,       // 10 attempts per 15 min
    blockDuration: 900,
  }),

  // File upload — generous but limited
  upload: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl:upload',
    points: 20,
    duration: 3600,
  }),

  // Admin endpoints
  admin: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl:admin',
    points: 100,
    duration: 3600,
  }),
};

// Tier-based limits
const TIER_MULTIPLIERS = {
  free: 1,
  starter: 3,
  pro: 10,
  enterprise: 50,
};
```

**Rate limit tiers:**

| Endpoint | Free | Starter | Pro | Enterprise |
|----------|------|---------|-----|-----------|
| Paraphrase | 10/hr | 30/hr | 100/hr | 500/hr |
| Plagiarism | 5/hr | 15/hr | 50/hr | 250/hr |
| AI Detector | 10/hr | 30/hr | 100/hr | 500/hr |
| Grammar | 20/hr | 60/hr | 200/hr | 1000/hr |
| Humanize | 10/hr | 30/hr | 100/hr | 500/hr |
| AI Co-Writer | 20/hr | 60/hr | 200/hr | 1000/hr |
| File Upload | 5/hr | 10/hr | 20/hr | 50/hr |

---

### P1: Route Authentication (4 hours)

**Problem:** `/api/vector/*` and other routes have zero authentication.

**Tasks:**
1. Create auth middleware that validates JWT on all protected routes
2. Add route-level permissions (admin routes require admin role)
3. Protect all `/api/*` routes (except `/api/health` and `/api/.well-known/*`)
4. Add request logging with user ID for audit trail

---

### P1: Input Validation & XSS Prevention (6 hours)

**Tasks:**
1. Install DOMPurify on backend — sanitize all user inputs
2. Add Joi/Zod schema validation on all API endpoints
3. Validate file uploads (type, size, content-type header vs actual content)
4. Implement request body size limits (10MB default, 300MB for manuscripts)
5. Add SQL injection protection (parameterized queries — already using MongoDB, but validate)

---

### P1: Structured Logging (4 hours)

**Implementation:**
```typescript
// Winston or Pino structured logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: process.env.NODE_ENV === 'development' },
  },
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id,
      ip: req.ip,
    });
  });
  next();
});
```

---

### P2: Health Checks & Monitoring (4 hours)

**Tasks:**
1. `/api/health` — basic health check (already exists, enhance)
2. `/api/health/deep` — checks MongoDB, Redis, Convex, external APIs
3. Prometheus metrics endpoint (`/metrics`)
4. Key metrics: request count, latency histogram, error rate, cache hit rate
5. Alert thresholds: >5% error rate, >2s p95 latency, Redis disconnected

**Phase 1 Total: ~38 hours**

---

<a name="phase-2"></a>
## Phase 2: Core Tool Services Hardening (Weeks 3-6)

**Goal:** Make the 5 AI tools reliable, fast, and cost-efficient

### P0: ONNX Model Conversion — AI Detector Speed (12 hours)

**Problem:** AI detection takes ~2s. Target: <500ms.

**Tasks:**
1. Convert current AI detection model to ONNX format
2. Set up ONNX Runtime on DigitalOcean (CPU inference — no GPU needed)
3. Benchmark: measure latency before/after conversion
4. Add warm-up on server start (first inference is slow)
5. Fallback: if ONNX fails, route to existing model

**Expected improvement:** 2s → 200-400ms (4-10x faster)

---

### P0: Redis Cache Infrastructure (6 hours)

Three cache namespaces with different TTLs:

| Namespace | TTL | Key | Purpose |
|-----------|-----|-----|---------|
| `cache:stem` | 24 hours | `sha256(text)` | STEM detection results — reusable across all modes |
| `cache:freeze` | 12 hours | `sha256(text + lang)` | Auto-freeze term detection |
| `cache:para` | 4 hours | `sha256(text + mode + lang + synonymLevel + freezeWords)` | Paraphrase output — exact config match |
| `cache:para:stale` | 72 hours | Same as `cache:para` | Emergency fallback when all models down |
| `cache:plagiarism` | 1 hour | `sha256(text)` | Plagiarism scan results |
| `cache:ai-detect` | 1 hour | `sha256(text)` | AI detection results |

**Implementation:** See `Implementation_Plan.md` P0-P1 (full code in that document).

---

### P0: AI Gateway — Circuit Breaker + Model Routing (12 hours)

**Architecture:** DeepSeek (primary) → Gemini (fallback) → Stale Cache → Error

```
Request → Cache hit? → YES → Return cached result
                │
                NO
                ▼
         DeepSeek (circuit breaker)
                │
           Success? → YES → Cache result, return
                │
                NO (timeout/error/circuit open)
                ▼
         Gemini Flash (circuit breaker)
                │
           Success? → YES → Cache result, return
                │
                NO
                ▼
         Stale cache (72h window)?
                │
           Found? → YES → Return stale + warning header
                │
                NO
                ▼
         503 "All providers temporarily unavailable"
```

**Implementation:** See `Implementation_Plan.md` P2 (full Cockatiel circuit breaker code — `ai-gateway.service.ts`).

**Key parameters:**

| Provider | Timeout | Retry | CB Threshold | Half-Open After |
|----------|---------|-------|-------------|----------------|
| DeepSeek | 10s | 1 retry | 30% failure in 60s window | 15s |
| Gemini | 15s | 0 retries | 50% failure in 60s window | 30s |

---

### P1: STEM Masking Service (Backend) (8 hours)

**Problem:** Frontend preprocesses STEM content (LaTeX/code), but backend should also validate and mask.

**Tasks:**
1. Port `stemPreprocessor.ts` logic to backend
2. Server-side STEM detection before sending to AI models
3. Validate that `[STEM_N]` placeholders survive the AI model round-trip
4. Re-substitute placeholders with original content after AI response
5. Log masking failures (placeholder corruption) for monitoring

---

### P1: DeepSeek Prompt Caching (4 hours)

**Optimization:** DeepSeek caches system prompts at $0.07/M tokens (vs $0.56/M uncached — 87% savings).

**Requirements:**
- System prompt must be >1024 tokens (shared prefix)
- Must be identical across requests of same mode
- Mode-specific suffix is the variable part

**Implementation:** See `Implementation_Plan.md` P6 (full prompt design with shared prefix).

---

### P1: Usage Tracking Per User Per Tool (6 hours)

**Backend needs to track:**

| Metric | Collection | Purpose |
|--------|-----------|---------|
| Tool usage count per user per day | `usage_daily` | Enforce tier limits |
| Tool usage count per user per month | `usage_monthly` | Billing calculations |
| Credit consumption | `credit_ledger` | Pre-paid credit model |
| Response quality scores | `quality_metrics` | Model performance tracking |

```typescript
// Usage tracking schema (MongoDB)
interface UsageRecord {
  userId: string;
  tool: 'paraphrase' | 'plagiarism' | 'ai_detector' | 'grammar' | 'humanize' | 'summarize';
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  inputChars: number;
  outputChars: number;
  model: string;
  cached: boolean;
  latencyMs: number;
  timestamp: Date;
}
```

---

### P2: Socket.io Streaming Fix (4 hours)

**Problem:** Socket.io reconnection logic is fragile.

**Tasks:**
1. Add exponential backoff on reconnection
2. Implement message deduplication (idempotency keys)
3. Add heartbeat/ping-pong mechanism
4. Handle graceful disconnection (save progress on client disconnect)

**Phase 2 Total: ~52 hours**

---

<a name="phase-3"></a>
## Phase 3: Publishing Platform Backend (Weeks 5-8)

**Goal:** Make the publishing pipeline production-ready

### P0: Convex Production Deploy (4 hours)

**Problem:** Every preview deploy generates a new URL. Three files need URL updates each time.

**Tasks:**
1. Purchase Convex production deploy key
2. Deploy to production (stable URL)
3. Update `NEXT_PUBLIC_CONVEX_URL` in `.env.local`
4. Update fallback URLs in:
   - `convex/http.ts`
   - `convex/auth.config.ts`
   - `src/app/api/auth/convex-token/route.ts`
5. Verify auth flow works end-to-end with production URL

---

### P0: Manuscript Validation Service (8 hours)

**Automated checks before human review:**

| Check | Tool/Library | Pass Criteria | Blocking? |
|-------|-------------|---------------|-----------|
| ePub structure | `epubchecker` npm | 0 critical errors | Yes |
| PDF validity | `pdf-parse` or `pdfjs-dist` | Readable, text extractable | Yes |
| File size | Server-side | < 300MB | Yes |
| Cover dimensions | `sharp` | Min 1600 x 2400 px | Yes |
| Cover format | `sharp` | JPEG/PNG/TIFF | Yes |
| Metadata completeness | Custom | All required fields present | Yes |
| Word count | Custom | Min 5,000 words | Warning |
| Language detection | `franc` | Matches declared language | Warning |
| Plagiarism score | Shothik API | < 15% similarity | Informational |
| AI detection score | Shothik API | Informational only | No |

**Implementation:**
```typescript
// Convex action — runs on Convex with Node.js runtime
// convex/validators.ts

export const validateManuscript = action({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    const book = await ctx.runQuery(internal.books.getBook, { bookId });
    
    const checks = [];
    
    // 1. File size check
    if (book.manuscriptSize > 300 * 1024 * 1024) {
      checks.push({ check: 'fileSize', pass: false, message: 'Manuscript exceeds 300MB' });
    }
    
    // 2. Cover dimension check (via sharp)
    if (book.coverStorageId) {
      const coverBlob = await ctx.storage.get(book.coverStorageId);
      // ... validate with sharp
    }
    
    // 3. Metadata completeness
    const required = ['title', 'description', 'language', 'category', 'listPrice'];
    for (const field of required) {
      if (!book[field]) {
        checks.push({ check: 'metadata', pass: false, message: `Missing ${field}` });
      }
    }
    
    return { bookId, checks, allPassed: checks.every(c => c.pass) };
  },
});
```

---

### P1: Writing Studio → Convex Migration (12 hours)

**Problem:** Writing Studio projects stored in `localStorage` — data loss risk.

**Migration plan:**
1. `projects-store.js` currently uses localStorage CRUD
2. Create Convex wrapper that mirrors the same API
3. On first load, check for localStorage projects and offer to migrate
4. New projects go directly to Convex
5. Keep localStorage as offline fallback (sync on reconnect)

**Convex schema already exists:** `projects` and `projectVersions` tables are defined.

**Tasks:**
1. Complete `convex/projects.ts` with full CRUD (list, create, update, delete, get)
2. Add auto-save mutation (debounced, called on content change)
3. Add version history (save snapshot every 5 minutes to `projectVersions`)
4. Update frontend `projects-store.js` to use Convex client instead of localStorage
5. Add offline detection and localStorage queue for sync
6. Migration modal: "We found X projects in your browser. Move them to the cloud?"

---

### P1: File Upload Pipeline (6 hours)

**For manuscript and cover uploads to Convex storage:**

1. Client → Convex `generateUploadUrl` (temporary signed URL)
2. Client uploads file directly to Convex storage
3. Client calls mutation with storage ID
4. Backend validates file (type, size, dimensions for covers)
5. Storage ID stored in book record

**Already partially implemented in `convex/books.ts` — needs:**
- File type validation (MIME type check, not just extension)
- Cover dimension validation using `sharp`
- Manuscript validation using `epubchecker`
- Progress tracking for large uploads

---

### P2: Notification Service (6 hours)

**Currently:** Notifications stored inline in book records (array field in `books` table).

**Improvement needed:**
1. Separate notifications table for scalability
2. Email notifications (via SendGrid or Resend) for:
   - Book submitted → confirmation email
   - Book approved → congratulations + next steps
   - Book rejected → reason + resubmission instructions
   - Book published → live link + sharing tools
   - Payout processed → receipt + statement
3. In-app notification count badge in Writing Studio header

**Phase 3 Total: ~36 hours**

---

<a name="phase-4"></a>
## Phase 4: Payments & Payouts (Weeks 7-10)

**Goal:** Authors can actually receive money

### P0: Stripe Connect Integration (16 hours)

**Current state:** API routes exist at `/api/stripe/connect` and `/api/stripe/payout` but no live keys.

**Tasks:**
1. Set up Stripe Connect platform account (UK company)
2. Configure Stripe API keys (live mode) as environment secrets
3. Implement Express Account onboarding flow:
   ```
   Author clicks "Connect Stripe" → Redirect to Stripe onboarding
   → Author completes identity verification → Redirect back
   → Store connected account ID in Convex `payoutAccounts`
   ```
4. Implement payout initiation:
   ```
   Author requests payout → Validate minimum ($25)
   → Create Stripe Transfer to connected account
   → Update payout status in Convex
   → Send confirmation email
   ```
5. Implement webhook handler for payout status updates
6. Handle edge cases: onboarding incomplete, account suspended, payout failed

**API routes needed:**
```
POST   /api/stripe/connect          — Generate onboarding link
GET    /api/stripe/connect/callback  — Handle OAuth redirect
POST   /api/stripe/payout           — Initiate payout
POST   /api/stripe/webhook          — Handle Stripe events
GET    /api/stripe/account-status   — Check connected account status
```

---

### P1: Payoneer Integration (12 hours)

**For Bangladesh authors (Stripe not supported in BD):**

1. Sign up for Payoneer Enterprise 360 account
2. Implement Mass Payout API integration:
   ```
   POST /register-payee    — Register author with bank/bKash details
   POST /fund-transfer     — Initiate payout (USD → BDT automatic)
   GET  /payment-status    — Track completion
   ```
3. Store Payoneer payee ID in Convex `payoutAccounts`
4. Implement payout scheduling (batch monthly payouts)

---

### P1: Royalty Calculation Engine (12 hours)

**Monthly cycle:**

```
Day 1-5:   Google sales report CSV available for download
Day 5-10:  Import CSV → sales_transactions table
Day 10:    Run royalty calculation:
           - For each sale: royalty = google_revenue × 0.85
           - Apply 10% reserve holdback (first 60 days)
           - Release reserves from 2 months ago
Day 15:    Google pays Shothik UK bank account
Day 16-20: Process approved payouts via Stripe/Payoneer
Day 25:    Generate monthly statements (PDF)
```

**Implementation:**
```typescript
// Convex scheduled function — runs monthly
export const calculateMonthlyRoyalties = internalAction({
  args: { period: v.string() }, // "2026-03"
  handler: async (ctx, { period }) => {
    // 1. Get all sales for this period
    const sales = await ctx.runQuery(internal.sales.getByPeriod, { period });
    
    // 2. Calculate per-author royalties
    const authorRoyalties = new Map();
    for (const sale of sales) {
      const commission = sale.googleRevenue * 0.15;
      const royalty = sale.googleRevenue - commission;
      const holdback = royalty * 0.10; // 10% reserve
      const available = royalty - holdback;
      
      // Accumulate per author
      const existing = authorRoyalties.get(sale.userId) || { total: 0, books: [] };
      existing.total += available;
      existing.books.push({ bookId: sale.bookId, amount: available });
      authorRoyalties.set(sale.userId, existing);
    }
    
    // 3. Release reserves from 2 months ago
    // ...
    
    // 4. Create ledger entries
    // ...
  },
});
```

---

### P2: Sales Data Import (8 hours)

**Google Play provides CSV reports monthly:**

1. Admin downloads sales CSV from Google Play Partner Center
2. Upload CSV to admin dashboard
3. Backend parses CSV, deduplicates (using `dedup_hash`), inserts to `salesRecords`
4. Trigger royalty calculation

**Future automation (Phase 5):** ONIX feed + automated report pulling

---

### P2: Monthly Statement Generation (6 hours)

**PDF statement for each author, each month:**
- Period covered
- Book-by-book sales breakdown
- Commission deducted
- Reserve holdback/release
- Net royalty earned
- Payout method and amount
- Year-to-date totals

Use `@react-pdf/renderer` (already in Next.js stack) or `puppeteer` for PDF generation.

**Phase 4 Total: ~54 hours**

---

<a name="phase-5"></a>
## Phase 5: Automation & Scaling (Weeks 10-14)

### P1: ONIX 3.0 Feed Generation (16 hours)

**For automated Google Play catalog management:**

1. Generate ONIX 3.0 XML from books database
2. Full feed weekly, delta feed daily
3. Validate against EDItEUR XSD schema
4. Host feed on HTTPS with basic auth for Google ingestion
5. Include all metadata: title, description, subject codes, contributors, prices, territories

---

### P1: PublishDrive API Integration (16 hours)

**Multi-store distribution via PublishDrive Pro ($99/month):**

```
Shothik Book Record
    ↓
PublishDrive API: POST /books (metadata + files)
    ↓
PublishDrive distributes to: Google Play, Amazon Kindle,
Apple Books, Kobo, B&N, OverDrive, Scribd, etc.
    ↓
PublishDrive API: GET /sales (monthly reports)
    ↓
Import to salesRecords table
```

**Tasks:**
1. Implement PublishDrive client library
2. Book submission: metadata mapping (Shothik → PublishDrive format)
3. File upload to PublishDrive (manuscript + cover)
4. Per-store pricing and territory settings
5. Status tracking (per-store: pending/live/failed)
6. Sales report pull and import
7. Feature flag: `NEXT_PUBLIC_PUBLISHDRIVE_ENABLED` (already exists)

---

### P1: Job Queue Implementation (8 hours)

**RabbitMQ already configured — needs proper utilization:**

| Queue | Purpose | Consumer |
|-------|---------|----------|
| `manuscript.validate` | File validation pipeline | Validation worker |
| `book.publish` | Multi-step publishing flow | Publishing worker |
| `notification.send` | Email + in-app notifications | Notification worker |
| `report.generate` | Monthly statement PDFs | Report worker |
| `sales.import` | Sales CSV processing | Import worker |
| `payout.process` | Payout initiation | Payout worker |

---

### P2: KYC Verification (8 hours)

**Before first payout, authors need identity verification:**

| Country | ID Required | Method |
|---------|-------------|--------|
| India | PAN + Aadhaar | Stripe Identity (automated) |
| UK | Passport or License | Stripe Identity (automated) |
| Bangladesh | NID or Passport | Manual review (admin) |
| Pakistan | CNIC or Passport | Manual review (admin) |

---

### P2: ISBN Management Service (4 hours)

**Track ISBN pool:**
```typescript
// MongoDB or Convex table
interface ISBNRecord {
  isbn: string;           // 13-digit ISBN
  status: 'available' | 'reserved' | 'assigned';
  bookId?: string;
  reservedAt?: Date;
  assignedAt?: Date;
  purchaseBatch: string;  // "nielsen-batch-001"
}
```

**Phase 5 Total: ~52 hours**

---

<a name="phase-6"></a>
## Phase 6: Analytics, Monitoring & Admin (Weeks 12-16)

### P1: Admin Dashboard Backend (12 hours)

**Admin endpoints (protected by `requireAdmin()`):**

```
GET  /api/admin/dashboard           — Platform stats overview
GET  /api/admin/books               — All books with filters
GET  /api/admin/books/:id           — Book detail for review
POST /api/admin/books/:id/approve   — Approve book (already exists in Convex)
POST /api/admin/books/:id/reject    — Reject book (already exists in Convex)
GET  /api/admin/authors             — Author list with stats
GET  /api/admin/payouts             — Payout queue
POST /api/admin/payouts/:id/approve — Approve payout
GET  /api/admin/usage               — Tool usage analytics
GET  /api/admin/revenue             — Revenue breakdown
GET  /api/admin/circuit-states      — AI gateway circuit breaker status
GET  /api/admin/cache-metrics       — Cache hit rates
```

---

### P1: Platform Analytics (8 hours)

**Track and expose:**

| Metric | Source | Update Frequency |
|--------|--------|-----------------|
| Monthly Active Users | Auth logs | Daily |
| Tool usage per tool per tier | Usage records | Real-time |
| Revenue (subscriptions) | Stripe | Daily |
| Revenue (publishing commission) | Sales import | Monthly |
| Books published | Convex books table | Real-time |
| Authors registered | Convex payoutAccounts | Real-time |
| Payout volume | Convex payouts | Monthly |
| API latency (p50/p95/p99) | Prometheus | Real-time |
| Cache hit rate | Redis metrics | Real-time |
| Error rate | Structured logs | Real-time |

---

### P2: Alerting System (6 hours)

**Critical alerts (immediate):**
- API error rate > 5% for 5 minutes
- AI gateway both circuits open (DeepSeek + Gemini both down)
- Redis disconnected
- Convex queries failing
- Stripe webhook delivery failing

**Warning alerts (daily digest):**
- Cache hit rate below 15%
- Response time p95 > 2s
- Storage usage > 80%
- Payout failures

---

### P2: Automated Backup & Recovery (4 hours)

**MongoDB:** Daily automated backups (managed service provides this)
**Convex:** Built-in automatic backups
**Redis:** Persistence (AOF + RDB) configured
**Recovery playbook:** Document step-by-step restore procedure

**Phase 6 Total: ~30 hours**

---

<a name="7-api-specification"></a>
## 7. API Specification Summary

### Existing Endpoints (DigitalOcean Backend)

| Method | Endpoint | Tool | Auth |
|--------|----------|------|------|
| POST | `/api/v1/paraphrase` | Paraphrase | JWT |
| POST | `/api/v1/plagiarism-check` | Plagiarism Checker | JWT |
| POST | `/api/v1/ai-detect` | AI Detector | JWT |
| POST | `/api/v1/grammar-check` | Grammar Fix | JWT |
| POST | `/api/v1/humanize` | Humanize GPT | JWT |
| POST | `/api/v1/summarize` | Summarize | JWT |
| GET  | `/api/v1/user/profile` | User | JWT |
| GET  | `/api/v1/wallet/balance` | Wallet | JWT |

### New Endpoints Needed

| Method | Endpoint | Phase | Purpose |
|--------|----------|-------|---------|
| GET | `/api/v1/health/deep` | Phase 1 | Deep health check |
| GET | `/api/v1/metrics` | Phase 1 | Prometheus metrics |
| POST | `/api/v1/usage/track` | Phase 2 | Track tool usage |
| GET | `/api/v1/usage/limits` | Phase 2 | Get user's remaining limits |
| POST | `/api/v1/validate/manuscript` | Phase 3 | Validate manuscript file |
| POST | `/api/v1/validate/cover` | Phase 3 | Validate cover image |
| POST | `/api/stripe/connect` | Phase 4 | Stripe onboarding |
| GET | `/api/stripe/connect/callback` | Phase 4 | OAuth callback |
| POST | `/api/stripe/payout` | Phase 4 | Initiate payout |
| POST | `/api/stripe/webhook` | Phase 4 | Stripe events |
| POST | `/api/v1/sales/import` | Phase 4 | Import sales CSV |
| POST | `/api/v1/royalties/calculate` | Phase 4 | Run royalty calculation |
| GET | `/api/v1/statements/:period` | Phase 4 | Download monthly statement |
| POST | `/api/v1/publishdrive/submit` | Phase 5 | Submit to PublishDrive |
| GET | `/api/v1/publishdrive/status/:bookId` | Phase 5 | Distribution status |
| POST | `/api/v1/isbn/assign` | Phase 5 | Assign ISBN to book |
| POST | `/api/v1/kyc/submit` | Phase 5 | Submit KYC documents |
| GET | `/api/admin/*` | Phase 6 | Admin dashboard endpoints |

---

<a name="8-database-schema"></a>
## 8. Database Schema Master Plan

### MongoDB (DigitalOcean — Existing + Extensions)

```
EXISTING:
├── users               — User accounts, profiles, auth
├── wallet_transactions  — Credit/debit history
├── tool_history         — Usage history per tool
└── subscriptions        — Plan subscriptions

NEW (Phase 1-2):
├── usage_daily          — Daily usage counts per user per tool
├── usage_monthly        — Monthly aggregated usage
├── rate_limit_overrides — Custom rate limits per user/org
└── audit_log            — Security audit trail

NEW (Phase 4-5):
├── isbn_pool            — ISBN inventory management
├── kyc_documents        — Author identity verification
└── monthly_statements   — Generated statement records
```

### Convex (Publishing Platform — Existing)

```
EXISTING (all 6 tables):
├── projects             — Writing Studio projects (to replace localStorage)
├── projectVersions      — Project version history
├── books                — Book submissions, metadata, status
├── salesRecords         — Sales data per book per period
├── payouts              — Payout requests and status
└── payoutAccounts       — Author payout method details
```

---

<a name="9-env-vars"></a>
## 9. Environment Variables & Secrets

### Already Configured

| Variable | Status | Location |
|----------|--------|----------|
| `CONVEX_DEPLOY_KEY` | Set (preview) | Replit Secrets |
| `JWT_PRIVATE_KEY` | Set | Replit Secrets |
| `NEXT_PUBLIC_CONVEX_URL` | Set (preview URL) | `.env.local` |

### Need to Add

| Variable | Phase | Purpose | Type |
|----------|-------|---------|------|
| `STRIPE_SECRET_KEY` | Phase 4 | Stripe API (live mode) | Secret |
| `STRIPE_PUBLISHABLE_KEY` | Phase 4 | Stripe frontend key | Env |
| `STRIPE_WEBHOOK_SECRET` | Phase 4 | Webhook signature verification | Secret |
| `STRIPE_CONNECT_CLIENT_ID` | Phase 4 | Connect OAuth | Secret |
| `PAYONEER_API_KEY` | Phase 4 | Payoneer Enterprise API | Secret |
| `PAYONEER_PARTNER_ID` | Phase 4 | Payoneer partner ID | Env |
| `REDIS_URL` | Phase 1 | Redis connection string | Secret |
| `MONGODB_URI` | Phase 1 | MongoDB connection (may already exist) | Secret |
| `DEEPSEEK_API_KEY` | Phase 2 | DeepSeek AI model | Secret |
| `SENDGRID_API_KEY` or `RESEND_API_KEY` | Phase 3 | Transactional emails | Secret |
| `PUBLISHDRIVE_API_KEY` | Phase 5 | PublishDrive distribution | Secret |
| `NEXT_PUBLIC_PUBLISHDRIVE_ENABLED` | Phase 5 | Feature flag | Env |
| `SENTRY_DSN` | Phase 1 | Error tracking | Env |

---

<a name="10-dependency-graph"></a>
## 10. Dependency Graph

```
Phase 1: Security & Infrastructure
  ├── JWT Fix ─────────────────────────────────┐
  ├── CORS Hardening ──────────────────────────┤
  ├── Secret Management ───────────────────────┤
  ├── Rate Limiting (requires Redis) ──────────┤
  ├── Route Auth (requires JWT Fix) ───────────┤
  ├── Input Validation ────────────────────────┤
  ├── Structured Logging ──────────────────────┤
  └── Health Checks ───────────────────────────┘
                                               │
Phase 2: Tool Services Hardening ◄─────────────┘
  ├── ONNX Conversion (independent) ───────────┐
  ├── Redis Cache (requires Phase 1 Redis) ────┤
  ├── AI Gateway/Circuit Breaker ──────────────┤
  │     (requires Redis Cache)                 │
  ├── STEM Masking (backend) ──────────────────┤
  ├── Prompt Caching ──────────────────────────┤
  │     (requires AI Gateway)                  │
  ├── Usage Tracking ──────────────────────────┤
  └── Socket.io Fix (independent) ─────────────┘
                                               │
Phase 3: Publishing Backend ◄──────────────────┘
  ├── Convex Production Deploy ────────────────┐
  ├── Manuscript Validation ───────────────────┤
  ├── Writing Studio Migration ────────────────┤
  │     (requires Convex Production)           │
  ├── File Upload Pipeline ────────────────────┤
  └── Notification Service ────────────────────┘
                                               │
Phase 4: Payments & Payouts ◄──────────────────┘
  ├── Stripe Connect ──────────────────────────┐
  │     (requires Phase 1 security)            │
  ├── Payoneer Integration ────────────────────┤
  ├── Royalty Calculation ─────────────────────┤
  │     (requires sales data)                  │
  ├── Sales Data Import ───────────────────────┤
  └── Statement Generation ────────────────────┘
                                               │
Phase 5: Automation & Scale ◄──────────────────┘
  ├── ONIX Feed Generation ────────────────────┐
  ├── PublishDrive API ────────────────────────┤
  ├── Job Queue (RabbitMQ) ────────────────────┤
  ├── KYC Verification ───────────────────────┤
  └── ISBN Management ────────────────────────┘
                                               │
Phase 6: Analytics & Monitoring ◄──────────────┘
  ├── Admin Dashboard Backend
  ├── Platform Analytics
  ├── Alerting System
  └── Automated Backup
```

### Parallel Work Tracks

These can be worked on simultaneously by different developers:

- **Track A (Security):** Phase 1 items → Phase 2 ONNX
- **Track B (Infrastructure):** Redis setup → Cache → Circuit breaker → Usage tracking
- **Track C (Publishing):** Convex production → Validation → Migration
- **Track D (Payments):** Stripe Connect → Payoneer → Royalty engine

---

<a name="11-risk-matrix"></a>
## 11. Risk Matrix

| Risk | Phase | Probability | Impact | Mitigation |
|------|-------|-------------|--------|------------|
| JWT bypass exploited before fix | Phase 1 | Medium | Critical | Prioritize as week 1 task |
| Convex preview URL changes mid-usage | Phase 3 | High | High | Get production key ASAP |
| Stripe Connect rejected (UK company issue) | Phase 4 | Low | Critical | Apply early; have Payoneer as backup |
| ONNX conversion degrades accuracy | Phase 2 | Medium | High | Benchmark before/after; keep original model as fallback |
| Google Play publisher account delayed | Phase 3 | Medium | High | Apply immediately; not dependent on backend |
| DeepSeek API deprecation or pricing change | Phase 2 | Low | High | Circuit breaker auto-routes to Gemini |
| RabbitMQ queue message loss | Phase 5 | Low | Medium | Durable queues + dead letter exchange |
| Sales CSV import errors | Phase 4 | Medium | Medium | Validation + manual review + dedup hash |
| Team capacity insufficient | All | Medium | High | Strict phase discipline; P0 items only first |

---

<a name="12-team-effort"></a>
## 12. Team & Effort Estimates

### By Phase

| Phase | Duration | Effort | Team Size | Roles |
|-------|----------|--------|-----------|-------|
| Phase 1: Security | 3 weeks | ~38 hours | 2 devs | Backend + DevOps |
| Phase 2: Tool Hardening | 3 weeks | ~52 hours | 2 devs | Backend + AI/ML |
| Phase 3: Publishing | 3 weeks | ~36 hours | 2 devs | Backend + Frontend |
| Phase 4: Payments | 3 weeks | ~54 hours | 2 devs | Backend + Finance |
| Phase 5: Automation | 4 weeks | ~52 hours | 2 devs | Backend + Integration |
| Phase 6: Analytics | 4 weeks | ~30 hours | 1-2 devs | Backend + DevOps |
| **Total** | **16 weeks** | **~262 hours** | **2-3 devs** | |

### By Priority

| Priority | Items | Total Effort | Must Complete Before Launch |
|----------|-------|-------------|---------------------------|
| P0 | JWT fix, CORS, secrets, rate limiting, Convex prod, ONNX, Stripe | ~90 hours | Yes |
| P1 | Cache, circuit breaker, usage tracking, royalty engine, migration | ~100 hours | Yes (soft launch) |
| P2 | Notifications, KYC, analytics, alerting, statements | ~72 hours | No (can launch without) |

### Minimum Viable Backend (P0 only — 6 weeks)

If resources are constrained, the absolute minimum to launch:

1. **Week 1-2:** JWT fix + CORS + secrets + rate limiting
2. **Week 3:** Convex production deploy + Stripe Connect setup
3. **Week 4-5:** ONNX conversion + basic Redis caching
4. **Week 5-6:** Manuscript validation + test end-to-end flow

This gets you: secure API, stable publishing URL, working payouts, faster AI detection, and cached results.

---

## Appendix: Cross-References

- [Strategic_Roadmap.md](Strategic_Roadmap.md) — Platform roadmap v2.0 (Phase 3 = this plan's Phase 1-3)
- [Implementation_Plan.md](Implementation_Plan.md) — Paraphrase service detailed implementation (AI Gateway, caching, circuit breaker code)
- [Publishing_Platform_Implementation_Plan.md](Publishing_Platform_Implementation_Plan.md) — Publishing pipeline details (SQL schemas, review pipeline, ONIX specs)
- [Publishing_Platform_Research.md](Publishing_Platform_Research.md) — Business model research (Google Play, ISBNs, legal requirements)
- [Service_Tracker.md](Service_Tracker.md) — 14-service frontend audit
- [Quality_Robustness_Deep_Analysis.md](Quality_Robustness_Deep_Analysis.md) — Code quality issues (XSS, error boundaries)
- [Business_Analysis_Roundtable.md](Business_Analysis_Roundtable.md) — 20-agent roundtable with revised phases

---

## Appendix B: Architectural Review Notes (Feb 23, 2026)

The following items were identified during architectural review and should be addressed during implementation:

### Priority Reclassifications

1. **ONNX Conversion → P1** (from P0): Not a production blocker unless SLA requires <500ms. Can soft-launch with existing ~2s detection speed.
2. **Next.js API route auth/rate-limiting → Phase 1 P0** (already covered but emphasize): The 22 existing Next.js API routes are production-facing and need auth + rate limiting alongside the DigitalOcean backend routes.
3. **Payouts gated after sales import + royalty engine**: Phase 4 payouts cannot be tested or deployed until sales data import and royalty calculation are proven. Sequence: Sales Import → Royalty Engine → Payout Initiation.

### Missing Items to Add

1. **NLP Inference Service Stack** (`backend-services/nlp-inference-service`): If a separate inference service exists, it needs its own deployment pipeline, monitoring, auth integration with the main API, and health checks. Add ~8 hours to Phase 2.
2. **MongoDB Schema Migrations**: Need a migration strategy (e.g., `migrate-mongo` or manual versioned scripts) for schema evolution on the DigitalOcean MongoDB. Add ~4 hours to Phase 1.
3. **Token Exchange Strategy**: Document how Next.js API routes authenticate to the DigitalOcean backend (token forwarding vs service-to-service tokens). Add ~4 hours to Phase 1.
4. **Frontend Hardening** (cross-cutting): DOMPurify/XSS and route-level error boundaries are frontend concerns. They're listed here for completeness but should be tracked in a separate frontend hardening sprint, not counted against backend effort.

### Estimate Adjustments

| Item | Original | Revised | Reason |
|------|----------|---------|--------|
| Secret management | 4 hours | 6 hours | Repo size + multiple services |
| ONNX conversion | 12 hours | 16 hours | Post-conversion accuracy validation |
| Stripe Connect E2E | 16 hours | 20 hours | Webhook handling + compliance + edge cases |
| Manuscript validation | 8 hours | 12 hours | epubchecker/sharp on Convex actions complexity |

**Revised total:** ~280-310 hours (up from ~262 hours)

---

*This document consolidates all backend requirements from 7 planning documents into a single actionable implementation plan. Phases are designed for parallel execution by a team of 2-3 developers. The critical path is: Security (Phase 1) → Convex Production (Phase 3) → Sales Import + Royalty Engine (Phase 4) → Stripe Connect (Phase 4). Everything else can be sequenced based on team capacity.*

**Prepared by:** Shothik AI Development Planning  
**Last updated:** February 23, 2026  
**Next review:** March 7, 2026
