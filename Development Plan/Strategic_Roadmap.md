# Shothik AI — Platform Strategic Roadmap & Development Plan

**Document Version:** 2.0
**Date:** February 23, 2026 (Updated from v1.0 — Feb 15, 2026)
**Organization:** Shothik AI (shothikai)
**Platform:** Shothik AI v3 (Next.js 16 Frontend + Convex Backend)
**Status:** Active Development — Publishing Platform & Core Tools Production-Hardened

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Progress Report — What's Been Built (Feb 2026)](#2-progress-report--whats-been-built-feb-2026)
3. [22-Agent Strategic Panel — Full Findings](#3-22-agent-strategic-panel--full-findings)
4. [Consensus & Vote Tally](#4-consensus--vote-tally)
5. [Top Strategic Risks](#5-top-strategic-risks)
6. [Top Strategic Opportunities](#6-top-strategic-opportunities)
7. [Competitive Analysis: Shothik vs QuillBot](#7-competitive-analysis-shothik-vs-quillbot)
8. [Competitive Landscape Overview](#8-competitive-landscape-overview)
9. [Revised Product Strategy (Updated Feb 2026)](#9-revised-product-strategy-updated-feb-2026)
10. [Multi-Agent Architecture Design (Revised)](#10-multi-agent-architecture-design-revised)
11. [Phased Development Roadmap (Updated Feb 2026)](#11-phased-development-roadmap-updated-feb-2026)
12. [Go-to-Market Strategy (Updated)](#12-go-to-market-strategy-updated)
13. [Pricing Model (Updated)](#13-pricing-model-updated)
14. [Success Metrics & KPIs (Updated)](#14-success-metrics--kpis-updated)
15. [Unit Economics & Feasibility](#15-unit-economics--feasibility)
16. [Risk Mitigation Plan (Updated)](#16-risk-mitigation-plan-updated)
17. [Conclusion](#17-conclusion)

---

## 1. Executive Summary

Shothik AI has evolved from a plagiarism detection service into a **comprehensive AI-powered academic platform** targeting 40M+ university students in South/Southeast Asia (Bangladesh, India, Pakistan). The platform now encompasses:

1. **AI Content Tools** (5 production-hardened): Plagiarism Checker, AI Detector, Paraphrase, Grammar Fix, Humanize GPT
2. **Writing Studio**: Unified 4-tab workspace for books, research papers, and assignments with AI co-writer, citation management, and PDF/EPUB/DOCX export
3. **Publishing & Earning Platform**: Complete pipeline from manuscript to Google Play Books with 85% author royalties, Stripe Connect payouts, and multi-store distribution (12 channels via PublishDrive)
4. **AI Agents**: Slide generation, spreadsheet analysis, and deep research (infrastructure built, testing pending)

**Original Direction (Feb 15, 2026):** STEM-focused plagiarism detection — "RIGHT segment, needs FOCUSED execution."

**Current State (Feb 23, 2026):** Platform has expanded significantly beyond plagiarism into a full academic ecosystem. The original strategic insights from the 22-agent panel remain valid, but the business model now includes a **publishing and earning platform** that creates a revenue stream independent of tool subscriptions.

**Key Strategic Shift:** Shothik is no longer just "a cheaper alternative to QuillBot/Turnitin" — it's becoming **"the only platform a STEM researcher needs"** — write, check, detect, paraphrase, format, publish, earn.

**Panel Result: 13 Bullish / 6 Neutral / 3 Bearish — PROCEED WITH PIVOTS** (Original panel findings remain valid)

---

## 2. Progress Report — What's Been Built (Feb 2026)

### Platform Development Status

| Category | Component | Status | Details |
|----------|-----------|--------|---------|
| **Core AI Tools** | Plagiarism Checker | Production Hardened | STEM-native, citation-aware, file upload, KaTeX/Shiki rendering, mobile responsive |
| | AI Detector | Production Hardened | STEM preprocessing, cross-service wiring to Humanize GPT |
| | Paraphrase | Production Hardened | 7 modes, 5 languages, plagiarism sidebar integration |
| | Grammar Fix | Production Hardened | STEM-aware, mobile tabs, Gaia UI compliant |
| | Humanize GPT | Production Hardened | Cross-service wiring to AI Detector, history tracking |
| **Writing Studio** | Dashboard & Projects | Done | 3 project types, 16 templates, localStorage CRUD |
| | Write View | Done | 3-pane layout, prose editor, AI panel |
| | Outline View | Done | Draggable chapter/scene cards, pacing visualization |
| | Formatting View | Done | Typography controls, two-page preview, PDF/EPUB/DOCX export |
| | Publish View | Done | 4-tab dashboard (My Books, Earnings, Payouts, Distribution) |
| **Publishing Platform** | 6-Step Wizard | Done | Manuscript upload, cover, metadata, pricing, agreement, review |
| | Author Dashboard | Done | Book listing, status tracking, search/filter |
| | Admin Review System | Done | Approve/reject/publish with demo@shothik.ai access |
| | Notification System | Done | In-book notifications for review status |
| | Earnings Dashboard | Done | Monthly chart, per-book breakdown, available balance |
| | Payout System | Done | Stripe Connect, Payoneer, bank transfer ($25 minimum) |
| | Distribution (PublishDrive) | Stubbed | 12 channels ready, waiting for Pro plan purchase |
| **Convex Backend** | Schema | Done | 5 tables: books, salesRecords, payouts, payoutAccounts, projects |
| | Authentication | Done | RS256 JWT with JWKS, server-side enforcement |
| | API Routes | Done | Stripe connect/payout, Convex token exchange, JWKS |
| **Untouched Services** | Summarize | Not Started | Basic UI exists |
| | Translator | Not Started | Components exist (directory typo: `tanslator`) |
| | Marketing Automation | Not Started | Extensive UI + 12 hooks exist, not tested |
| | AI Agents (Slides) | Not Started | Full infrastructure exists (12 hooks, services, components) |
| | AI Agents (Sheets) | Not Started | FortuneSheet adapter + streaming service exist |
| | Deep Research | Not Started | Socket.io streaming + 4 Redux slices + API routes exist |

### Technical Infrastructure Built

| Area | Count | Details |
|------|-------|---------|
| Frontend routes | 14+ | Primary layout routes with sub-routes |
| Service files | 31 | Dedicated service layers per feature |
| Custom hooks | 93 | Reusable logic across platform |
| Redux slices | 16 | State management per feature |
| RTK Query APIs | 12 | Server state/caching |
| Convex backend functions | ~40 | Queries + mutations for publishing |
| API routes | 25+ | Next.js API endpoints |
| npm dependencies | 126 | Production dependencies |
| UI components | 886 | Total component files |

### What the Original Roadmap Planned vs What Was Built

| Original Plan | Planned Timeline | Actual Status | Notes |
|---------------|-----------------|---------------|-------|
| Phase 0: Security fixes | Weeks 1-4 | Partial | Frontend hardened, backend security still pending |
| Phase 1: STEM MLP | Weeks 5-12 | Done (Frontend) | STEM preprocessing, citation analysis, file upload all complete on frontend |
| Phase 2: Market Entry | Weeks 13-20 | Partial | Dashboard built, file upload done, but no live users yet |
| Phase 3: Growth features | Weeks 21-32 | Not Started | AI detection exists but ONNX conversion and code similarity pending |
| Phase 4: Enterprise | Months 9-18 | Not Started | SOC 2, editorial integrations not started |
| Phase 5: LaTeX Engine | Post-Phase 4 | Partial | Writing Studio built, LaTeX compilation API routes exist |
| **NEW: Publishing Platform** | Not originally planned | Done | Complete 6-step wizard, earnings, payouts, distribution — major strategic addition |
| **NEW: Writing Studio redesign** | Not originally planned | Done | 4-tab workspace with 3 project types, AI co-writer, export system |

---

## 3. 22-Agent Strategic Panel — Full Findings

> *Note: This 22-agent panel analysis was conducted on February 15, 2026, when the platform was focused on plagiarism detection. The insights remain strategically valid and have guided subsequent development decisions.*

### Agent 1: Market Strategist
**Verdict: BULLISH**

The global plagiarism detection market is projected to exceed $2B by 2028. STEAM academic publishing is a high-value, underserved niche. Most existing tools are generalist; a STEM-specific product with LaTeX, code, and formula handling would be genuinely differentiated from everything on the market today.

- **Critical Risk:** Market is dominated by Turnitin with deep institutional lock-in and multi-year contracts.
- **Recommendation:** Don't compete head-on with Turnitin. Position as the "STEM specialist" tool that complements, not replaces, existing institutional tools.

---

### Agent 2: Academic Publishing Expert
**Verdict: NEUTRAL**

Journal publishers need tools, but most already use Crossref Similarity Check (powered by iThenticate). The switching cost is high for established publishers. However, there's a significantly underserved segment — small/mid-tier journals, open-access publishers, and conference proceedings that cannot afford Turnitin's institutional pricing.

- **Critical Risk:** Established publishers won't switch without SOC 2 compliance and proven accuracy at scale.
- **Recommendation:** Target open-access journals and conference organizers first — they're price-sensitive and actively looking for affordable alternatives.

---

### Agent 3: STEM Researcher
**Verdict: BULLISH**

As a researcher, I'd absolutely use a tool that understands LaTeX formulas, code blocks, and doesn't flag my bibliography as plagiarism. Current tools are frustrating — they flag every common methodology phrase ("We used a mixed-methods approach...") and properly cited content. A tool built specifically for STEM would save hours of false-positive review per paper.

- **Opportunity:** Researchers currently spend $20-40 per paper on pre-submission checks (Scribbr, iThenticate). A cheaper, STEM-aware alternative would win adoption through word-of-mouth in academic circles.
- **Recommendation:** Build a free tier for researchers to try before submission — this creates organic growth within research communities.

---

### Agent 4: Medical Journal Editor
**Verdict: NEUTRAL**

Medical publishing has strict compliance requirements (HIPAA awareness, patient data detection in case studies). The tool would need to handle medical terminology correctly and integrate with editorial management systems like ScholarOne or Editorial Manager. The concept is good, but execution requirements for medical journals are very specific and regulated.

- **Critical Risk:** Medical journals require regulatory compliance certifications that take years to establish.
- **Recommendation:** Start with general STEM before targeting medical journals specifically. Medical should be Phase 3, not Phase 1. Build credibility first.

---

### Agent 5: Engineering Faculty
**Verdict: BULLISH**

Engineering departments constantly deal with code plagiarism in student submissions and research papers. A tool that differentiates between standard boilerplate code (import statements, common patterns) and actual copied implementations would be extremely valuable. Current tools flag `import numpy as np` or standard algorithm implementations as plagiarism, which produces massive false positives.

- **Opportunity:** Code-aware plagiarism detection is a massive gap — only Stanford's MOSS handles this, and it's outdated and unsupported.
- **Recommendation:** Build code similarity detection as a flagship differentiator for CS/Engineering departments.

---

### Agent 6: Arts & Humanities Professor
**Verdict: BEARISH**

Arts and humanities papers are heavily text-based with extensive quotations and citations. The existing tools (Turnitin, Grammarly) already serve this space adequately. There's no compelling reason to switch to a new tool specifically for arts/humanities — the STEAM framing feels forced for the "A" in STEAM. The technical differentiators (LaTeX, code, formulas) are irrelevant for this discipline.

- **Critical Risk:** Spreading across all STEAM disciplines dilutes the product identity and stretches development resources thin.
- **Recommendation:** Drop the "A" from the target market. Focus on STEM + Medical where the technical differentiators actually create meaningful value.

---

### Agent 7: Competitive Intelligence
**Verdict: NEUTRAL**

QuillBot is vulnerable — their plagiarism checker is powered by Copyleaks (not their own technology), has a 35% false positive rate on AI detection, and only allows 20 pages/month even on Premium. However, Turnitin has 1B+ sources, deep institutional relationships, and near-monopoly status in universities. The window of opportunity is narrow: compete on price and STEM features before Copyleaks or Turnitin add similar capabilities themselves.

- **Critical Risk:** Copyleaks could add STEM-specific features within 12-18 months, closing the differentiation window.
- **Recommendation:** Move fast. First-mover advantage in STEM-specific plagiarism detection won't last forever. Speed to market is critical.

---

### Agent 8: Technical Architecture
**Verdict: BULLISH**

The LangGraph multi-agent architecture is genuinely well-designed — having specialized agents for search, analysis, and reporting is the right pattern for this type of complex pipeline. The Gemini Grounding API provides real-time web coverage that many competitors (who rely on static databases) lack. The ChromaDB vector cache for instant results on repeat checks is smart engineering that creates a compounding advantage over time.

- **Critical Risk:** Current v1 takes ~45 seconds per analysis. This must drop to <5 seconds for competitive UX.
- **Recommendation:** Prioritize Vector Service 2.0 (<1s cached responses) before adding new features. Speed wins users and reduces churn.

---

### Agent 9: Product-Market Fit
**Verdict: BULLISH**

There IS real demand in this space. Researchers currently spend $20-40 per paper on pre-submission checks (Scribbr, iThenticate individual credits). Small journals can't afford Turnitin's institutional pricing. Conference organizers have no affordable option for screening hundreds of submissions. The Quill editor integration for live checking during writing is a differentiator — no competitor currently offers real-time plagiarism checking while you write.

- **Opportunity:** Real-time plagiarism checking during writing (via Quill editor or browser extensions) is a unique value proposition no competitor has shipped.
- **Recommendation:** Make the real-time checking experience the hero feature — "Check plagiarism as you write, not after." This changes the user workflow from reactive to proactive.

---

### Agent 10: Pricing Strategy
**Verdict: BULLISH**

QuillBot charges $19.95/month for only 20 pages of plagiarism checking. Turnitin is institutional-only with no individual access. There's a massive pricing gap in the market. A model offering 100+ pages/month at $14.99 or unlimited at $24.99 would undercut QuillBot significantly while still being profitable with the credit-based backend architecture.

- **Critical Risk:** Race to the bottom on pricing isn't sustainable if Gemini API costs are high per analysis.
- **Recommendation:** Offer a freemium model (3-5 free checks/month) + affordable premium ($9.99-14.99/month) to capture researchers and students. Monitor unit economics closely.

---

### Agent 11: Security Auditor
**Verdict: BEARISH**

The current codebase is **NOT production ready**. The QA audit from January 2026 found critical failures: JWT authentication can be bypassed using `jwt.decode` fallback, secrets are hardcoded in source code, `/api/vector/*` routes have zero authentication, CORS allows requests from any origin, and admin endpoints are publicly accessible. No academic institution would deploy this. No journal publisher would trust their unpublished manuscripts to a system with these vulnerabilities.

- **Critical Risk:** A single data breach of unpublished research manuscripts would destroy the company's reputation permanently. Academic trust takes years to build and seconds to lose.
- **Recommendation:** STOP all feature development immediately. Fix every security issue first. Get SOC 2 Type 1 certification before approaching any institutional customer. This is non-negotiable.

---

### Agent 12: AI/ML Research
**Verdict: BULLISH**

The Gemini Grounding API is a strong technical bet — it provides real-time web indexing coverage that static databases (used by most competitors) cannot match. Combined with Gemini embeddings for semantic similarity, this is a more modern and adaptable approach than Turnitin's legacy text-matching algorithms. The codebase already includes DeepSeek integration, suggesting a multi-model strategy that provides redundancy and accuracy improvement.

- **Opportunity:** Multi-model approach (Gemini + DeepSeek) provides redundancy. Adding cross-lingual embeddings for detecting translated plagiarism would address a gap even Turnitin struggles with.
- **Recommendation:** Add cross-lingual embeddings as a premium feature — this is a genuine technical moat for international academic publishing.

---

### Agent 13: User Experience
**Verdict: NEUTRAL**

The Quill editor integration is promising for real-time checking, but the reality is that researchers typically work in LaTeX (via Overleaf), Google Docs, or Microsoft Word — not in a web-based Quill editor. The tool needs to meet researchers where they already work, not force them to adopt a new editor just for plagiarism checking. Workflow friction kills adoption in academic settings.

- **Critical Risk:** Researchers won't change their writing workflow to use a new editor. They'll just upload finished papers.
- **Recommendation:** Build browser extensions for Overleaf and Google Docs, plus file upload for Word/LaTeX/PDF. Keep the Quill editor as one option, but not the primary interface. Prioritize "upload and check" as the main flow.

---

### Agent 14: Go-to-Market Strategy
**Verdict: NEUTRAL**

Selling to universities is extremely difficult — procurement cycles are 6-18 months, they require SOC 2/FERPA compliance, committee approvals, and Turnitin has multi-year exclusive contracts at many institutions. However, selling directly to individual researchers, small journals, and conference organizers is much faster, doesn't require institutional approval, and generates revenue immediately.

- **Critical Risk:** B2B institutional sales require a dedicated sales team, compliance certifications, and significant capital investment that a small team can't afford.
- **Recommendation:** Start B2C (individual researchers/students) and B2SMB (small journals/conferences). Build to 10,000+ individual users as social proof before approaching any university. Let bottom-up adoption drive institutional interest.

---

### Agent 15: Startup Advisor
**Verdict: BULLISH**

This is a viable direction for a small team IF they focus narrowly and resist the temptation to build everything at once. The mistake would be trying to be "Turnitin for everyone." The winning strategy is: STEM-specific plagiarism detection for individual researchers and small publishers. Start narrow, prove the product works better than alternatives for this specific audience, then expand methodically.

- **Critical Risk:** Feature creep and trying to serve everyone will kill the product before it finds product-market fit.
- **Recommendation:** Define a "Minimum Lovable Product" — STEM plagiarism + citation awareness + fast results + affordable pricing. Ship that and nothing more until you have 1,000 paying users.

---

### Agent 16: DevOps/Infrastructure
**Verdict: NEUTRAL**

The Docker-based deployment is acceptable for small scale, but institutional workloads (thousands of papers during journal submission deadlines) require auto-scaling, proper queue management, and rate limiting. The current unbounded parallelism in search/fetch agents could crash the system under load. RabbitMQ is already configured in the codebase but appears underutilized.

- **Critical Risk:** A journal's submission deadline could generate 500+ simultaneous analyses. Current architecture would collapse.
- **Recommendation:** Properly implement the existing RabbitMQ setup for job queuing, add rate limiting per API key, and plan for horizontal scaling with Kubernetes. Test with simulated peak loads before any production launch.

---

### Agent 17: Legal/Compliance
**Verdict: BEARISH**

Academic tools handling unpublished research manuscripts face serious legal requirements: GDPR (EU researchers), FERPA (US students), data residency requirements (some countries require data to stay in-country), and copyright considerations when fetching/storing source content from the web. The current system stores content in Google Cloud Storage without clear data retention or deletion policies.

- **Critical Risk:** Storing unpublished manuscripts without proper data handling policies could lead to intellectual property theft accusations or regulatory fines.
- **Recommendation:** Implement strict data retention policies (auto-delete manuscripts within 30 days of analysis), get legal counsel for GDPR/FERPA compliance, and ensure manuscripts are never stored permanently in the vector database without explicit user consent. Add a clear privacy policy and data processing agreement.

---

### Agent 18: Content Creator
**Verdict: BULLISH**

Beyond STEM academics, there's a much broader market for content creators, bloggers, SEO agencies, and marketing teams who need regular plagiarism checking. QuillBot's 20-page monthly limit is a constant frustration for professional content creators who may need to check 50-100+ articles per month. A generous limit or unlimited plan at competitive pricing would capture this adjacent market with minimal additional development.

- **Opportunity:** Content creators are an easier, faster-to-acquire market segment than academic institutions. They have simpler needs and faster decision-making.
- **Recommendation:** Build two product tiers from the same engine: "Shothik Academic" for STEM/Medical users (with LaTeX/code/citation features) and "Shothik Creator" for content professionals (with SEO-focused features). Same backend, different packaging.

---

### Agent 19: EdTech Investor
**Verdict: NEUTRAL (Conditionally Bullish)**

The Total Addressable Market is attractive, and the technical approach using LangGraph + Gemini is genuinely differentiated from competitors. However, the current state — pre-revenue with critical security vulnerabilities — is a red flag for investment. To become investable, I'd need to see: (1) all security issues resolved, (2) 1,000+ monthly active users, (3) at least one paying journal publisher or conference, and (4) published accuracy benchmarks against Turnitin/Copyleaks.

- **Critical Risk:** Without published accuracy benchmarks comparing detection rates, no academic customer will trust the tool over established alternatives.
- **Recommendation:** Run a formal accuracy study: test Shothik vs. QuillBot vs. Turnitin on 100+ real STEM papers with known plagiarism. Publish the results openly — this serves as both marketing content and credibility building.

---

### Agent 20: Southeast Asian Market
**Verdict: BULLISH**

Bangladesh, India, Pakistan, and Southeast Asia have rapidly growing academic publishing sectors with thousands of universities and tens of thousands of journals. The vast majority cannot afford Turnitin's institutional pricing. These markets are extremely price-sensitive and desperately underserved. A tool priced at $5-10/month with regional payment options would dominate this region before any Western competitor bothers to localize.

- **Opportunity:** 50,000+ research journals and 10,000+ universities in South/Southeast Asia with no affordable plagiarism solution. This is a massive blue ocean market.
- **Recommendation:** Launch first in Bangladesh/South Asia with regional pricing and local language support (Bengali, Hindi, Urdu). Build a user base of 10,000+ in the region, then use this traction to expand globally. Being from Bangladesh is an advantage here — deep market understanding and local network.

---

### Agent 21: Open Source Community
**Verdict: BULLISH**

Open-sourcing the core detection engine (not the proprietary LangGraph agents or Gemini integration) would build trust in academic circles, attract contributors who improve the code, and establish Shothik as a credible, transparent alternative. Academics inherently trust open-source tools because they can verify the methodology — this is particularly important for a tool making claims about academic integrity.

- **Critical Risk:** Competitors could fork the open-source components and use them without contributing back.
- **Recommendation:** Open-source the text chunking, similarity scoring, and report generation utilities. Keep the LangGraph multi-agent workflow, Gemini integration, vector service, and credit system proprietary as the commercial edge. Use an AGPL license to discourage SaaS competitors from freeloading.

---

### Agent 22: Student User
**Verdict: BULLISH**

As a student, I currently use QuillBot's free tier for paraphrasing but absolutely cannot afford $19.95/month for plagiarism checking on a student budget. If Shothik offered 3-5 free plagiarism checks per month with a student plan at $4.99/month, I'd switch immediately. Bonus points if it works with Google Docs where I actually write my papers — I'm not going to copy-paste into a separate website every time.

- **Opportunity:** Students are the highest-volume, lowest-cost-to-acquire user segment. They become researchers and professors who influence future institutional purchasing decisions. This is a 10-year customer lifecycle.
- **Recommendation:** Offer a generous free student tier (verified via .edu email). Students become your organic growth engine and future enterprise champions when they join faculty or editorial boards.

---

## 4. Consensus & Vote Tally

| Verdict | Count | Agents |
|---|---|---|
| **BULLISH** | **13** | Market Strategist, STEM Researcher, Engineering Faculty, Technical Architecture, Product-Market Fit, Pricing Strategy, AI/ML Research, Startup Advisor, Content Creator, SE Asian Market, Open Source Community, Student User, EdTech Investor (conditional) |
| **NEUTRAL** | **6** | Academic Publishing Expert, Medical Journal Editor, Competitive Intelligence, User Experience, Go-to-Market Strategy, DevOps/Infrastructure |
| **BEARISH** | **3** | Arts & Humanities Professor, Security Auditor, Legal/Compliance |

**Overall Decision: PROCEED WITH STRATEGIC PIVOTS**

The 13-6-3 split indicates strong directional confidence with important caveats. The bearish agents don't disagree with the market opportunity — they flag execution risks (security, legal compliance) that must be addressed before proceeding.

---

## 5. Top Strategic Risks

### Risk 1: Security is a Showstopper
The current codebase has critical vulnerabilities (JWT bypass, unprotected APIs, hardcoded secrets, CORS misconfiguration). No academic institution or journal publisher will trust unpublished manuscripts to a system with these flaws. A data breach of unpublished research would be catastrophic and unrecoverable.

**Mitigation:** Complete security overhaul before any customer-facing deployment. Target SOC 2 Type 1 certification within 12 months.

### Risk 2: Turnitin's Institutional Lock-In
Universities have multi-year contracts with Turnitin. Going B2Enterprise too early will burn cash with 6-18 month sales cycles and zero revenue. The institutional procurement process requires certifications and committee approvals that a small team cannot efficiently navigate.

**Mitigation:** Avoid B2Enterprise entirely in Year 1. Build bottom-up with individual researchers and small publishers. Let institutional demand come organically.

### Risk 3: Accuracy is Unproven
Without published benchmarks comparing Shothik's detection accuracy against Turnitin/Copyleaks on real STEM papers with known plagiarism, no academic user will trust the tool for high-stakes use cases (journal submissions, thesis defense).

**Mitigation:** Run a formal accuracy study on 100+ STEM papers. Publish results openly regardless of outcome. Transparency builds more trust than marketing claims.

---

## 6. Top Strategic Opportunities

### Opportunity 1: South/Southeast Asian Blue Ocean
50,000+ research journals and 10,000+ universities in the region with no affordable plagiarism solution. Regional pricing ($5-10/month) can capture this market before any Western competitor localizes. Being based in Bangladesh provides deep market understanding, local networks, and credibility.

### Opportunity 2: STEM-Specific Features as a Moat
No existing competitor handles LaTeX formulas, code blocks, bibliography sections, and citation-aware analysis properly. Being the first "built for STEM researchers" plagiarism tool creates a defensible niche that generalist tools cannot easily replicate without significant R&D investment.

### Opportunity 3: Real-Time Checking During Writing
"Check plagiarism as you write, not after" is a paradigm shift. Combined with browser extensions for Overleaf and Google Docs, this changes the user experience from a post-writing chore to an integrated part of the writing process. No competitor currently offers this.

---

## 7. Competitive Analysis: Shothik vs QuillBot

### QuillBot's Current State

| Aspect | Details |
|---|---|
| **Plagiarism Engine** | Powered by Copyleaks (not their own technology) |
| **Accuracy** | 75-80% on long-form English; drops on short text, STEM content, multi-language |
| **AI Detection** | 35% false positive rate — flags genuine human writing as AI-generated |
| **Page Limit** | 20 pages/month on Premium ($19.95/mo) |
| **Languages** | 100+ languages supported |
| **Pricing** | $19.95/mo monthly, $8.33/mo annual, student discount available |
| **Strengths** | Bundled paraphrasing tool, grammar checker, citation generator, browser extensions |
| **Weaknesses** | Not own tech, page limits, poor STEM handling, slow support, credit expiration |

### QuillBot's Exploitable Weaknesses

| Weakness | Shothik's Counter-Strategy |
|---|---|
| Powered by Copyleaks (not own tech) | Own LangGraph multi-agent architecture — full control over detection quality |
| 20 pages/month limit | Offer 100+ pages or unlimited at lower price |
| 35% AI detection false positive rate | Train on STEM-specific content patterns to reduce false positives below 10% |
| Struggles with STEM/technical content | LaTeX, code block, and formula-aware analysis as core features |
| No citation awareness | Citation-aware analysis that excludes properly cited content |
| No bibliography exclusion | Auto-detect and exclude reference sections |
| Credits don't roll over | Roll-over unused credits to next month |
| Slow customer support | Priority support for academic users; community forum for students |
| $19.95/month for limited features | $9.99-14.99/month for significantly more value |

### Where QuillBot is Still Stronger

| Area | QuillBot Advantage | Shothik's Response |
|---|---|---|
| Brand Recognition | Established brand, millions of users | Build through academic community, open-source credibility |
| Bundled Writing Tools | Paraphraser, grammar checker, summarizer included | Already built: 5 STEM-native AI tools + Writing Studio + Publishing platform |
| Browser Extensions | Chrome, Word, Google Docs extensions | Build Overleaf + Google Docs extensions as priority |
| 100+ Languages | Extensive language support | Start with English + top 5 academic languages, expand gradually |

---

## 8. Competitive Landscape Overview

| Competitor | Strength | Weakness | Shothik's Advantage |
|---|---|---|---|
| **Turnitin/iThenticate** | 1B+ sources, institutional standard | Institutional-only, expensive, no individual access | Individual/SMB access, STEM features, affordable pricing |
| **QuillBot** | Bundled writing tools, brand recognition | Not own tech, 20-page limit, poor STEM handling | Own tech, unlimited analysis, STEM-native |
| **Copyleaks** | 99.1% accuracy, 30+ languages, SOC 2 | Expensive, enterprise-focused | Researcher-friendly pricing, STEM specialization |
| **Paperpal** | 200M articles, writing assistant | Limited to pre-submission | Real-time checking during writing |
| **Scribbr** | Good accuracy, academic focus | Pay-per-use ($20-40/paper), no API | Subscription model, API access, lower per-check cost |
| **Grammarly** | Unlimited plagiarism checks on Premium | Generic, not STEM-aware | STEM-specific accuracy, citation awareness |

---

## 9. Revised Product Strategy (Updated Feb 2026)

### Product Identity (Updated)

**Name:** Shothik AI
**Tagline:** "Write. Check. Publish. Earn."
**Target Market:** 40M+ university students and STEM researchers in South/Southeast Asia (Bangladesh, India, Pakistan), expanding globally
**Platform URL:** shothik.ai

### What We Are Building

A comprehensive AI-powered academic platform that:
1. **Writes**: AI co-writer, writing studio with 3 project types (books, research papers, assignments), 16 templates
2. **Checks**: STEM-native plagiarism detection, AI content detection, grammar checking, paraphrasing, humanization
3. **Publishes**: Book publishing to Google Play Books (eventually 12+ stores via PublishDrive), professional PDF/EPUB/DOCX export
4. **Earns**: 85% author royalties, Stripe Connect/Payoneer/bank transfer payouts, per-book earnings tracking

### What We Are NOT Building (Year 1)

- A Turnitin replacement for universities (bottom-up adoption first)
- A social media management platform (marketing automation is deprioritized)
- A general-purpose content management system

### Three Product Pillars

| Pillar | Target | Key Features | Revenue Model |
|---|---|---|---|
| **AI Content Tools** | Students, researchers, content creators | Plagiarism, AI detection, paraphrase, grammar, humanize — all STEM-native | Subscription (Starter/Pro/Enterprise) |
| **Writing Studio** | Authors, researchers, students | AI co-writer, citation management, formatting, export, 3 project types | Subscription (Pro/Enterprise) |
| **Publishing Platform** | Authors, researchers | Book publishing wizard, admin review, multi-store distribution, earnings & payouts | Commission (15% of Google's 70%) |

### Competitive Moat

The integrated workflow — **Write → Check → Detect → Paraphrase → Format → Publish → Earn** — is Shothik's strongest competitive advantage. No competitor offers the full stack. Estimated 12-18 months for any competitor to replicate.

---

## 10. Multi-Agent Architecture Design (Revised)

### Current Architecture (7 Agents)

```
Initialize → Chunk → Search → Fetch → Analysis → Route → Report
```

### Proposed Architecture (14 Agents)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHOTHIK v2.0 AGENT PIPELINE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [1. Intake Agent]                                              │
│      ↓                                                          │
│  [2. Document Parser Agent]                                     │
│      ├── LaTeX Parser                                           │
│      ├── PDF Extractor                                          │
│      ├── Code Block Detector                                    │
│      └── Section Classifier (Abstract/Body/Refs/Appendix)      │
│      ↓                                                          │
│  [3. Citation Extraction Agent]                                 │
│      ├── In-text Citation Detector (APA, MLA, Chicago, IEEE)   │
│      ├── Bibliography Parser                                    │
│      └── Self-Citation Identifier                               │
│      ↓                                                          │
│  [4. Smart Chunker Agent]                                       │
│      ├── Sentence-aware chunking                                │
│      ├── Section-aware chunking (don't split across sections)   │
│      └── Code block isolation                                   │
│      ↓                                                          │
│  [5. Vector Gate Agent] ← ChromaDB                              │
│      ├── Check vector cache for instant matches                 │
│      └── Return cached results if >95% similarity to prior      │
│      ↓ (cache miss)                                             │
│  [6. Multi-Source Search Agent]                                  │
│      ├── Gemini Grounding (web sources)                         │
│      ├── arXiv API                                              │
│      ├── PubMed/PMC API                                         │
│      ├── CORE API                                               │
│      ├── OpenAlex API                                           │
│      └── CrossRef API                                           │
│      ↓                                                          │
│  [7. Content Fetch Agent]                                       │
│      ├── Academic content extractors                            │
│      ├── PDF downloaders for open-access papers                 │
│      └── Rate-limited, queued fetching                          │
│      ↓                                                          │
│  [8. Similarity Analysis Agent]                                 │
│      ├── Exact match (n-gram)                                   │
│      ├── Semantic similarity (Gemini embeddings)                │
│      ├── Cross-lingual similarity                               │
│      └── Code similarity (AST-based for code blocks)           │
│      ↓                                                          │
│  [9. Citation Verification Agent]                               │
│      ├── Match detected sources against cited references        │
│      ├── Flag uncited matches as plagiarism                     │
│      └── Exclude properly cited content from score              │
│      ↓                                                          │
│  [10. AI Detection Agent]                                       │
│      ├── Gemini-based AI content detection                      │
│      ├── Statistical analysis (perplexity, burstiness)          │
│      └── Writing style consistency check                        │
│      ↓                                                          │
│  [11. Route Decision Agent]                                     │
│      ├── Process next chunk or early terminate                  │
│      └── Adaptive: skip chunks in low-risk sections             │
│      ↓                                                          │
│  [12. Report Generation Agent]                                  │
│      ├── Overall similarity score                               │
│      ├── Per-section breakdown                                  │
│      ├── Source-level matching with highlights                   │
│      ├── Citation gap analysis                                  │
│      └── Discipline-specific severity assessment                │
│      ↓                                                          │
│  [13. Quality Assurance Agent]                                  │
│      ├── Validate report completeness                           │
│      ├── Check for false positive patterns                      │
│      └── Confidence scoring for each match                      │
│      ↓                                                          │
│  [14. Feedback & Learning Agent]                                │
│      ├── Store analysis results for vector cache                │
│      ├── Track false positive/negative reports                  │
│      └── Update detection models based on feedback              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### New Agents Explained

| Agent | Purpose | Why It's Needed |
|---|---|---|
| **Document Parser** | Understand document structure (sections, formulas, code) | STEM papers have complex structures that generic chunking destroys |
| **Citation Extraction** | Identify all in-text citations and bibliography entries | Must know what's cited to avoid false positives on referenced content |
| **Citation Verification** | Cross-reference detected matches with cited sources | The core differentiator — properly cited content should NOT be flagged |
| **AI Detection** | Detect AI-generated content alongside plagiarism | Market requirement — journals now require both checks |
| **Quality Assurance** | Validate reports before delivery | Reduces false positives; adds confidence scoring |
| **Feedback & Learning** | Improve over time from user corrections | Creates a competitive moat — the system gets smarter with every check |
| **Vector Gate** (enhanced) | Instant results for repeat/similar checks | Reduces cost and latency dramatically for repeat content |

---

## 11. Phased Development Roadmap (Updated Feb 2026)

> *Note: The original 5-phase roadmap has been restructured to reflect actual progress and the expanded platform scope. Completed phases are marked with checkmarks.*

### Phase 0: Foundation — "Make It Safe" [PARTIAL]

**Original Plan:** Weeks 1-4 | **Status:** Frontend hardened, backend security still pending

| Task | Owner | Status | Notes |
|---|---|---|---|
| Frontend production hardening (all 5 tools) | Frontend | DONE | Console cleanup, error handling, Gaia UI, ARIA, mobile responsive |
| Convex server-side auth enforcement | Frontend | DONE | All mutations require JWT identity |
| Stripe API route auth verification | Frontend | DONE | Server-side ownership checks |
| JWT authentication middleware fix (backend) | Backend | NOT DONE | `jwt.decode` fallback still allows bypass |
| Remove hardcoded secrets from backend source | Backend | NOT DONE | Backend security issue |
| Fix CORS — whitelist specific origins | Backend | NOT DONE | Still allows all origins |
| Protect admin endpoints | Backend | NOT DONE | Still publicly accessible |
| Rate limiting per API key | Backend | NOT DONE | Needs implementation |
| SOC 2 Type 1 certification | Compliance | NOT STARTED | Required for institutional customers |

**Exit Criteria (Revised):** All critical backend security issues resolved. Convex auth is solid. Need backend team to address remaining items.

---

### Phase 1: STEM Frontend Features — "Make It Work for STEM" [DONE]

**Original Plan:** Weeks 5-12 | **Status:** COMPLETE (Frontend)

| Feature | Status | Implementation |
|---|---|---|
| STEM preprocessing (LaTeX/code detection) | DONE | `stemPreprocessor.ts` — shared across all 5 tools |
| Citation extraction & analysis | DONE | `citationDetector.ts` — APA/IEEE/DOI/URL detection |
| Citation analysis panel | DONE | `CitationAnalysisPanel.tsx` with coverage ring |
| File upload (PDF/DOCX/LaTeX/TXT) | DONE | `fileExtractor.ts` + `FileDropzone.tsx` with drag & drop |
| KaTeX math rendering | DONE | `MathRenderer.tsx` — inline/display LaTeX |
| Shiki code highlighting | DONE | `CodeHighlighter.tsx` — 12 STEM languages, dual theme |
| STEM content renderer | DONE | `STEMContentRenderer.tsx` — unified parser |
| Mobile tab navigation | DONE | WAI-ARIA tablist on all tools |
| Gaia UI compliance | DONE | 8.5/10 score across all tools |

**Exit Criteria:** MET — All STEM features implemented on frontend. Backend integration pending.

---

### Phase 2: Writing Studio & Publishing Platform — "Make It a Platform" [DONE]

**New phase (not in original roadmap)** | **Status:** COMPLETE

| Feature | Status | Implementation |
|---|---|---|
| Writing Studio redesign (4-tab workspace) | DONE | Write, Outline, Formatting, Publish views |
| 3 project types with templates | DONE | Book (5 templates), Research (5), Assignment (6) |
| AI Co-Writer panel | DONE | `AiCoWriterPanel.jsx` + `useAiCoWriter.js` |
| Citation management | DONE | `CitationSuggestionPanel.jsx` + `useCitationSuggestions.ts` |
| Document export (PDF/EPUB/DOCX) | DONE | `ExportPanel.jsx` + `useDocumentBuild.ts` |
| Convex backend (5 tables, ~40 functions) | DONE | books, salesRecords, payouts, payoutAccounts, projects |
| 6-step publishing wizard | DONE | Manuscript → Cover → Metadata → Pricing → Agreement → Review |
| Author dashboard with status tracking | DONE | Book listing, visual pipeline, search/filter |
| Admin review system (demo@shothik.ai) | DONE | 722-line AdminReviewPanel with approve/reject/publish |
| Notification system | DONE | In-book bell notifications with read/unread |
| Earnings dashboard | DONE | Monthly chart, per-book breakdown, available balance |
| Payout system (3 methods) | DONE | Stripe Connect, Payoneer, bank transfer ($25 min) |
| PublishDrive distribution service | DONE (Stubbed) | 12 channels, feature-flagged, waiting for Pro plan |
| RS256 JWT authentication for Convex | DONE | JWKS endpoint, token exchange, server-side enforcement |

**Exit Criteria:** MET — Full publishing pipeline operational. Distribution activation pending external dependency.

---

### Phase 3: Platform Hardening & Launch Prep — "Make It Ready" [CURRENT]

**Timeline:** March-April 2026 | **Status:** IN PROGRESS

| Sprint | Task | Priority | Owner | Status |
|---|---|---|---|---|
| Sprint 1 (W1-2) | Get Convex production deploy key (stable URL) | P0 | DevOps | Not Started |
| Sprint 1 (W1-2) | Configure Stripe API keys as production secrets | P0 | DevOps | Not Started |
| Sprint 1 (W1-2) | Test publishing wizard end-to-end with real data | P0 | QA | Not Started |
| Sprint 2 (W3-4) | Activate PublishDrive distribution (purchase Pro plan) | P1 | Business | Not Started |
| Sprint 2 (W3-4) | Set up Google Play Books publisher account (Shothik UK) | P1 | Business | Not Started |
| Sprint 3 (W5-6) | ONNX model conversion for AI Detector (faster, cheaper) | P0 | Backend | Not Started |
| Sprint 3 (W5-6) | Wire Writing Studio inline tool integrations (Paraphrase, Grammar, AI Detector) | P2 | Frontend | Not Started |
| Sprint 4 (W7-8) | Migrate Writing Studio from localStorage to Convex persistence | P1 | Frontend | Not Started |
| Sprint 4 (W7-8) | Sales data ingestion pipeline (automated from Google Play) | P1 | Backend | Not Started |
| Sprint 4 (W7-8) | Production-harden Summarize tool | P2 | Frontend | Not Started |

**Exit Criteria:** Stable Convex URL, working Stripe payouts, ONNX AI detection, first real book published.

---

### Phase 4: South Asian Market Entry — "Make It Accessible" [PLANNED]

**Timeline:** May-July 2026 | **Status:** NOT STARTED

| Sprint | Task | Deliverable |
|---|---|---|
| Sprint 5 (W9-10) | Regional pricing for South Asia (BDT, INR, PKR via bKash/Razorpay) | Local payment options |
| Sprint 5 (W9-10) | Accuracy benchmark study (100+ STEM papers vs Turnitin/QuillBot) | Published credibility |
| Sprint 6 (W11-12) | University WhatsApp/Telegram outreach campaign | User acquisition |
| Sprint 6 (W11-12) | Author onboarding program (first 100 published authors) | Publishing traction |
| Sprint 7 (W13-14) | Hindi/Bengali language support for AI Detector | Regional language |
| Sprint 7 (W13-14) | Author identity verification (KYC) for payouts | Compliance |
| Sprint 8 (W15-16) | Tax document generation (W-8/W-9) | Tax compliance |
| Sprint 8 (W15-16) | Automated royalty calculation from live sales | Revenue automation |

**Exit Criteria:** 1,000+ monthly active users in South Asia. 50+ books published. Regional pricing live.

---

### Phase 5: Growth & Advanced Features — "Make It Better" [PLANNED]

**Timeline:** August-November 2026 | **Status:** NOT STARTED

| Sprint | Task | Deliverable |
|---|---|---|
| Sprint 9-10 | Cross-lingual plagiarism detection | Multi-language detection |
| Sprint 9-10 | Code similarity detection (AST-based) | Code plagiarism for CS papers |
| Sprint 11-12 | STEM paraphrase modes (Technical, Citation-Safe) | Advanced paraphrasing |
| Sprint 11-12 | Overleaf browser extension (MVP) | Meet researchers where they work |
| Sprint 13-14 | Real-time collaboration in Writing Studio | Multi-user editing |
| Sprint 13-14 | Batch processing API for journal editors | Publisher feature |
| Sprint 15-16 | AI Agents activation (Slides, Sheets, Deep Research) | Full agent ecosystem |

**Exit Criteria:** 10,000+ monthly active users. 500+ books published. 5+ paying journal publishers.

---

### Phase 6: Enterprise & Scale — "Make It Institutional" [PLANNED]

**Timeline:** December 2026 - June 2027 | **Status:** NOT STARTED

| Quarter | Task | Deliverable |
|---|---|---|
| Q1 2027 | SOC 2 Type 1 certification | Compliance certification |
| Q1 2027 | Editorial system integrations (ScholarOne, OJS) | Publisher workflows |
| Q2 2027 | Enterprise dashboard for department heads | Institutional tier |
| Q2 2027 | GDPR/FERPA compliance | Regulatory readiness |
| Q2 2027 | University pilot programs (5-10 in South Asia) | Institutional validation |
| Q2 2027 | Open-source release of core utilities | Community trust |

---

## 12. Go-to-Market Strategy (Updated)

### Channel 1: Bottom-Up Student & Researcher Adoption (Months 1-6)

```
Students → Researchers → Lab Groups → Departments → Institutions
       ↓
    Authors → Published Books → Earning Authors → Community Growth
```

| Channel | Action | Cost |
|---|---|---|
| University WhatsApp/Telegram groups (South Asia) | Direct outreach to student groups — "Free AI writing tools" | Free |
| Academic Twitter/X | Share accuracy benchmark results, engage with researchers | Free |
| Reddit (r/academia, r/GradSchool) | Community engagement, offer free trials | Free |
| ResearchGate | Product page, researcher testimonials | Free |
| YouTube tutorials (Bengali/Hindi) | "How to publish your first book" tutorial series | Free |
| Publishing program | "First 100 Authors" program — free Enterprise plan for early publishers | Free (investment) |
| Conference sponsorships | Sponsor small STEM conferences, offer free checks | $500-2000/conference |

### Channel 2: Publishing Platform Growth (Months 3-9)

| Channel | Action | Target |
|---|---|---|
| Author recruitment | "Publish your thesis as a book" campaign targeting fresh graduates | 100 authors in 6 months |
| University partnerships | "Student Publishing Program" — publish student research as books | 10 universities |
| Content creator outreach | "Turn your blog into a book" for content creators | 500+ creators |
| Earning showcase | Publicly share author earnings milestones | Social proof |

### Channel 3: Institutional & Enterprise (Months 12-18)

| Channel | Action | Target |
|---|---|---|
| Open-access journal directories (DOAJ) | Email outreach to editors for plagiarism tool | 500+ journals |
| Publisher partnerships | Integration with OJS, ScholarOne | Top 50 small/mid publishers |
| University procurement | Formal proposals with SOC 2 certification | 10 university pilots |
| Reseller partnerships | Partner with regional EdTech distributors | South/Southeast Asia coverage |

---

## 13. Pricing Model (Updated)

### Consumer Plans (Live in Platform)

| Plan | Price | Includes | Target |
|---|---|---|---|
| **Starter** | $7.99/mo | AI tools (limited usage), Writing Studio, basic export | Students, casual users |
| **Pro** | $15/mo | Unlimited AI tools, STEM-Safe mode, plagiarism checks, citation management, all export formats | Active researchers, content creators |
| **Enterprise** | $25/mo | Everything in Pro + AI agents (Slides, Sheets, Research), book publishing, priority support | Power users, authors, professionals |

### Publishing Revenue (Commission Model)

| Component | Rate | Details |
|---|---|---|
| Google Play Books payment to Shothik | 70% of list price | Standard Google Play revenue share |
| Shothik commission | 15% of Google's payment | Platform fee for distribution, admin review, payment processing |
| Author royalty | 85% of Google's payment | ~59.5% of list price paid to author |
| Minimum payout | $25 | Accumulated until threshold reached |
| Payout methods | 3 | Stripe Connect (instant), Payoneer (global), Bank Transfer (3-5 days) |

### Regional Pricing (South Asia — Planned for Phase 4)

| Plan | BDT | INR | PKR | USD Equivalent |
|---|---|---|---|---|
| Starter | ৳499/mo | ₹499/mo | Rs. 1,499/mo | ~$4/mo |
| Pro | ৳999/mo | ₹999/mo | Rs. 2,999/mo | ~$8/mo |
| Enterprise | ৳1,499/mo | ₹1,499/mo | Rs. 4,999/mo | ~$12/mo |

### Publisher/Institutional Tier (Planned for Phase 6)

| Plan | Price | Includes | Target |
|---|---|---|---|
| **Journal Starter** | $99/mo | 500 checks/month, editor dashboard, batch processing | Small journals |
| **Journal Pro** | $299/mo | 2,000 checks/month, editorial system integration, priority support | Mid-tier journals |
| **Enterprise** | Custom | Unlimited, SSO, compliance reports, dedicated support | Universities, large publishers |

---

## 14. Success Metrics & KPIs (Updated)

### Platform Metrics

| Metric | Month 3 Target | Month 6 Target | Month 12 Target |
|---|---|---|---|
| Monthly Active Users | 500 | 5,000 | 25,000 |
| Paying Subscribers | 50 | 500 | 5,000 |
| Monthly Revenue (Subscriptions) | $400 | $5,000 | $50,000 |
| Monthly Revenue (Publishing Commission) | $0 | $200 | $2,000 |
| Papers/Documents Analyzed | 2,000 | 15,000 | 100,000 |
| Books Published | 10 | 100 | 500 |
| Author Payouts Processed | 0 | $500 | $5,000 |
| Writing Studio Projects Created | 100 | 2,000 | 15,000 |

### Technical Metrics

| Metric | Current | Target |
|---|---|---|
| API Uptime | N/A (not measured) | 99.5% |
| AI Detection Speed (with ONNX) | ~2s (current) | <500ms |
| Convex Query Response | ~200ms | <100ms |
| Security Audit Score | Partial pass (frontend) | Full pass |
| Production-Hardened Tools | 5/14 | 10/14 |
| Gaia UI Compliance Score | 8.5/10 | 9.5/10 |

### Business Metrics

| Metric | Month 6 Target | Month 12 Target |
|---|---|---|
| Customer Acquisition Cost | <$10/user | <$3/user |
| Monthly Churn Rate | <8% | <5% |
| Net Promoter Score | >40 | >50 |
| Published Authors on Platform | 50 | 200 |
| Distribution Channels Active | 1 (Google Play) | 5+ |
| University Partnerships | 0 | 5 |

---

## 15. Unit Economics & Feasibility

### Cost Per Analysis (Estimated)

| Component | Cost Per Analysis | Notes |
|---|---|---|
| Gemini Grounding API | ~$0.01-0.03 | Per chunk search (varies by input tokens) |
| Gemini Embeddings | ~$0.005 | Per chunk vector generation |
| ChromaDB (cached hit) | ~$0.001 | Local vector lookup, near-zero marginal cost |
| Content Fetching | ~$0.002 | Server compute for web scraping |
| MongoDB Storage | ~$0.001 | Per analysis record |
| **Total (fresh analysis, 10 chunks)** | **~$0.15-0.35** | Average 5,000-word paper |
| **Total (cached hit)** | **~$0.01** | Repeat/similar content |

### Sustainability Check

| Plan | Monthly Revenue/User | Avg Analyses/User/Mo | Cost/Analysis | Gross Margin |
|---|---|---|---|---|
| Free (5 checks) | $0 | 5 | $0.25 avg | -100% (acquisition cost) |
| Student ($4.99) | $4.99 | 15 | $0.25 avg | ~25% ($1.24 margin) |
| Researcher ($14.99) | $14.99 | 40 | $0.25 avg | ~33% ($4.99 margin) |
| Professional ($24.99) | $24.99 | 80 | $0.20 avg (more cached) | ~36% ($8.99 margin) |
| Journal Starter ($99) | $99 | 300 | $0.15 avg (bulk cached) | ~55% ($54 margin) |

### Assumptions

- Average research paper: ~5,000 words = ~10 chunks at 300 words/chunk
- Gemini API pricing based on current Gemini 1.5 Flash rates ($0.075/1M input tokens)
- Cached analyses (Vector Gate hits) reduce cost by ~95%
- As the vector database grows, cache hit rate increases, improving margins over time
- DeepSeek fallback available at lower cost for non-critical analyses

### Team Size Assumptions Per Phase

| Phase | Duration | Minimum Team | Roles |
|---|---|---|---|
| Phase 0 | 4 weeks | 2 developers | 1 backend security + 1 QA |
| Phase 1 | 8 weeks | 3 developers | 2 backend + 1 AI/ML |
| Phase 2 | 8 weeks | 4 developers | 2 backend + 1 frontend + 1 DevOps |
| Phase 3 | 12 weeks | 5 developers | 2 backend + 1 AI/ML + 1 frontend + 1 DevOps |
| Phase 4 | 6 months | 6+ team | + sales/BD + compliance |

### Must-Have vs Nice-to-Have Per Phase

| Phase | Must-Have | Nice-to-Have |
|---|---|---|
| **Phase 0** | JWT fix, route protection, CORS fix, input validation | Structured logging, health checks |
| **Phase 1** | Citation extraction, citation verification, smart chunking, vector service 2.0 | LaTeX parser, code block detection |
| **Phase 2** | Web dashboard, file upload, arXiv/OpenAlex integration, accuracy study | Overleaf extension, PubMed integration |
| **Phase 3** | AI detection, code similarity, batch processing | Cross-lingual detection, Google Docs extension |
| **Phase 4** | SOC 2, editorial system integration, enterprise dashboard | Open-source release, university pilots |

---

## 16. Risk Mitigation Plan (Updated)

### Platform-Level Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Security breach of manuscripts/books | Medium | Critical | Fix all backend security issues; SOC 2 certification; auto-delete policy |
| Convex preview URL instability | High | High | Get production deploy key ASAP; fallback URLs in 3 files |
| Stripe API key missing | High | Critical (payouts broken) | Configure production secrets immediately |
| Google Play publisher account delay | Medium | High | Begin application process now (UK company) |
| PublishDrive Pro plan cost | Low | Medium | Feature-flagged; can launch with Google Play only initially |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Slow author adoption for publishing | Medium | High | "First 100 Authors" incentive program; YouTube tutorials in Bengali/Hindi |
| Turnitin/QuillBot adds STEM features | Low | High | Move fast; integrated platform moat (Write→Check→Publish→Earn) |
| Gemini API cost increases | Medium | Medium | ONNX conversion (in progress); multi-model approach |
| Low book sales on Google Play | Medium | Medium | Multi-store distribution (PublishDrive); author marketing tools |
| Payment fraud/chargebacks | Low | Medium | KYC verification; minimum payout threshold; Stripe Connect protections |
| Regional payment integration complexity | Medium | Medium | Start with USD/Stripe; add bKash/Razorpay in Phase 4 |

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| localStorage data loss (Writing Studio) | High | Medium | Migrate to Convex persistence in Phase 3 |
| Copyleaks adds STEM features | Medium | High | Differentiate on integrated workflow, not individual tools |
| Backend API reliability | Medium | High | Monitoring, retry logic, circuit breakers already in service layer |
| Scale issues under load | Medium | Medium | Convex auto-scales; backend needs queue management |
| Team burnout (small team, large scope) | High | High | Strict phase discipline; ship Phase 3 before expanding |

---

## 17. Conclusion

### The Verdict (Updated Feb 2026)

Shothik AI has successfully evolved from a plagiarism detection concept into a **comprehensive AI-powered academic platform**. The 22-agent panel's original direction — "RIGHT segment, needs FOCUSED execution" — has been validated by the progress made. The platform now offers a differentiated value proposition that no competitor can match:

**Write → Check → Detect → Paraphrase → Fix → Humanize → Format → Publish → Earn**

### What's Changed Since v1.0 (Feb 15)

1. **Scope expanded**: From plagiarism-only to full academic ecosystem
2. **Publishing platform built**: Complete manuscript-to-royalty pipeline
3. **Writing Studio redesigned**: From basic Quill editor to 4-tab unified workspace
4. **5 tools production-hardened**: All STEM-native with mobile support and Gaia UI compliance
5. **Convex backend deployed**: 5 tables, ~40 functions, RS256 JWT auth
6. **Pricing model refined**: Three tiers ($7.99/$15/$25) + publishing commission (15%)

### Strategic Position

Shothik is no longer competing in just one category. The competitive landscape has shifted:

| Category | Primary Competitors | Shothik's Advantage |
|---|---|---|
| Plagiarism Detection | Turnitin, QuillBot, Copyleaks | STEM-native, citation-aware, affordable |
| AI Detection | GPTZero, Originality.ai | Integrated with humanization tool |
| Writing Tools | Grammarly, QuillBot | STEM-aware paraphrasing & grammar |
| Academic Writing | Overleaf, Google Docs | AI co-writer + formatting + export |
| Book Publishing | Amazon KDP, Lulu | Write-to-publish pipeline, 85% royalties |
| **Full Stack** | **Nobody** | **The only platform offering all 5 categories** |

### The Path Forward (Updated)

```
Phase 0 (Done/Partial) → Frontend hardened, backend security still needed
Phase 1 (Done)         → STEM features complete on frontend
Phase 2 (Done)         → Writing Studio + Publishing Platform built
Phase 3 (Current)      → Platform hardening, Convex production, Stripe, ONNX
Phase 4 (May-Jul 26)   → South Asian market entry, regional pricing, first 1,000 users
Phase 5 (Aug-Nov 26)   → Advanced features, AI agents, cross-lingual detection
Phase 6 (Dec 26-Jun 27)→ Enterprise, SOC 2, university pilots
```

### Immediate Priorities (Next 30 Days)

1. **P0**: Get Convex production deploy key (stable URL for all environments)
2. **P0**: Configure Stripe API keys for live payouts
3. **P0**: ONNX model conversion for AI Detector speed improvement
4. **P1**: Test publishing wizard end-to-end with real manuscript
5. **P1**: Begin Google Play Books publisher account application (UK company)
6. **P2**: Wire Writing Studio inline tool integrations

### The Bottom Line

Don't try to be Turnitin. Don't try to be QuillBot. Don't try to be Amazon KDP. Be all of them — but built specifically for STEM researchers and students in South/Southeast Asia. Write your paper, check it, fix it, format it, publish it, earn from it — all in one platform. No competitor offers this end-to-end workflow. Build it fast, build it right, and build it for the 40 million students who need it most.

---

**Document prepared by:** Shothik AI Strategic Planning
**Last updated:** February 23, 2026 (v2.0 — Full platform audit and roadmap update)
**Previous versions:** v1.0 (Feb 15, 2026), Phase 5 added (Feb 17, 2026)
**Next review date:** March 23, 2026
**Cross-references:**
- [Development Plan/Service_Tracker.md](Service_Tracker.md) — Comprehensive 14-service platform audit
- [Development Plan/Frontend_Implementation_Plan.md](Frontend_Implementation_Plan.md) — Frontend implementation plan
- [Findings/Paraphrase.md](../Findings/Paraphrase.md) — Backend analysis, 22-agent strategic panel
- [shothikai/writing-studio](https://github.com/shothikai/writing-studio) — LaTeX backend repository (integrated into Phase 5)
- [convex/schema.ts](../convex/schema.ts) — Convex database schema for publishing platform
