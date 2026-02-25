# Shothik AI — GitHub Module Analysis Report

**Date:** February 17, 2026  
**Analyst Scope:** All repositories under `shothikai`, `shothikai-platform`, and related accounts  
**Objective:** Identify unconnected modules, assess integration readiness, and recommend implementation priorities

---

## 1. Repository Inventory

### Organizations Found
| Org/Owner | Repos | Role |
|-----------|-------|------|
| `shothikai` | 21 repos | Primary development org |
| `shothikai-platform` | 8 repos | Platform microservices (production) |
| `ahsanhabib9191` | Personal forks/experiments | Developer workspace |
| `ridz-shothikai` | 2 repos | Contributor workspace |

### Total Active Repositories: 29 unique (excluding forks, empty, and archived)

---

## 2. Current Platform Connections (Already Integrated)

These backend services are **already connected** to the current frontend (`shothik-v3` / this Replit codebase):

| Service | Backend URL | Frontend Integration |
|---------|------------|---------------------|
| **Main API (model)** | `prod-api.shothik.ai` | `api-client.ts` — Auth, dashboard, AI tools, presentations, research, sheets |
| **Payment System** | `payment-qa-svc.shothik.ai` | `api-payment.ts` — Wallet, transactions, subscriptions, Stripe |
| **Blog API** | `api-blog.shothik.ai` | `api/blog.ts` — Blog content, SEO articles |
| **Paraphrase Service** | Via main API proxy | `paraphrase.service.ts` — Text paraphrasing |
| **AI Detector** | Via main API proxy | `ai-detector.service.ts` — AI content detection |
| **Grammar Checker** | Via main API proxy | `grammar-checker.service.ts` — Grammar analysis |
| **Research (Deep Research)** | Via main API + Socket.io | Real-time streaming research |
| **Presentation Gen** | Via main API proxy | `createPresentationServer.js` — Slide generation |
| **Sheet Gen** | Via main API proxy | `sheetAiStreamService.js` — Spreadsheet AI |
| **Marketing Automation** | Via main API | `marketing-automation.service.ts` — Meta ads |

---

## 3. UNCONNECTED Modules — Detailed Analysis

### 3.1 Writing Studio Backend (`shothikai/writing-studio`) ⭐ HIGH PRIORITY

**What it does:** LaTeX-powered PDF generation system that converts rich text content into professional academic papers (IEEE, Springer, Modern Book templates).

**Architecture:**
- **Backend** (Express.js + TypeScript): REST API for document management, template CRUD, AI-powered research endpoints, file uploads to Google Cloud Storage
- **Worker** (Node.js): Asynchronous PDF generation via RabbitMQ queue — converts Tiptap JSON → HTML → LaTeX → PDF
- **Shared**: Common types and utilities between backend and worker
- **Templates**: LaTeX templates (IEEE, Springer, etc.)

**Tech Stack:** Express 5, Mongoose 9, RabbitMQ (amqplib), Google Cloud Storage, Google Generative AI (Gemini), PDFKit, mammoth.js (DOCX import), pdfjs-dist (PDF parsing)

**Current State:** Active development (updated Feb 2026), has Dockerfile for deployment, system architecture fully documented

**What's Missing from Our Frontend:**
- No PDF export/preview functionality in Writing Studio
- No template selection UI (IEEE, Springer, APA paper formats)
- No document import (DOCX/PDF ingestion)
- No cloud document storage
- No AI Co-Writer (Gemini streaming for inline autocomplete)

**Improvement Areas:**
1. Backend needs production hardening (error handling, rate limiting, monitoring)
2. No WebSocket/SSE support for real-time PDF build status — currently would require polling
3. RabbitMQ dependency adds infrastructure complexity — consider Cloud Tasks or Bull queue as alternative
4. Google Cloud credential management needs to align with platform auth
5. No caching layer for generated PDFs
6. Worker doesn't have health check endpoints

**Integration Recommendation:** **P0 — Critical** (Phase 5 priority). This completes the "Write → Check → Submit" workflow. Frontend needs: template picker, PDF preview panel, export button, document import dialog, build status indicator.

---

### 3.2 Payment System Admin Panel (`shothikai/payment-system-adminpanel`) ⭐ MEDIUM PRIORITY

**What it does:** Admin dashboard for managing payment operations, user subscriptions, transaction monitoring, and credit management.

**Tech Stack:** TypeScript, Next.js, React, Tailwind CSS, Radix UI

**Current State:** Separate standalone app, not connected to main platform

**What's Missing from Our Frontend:**
- No admin panel route in current platform
- No subscription management UI for admins
- No transaction monitoring dashboard
- No user credit management interface

**Improvement Areas:**
1. Should be embedded as `/dashboard/admin` route rather than separate app
2. Needs RBAC integration with existing auth system
3. Missing real-time transaction monitoring (WebSocket)
4. No audit logging for admin actions
5. UI should follow Gaia design system for consistency

**Integration Recommendation:** **P2 — Important but not user-facing.** Can be deferred. Admin panel is operational tool, not revenue-generating.

---

### 3.3 Auth Service (`shothikai-platform/auth-service`) ⭐ LOW PRIORITY (ALREADY COVERED)

**What it does:** Standalone authentication microservice — registration, login, Google OAuth, JWT, password reset, email verification, 2FA, RBAC.

**Tech Stack:** Express.js, TypeScript, MongoDB, Passport.js, JWT, Nodemailer

**Current State:** Published as npm package `@shothikai-platform/auth-service`

**Assessment:** The current platform already has fully working auth (`src/app/auth/`, Google OAuth, JWT cookies, middleware). This service is used by OTHER backend services (research-v2, sheet-gen, etc.) via npm package, not directly by the frontend.

**Integration Recommendation:** **Already indirectly connected** via backend services. No frontend work needed.

---

### 3.4 Marketing Automation Service (`shothikai-platform/marketing-automation-service`) ⭐ LOW PRIORITY (MAINTENANCE MODE)

**What it does:** Full Meta/Facebook Ads automation — campaign CRUD, AI ad copy, media generation, messenger inbox, knowledge base, analytics. 67 API endpoints documented.

**Tech Stack:** Express.js, TypeScript, MongoDB, Redis, ImageKit

**Current State:** Active, connected via main API. Frontend already has full marketing automation section.

**Assessment:** Already integrated. Business decision is to keep this in maintenance mode while focusing on academic tools.

**Integration Recommendation:** **No action needed.** Already connected and in maintenance mode per business strategy.

---

### 3.5 Shothik Blog (`shothikai/Shothik-Blog`) ⭐ LOW PRIORITY

**What it does:** Blog/content management system for SEO and marketing content.

**Tech Stack:** TypeScript, Next.js

**Current State:** Connected via `api-blog.shothik.ai`. Blog section exists at `/blogs`.

**Assessment:** Already integrated. Blog API is live and serving content.

**Integration Recommendation:** **No action needed.**

---

### 3.6 Work-for-Me / Job Automation (`shothikai/Work-for-me-dev`, `shothikai/work-for-me`) ⭐ EXPERIMENTAL

**What it does:** AI-powered job application automation — browser-controlling agent that applies to jobs autonomously.

**Tech Stack:** TypeScript, likely Puppeteer/Playwright

**Current State:** Development stage. Two repos exist (dev and non-dev versions), suggesting active experimentation.

**Assessment:** This is a separate product concept, not directly related to academic integrity platform. Could be a future B2B or premium feature.

**Improvement Areas:**
1. No clear API interface for frontend integration
2. No documentation on capabilities or limitations
3. Not aligned with current product positioning (academic tools)
4. Legal/ethical considerations for autonomous job applications

**Integration Recommendation:** **P3 — Park for now.** Not aligned with current product focus. Revisit when expanding beyond academic market.

---

### 3.7 Shothik V4 (`shothikai-platform/shothik-v4`) ⭐ ANALYSIS ONLY

**What it does:** Next-generation frontend codebase. Full rewrite of the platform with improved architecture.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Redux Toolkit, React Query, Radix UI — **identical stack to current v3**

**Structure:** Has same directory pattern (`src/adapters/`, `src/analysers/`, `src/components/`, `src/hooks/`, `src/redux/`, `src/services/`)

**Assessment:** This appears to be a cleaner rewrite/reorganization of the v3 codebase. Key differences:
- Has `_mock/` directory (test data patterns)
- Has `mappers/` and `analysers/` directories (data transformation layer)
- Has `builder/` directory (component building patterns)
- Uses `(primary-layout)` and `(secondary-layout)` routing — same as current

**Improvement Areas for Current Platform (learnings from v4):**
1. **Adapter pattern**: v4 has `src/adapters/` for API response transformation — our v3 has this but could be more consistent
2. **Analysers**: v4 has dedicated analysis utilities — we have `stemPreprocessor.ts` and `citationDetector.ts` but they're scattered
3. **Mappers**: Dedicated data mapping layer — v3 does inline transformations
4. **Builder pattern**: Component factories — could reduce component duplication

**Integration Recommendation:** **Do not migrate.** The current v3 codebase on Replit is the production system. Cherry-pick architectural patterns where beneficial.

---

### 3.8 Plagiarism Service (`shothikai/shothik-plagiarism`) ⭐ ALREADY CONNECTED

**What it does:** Plagiarism detection backend service.

**Tech Stack:** TypeScript

**Current State:** Connected via main API. Frontend has full plagiarism checker at `/plagiarism-checker`.

**Integration Recommendation:** **Already connected.**

---

### 3.9 Research V2 (`shothikai/shothik-research-v2`) ⭐ ALREADY CONNECTED

**What it does:** LangGraph-based deep research agent — multi-step research with web search, reflection, image search, citation management.

**Tech Stack:** Express.js, TypeScript, LangChain, Google Gemini, MongoDB, Brave Search, RabbitMQ

**Current State:** Connected via main API + Socket.io streaming. Frontend has full research UI at `/research`.

**Integration Recommendation:** **Already connected.**

---

### 3.10 Empty/Archived Repos

| Repo | Status | Action |
|------|--------|--------|
| `bypass-gpt-data-extractor` | Empty (0 KB) | Archive |
| `meeting-min-bot` | Empty (0 KB) | Archive |
| `demo-repository` | GitHub template demo (2 KB) | Archive |
| `v1`, `v2` | Legacy versions (2023) | Archive |
| `template` | Old template project | Archive |
| `shothikai-admin/Shothik-Ai-Knowledge-Hub` | Unknown | Investigate |

---

## 4. Gap Analysis Summary

| Module | Connected? | Priority | Effort | Revenue Impact |
|--------|-----------|----------|--------|----------------|
| Writing Studio Backend (LaTeX PDF) | **NO** | P0 | 5-6 weeks | HIGH — completes Write→Check→Submit |
| Payment Admin Panel | **NO** | P2 | 2-3 weeks | LOW — operational tool |
| Work-for-Me (Job AI) | **NO** | P3 | Unknown | LOW — different market |
| Auth Service | Indirect | N/A | None | N/A |
| Marketing Automation | YES | N/A | None | Maintenance mode |
| Blog | YES | N/A | None | SEO content |
| Plagiarism | YES | N/A | None | Core tool |
| AI Detector | YES | N/A | None | Core tool |
| Research V2 | YES | N/A | None | Core tool |
| Presentation Gen | YES | N/A | None | Core tool |
| Sheet Gen | YES | N/A | None | Core tool |
| Paraphrase | YES | N/A | None | Core tool |

---

## 5. Recommended Implementation Plan

### Phase 5 (Immediate — 5-6 weeks): Writing Studio LaTeX Integration

This is the **only unconnected module that directly impacts revenue and product positioning**. It completes the academic pipeline:

**Frontend Work Required:**
1. **Template Picker Component** — Let users choose IEEE, Springer, APA, Modern Book format
2. **PDF Preview Panel** — In-editor preview of generated PDF (iframe or embedded viewer)
3. **Export Button & Build Status** — Trigger PDF generation, show processing/complete status
4. **Document Import** — Upload DOCX/PDF/LaTeX files to import into editor
5. **AI Co-Writer** — Gemini-powered inline suggestions (streaming autocomplete)
6. **Cloud Storage Integration** — Save/load documents from GCS

**Backend Requirements:**
- Writing Studio backend needs to be deployed (Docker → Cloud Run or similar)
- RabbitMQ instance needed for job queue
- GCS bucket for PDF storage
- Gemini API key for AI features

**Improvement Items Before Integration:**
- Add health check endpoints to backend and worker
- Implement proper error responses with user-friendly messages
- Add WebSocket support for real-time build status (avoid polling)
- Add PDF caching to avoid regenerating unchanged documents
- Add retry logic for failed LaTeX compilations
- Template validation (ensure LaTeX templates compile without content)

### Phase 6 (Deferred): Admin Panel Embedding
- Embed payment admin as protected `/dashboard/admin` route
- Port UI to Gaia design system
- Add RBAC checks

### Parking Lot:
- Work-for-Me: Revisit in Q3 2026 if expanding beyond academic market
- V4 patterns: Cherry-pick adapter/mapper patterns incrementally

---

## 6. Architecture Improvement Recommendations (Cross-Cutting)

### From V4 Codebase Analysis:
1. **Introduce `src/adapters/` layer** — Standardize API response transformations (currently mixed between services and components)
2. **Consolidate analysis utilities** — Move `stemPreprocessor.ts`, `citationDetector.ts`, `fileExtractor.ts` into `src/analysers/` directory
3. **Add mapper utilities** — Create `src/mappers/` for data shape transformations between API and UI models

### From Backend Service Patterns:
4. **Unified service health checks** — All services use different health check patterns; standardize
5. **Shared auth package** — `@ridz-shothikai/shothik-auth-service` is used across services but version pinning varies (1.0.4 → 1.0.6)
6. **Queue standardization** — Services mix RabbitMQ and BullMQ; pick one strategy

### Security:
7. **Rotate exposed credentials** — `shothik-project-2cc7a51b6844.json` (GCS service account key) is committed to the writing-studio repo. This should be rotated and moved to secret management.
8. **Clean up empty repos** — `bypass-gpt-data-extractor` and `meeting-min-bot` are empty but private — either populate or delete to reduce attack surface.

---

*Report generated from live GitHub analysis of 29 repositories across 2 organizations.*
