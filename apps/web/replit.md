# Shothik AI

## Overview
Shothik AI is an AI-powered platform for digital marketing automation and content creation. It aims to streamline marketing efforts and enhance content quality through AI. Key capabilities include managing Meta advertising campaigns, offering AI writing utilities (paraphrasing, plagiarism detection), providing an academic writing studio with advanced AI actions and citation management, and featuring AI agents for slide generation, data analysis, and deep research. The platform seeks to establish an efficient digital presence and academic writing experience, targeting significant market share in AI-powered content and marketing automation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
The frontend uses Next.js 16 (App Router), TypeScript, and Tailwind CSS v4. State is managed with Redux Toolkit, and server state/API caching with React Query/RTK Query. UI components leverage Radix UI primitives wrapped with shadcn/ui, custom components, and Framer Motion. Tiptap and Monaco Editor are used for rich text and code editing, respectively.

### Key Architectural Patterns
The architecture employs a Service Layer Pattern, custom React hooks, and Redux slices per feature. `postMessage` handles parent-iframe communication, and Socket.io-client enables real-time features. Authentication is JWT token-based with Google OAuth. Error handling uses Error Boundaries, custom error classes, and toast notifications.

### UI/UX Design Principles (Gaia UI)
Gaia UI principles dictate a flat design, generous spacing, CSS variables, `rounded-xl` for cards, specific Framer Motion spring animations, and accessibility. Dark mode uses the `zinc` palette and `prefers-reduced-motion`.

### Feature Specifications
- **Core AI Tools**: Includes Plagiarism Checker (STEM-native, client-side file extraction), AI Detector (STEM-native, production-hardened), Paraphrase (production-hardened, Gaia UI aligned), Humanize GPT (production-hardened, cross-service integration), and Grammar Fix (production-hardened, STEM-aware).
- **Writing Studio (Unified Book Workspace)**: Redesigned as a 4-tab unified workspace for book publishing, writing, research papers, and assignments.
    - **Write View**: 3-pane layout with a manuscript chapter tree, prose editor (Georgia serif, toolbar with B/I/U + Citation/Comment), and an AI panel for writing, research, and improvement.
    - **Outline View**: Left icon toolbar, center canvas with draggable chapter and scene cards, and a right sidebar with pacing visualization and AI Scene Generator.
    - **Formatting View**: Left panel for typography, page layout, and chapter styles; right panel displays a book canvas with two-page spread preview and export options (PDF/EPUB/DOCX).
    - **Publish View**: A 3-column grid featuring a publishing checklist, general info form (title, description with AI Assist, keywords, category), and a cover preview. Publishing requires an Enterprise plan.
- **Sheet AI (FortuneSheet)**: Replaces `react-data-grid` for Excel-like spreadsheet capabilities, including formulas, cell formatting, and merge cells, with a bidirectional data adapter.

### Monetization
- **Usage-Based Access**: All tool pages integrate `ToolPageWrapper` to monitor backend usage limits. `UpgradeBanner` displays at 70%+ usage, and `UpgradePrompt` modal triggers at limit or after third use.
- **Pricing Tiers**: Starter ($7.99/mo), Pro ($15/mo), and Enterprise ($25/mo) plans offer escalating features, including unlimited tool usage, STEM-Safe mode, plagiarism checks, citation management, AI agents, and book publishing.
- **Publishing & Earning Platform**: Transforms Shothik AI into a platform where authors can publish books to Google Play Books via Shothik's UK company, earning royalties. A 6-step publishing wizard guides submissions, including manuscript/cover upload, metadata, pricing calculation, agreement acceptance, and review. An Author Dashboard tracks book status and sales.

### Convex Backend (Publishing Platform)
- **Cloud Deployment**: Deployed to `https://healthy-mastiff-358.convex.cloud`. Note: Preview deploys generate new URLs each time. Update `NEXT_PUBLIC_CONVEX_URL` in `.env.local` and fallback URLs in `convex/http.ts`, `convex/auth.config.ts`, and `src/app/api/auth/convex-token/route.ts` after each deploy. For a stable production URL, upgrade to a Convex production deploy key.
- **Deploy command**: `npx convex deploy --preview-create shothik-prod --yes`
- **Schema**: `books` table (manuscript, cover, pricing, agreement, status, distribution channels, sales tracking), `salesRecords` table (per-channel sales data by period), `payouts` table (payout requests with status tracking), `payoutAccounts` table (Stripe Connect, Payoneer, bank transfer details), `projects` table.
- **Backend Functions**: Full CRUD lifecycle for books, earnings queries (summary, per-book, monthly breakdown), payout management (request, history, accounts), sales recording.
- **Authentication**: RS256 JWT-based auth with JWKS verification. All Convex mutations/queries enforce server-side auth identity (no client-side userId passthrough). Admin access uses JWT identity + email allowlist (demo@shothik.ai).
- **React Hooks**: `usePublishingBook` for wizard state, `useAuthorBooks` for dashboard, `useEarnings` for earnings data, `usePayouts` for payout management.
- **Admin Review System**: Admin-only backend with `requireAdmin()` security for managing book submissions.
- **Notification System**: In-book notifications for authors regarding review status and actions.
- **Earnings & Payouts**: Royalty tracking (Google pays 70% to Shothik, Shothik keeps 15%, authors get 85%). Min payout $25. Stripe Connect, Payoneer, and bank transfer methods. API routes at `/api/stripe/connect` and `/api/stripe/payout` with server-side auth verification.
- **Distribution**: PublishDrive integration service layer (stubbed, behind `NEXT_PUBLIC_PUBLISHDRIVE_ENABLED` env flag). Supports 12 channels (Google Play, Amazon Kindle, Apple Books, Kobo, etc.). Will activate when PublishDrive Pro plan is obtained.
- **Publish View**: 4-tab dashboard (My Books, Earnings, Payouts, Distribution) with wizard, tracker, and notification system.

### Security & Infrastructure (Phase 1 — Implemented Feb 23, 2026)
- **JWT Auth**: Removed `decodeJwt` bypass in Convex token exchange — now strictly validates via backend API before issuing Convex tokens.
- **Stripe Auth**: Removed body-param auth fallback. All Stripe routes require Bearer token. GET endpoint verifies account ownership with metadata backfill for legacy accounts.
- **Rate Limiting**: Global rate limiting via Next.js middleware (`src/middleware.ts`). Per-route configs in shared module (`src/lib/rate-limit-config.ts`): AI cowriter (10/min), Stripe (10/min), Auth/LaTeX (20/min), Research/Sheet (30/min), Templates (60/min). In-memory sliding window. Both middleware.ts and api-middleware.ts import from single source of truth.
- **Security Headers**: All responses include X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy.
- **DOMPurify**: Replaced browser-only `dompurify` with `isomorphic-dompurify` for server+client sanitization. 10 of 17 `dangerouslySetInnerHTML` usages wrap with `sanitizeHtml()`. Remaining 7 are trusted library outputs (Shiki, KaTeX, analytics scripts).
- **Structured Logger**: Enhanced `src/lib/logger.ts` with configurable log levels, info-level production logging, API request helper, and security event logging.
- **Deep Health Check**: `GET /api/health?deep=true` checks backend API, Convex, and environment variables. `GET /api/health?metrics=true` returns runtime metrics, cache stats, and circuit statuses (gated behind admin key in production).
- **Runtime Metrics** (`src/lib/runtime-metrics.ts`): Lightweight in-memory counter/gauge system tracking cache hits/misses/evictions, circuit breaker events, rate limit rejections, and store sizes. Periodic logging every 5 minutes.
- **Sheet Auth**: `GET /api/sheet/chat/get_my_chats` now scopes to authenticated user (was returning all sessions).
- **Shared Middleware**: `src/lib/api-middleware.ts` provides reusable `withApiProtection()` wrapper for route-level auth + rate limiting.

### Core Tool Services Hardening (Phase 2 — Implemented Feb 23, 2026)
- **AI Gateway** (`src/lib/ai-gateway.ts`): Circuit breaker pattern via Cockatiel library. Per-tool timeout configs (15s default, 300s plagiarism, 60s cowriter). Exponential backoff retry. Automatic circuit recovery via half-open state.
- **Result Cache** (`src/lib/result-cache.ts`): LRU cache with per-tool TTLs (1-4 hours) and stale-cache fallback (24-72 hours). SHA-256 content hashing for deduplication. Configurable max entries per tool.
- **Usage Tracker** (`src/lib/usage-tracker.ts`): In-memory per-user per-tool usage tracking. Tier-based limits (free/starter/pro/enterprise) with hourly and daily windows. Auto-cleanup of expired records.
- **Tool Errors** (`src/lib/tool-errors.ts`): Standardized error hierarchy (Auth, Quota, ServiceUnavailable, Timeout, InputValidation, PaymentRequired). User-friendly messages. Error display info helper for UI.
- **Resilient Socket** (`src/lib/resilient-socket.ts`): Exponential backoff with jitter for reconnection. MessageDeduplicator for idempotent processing. HeartbeatManager for keep-alive. Reconnect state utilities.
- **STEM Masking Enhanced** (`src/services/stemPreprocessor.ts`): Added `\[...\]` and `\(...\)` LaTeX patterns. 70+ new LaTeX commands (trig, calculus, linear algebra, styling). R/Python/MATLAB code detection. `validateMaskRoundTrip()` for placeholder survival checking. `unmaskWithRecovery()` for graceful corrupted placeholder handling.
- **Service Integration**: AI Detector, Grammar, Plagiarism, and Paraphrase services now wrap API calls with gateway circuit breakers, content-hash caching (with complete cache keys including all output-affecting params), and normalized error handling.

### Quality and Robustness
The platform includes XSS sanitization (isomorphic-dompurify), route-level error/loading states, service retry logic with circuit breakers, global API rate limiting via middleware, security headers, content-hash result caching, tier-based usage tracking, and output statistics for content tools. It features rich copy functionality and auto-saves drafts to local storage. STEM rephrase masking preserves LaTeX/code during rephrasing with round-trip validation and recovery.

## External Dependencies

### Backend API
- **Primary Backend API**: `prod-api.shothik.ai` (production) / `api-qa.shothik.ai` (QA).

### Third-Party Services
- **Meta/Facebook Business API**: For OAuth, ad publishing, page management, and pixel tracking.
- **Stripe**: For payment processing.
- **Cloudinary**: For image hosting.
- **ImageKit**: CDN for media assets.
- **Google Vertex AI Search**: For deep research grounding.
- **Semantic Scholar API**: For academic paper search and citation data.

### Real-time Communication
- **Socket.io-client**: For real-time updates (e.g., research streaming, wallet transactions).

### Analytics
- **Google Analytics (gtag)**
- **Facebook Pixel**