# Shothik AI — Service Tracker

**Last Updated:** February 23, 2026
**Project:** Shothik AI v3 (Next.js 16 Frontend)
**Backend API:** prod-api.shothik.ai (production) / api-qa.shothik.ai (QA)
**Convex Backend:** https://healthy-mastiff-358.convex.cloud (Publishing Platform)

---

## Master Overview

| # | Service | Route | Current State | Priority | Status |
|---|---------|-------|---------------|----------|--------|
| 1 | **Plagiarism Checker** | `/plagiarism-checker` | Production-hardened, STEM features complete (Phases 1.5–4 done) | P0 — Core | Production Hardened |
| 2 | **AI Detector** | `/ai-detector` | Production-hardened, STEM preprocessing, mobile tabs, cross-service wiring | P1 — High | Production Hardened |
| 3 | **Paraphrase** | `/paraphrase` | Production-hardened: debug cleanup, Gaia UI borders, ARIA labels | P1 — High | Production Hardened |
| 4 | **Grammar Fix** | `/grammar-checker` | Production-hardened, STEM preprocessing, mobile tabs, Gaia UI | P1 — High | Production Hardened |
| 5 | **Summarize** | `/summarize` | Page exists, basic UI | P2 — Medium | Not Started |
| 6 | **Translator** | `/translator` | Page exists, basic component structure | P3 — Low | Not Started |
| 7 | **Humanize GPT** | `/humanize-gpt` | Production-hardened, Gaia UI aligned, cross-service wiring to AI Detector | P1 — High | Production Hardened |
| 8 | **Writing Studio** | `/writing-studio` | Fully redesigned 4-tab workspace (Write/Outline/Formatting/Publish), 3 project types, AI co-writer, citations, export | P0 — Core | Active Development |
| 9 | **Publishing Platform** | (within Writing Studio) | Complete publishing pipeline: wizard, admin review, earnings, payouts, distribution | P0 — Core | Active Development |
| 10 | **Marketing Automation** | `/marketing-automation` | Extensive UI, multi-page flow, Meta integration | P3 — Low | Not Started |
| 11 | **AI Agents (Slides)** | `/agents/[agentType]`, `/slides` | Slide generation with iframe editor, share links, replay | P2 — Medium | Not Started |
| 12 | **AI Agents (Sheets)** | `/agents/[agentType]` | FortuneSheet adapter, streaming data analysis | P2 — Medium | Not Started |
| 13 | **Deep Research** | `/research` | Real-time streaming research via Socket.io, academic search, sources grid | P2 — Medium | Not Started |
| 14 | **Admin Review Panel** | `/admin/review` | Book submission review system for admins (demo@shothik.ai) | P0 — Core | Done |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| Done | Feature fully implemented and verified |
| Partial | Feature exists but needs fixes or wiring |
| Not Started | Feature not yet worked on |
| Blocked | Requires backend changes or external dependency |
| Active Development | Feature actively being built with significant progress |

---

## 1. Plagiarism Checker

**Route:** `/plagiarism-checker`
**Status:** Production Hardened (Phases 1.5–4 complete)
**Service File:** `src/services/plagiarismService.ts`

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Done | Route renders, editor works, no console errors |
| API integration | Done | Service layer with 5-min timeout, abort handling, error messages |
| Data mapping | Done | `PlagiarismDataMapper.ts` transforms backend responses |
| Caching | Done | `PlagiarismCacheManager.ts` handles client-side caching |
| Request management | Done | `PlagiarismRequestManager.js` for dedup/queuing |
| Backend reachability | Blocked | `api-qa.shothik.ai` unreachable from Replit (expected network isolation) |

### Findings (from production hardening)

| Finding | Severity | Status |
|---------|----------|--------|
| Broken console.log artifacts across 6 files | Critical | Fixed |
| No timeout on API calls (could hang forever) | Critical | Fixed — 5-min timeout with AbortController |
| Missing API URL validation | High | Fixed |
| Technical error messages leaked to users | Medium | Fixed — user-friendly messages |
| Debug console.warn/error in production code | Low | Fixed — all removed |
| Event tracking label wrong ("ai-detector") | Low | Fixed |
| LoginDialog text incorrect | Low | Fixed |
| WordCounter toolName wrong | Low | Fixed |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| STEM-native plagiarism detection | P0 | Done — stemPreprocessor.ts with LaTeX/code/reference/quote detection |
| Citation-aware analysis (exclude properly cited content) | P0 | Done — citationDetector.ts, CitationAnalysisPanel, useCitationAnalysis hook |
| Affordable pricing ($5-10/month for researchers) | P0 | Planned |
| LaTeX formula handling | P1 | Done — auto-detected and excludable via toggle |
| Code block detection | P1 | Done — fenced, backtick, indented blocks with heuristic |
| File upload (PDF/DOCX/LaTeX) | P1 | Done — FileDropzone with drag & drop, PDF/DOCX/TXT/LaTeX extractors |
| Cross-lingual plagiarism detection | P2 | Not Started |
| Real-time checking while writing | P3 | Not Started |
| Browser extension (Overleaf, Google Docs) | P3 | Not Started |

### What Has Been Implemented

| Feature | Date | Details |
|---------|------|---------|
| Production hardening | Feb 2026 | Syntax fixes, timeout handling, error messages, debug cleanup |
| "Try Sample" button | Feb 2026 | Loads ~200-word STEM research text for instant demo |
| "Exclude References" toggle | Feb 2026 | Detects References/Bibliography/Works Cited/Literature Cited headers, strips everything below |
| "Exclude Quotes" toggle | Feb 2026 | Removes double/single/smart quoted passages before scanning |
| Color-coded highlights | Feb 2026 | Red for exact matches (100%), amber gradients for paraphrased (high/medium/low) |
| Bidirectional click linking | Feb 2026 | Editor highlights → sidebar scroll + accordion expand; sidebar → editor scroll + flash animation |
| Highlight legend | Feb 2026 | Visual key showing red = exact match, amber = paraphrased |
| Highlight position mapping | Feb 2026 | Normalized-to-original text position mapping for whitespace handling |
| PDF report download | Pre-existing | `pdfDownload.js` helper for report export |
| STEM preprocessing (Phase 2A) | Feb 2026 | `stemPreprocessor.ts` — LaTeX/code/reference/quote auto-detection with exclusion toggles |
| File upload pipeline (Phase 2B) | Feb 2026 | `fileExtractor.ts` + `FileDropzone.tsx` — PDF/DOCX/TXT/LaTeX extraction, drag & drop, compact toolbar mode, password-protected PDF detection |
| Citation analysis (Phase 2C) | Feb 2026 | `citationDetector.ts` (APA/IEEE/DOI/URL), `useCitationAnalysis` hook, `CitationAnalysisPanel.tsx` with coverage ring |
| Mobile layout (Phase 3) | Feb 2026 | Tab-based editor/results navigation with ARIA, responsive padding, compact file upload in toolbar |
| Gaia UI bug fixes (Phase 1.5) | Feb 2026 | All 7 bugs fixed: dark mode highlights (`color: inherit`), ARIA attributes, reduced motion, zinc palette |
| Border migration (Phase 4A) | Feb 2026 | Removed decorative borders from 7 components, replaced with bg-muted/shadow-sm flat design. Kept semantic borders (similarity badges). |
| KaTeX math rendering (Phase 4B) | Feb 2026 | `MathRenderer.tsx` — renders inline ($) and display ($$) LaTeX, XSS-safe React nodes, KaTeX CSS auto-loaded |
| Shiki code highlighting (Phase 4C) | Feb 2026 | `CodeHighlighter.tsx` — client-side Shiki with 12 STEM languages, dual theme (github-light/dark), lazy singleton loader |
| STEM content renderer (Phase 4) | Feb 2026 | `STEMContentRenderer.tsx` — unified parser for code blocks + math formulas, integrated into ReportSectionItem excerpts |
| Pre-Phase 5 stabilization | Feb 2026 | Fixed Summarize crash (orphaned console.log), Humanize GPT crash (orphaned console.log in TopNavigation), cross-origin config (allowedDevOrigins), Paraphrase hardening (debug cleanup, Gaia UI borders, ARIA), codebase-wide orphaned debug string sweep |

### Gaia UI Quality Assessment (Feb 2026)

**Overall Score: 8.5/10** — See `Gaia_UI_Quality_Audit.md` for full 20-agent analysis. Score improved from 7.5 after Phase 1.5 bug fixes.

| Dimension | Score | Status |
|-----------|-------|--------|
| Design tokens | 7/10 | Aligned — same shadcn/ui foundation |
| Animation & loading | 8.5/10 | Strong — physics-based springs |
| Color hierarchy | 8/10 | Strong — semantic plagiarism colors |
| Component composition | 8/10 | Strong — clean TypeScript interfaces |
| Borders & surfaces | 8.5/10 | Fixed — Phase 4 border migration complete, bg-muted/shadow-sm flat design |
| Accessibility | 9/10 | Fixed — ARIA labels, aria-live, role=status/alert on all components |
| Dark mode | 9/10 | Fixed — `color: inherit` on all highlights, zinc palette |
| Mobile responsiveness | 8.5/10 | Fixed — tab navigation, compact file upload, responsive padding |

### Strategic Roadmap

| Milestone | Target | Dependency |
|-----------|--------|------------|
| Security overhaul (JWT, CORS, secrets) | Before any public launch | Backend team |
| STEM feature set complete (LaTeX, code, citations) | Month 1-2 | Done — Phases 2A-2C complete |
| Accuracy benchmark study (vs Turnitin/QuillBot on 100+ STEM papers) | Month 2-3 | Backend access |
| South/SE Asia soft launch ($5-10/month pricing) | Month 3-4 | Security + accuracy |
| 1,000 monthly active users | Month 4-6 | Marketing + product |
| SOC 2 Type 1 certification | Month 6-12 | Compliance team |

---

## 2. AI Detector

**Route:** `/ai-detector`
**Status:** Production Hardened
**Service File:** `src/services/ai-detector.service.ts`

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Done | Route renders correctly; hydration mismatch and Meta Pixel warnings are dev-only |
| Service layer | Done | `ai-detector.service.ts` with TypeScript, custom error class, AbortSignal support |
| API integration | Done | RTK Query `useScanAidetectorMutation` wired to backend |
| UI components | Done | Content section, FAQ section, OutputResult, SampleText, UsesLimitBar, ShareURLModal |
| STEM preprocessing | Done | LaTeX/code exclusion via `stemPreprocessor.ts` |
| Mobile responsive | Done | Tab-based editor/results navigation with WAI-ARIA |
| Cross-service | Done | Humanize GPT "Detect AI" button passes content via sessionStorage |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Verify page loads without errors | P0 | Done |
| Validate API integration with backend | P0 | Done |
| Add STEM-aware detection (reduce false positives) | P1 | Done |
| Mobile tab navigation | P1 | Done |
| Cross-service integration (Humanize GPT → AI Detector) | P1 | Done |
| Production hardening (Gaia UI, accessibility, debug cleanup) | P1 | Done |
| Accuracy benchmarking on STEM papers | P1 | Backend — Not Started |
| ONNX model conversion for speed | P0 | Backend — Not Started |
| Hindi language support | P2 | Not Started |
| Moodle LMS plugin | P2 | Not Started |

### Strategic Roadmap

Aligned with Plagiarism Checker — AI detection complements plagiarism detection as a bundle offering. The integrated Detect → Humanize → Paraphrase → Check Plagiarism workflow is the platform's strongest competitive moat.

---

## 3. Paraphrase

**Route:** `/paraphrase`
**Status:** Production Hardened
**Service File:** `src/services/paraphrase.service.ts`

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Done | Route renders correctly (HTTP 200) |
| Service layer | Done | TypeScript with custom error class + AbortSignal support |
| UI components | Done | Feature-rich: 7 modes, 5 languages, auto-freeze, file history |
| TipTap editor | Done | StarterKit duplicate extension warnings fixed |
| Plagiarism integration | Done | "Check Plagiarism" button opens PlagiarismSidebar with useGlobalPlagiarismCheck auto-trigger |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Wire "Check Plagiarism" button to plagiarism scan | P1 | Done |
| Verify all 7 paraphrase modes work | P1 | Not Started |
| Add STEM paraphrase modes (Technical, Citation-Safe) | P2 | Not Started |
| Compare Modes feature (side-by-side variants) | P2 | Not Started |
| Paraphrase quality indicator (% changed) | P3 | Not Started |

### Strategic Roadmap

*Paraphrase is the highest-traffic feature on the live site. Key integration point: paraphrased text → one-click plagiarism check.*

---

## 4. Grammar Fix

**Route:** `/grammar-checker`
**Status:** Production Hardened
**Service File:** `src/services/grammar-checker.service.ts`

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Done | Route renders, Tiptap editor works, no console errors |
| Service layer | Done | TypeScript with custom error class (`GrammarServiceError`), AbortSignal |
| UI components | Done | Full editor with toolbar, sidebar, section history, issue cards |
| Gaia UI | Done | Flat design (shadow-sm), rounded-xl, no borders, CSS variable colors |
| Accessibility | Done | aria-labels on editor/buttons, aria-live on results, role=textbox |
| STEM preprocessing | Done | LaTeX/code exclusion toggles, auto-detection |
| Mobile tabs | Done | Tab-based editor/results switching on ≤1024px, WAI-ARIA |
| Dark mode | Done | CSS variable error highlight, reduced motion support |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| STEM-aware grammar checking | P0 | Done |
| Mobile responsive layout | P1 | Done |
| Gaia UI compliance | P1 | Done |
| Academic writing style suggestions | P2 | Not Started |
| Integration with Writing Studio | P2 | Not Started |

---

## 5. Summarize

**Route:** `/summarize`
**Status:** Not Started
**Service File:** *No dedicated service file found*

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Partial | Route exists, basic UI with InitialInputActions |
| Service layer | Unknown | No dedicated summarize service file found |
| UI components | Partial | Content section and FAQ section exist |
| API integration | Unknown | Needs investigation |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Verify page loads without errors | P0 | Not Started |
| Identify and validate backend endpoint | P0 | Not Started |
| Test summarization quality | P1 | Not Started |
| STEM-specific summarization (abstract generation) | P2 | Not Started |

---

## 6. Translator

**Route:** `/translator`
**Status:** Not Started
**Service File:** *No dedicated service file found*

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Partial | Route exists |
| UI components | Partial | `Translator.jsx`, `LanguageMenu.jsx`, `BottomBar.jsx` exist in `src/components/tools/tanslator/` (note: typo in directory name) |
| Service layer | Unknown | No dedicated translator service file found |
| API integration | Unknown | Needs investigation |

### Findings

| Finding | Severity | Status |
|---------|----------|--------|
| Directory name has typo: `tanslator` instead of `translator` | Low | Not Fixed |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Verify page loads without errors | P0 | Not Started |
| Identify backend endpoint | P0 | Not Started |
| Fix directory name typo | P3 | Not Started |
| Support for regional languages (Bengali, Hindi, Urdu) | P2 | Not Started |

---

## 7. Humanize GPT

**Route:** `/humanize-gpt`
**Status:** Production Hardened
**Service File:** Uses RTK Query via `toolsApi.js` (no dedicated service file — API handled through Redux)

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Done | Route renders, full UI with editor, settings, output |
| Service layer | Done | RTK Query mutation via `toolsApi.js`, Redux slice in `inputOutput.js` |
| UI components | Done | HumanizedContend, GPTsettings, GPTsettingSidebar, GPTHistoryTab, HumanizeScrores, OutputNavigation, Navigations, InputBottom, CustomDonutChart, AnimatedLoader |
| API integration | Done | Wired to backend via RTK Query |
| Cross-service wiring | Done | "Detect AI" button passes content to AI Detector via sessionStorage |
| History | Done | GPTHistoryTab with humanize history via `humanizeHistory` RTK Query API |
| Gaia UI | Done | Aligned with platform design |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Verify page loads without errors | P0 | Done |
| API integration with backend | P0 | Done |
| Cross-service integration (Humanize → AI Detector) | P1 | Done |
| Production hardening (debug cleanup, Gaia UI) | P1 | Done |
| Test humanization quality vs AI detectors | P1 | Not Started — requires backend access |
| STEM-aware humanization (preserve LaTeX/code) | P2 | Not Started |

---

## 8. Writing Studio

**Route:** `/writing-studio`
**Status:** Active Development — Fully redesigned as unified workspace
**Service File:** `src/services/writing-studio.service.ts` (124 lines)

### Current State

| Area | State | Details |
|------|-------|---------|
| Dashboard | Done | `WritingHomeDashboard.jsx` (332 lines) — project list, search, filter by type, delete |
| Project creation | Done | `CreateProjectModal.jsx` (287 lines) — 3 types (book/research/assignment), templates per type |
| Project storage | Done | `projects-store.js` — localStorage-based CRUD with default section templates |
| Workspace header | Done | `WorkspaceHeader.jsx` (154 lines) — tab navigation, editable title, back button |
| WritingStudioContent | Done | `WritingStudioContent.jsx` (131 lines) — routes to correct view based on project type and tab |
| Convex integration | Done | `ConvexClientProvider.jsx` (103 lines) — wraps app with authenticated Convex provider |
| Usage limits | Done | `useWritingStudioLimits.ts` — monitors backend usage for tool access gating |

### Workspace Views

| View | File | Lines | State | Details |
|------|------|-------|-------|---------|
| **Write View** | `WriteView.jsx` | 345 | Done | 3-pane layout: chapter tree sidebar, prose editor (Georgia serif, toolbar with B/I/U), AI panel |
| **Outline View** | `OutlineView.jsx` | 303 | Done | Left icon toolbar, center canvas with draggable chapter/scene cards, right sidebar with pacing visualization and AI Scene Generator |
| **Formatting View** | `FormattingView.jsx` | 306 | Done | Left panel (typography, page layout, chapter styles), right panel (two-page spread preview, export options PDF/EPUB/DOCX) |
| **Publish View** | `PublishView.jsx` | 314 | Done | 4-tab dashboard (My Books, Earnings, Payouts, Distribution) with Enterprise gate |
| **Research Paper View** | `ResearchPaperWriteView.jsx` | 342 | Done | Specialized IMRaD structure editor for research papers with tabbed modes |
| **Assignment View** | `AssignmentWriteView.jsx` | 347 | Done | Assignment-specific editor with write/research/review/submit tabs |

### Project Types & Templates

| Type | Templates | Default Sections |
|------|-----------|-----------------|
| **Book** | Novel, Short Story Collection, Non-Fiction Book, Poetry Collection, Blank Book | Chapter 1 (Scene 1), Chapter 2 (Scene 1) |
| **Research** | Journal Article, Thesis/Dissertation, Conference Paper, Review Paper, Blank Paper | Abstract, Introduction, Literature Review, Methodology, Results, Discussion, Conclusion, References |
| **Assignment** | Essay, Lab Report, Case Study, Literature Review, Thesis Proposal, Blank | Introduction, Body Section 1, Body Section 2, Conclusion, References |

### Supporting Components

| Component | File | State | Details |
|-----------|------|-------|---------|
| AI Co-Writer Panel | `AiCoWriterPanel.jsx` | Done | AI writing assistance panel |
| Citation Suggestion | `CitationSuggestionPanel.jsx` | Done | Academic citation recommendations |
| Diff Preview | `DiffPreview.jsx` | Done | Shows before/after AI edits |
| Document Import | `DocumentImport.jsx` | Done | Import existing documents |
| Export Panel | `ExportPanel.jsx` | Done | PDF/EPUB/DOCX export with `useDocumentBuild` |
| Research Search | `ResearchSearchPanel.jsx` | Done | Search academic sources |
| Review Panels | `ReviewPanels.jsx` | Done | AI review/feedback panels |
| Writing Templates | `WritingTemplates.jsx` | Done | Template browser and selector |
| Context Panel | `ContextPanel.jsx` | Done | Contextual side panel for research/citations |
| Canvas components | `WritingCanvas.jsx`, `FloatingToolbar.jsx`, `DocumentOutline.jsx`, `NotebookHeader.jsx`, `EditorFooter.jsx`, `BottomActionBar.jsx`, `TemplatePicker.jsx` | Done | Rich editor canvas with toolbars |
| Onboarding | `WritingStudioOnboarding.jsx` | Done | First-time user onboarding flow |
| Upgrade prompt | `WritingStudioUpgrade.jsx` | Done | Plan upgrade prompt for free users |

### Key Hooks

| Hook | File | Details |
|------|------|---------|
| `useAiCoWriter` | `useAiCoWriter.js` | AI-powered writing assistance |
| `useCitationSuggestions` | `useCitationSuggestions.ts` | Academic citation recommendations |
| `useDocumentBuild` | `useDocumentBuild.ts` | Document compilation for export |
| `useWritingStudioLimits` | `useWritingStudioLimits.ts` | Usage limit tracking |

### Tab Routing

| Project Type | Tab 1 | Tab 2 | Tab 3 | Tab 4 |
|-------------|-------|-------|-------|-------|
| Book | Write | Outline | Formatting | Publish |
| Research | Write | Research | Citations | Submit |
| Assignment | Write | Research | Review | Submit |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Dashboard and project management | P0 | Done |
| 4-tab workspace with view routing | P0 | Done |
| Write View (3-pane editor) | P0 | Done |
| Outline View (draggable cards) | P1 | Done |
| Formatting View (typography, export) | P1 | Done |
| Publish View (publishing pipeline) | P0 | Done |
| Research Paper specialized view | P1 | Done |
| Assignment specialized view | P1 | Done |
| AI Co-Writer integration | P1 | Done |
| Citation management | P1 | Done |
| Document import/export | P1 | Done |
| Real-time collaboration | P3 | Not Started |
| Tiptap → backend persistence (currently localStorage) | P1 | Partial — projects in localStorage, books in Convex |
| Integration with other tools (Paraphrase, Grammar, AI Detector) | P2 | Not Started — inline actions described but not wired |

### What Has Been Implemented

| Feature | Date | Details |
|---------|------|---------|
| Complete workspace redesign | Feb 2026 | 4-tab unified workspace for book publishing |
| 3 project types (book/research/assignment) | Feb 2026 | Each with dedicated views, templates, and section defaults |
| WritingHomeDashboard | Feb 2026 | Full project management with search, filter, create, delete |
| CreateProjectModal with templates | Feb 2026 | 16 templates across 3 project types |
| localStorage project persistence | Feb 2026 | `projects-store.js` with full CRUD operations |
| Write/Outline/Formatting/Publish views | Feb 2026 | All 4 workspace views implemented |
| AI Co-Writer and Citation panels | Feb 2026 | Supporting AI and research tools |
| Export system (PDF/EPUB/DOCX) | Feb 2026 | Via ExportPanel + useDocumentBuild |

---

## 9. Publishing Platform

**Status:** Active Development — Core pipeline complete
**Backend:** Convex Cloud (`https://healthy-mastiff-358.convex.cloud`)
**Deploy Command:** `npx convex deploy --preview-create shothik-prod --yes`

### Architecture

| Layer | Files | Lines | Details |
|-------|-------|-------|---------|
| **Convex Schema** | `convex/schema.ts` | 245 | 5 tables: projects, projectVersions, books, salesRecords, payouts, payoutAccounts |
| **Books Backend** | `convex/books.ts` | 436 | Full CRUD lifecycle, file uploads, status management, review workflow |
| **Earnings Backend** | `convex/earnings.ts` | 327 | Earnings summary, per-book breakdown, monthly aggregation, payout requests, account management |
| **Admin Backend** | `convex/admin.ts` | 339 | `requireAdmin()` security, book listing/review/approve/reject/publish, dashboard stats |
| **HTTP/Auth** | `convex/http.ts`, `convex/auth.config.ts` | 203 | JWKS endpoint, OpenID config, RS256 JWT verification |
| **Projects Backend** | `convex/projects.ts` | 145 | CRUD for writing projects |

### Publishing Wizard (6-Step Flow)

| Step | Component | Lines | State | Details |
|------|-----------|-------|-------|---------|
| 1. Manuscript Upload | `ManuscriptUpload.jsx` | 310 | Done | Drag & drop, PDF/EPUB/DOCX support, file validation |
| 2. Cover Upload | `CoverUpload.jsx` | 325 | Done | Image upload, dimension validation, cover preview |
| 3. Metadata Form | `MetadataForm.jsx` | 296 | Done | Title, description (AI Assist), keywords, category, language |
| 4. Pricing Calculator | `PricingCalculator.jsx` | 287 | Done | List price input, royalty calculation (85% author share), currency selection |
| 5. Agreement Acceptance | `AgreementAcceptance.jsx` | 255 | Done | Scrollable agreement, signature, checkbox confirmation |
| 6. Review & Submit | `ReviewSubmit.jsx` | 222 | Done | Summary review, final submission to Convex |

### Author Dashboard

| Component | Lines | State | Details |
|-----------|-------|-------|---------|
| `AuthorDashboard.jsx` | 292 | Done | Book listing with status badges, search, filter by status |
| `StatusTracker.jsx` | 348 | Done | Visual pipeline: Draft → Submitted → In Review → Approved → Uploading → Published |
| `NotificationBell.jsx` | 180 | Done | In-app notifications for review status changes, read/unread tracking |
| `PublishWizard.jsx` | 604 | Done | Orchestrates 6-step wizard flow with step validation and progress tracking |

### Earnings & Payouts

| Component | Lines | State | Details |
|-----------|-------|-------|---------|
| `EarningsDashboard.jsx` | 245 | Done | Total earnings, available balance, monthly chart, per-book breakdown table |
| `PayoutManager.jsx` | 391 | Done | Payout request form ($25 min), method selection (Stripe/Payoneer/bank), payout history |

| Hook | File | Lines | Details |
|------|------|-------|---------|
| `useEarnings` | `src/hooks/useEarnings.js` | 90 | Convex queries for earnings summary; includes `usePayouts` for payout management |
| `usePublishingBook` | `src/hooks/usePublishingBook.js` | 174 | Book wizard state, step management, Convex mutations; includes `useAuthorBooks` |
| `useAdminReview` | `src/hooks/useAdminReview.js` | 108 | Admin review panel hooks for listing, approving, rejecting books |

### Royalty Structure

| Flow | Percentage | Details |
|------|-----------|---------|
| Google Play pays | 70% of list price | Standard Google Play Books revenue share |
| Shothik keeps | 15% commission | Platform fee from Google's 70% |
| Author receives | 85% of Google's 70% | Net author royalty (~59.5% of list price) |

### Payout System

| Feature | State | Details |
|---------|-------|---------|
| Minimum payout | Done | $25 threshold |
| Stripe Connect | Done | Onboarding flow via `/api/stripe/connect`, instant payouts |
| Payoneer | Done | Global coverage, email-based account linking |
| Bank transfer | Done | Traditional bank account details |
| Payout history | Done | Status tracking: pending → processing → completed/failed |

### API Routes

| Route | File | Lines | Method | Details |
|-------|------|-------|--------|---------|
| `/api/stripe/connect` | `route.ts` | 119 | POST | Stripe Connect account creation, onboarding links, dashboard links |
| `/api/stripe/payout` | `route.ts` | 83 | POST | Process payout requests via Stripe Connect transfers |
| `/api/auth/convex-token` | `route.ts` | 164 | POST | Exchange backend JWT for RS256-signed Convex JWT |
| `/api/.well-known/jwks.json` | `route.ts` | 23 | GET | Public key endpoint for JWT verification |

### Distribution (PublishDrive Integration)

| Feature | State | Details |
|---------|-------|---------|
| Service layer | Done | `src/services/publishDriveService.js` (130 lines) — stubbed API client |
| Feature flag | Done | `NEXT_PUBLIC_PUBLISHDRIVE_ENABLED` controls activation |
| UI | Done | `DistributionManager.jsx` (205 lines) — channel selector, status tracking |
| 12 channels | Stubbed | Google Play, Amazon Kindle, Apple Books, Kobo, Barnes & Noble, Scribd, OverDrive, Smashwords, Tolino, 24Symbols, Vivlio, Storytel |
| Activation | Blocked | Waiting for PublishDrive Pro plan purchase (planned next month) |

### Admin Review System

| Feature | State | Details |
|---------|-------|---------|
| Admin route | Done | `/admin/review` — accessible to demo@shothik.ai |
| Admin panel | Done | `AdminReviewPanel.jsx` (722 lines) — full review interface |
| Security | Done | `requireAdmin()` in Convex checks JWT identity email against allowlist |
| Actions | Done | Approve, reject (with reason/category), request changes, publish |
| Notifications | Done | Authors notified on status changes via in-book notification system |

### Convex Deployment Notes

| Issue | Severity | Details |
|-------|----------|---------|
| Preview deploy URLs change each deploy | High | Current: `healthy-mastiff-358`. Must update `.env.local`, `convex/http.ts`, `convex/auth.config.ts`, `src/app/api/auth/convex-token/route.ts` after each deploy |
| Need production deploy key | High | Upgrading to Convex production deploy key would give a stable URL |
| JWT_PRIVATE_KEY secret required | Critical | Must be set for Convex token exchange to work |
| CONVEX_DEPLOY_KEY secret required | Critical | Must be set for `npx convex deploy` to work |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| 6-step publishing wizard | P0 | Done |
| Author dashboard with status tracking | P0 | Done |
| Admin review system | P0 | Done |
| Notification system | P1 | Done |
| Earnings dashboard with monthly breakdown | P0 | Done |
| Payout system (Stripe/Payoneer/bank) | P0 | Done |
| PublishDrive multi-store distribution | P1 | Stubbed — waiting for Pro plan |
| Stable Convex production URL | P0 | Not Done — need production deploy key |
| Stripe API keys in production | P0 | Not Done — need STRIPE_SECRET_KEY secret |
| Real Google Play Books integration | P1 | Not Started — requires Shothik UK company publisher account |
| Sales data ingestion pipeline | P1 | Not Started — manual recording via Convex mutation |
| Automated royalty calculation from live sales | P2 | Not Started |
| Author identity verification (KYC) | P2 | Not Started |
| Tax document generation (W-8/W-9) | P2 | Not Started |

### What Has Been Implemented

| Feature | Date | Details |
|---------|------|---------|
| Convex schema (books, salesRecords, payouts, payoutAccounts) | Feb 2026 | 5 tables with comprehensive indexes |
| Publishing wizard (6 steps) | Feb 2026 | Complete flow from manuscript upload to submission |
| Author dashboard | Feb 2026 | Book listing, status tracking, search/filter |
| Admin review panel | Feb 2026 | 722-line panel with approve/reject/publish actions |
| Notification system | Feb 2026 | In-book notifications with bell icon and read/unread |
| Earnings dashboard | Feb 2026 | Summary stats, monthly chart, per-book breakdown |
| Payout manager | Feb 2026 | $25 minimum, 3 payment methods, history tracking |
| Stripe Connect API routes | Feb 2026 | Account creation, onboarding, payout processing |
| Convex JWT authentication | Feb 2026 | RS256 token exchange with JWKS verification |
| PublishDrive service layer | Feb 2026 | 12-channel distribution service (stubbed) |
| Distribution manager UI | Feb 2026 | Channel selector with status indicators |
| Server-side auth enforcement | Feb 2026 | All Convex mutations require authenticated identity |
| PublishView 4-tab dashboard | Feb 2026 | My Books, Earnings, Payouts, Distribution tabs |

---

## 10. Marketing Automation

**Route:** `/marketing-automation`
**Status:** Not Started
**Service File:** `src/services/marketing-automation.service.ts`

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Unknown | Route exists with extensive sub-routes |
| Service layer | Exists | Dedicated service file |
| UI components | Extensive | Canvas, Dashboard, Media, Insights, Messenger, Webhooks, URL Analysis, AI Media |
| Sub-routes | Many | `/canvas/[projectId]`, `/dashboard/[projectId]`, `/media/[projectId]`, `/insights/[analysisId]`, `/messenger`, `/webhooks`, `/chat-knowledge` |
| Meta integration | Unknown | Facebook/Instagram ad management, page management, pixel tracking |
| Hooks | Extensive | 12 dedicated hooks in `src/hooks/(marketing-automation-page)/`: useAiMediaApi, useAIShortsApi, useAudioApi, useCampaignsApi, useChatApi, useImageKitApi, useKnowledgeApi, useMediaApi, useMessengerApi, useMetaData, useProjectsApi, useSmartAssetsApi, useUGCVideoApi |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Verify page loads without errors | P0 | Not Started |
| Test Meta OAuth flow | P1 | Not Started |
| Test campaign canvas workflow | P1 | Not Started |
| Test URL analysis feature | P1 | Not Started |
| AI media generation | P2 | Not Started |

---

## 11. AI Agents — Slides

**Route:** `/agents/[agentType]` (slides), `/slides`, `/slide/replay`
**Status:** Not Started
**Service Files:** `src/services/createPresentationServer.js`, `src/services/presentation/` (5 files)

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Unknown | Route exists with agent type routing |
| Slide generation | Unknown | AI-driven presentation generation via SSE streaming |
| Slide editor | Exists | Separate layout at `src/app/(slide-layout)/` with iframe communication |
| Share links | Exists | `/slide-share/[shareLink]` for sharing presentations |
| Replay | Exists | `/slide/replay` page for presentation playback |
| Service layer | Extensive | `PresentationOrchestrator.js`, `PresentationSSEService.js`, `PresentationApiSlice.js`, `slideEditService.ts`, `SlideHistoryDataParser.js`, `SSEDataParser.js` |
| Hooks | Extensive | 12 hooks in `src/hooks/presentation/`: useSlideEditor, useDragAndDrop, useAlignmentGuides, useAutoSave, useChangeTracking, useElementDeletion, useElementDuplication, useElementSelection, useKeyboardNavigation, useLayerOrdering, useStyleEditing, useTextEditing |
| Redux | Done | `presentationSlice.js`, `slideEditSlice.ts` |
| Components | Extensive | `src/components/presentation/` with editing/, v2/, and __tests__/ directories |
| Export | Done | `src/lib/pdfPresentationExporter.ts`, `src/lib/nativePresentationExporter.ts`, `src/lib/presentationExporter.ts` |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Verify slide generation page loads | P0 | Not Started |
| Test slide generation flow end-to-end | P1 | Not Started |
| Test slide editor iframe communication | P1 | Not Started |
| Academic presentation templates | P2 | Not Started |

---

## 12. AI Agents — Sheets

**Route:** `/agents/[agentType]` (sheets)
**Status:** Not Started
**Service File:** `src/services/sheetAiStreamService.js`

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Unknown | Route exists within agents |
| Streaming | Unknown | Uses streaming service for data generation |
| Share links | Exists | `/agents/shared-sheet/[shareId]` for sharing |
| FortuneSheet | Done | `src/adapters/fortuneSheetAdapter.js` (282 lines) — bidirectional data adapter for FortuneSheet |
| Components | Exists | `src/components/sheet/`: SheetAgentPage, SheetChatArea, SheetDataArea, ConversationCard, MetaDataDisplay, SavePointsDropDown |
| Hooks | Exists | `useSheetAiStream.js`, `useSheetAiChat.js`, `useRegisterSheetService.js` |
| Redux | Exists | `sheetSlice.js`, `sheetApi.js` |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Verify sheets agent page loads | P0 | Not Started |
| Test data analysis/generation flow | P1 | Not Started |
| Test streaming responsiveness | P1 | Not Started |

---

## 13. Deep Research

**Route:** `/research`
**Status:** Not Started
**Service File:** *Uses Socket.io for real-time streaming + Redux research APIs*

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Unknown | Route exists |
| Streaming | Unknown | Socket.io-based real-time research streaming |
| Backend | Unknown | Uses Google Vertex AI Search for grounding |
| Components | Extensive | `src/components/tools/research/`: ResearchContend, AcademicSearch, MarkdownRenderer, SourcesGrid, ReferenceModal, ModelSwitcher, WebSearch, UserMessage, Suggestion, SuggetionCard, form-component, CombinedActions, RenderPart, AttachmentPreview, AcademicLoadingState, ResearchContentWithReferences |
| Hooks | Extensive | `useResearchStream.js`, `useResearchHistory.js`, `useResearchSimulation.js`, `useGetResearchChats.js` |
| Redux | Extensive | `researchSlice.js`, `researchCoreSlice.js`, `researchChatSlice.js`, `researchUiSlice.js`, `researchChatApi.js`, `researchCoreApi.js`, `researchSSEapi.js` |
| API routes | Exists | `/api/research/chat/` (create, delete, get, get_one, update_name), `/api/research/research/create_research_queue` |

### Development Goals

| Goal | Priority | Status |
|------|----------|--------|
| Verify research page loads | P0 | Not Started |
| Test real-time streaming flow | P1 | Not Started |
| Test research quality and source grounding | P1 | Not Started |
| Academic research integration (arXiv, PubMed sources) | P2 | Not Started |

---

## 14. Admin Review Panel

**Route:** `/admin/review`
**Status:** Done
**Component:** `src/components/admin/AdminReviewPanel.jsx` (722 lines)

### Current State

| Area | State | Details |
|------|-------|---------|
| Page loads | Done | Admin-only route, accessible to demo@shothik.ai |
| Book listing | Done | All submitted books with status filters |
| Review actions | Done | Approve, reject (reason + category), request changes, publish |
| Dashboard stats | Done | Pending reviews count, published books, total submissions |
| Security | Done | `requireAdmin()` checks JWT identity email against allowlist |
| Convex integration | Done | All actions via Convex mutations with server-side auth |

---

## Cross-Service Dependencies

| From | To | Dependency Type | Status |
|------|-----|----------------|--------|
| Paraphrase | Plagiarism Checker | "Check Plagiarism" button triggers plagiarism scan on paraphrased output | Done |
| Humanize GPT | AI Detector | "Detect AI" button passes content via sessionStorage | Done |
| AI Detector | Humanize GPT | Detection → humanization workflow | Done |
| Plagiarism Checker | AI Detector | Bundled STEM integrity check | Done |
| Writing Studio → Publish View | Convex Backend | Book publishing pipeline | Done |
| Publish View | Stripe API Routes | Payout processing | Done |
| Publish View | PublishDrive Service | Multi-store distribution | Stubbed |
| Admin Panel | Convex Backend | Book review management | Done |
| Writing Studio | Paraphrase | Inline paraphrase action | Not Started |
| Writing Studio | Grammar Fix | Inline grammar fix action | Not Started |
| Writing Studio | Humanize GPT | Inline humanize action | Not Started |
| Writing Studio | AI Detector | AI detection score panel | Not Started |
| Writing Studio | Plagiarism Checker | Background plagiarism checking | Not Started |
| Deep Research | Writing Studio | Research findings → writing integration | Not Started |
| Deep Research | AI Agents (Slides) | Research → presentation generation | Not Started |
| Marketing Automation | AI Agents (Slides) | AI media generation for campaigns | Not Started |

---

## Global Infrastructure

### Authentication & Providers

| Component | File | State | Details |
|-----------|------|-------|---------|
| Auth service | `src/services/auth.service.ts` (129 lines) | Done | JWT token-based auth with Google OAuth |
| Auth Redux | `src/redux/api/auth/authApi.js`, `authApiSlice.js`, `src/redux/slices/auth.js` | Done | Redux auth state management |
| Convex provider | `src/providers/ConvexClientProvider.jsx` (103 lines) | Done | Wraps app with `ConvexProviderWithAuth`, exchanges backend tokens for Convex JWTs |
| JWKS endpoint | `src/app/api/.well-known/jwks.json/route.ts` (23 lines) | Done | Public key for Convex JWT verification |
| Convex token exchange | `src/app/api/auth/convex-token/route.ts` (164 lines) | Done | Signs RS256 JWTs for Convex auth |

### Redux Store

| Area | Files | Details |
|------|-------|---------|
| Store config | `src/redux/store.ts` | Central store configuration |
| Slices | 16 slices | auth, ai-detector, grammar-checker, inputOutput, presentationSlice, slideEditSlice, researchSlice, researchCoreSlice, researchChatSlice, researchUiSlice, sheetSlice, analyticsSlice, feature-endpoints, features-with-credentials, paraphraseHistorySlice, settings, tools, uploadQueueSlice, user-wallet |
| APIs | 12 RTK Query APIs | tools, auth, humanizeHistory, customModes, presentation, pricing, researchChat, researchCore, researchSSE, shareAgent, shareAiDetector, share, sheet, blog |

### Common Tool Components

| Component | File | Details |
|-----------|------|---------|
| ToolPageWrapper | `ToolPageWrapper.jsx` | Usage monitoring wrapper for all tool pages |
| UpgradePrompt | `UpgradePrompt.jsx` | Modal trigger at limit or after 3rd use |
| UpgradePopover | `UpgradePopover.jsx` | Inline upgrade prompt |
| UsageTracker | `UsageTracker.jsx` | Visual usage bar |
| WordCounter | `WordCounter.jsx` | Word/character count display |
| STEMSafeToggle | `STEMSafeToggle.jsx` | Toggle for STEM preprocessing |
| FileUpload | `FileUpload.jsx`, `MultipleFileUpload.jsx` | File upload components |

### Other API Routes

| Route | Details |
|-------|---------|
| `/api/ai-cowriter` | AI co-writer for Writing Studio |
| `/api/geolocation` | User location detection |
| `/api/health` | Health check endpoint |
| `/api/latex/*` | LaTeX compilation: convert-html, convert-to-html, download, status |
| `/api/research/*` | Research chat CRUD, research queue creation |
| `/api/sheet/*` | Sheet conversation management |
| `/api/templates` | Template retrieval |
| `/api/zoho-webhook` | Zoho CRM webhook integration |

### Key Libraries & Adapters

| Component | File | Details |
|-----------|------|---------|
| FortuneSheet adapter | `src/adapters/fortuneSheetAdapter.js` (282 lines) | Bidirectional data adapter for Excel-like spreadsheet |
| Event tracker | `src/analysers/eventTracker.js` | Analytics event tracking |
| Fetch with retry | `src/lib/fetchWithRetry.ts` | HTTP request retry logic |
| Rate limiter | `src/lib/rateLimiter.ts` | API rate limiting |
| Sanitize | `src/lib/sanitize.ts` | XSS sanitization with DOMPurify |
| Text analysis | `src/lib/text-analysis.js` | Content analysis utilities |
| Citation lookup | `src/lib/citation-lookup.js` | Academic citation search |

---

## Global Issues (Affect All Services)

| Issue | Severity | Status | Details |
|-------|----------|--------|---------|
| JWT authentication bypass | Critical | Not Fixed | Backend: `jwt.decode` fallback allows bypass |
| Hardcoded secrets in source | Critical | Not Fixed | Backend security issue |
| CORS allows all origins | High | Not Fixed | Backend configuration |
| Admin endpoints publicly accessible | High | Not Fixed | Backend security |
| `/api/vector/*` routes unauthenticated | High | Not Fixed | Backend security |
| Convex preview deploy URL instability | High | Not Fixed | Need production deploy key for stable URL |
| Stripe API keys not configured | High | Not Fixed | Need STRIPE_SECRET_KEY for payout processing |
| PublishDrive integration disabled | Medium | Expected | Waiting for Pro plan purchase |
| AuthProvider SSR hydration mismatch | Low | Fixed | `typeof window` guard on localStorage |
| Meta Pixel null PixelID warning | Low | Fixed | Env var validation + SSR-safe init |
| Backend unreachable from Replit | Info | Expected | Network isolation — frontend integration tested via code review |
| Translator directory typo (`tanslator`) | Low | Not Fixed | Cosmetic issue |

---

## Platform Statistics

| Metric | Count |
|--------|-------|
| Total routes (primary layout) | 14 main routes + sub-routes |
| Total services | 14 service files |
| Total hooks | 80+ hook files |
| Total Redux slices | 16 |
| Total RTK Query APIs | 12 |
| Total API routes | 25+ |
| Convex backend tables | 5 (projects, projectVersions, books, salesRecords, payouts, payoutAccounts) |
| Convex backend functions | ~40 (queries + mutations) |
| Publishing wizard steps | 6 |
| Distribution channels | 12 (stubbed) |
| Writing Studio templates | 16 across 3 project types |
| Production-hardened tools | 5 (Plagiarism, AI Detector, Paraphrase, Grammar Fix, Humanize GPT) |
| Tools not started | 3 (Summarize, Translator, Marketing Automation) |

---

## Priority Roadmap

### Immediate (This Sprint)

| Task | Priority | Owner |
|------|----------|-------|
| Get Convex production deploy key for stable URL | P0 | DevOps |
| Configure Stripe API keys as secrets | P0 | DevOps |
| Test publishing wizard end-to-end | P0 | QA |
| Test earnings/payout flow with mock data | P0 | QA |

### Short-Term (1-2 Months)

| Task | Priority | Details |
|------|----------|---------|
| Activate PublishDrive distribution | P1 | Purchase Pro plan, remove feature flag |
| Set up Google Play Books publisher account | P1 | Via Shothik UK company |
| Sales data ingestion pipeline | P1 | Automated recording from Google Play |
| Writing Studio → Convex project persistence | P1 | Migrate from localStorage to Convex |
| Wire Writing Studio inline tool integrations | P2 | Paraphrase, Grammar, AI Detector inline actions |
| Audit and harden Summarize tool | P2 | Production hardening similar to other tools |

### Medium-Term (3-6 Months)

| Task | Priority | Details |
|------|----------|---------|
| South/SE Asia soft launch | P0 | $5-10/month pricing for 40M+ university students |
| Author identity verification (KYC) | P1 | Required for payouts |
| Tax document generation | P1 | W-8/W-9 forms for US tax compliance |
| Automated royalty calculation | P1 | Real-time from live sales data |
| STEM paraphrase modes | P2 | Technical and Citation-Safe modes |
| Real-time collaboration in Writing Studio | P3 | Multi-user editing |
| Backend security overhaul | P0 | JWT bypass, CORS, admin endpoints, secrets |

### Long-Term (6-12 Months)

| Task | Priority | Details |
|------|----------|---------|
| 1,000 MAU milestone | P0 | Marketing + product iteration |
| SOC 2 Type 1 certification | P1 | Required for enterprise clients |
| Moodle LMS plugin | P2 | AI Detector integration for universities |
| Cross-lingual plagiarism detection | P2 | Multi-language support |
| Browser extension | P3 | Overleaf/Google Docs integration |

---

## How to Update This Document

When starting work on a new service:

1. **Update the Master Overview table** — change Status from "Not Started" to "Active Development"
2. **Fill in Current State** — test the page, check service files, note what works/doesn't
3. **Document Findings** — bugs, errors, technical debt discovered during investigation
4. **Define Development Goals** — what needs to be built, prioritized by importance
5. **Create Implementation Plan** — specific tasks with timeline estimates
6. **Track What's Been Implemented** — add entries with dates as features are completed
7. **Update Strategic Roadmap** — milestones and dependencies for launch
