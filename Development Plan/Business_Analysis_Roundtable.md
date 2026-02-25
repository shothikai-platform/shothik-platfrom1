# Shothik AI — 20-Agent Business Analyst Roundtable
**Date:** February 17, 2026 (Updated February 23, 2026)  
**Subject:** Ecosystem Opportunity Analysis — Platform Growth & Publishing Platform  
**Target Market:** 40M+ university students, STEM researchers, aspiring authors in South/Southeast Asia  
**Document Version:** 2.0

---

## UPDATE LOG (February 23, 2026)

> The original 20-agent roundtable was conducted on February 17, 2026. Since then, significant platform development has occurred. This update section tracks what was recommended vs. what was built, and provides a revised implementation plan.

### What's Been Built Since This Roundtable

| Recommendation | Agent(s) | Status | What Was Done |
|----------------|----------|--------|---------------|
| FortuneSheet integration for Sheet AI | 3, 6, 7 | DONE | `@fortune-sheet/react` installed, bidirectional data adapter built, `fortune-sheet-store.tsx` + `fortune-sheet-utils.ts` exist |
| STEM preprocessing across all tools | 10 | DONE | `stemPreprocessor.ts` shared across all 5 production-hardened tools |
| AI Detector with confidence scores | 18 | DONE | Production-hardened with STEM preprocessing and score breakdown |
| Paraphrase with style preservation | 18 | DONE | 7 modes, 5 languages, STEM-aware rephrasing |
| Writing Studio (unified workspace) | 12 | DONE | 4-tab workspace built; LaTeX compilation API routes exist but full LaTeX engine not yet production-ready |
| Citation detection & analysis | 10 | DONE | `citationDetector.ts` — APA/IEEE/DOI/URL detection with `CitationAnalysisPanel.tsx`; auto-conversion between formats not yet built |
| Cross-tool workflow integration | 12 | PARTIAL | Plagiarism ↔ AI Detector ↔ Humanize GPT wired; Sheet ↔ Research pending |
| Mobile responsive design | 14 | DONE | Mobile tab navigation (WAI-ARIA tablist) on all 5 tools |
| Code-splitting / lazy loading | 14 | PARTIAL | FortuneSheet uses `next/dynamic` with `ssr: false`; more splitting needed |
| **Publishing Platform** | NOT PLANNED | DONE | 6-step wizard, Convex backend, earnings, payouts, admin review — major strategic addition |
| **Author Earnings & Payouts** | NOT PLANNED | DONE | 85% royalties, Stripe Connect/Payoneer/bank transfer, $25 minimum |
| **Convex Backend** | NOT PLANNED | DONE | 5 tables, ~40 functions, RS256 JWT auth |
| Brand pivot to "AI Research Assistant" | 16 | PARTIAL | Platform identity now "Write. Check. Publish. Earn." — broader than research-only |
| Marketing automation maintenance mode | 16, 20 | YES | No new development on marketing automation |
| Mobile payment (bKash/UPI) | 13, 5, 19 | NOT STARTED | Using Stripe only; regional payments planned for Phase 4 |
| University pilot programs | 17 | NOT STARTED | Planned for Phase 6 (Dec 2026-Jun 2027) |
| ONNX model conversion for speed | 18 | NOT STARTED | Planned as P0 in Phase 3 (current priority) |
| Research → Sheet data pipeline | 3, 12 | NOT STARTED | Infrastructure exists but handoff not wired |
| Chart/graph generation | 3 | NOT STARTED | Recharts in dependency tree but not integrated |
| Statistical analysis sidebar | 9 | NOT STARTED | Planned for Phase 5 |
| Humanize GPT rebranding | 15, 16 | NOT DONE | Still called "Humanize GPT" — rebranding deferred |

### Key Strategic Shifts Since Roundtable

1. **Publishing Platform added**: The most significant development not anticipated by the roundtable. Shothik now enables authors to write → publish → earn, creating a commission-based revenue stream (15% of Google Play's 70%) alongside subscriptions.

2. **Convex backend introduced**: Cloud-native backend (deployed to `healthy-mastiff-358.convex.cloud`) with 5 tables, RS256 JWT authentication, and ~40 functions. This replaces the need for custom backend CRUD for the publishing workflow.

3. **Pricing model evolved**: The roundtable recommended $2.99/$7.99 tiers. Platform now uses Starter ($7.99), Pro ($15), Enterprise ($25) + publishing commission. Higher prices justified by expanded feature set (Writing Studio, Publishing, AI Agents).

4. **Revenue model expanded**: Two revenue streams now — (1) tool subscriptions and (2) publishing commission (15% of book sales). The publishing commission creates recurring revenue independent of subscription pricing debates.

5. **Scope expanded beyond academic tools**: Writing Studio supports books, research papers, AND assignments. Publishing platform targets aspiring authors, not just researchers. Market addressable beyond "just STEM students."

### Revised Agent Assessments

| Agent | Original Position | Updated Assessment |
|-------|-------------------|-------------------|
| Agent 3 (Product Manager) | MVP = FortuneSheet + AI data | FortuneSheet done; MVP has shifted to "full publishing pipeline working end-to-end" |
| Agent 5 (Monetization) | $2.99-7.99 tiers | Pricing at $7.99-25 tiers + publishing commission — higher value, higher price |
| Agent 12 (Platform Strategist) | "8 standalone tools that don't talk to each other" | 5 tools production-hardened with cross-service wiring; Writing Studio integrates multiple tools |
| Agent 13 (Localization) | bKash/UPI essential immediately | Deferred — launching with Stripe first, adding regional payments in Phase 4 |
| Agent 16 (Content Strategist) | Pivot to "AI Research Assistant" | Broader pivot: "Write. Check. Publish. Earn." — academic + publishing platform |
| Agent 19 (Financial Analyst) | Break-even at 5,000 paying users | Publishing commission changes economics — even 100 authors generating $200/mo in royalties creates meaningful revenue |
| Agent 20 (Risk Manager) | #1 risk is scope creep | Scope did expand significantly, but strategically (publishing platform). New #1 risk: Convex URL instability + missing Stripe production keys |

---

## ROUND 1: Opening Statements (Each Agent's Key Insight)

---

### Agent 1: Market Research Analyst

The South/Southeast Asian EdTech market is projected at $25B+ by 2027. Bangladesh, India, Indonesia, Philippines, and Vietnam have over 40 million university students combined. Key behaviors:

- **Price sensitivity is extreme** — average monthly software spend is $2-5 USD per student
- **Grammarly, Turnitin, and Overleaf dominate** but are priced for Western markets ($12-30/month)
- **Piracy is rampant** — if the free tier isn't generous, users find "alternatives"
- **Mobile-first access** — 60-70% of students in Bangladesh/India access tools via phone
- **WhatsApp/Telegram word-of-mouth** drives 80% of tool discovery in these communities
- **University lab computers** are a primary workspace (shared machines, unreliable internet)

**Key insight:** The market wants "Grammarly + Turnitin + Google Sheets for research" at 1/10th the price. Nobody offers this bundle. That's the gap.

---

### Agent 2: UX Researcher

I interviewed user behavior patterns across academic communities. Top pain points:

1. **Copy-paste workflow hell** — researchers extract data from papers, paste into Excel, clean manually, paste into Word, reformat. Takes 3-4 hours per dataset.
2. **Tool switching fatigue** — Grammarly for grammar, Turnitin for plagiarism, Overleaf for LaTeX, Google Sheets for data. 5+ tools open simultaneously.
3. **"I found data but can't use it"** — research papers have tables as images/PDFs that can't be edited
4. **Citation formatting nightmare** — manually converting between APA, IEEE, Vancouver formats
5. **Revision anxiety** — "Did my paraphrase trigger AI detection?" — constant back-and-forth between tools

**Key insight:** The biggest time waste is data transformation (paper → spreadsheet → visualization → document). An integrated pipeline saves 10+ hours per research project.

**Challenge to Agent 1:** Price sensitivity matters, but researchers will pay if the tool saves them significant time. Time = money even in low-income markets. A $5/month tool that saves 10 hours is still worth it.

---

### Agent 3: Product Manager

Based on the Cheatsheet comparison, here's what the MVP should look like:

**Must Have (P0):**
- Interactive spreadsheet with cell editing (FortuneSheet or similar)
- AI can populate data from natural language ("Find rice yield data for Bangladesh 2015-2024")
- Basic formulas (SUM, AVERAGE, COUNT, MIN, MAX)
- Export to CSV/XLSX
- Mobile-responsive layout

**Should Have (P1):**
- AI cell selection awareness ("Fix this column", "Chart these 3 rows")
- Basic chart generation (bar, line, pie)
- "Send to Presentation" action
- Formula suggestions from AI

**Nice to Have (P2):**
- Multi-tab support
- Advanced formulas (VLOOKUP, IF, COUNTIF)
- Collaborative editing
- Template library (research data templates, marketing report templates)

**Key insight:** The MVP is NOT "build Google Sheets." It's "AI fills a spreadsheet with real data, and you can edit it." That's fundamentally different.

**Challenge to Agent 6 (Technical Architect):** Can we ship the P0 in 2-3 weeks? What's the realistic timeline?

---

### Agent 4: Growth Hacker

Academic growth is driven by three channels:

1. **Thesis/paper sharing** — "I used Shothik AI for my research" → link in acknowledgments → peers try it
2. **Professor recommendations** — one professor influences 200+ students per semester
3. **Research group adoption** — if one lab member uses it, the whole lab follows

**Viral features that work:**
- **Share links with preview** — "Here's my data analysis" (already have this for sheets)
- **Free tier generous enough for one full paper** — get them hooked on the workflow
- **"Powered by Shothik AI" watermark** on free exports — organic brand exposure
- **University bulk licensing** — $1/student/month for 500+ students is better than $5/month per individual
- **Referral credits** — share with 3 friends, get 50 free credits

**Key insight:** Don't sell to students. Sell to departments. One sale = 500 users. The growth loop is: student uses free tier → shows professor → department buys license.

**Challenge to Agent 5:** Individual subscriptions won't work in this market. We need institutional pricing alongside credits.

---

### Agent 5: Monetization Strategist

> **UPDATE (Feb 23):** The pricing below was the original proposal. The platform now uses: **Starter ($7.99/mo)**, **Pro ($15/mo)**, **Enterprise ($25/mo)** + publishing commission (15% of Google Play's 70%). Higher prices justified by the expanded feature set (Writing Studio, Publishing Platform, AI Agents). See Strategic_Roadmap.md Section 13 for current pricing.

Pricing model for South/Southeast Asian market (original proposal):

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | 5 AI research queries/day, 3 plagiarism checks/day, basic spreadsheet (100 rows), 2 exports/month |
| **Student** | $2.99/month | 50 AI queries/day, unlimited plagiarism/grammar, full spreadsheet, 20 exports/month, no watermark |
| **Researcher** | $7.99/month | Unlimited AI queries, priority processing, advanced charts, collaboration, API access |
| **Institution** | $1.49/student/month (min 100) | All Researcher features, admin dashboard, usage analytics, SSO |

**Revenue model:**
- 95% free users → 4% Student → 0.8% Researcher → 0.2% Institution
- With 100K users: ~$15K MRR growing to $50K+ MRR with institutional sales
- Credit top-ups for heavy users ($0.99 for 100 credits) provide additional revenue

**Key insight:** The "credit top-up" model works best alongside subscriptions. Students need predictable costs (subscription) with burst capability (credits for thesis deadline week).

**Agreement with Agent 4:** Institutional pricing is essential. But individual subscriptions fund the runway while you build institutional sales channels.

---

### Agent 6: Technical Architect

Technical feasibility assessment:

| Feature | Feasibility | Risk | Timeline |
|---------|------------|------|----------|
| FortuneSheet integration | High | Bundle size (400KB gzipped), SSR issues | 1 week for basic embed |
| AI cell tools (update/sort/clear) | High | State sync between Redux and sheet | 1 week |
| Formula engine | Medium | FortuneSheet has built-in, but edge cases | Included with FortuneSheet |
| Chart generation (Recharts) | High | Already in our dependency tree via Cheatsheet pattern | 3-4 days |
| Research → Sheet handoff | High | Need shared data schema | 3-4 days |
| Sheet → Presentation handoff | Medium | presentation-gen-service API contract unclear | 1 week |
| Multi-tab | Medium | FortuneSheet supports natively | Included |
| Real-time collaboration | Low | Requires OT/CRDT layer, WebSocket infra | 4-6 weeks (defer) |

**Architecture decision:** Keep Redux for app-level state, use FortuneSheet's internal state for spreadsheet data, bridge with a thin adapter layer. The LangChain backend stays as-is — it generates data that populates the spreadsheet.

**Response to Agent 3:** P0 is achievable in 2-3 weeks. The FortuneSheet embed + 6 core tools + formula support can ship in that timeframe. Charts add 1 more week.

**Challenge to Agent 8 (Backend):** The bottleneck isn't the frontend. It's whether sheet-gen-service can output data in a format FortuneSheet can consume directly.

---

### Agent 7: Frontend Engineer

FortuneSheet integration specifics:

**Pros:**
- @fortune-sheet/react is a React component — drops into Next.js easily
- Built-in formula engine, cell styling, multi-sheet tabs
- Cheatsheet has already proven it works in a Next.js context
- 137 stars, active maintenance, MIT license

**Cons:**
- Must be client-side only (`'use client'` directive) — no SSR
- Bundle size is significant (~400KB gzipped)
- Styling conflicts with Tailwind are possible
- Internal state model is different from Redux — need adapter

**Key recommendations:**
- Dynamic import with `next/dynamic` and `ssr: false`
- Code-split the sheet component — only load when user navigates to Sheet AI
- Use Zustand or a simple store for sheet state, sync to Redux only for metadata (save points, conversation history)
- The Cheatsheet codebase is a great reference — their `fortune-sheet-store.tsx` and `fortune-sheet-utils.ts` solve exactly our problems

**Challenge to Agent 14 (Mobile):** FortuneSheet on mobile is usable but cramped. Should we offer a simplified "data card view" for mobile instead of a full spreadsheet grid?

---

### Agent 8: Backend Engineer

Backend service coordination analysis:

**Current architecture:**
```
Frontend → model (core API) → individual microservices
                             → paraphrase-service
                             → sheet-gen-service
                             → presentation-gen-service
                             → shothik-research-v2
```

**Bottlenecks:**
1. **No shared data contract** — each service returns data in its own format
2. **RabbitMQ is underutilized** — could enable async pipelines (research → sheet → presentation)
3. **sheet-gen-service returns flat data** — needs transformation to FortuneSheet format
4. **No caching layer** — repeated research queries hit Gemini API every time

**Recommendations:**
- Define a **Universal Dataset Schema** (JSON) that all services produce/consume
- Add a **transformation layer** in the model service that converts between formats
- Use **RabbitMQ** for the pipeline workflow: research completes → triggers sheet population → triggers chart suggestions
- Add **Redis caching** for research results (already have Redis in the model service)

**Response to Agent 6:** The format conversion is straightforward. sheet-gen-service returns structured JSON arrays — converting to FortuneSheet's `celldata` format is a simple mapping function. I'd put it in the frontend adapter, not the backend.

---

### Agent 9: Data Scientist

Data-driven features that would differentiate:

1. **Smart data cleaning suggestions** — "Column B has 12% missing values. Fill with mean/median/interpolation?"
2. **Statistical analysis sidebar** — auto-compute mean, std dev, correlation, p-values when data is loaded
3. **Outlier detection** — highlight anomalous data points in research datasets
4. **Data source credibility scoring** — "This data is from WHO (high credibility)" vs "This data is from a blog post (low credibility)"
5. **Usage analytics for institutions** — "Your department used 4,500 AI queries this month, 67% for plagiarism checking"

**Key insight:** The killer feature for STEM researchers isn't the spreadsheet itself — it's **automated statistical analysis** on top of the spreadsheet. No one else offers "paste your data → get instant stats + charts."

**Challenge to Agent 3:** Statistical analysis should be P0, not P2. It's the #1 differentiator for STEM users. A spreadsheet without stats is just... Excel.

---

### Agent 10: Academic Domain Expert

What STEM researchers actually need that Overleaf/Grammarly/Turnitin don't provide:

1. **LaTeX-aware editing** — existing tools break when they encounter `\begin{equation}` or `$\alpha$`
2. **Code-aware processing** — Grammarly flags Python code as grammar errors
3. **Citation-format flexibility** — switching between APA, IEEE, Vancouver, Harvard without re-typing
4. **Figure/table management** — "Insert Table 3 from my Sheet AI data with proper numbering"
5. **Reproducibility aids** — "Here's the data, analysis steps, and results" as a package
6. **Multi-language support** — Many researchers write in English as L2; paraphrase tool should understand Bangla/Hindi/Indonesian academic conventions

**Key insight:** Shothik already has STEM preprocessing (stemPreprocessor.ts) integrated into 3 tools. This is a REAL competitive advantage. Grammarly, Turnitin, and Cheatsheet have ZERO STEM awareness. Lean into this hard.

**Agreement with Agent 9:** Statistical analysis is critical. But also add: **data provenance tracking** — "This number came from WHO Report 2024, Table 3, Column D." Academic credibility requires citation of data sources.

---

### Agent 11: Competitive Intelligence Analyst

Competitive landscape:

| Competitor | Strength | Weakness | Shothik Advantage |
|-----------|----------|----------|-------------------|
| **Grammarly** | Grammar/writing polish | No STEM awareness, no data tools, $12/month | STEM preprocessing, integrated workflow, 1/4 the price |
| **Turnitin** | Gold standard plagiarism | Institutional only, $3-5/paper, no AI tools | Self-service, bundled with other tools, cheaper |
| **Overleaf** | LaTeX editing, collaboration | No AI writing tools, no data analysis | AI-powered writing + data pipeline |
| **QuillBot** | Paraphrasing | Limited features, no plagiarism check | Full suite, STEM-aware paraphrasing |
| **Google Sheets** | Full spreadsheet | No AI research, no academic features | AI-powered data population, STEM integration |
| **Cheatsheet** | AI spreadsheet, open source | No backend intelligence, no academic features | Real data sourcing, academic credibility |
| **Elicit/Semantic Scholar** | Research paper search | No writing/data tools, limited markets | Full pipeline from search to publication |
| **Typeset.io (SciSpace)** | Academic reading/writing | Expensive, limited data features | Broader tool suite, better pricing |

**Key insight:** Nobody combines ALL of: STEM-aware writing tools + AI data research + interactive spreadsheet + presentation generation + academic integrity checking. Shothik is the only platform attempting this full pipeline.

**Warning:** SciSpace and Elicit are well-funded ($20M+). Speed matters. Ship the integrated workflow before they expand their feature set.

---

### Agent 12: Platform Strategist

Ecosystem reinforcement model:

**Current state:** 8 standalone tools that don't talk to each other.
**Target state:** An integrated platform where each tool makes the others more valuable.

**Network effects to build:**
1. **Data flows between tools** — Research → Sheet → Presentation → Writing Studio
2. **Shared context** — AI remembers your topic across tools ("You're researching climate change in Bangladesh, so here are relevant templates/data/citations")
3. **Progressive engagement** — User starts with free paraphrase → discovers plagiarism check → tries Sheet AI → needs Writing Studio → becomes paying subscriber
4. **Content lock-in** — Your research data, saved spreadsheets, citation library, writing history — all in one platform makes switching painful

**The "1+1=3" opportunities:**
- Plagiarism Checker + AI Detector = "Is this text original AND human-written?" (already built)
- Sheet AI + Deep Research = "Find data and let me edit it" (to build)
- Presentation + Sheet AI = "Turn my data into slides" (to build)
- Writing Studio + Citation Library + Sheet AI = "Insert Table 3 with proper IEEE formatting" (Phase 5)

**Challenge to Agent 3:** The MVP shouldn't be Sheet AI alone. It should be the **Research → Sheet handoff** — that's where the platform value becomes visible.

---

### Agent 13: Localization Specialist

Market-specific needs:

**Bangladesh:**
- Primary language: Bangla/English mix in academic writing
- Key need: IEEE/ACM paper formatting (engineering-heavy universities)
- Payment: bKash/Nagad mobile payments essential (credit cards rare)
- Internet: 15-25 Mbps average, drops frequently
- University system: National University has 2M+ students — one partnership = massive scale

**India:**
- Primary language: English (academic), Hindi/regional for notes
- Key need: UGC-NET exam preparation, PhD thesis writing (300K+ PhD students)
- Payment: UPI (Google Pay, PhonePe) dominates
- Internet: 4G widespread but bandwidth-limited
- University system: Fragmented (1,000+ universities) — harder to do institutional sales

**Indonesia:**
- Primary language: Bahasa Indonesia/English
- Key need: Scopus-indexed journal publication (career advancement requires it)
- Payment: OVO, GoPay, bank transfer
- Internet: Variable, mobile-dominant

**Philippines:**
- Primary language: English (strong academic English)
- Key need: Thesis formatting, plagiarism checking (strict university policies)
- Payment: GCash dominates

**Key insight:** Mobile payment integration (bKash, UPI, GoPay, GCash) is MORE important than features for conversion. Students won't subscribe if they can't pay.

**Challenge to Agent 5:** Your pricing model assumes credit card payments. In Bangladesh, less than 5% of students have credit cards. Without bKash integration, you lose 95% of potential conversions.

---

### Agent 14: Mobile/Accessibility Expert

Device and access patterns:

- **65% mobile** (Android, mid-range: Samsung A-series, Xiaomi Redmi) with 6" screens
- **25% shared university lab computers** (Windows, Chrome, often outdated)
- **10% personal laptop** (usually low-end, 4GB RAM)

**Implications for Sheet AI:**
- FortuneSheet on a 6" screen is painful — tiny cells, fat-finger errors
- Need a **"Data Card View"** for mobile — shows data as scrollable cards, switches to grid on desktop
- **Offline capability** matters — save spreadsheet state locally, sync when online
- **Low-bandwidth mode** — don't load Shiki + KaTeX + FortuneSheet simultaneously; lazy-load everything

**Response to Agent 7:** Yes, we need a simplified mobile view. But don't build two separate UIs. Use responsive breakpoints: grid view on desktop/tablet, card view on phone. FortuneSheet supports touch but needs CSS overrides for larger hit targets.

**Challenge to Agent 6:** Bundle size of 400KB for FortuneSheet + 200KB for KaTeX + 300KB for Shiki = nearly 1MB of JavaScript. On a 3G connection in rural Bangladesh, that's 15-20 seconds of loading. We MUST code-split aggressively.

---

### Agent 15: Security/Compliance Analyst

Critical compliance considerations:

1. **Academic integrity paradox** — We sell both "AI humanizer" (makes AI text undetectable) and "AI detector." Universities could view us as enabling cheating.
2. **Data privacy (GDPR-adjacent)** — India's DPDP Act 2023 requires consent for data processing. Bangladesh's upcoming data protection law follows similar patterns.
3. **Research data sensitivity** — Students may upload unpublished research data to Sheet AI. We need clear data retention policies.
4. **Plagiarism report liability** — If our plagiarism checker says "0% plagiarism" and it's wrong, universities may hold us liable.
5. **API key security** — Multiple AI providers (Google, OpenAI, AWS) — key rotation and access control are essential.

**Recommendations:**
- Add clear disclaimers: "AI Detector and Plagiarism results are estimates, not guarantees"
- Implement data retention limits: auto-delete uploaded content after 30 days unless saved
- Position Humanize GPT as "writing improvement" not "AI evasion"
- SOC 2 Type 1 certification would unlock institutional sales

**Challenge to Agent 4:** "Powered by Shothik AI" watermarks on academic papers could be seen negatively by universities. Use subtle attribution instead.

---

### Agent 16: Content Strategist

Brand positioning:

**Current positioning:** "AI-powered digital marketing and content creation"
**Recommended pivot:** "The AI Research Assistant for South Asian Scholars"

**Why pivot:**
- "Digital marketing" and "academic writing" are different audiences with different needs
- The STEM tools are more defensible (STEM preprocessing, LaTeX awareness) than marketing automation
- Academic market has stronger network effects (university adoption)
- Marketing automation competes with Jasper, Copy.ai, HubSpot — heavily funded players

**Content strategy:**
- YouTube tutorials in Bangla/Hindi: "How to write an IEEE paper in 2 hours using Shothik AI"
- University workshop sponsorships: free workshops on academic writing
- Blog posts: "Top 10 free tools for PhD students in Bangladesh"
- Student ambassador program: campus reps get free Researcher tier

**Key insight:** The marketing automation features (Meta campaigns, ad publishing) feel like a different product. Consider separating them or de-emphasizing them in favor of the academic suite.

**Challenge to Agent 12:** Platform strategy says "more tools = more value." But spreading across marketing AND academics dilutes the brand. Pick one and dominate.

---

### Agent 17: Partnership/BD Analyst

Institutional partnership opportunities:

| Partner Type | Example | Value | Effort |
|-------------|---------|-------|--------|
| **National university systems** | Bangladesh National University (2M students) | Massive scale, credibility | High (government procurement) |
| **Private universities** | BRAC University, IIT Delhi, UP Diliman | Faster sales cycle, 5K-50K students each | Medium |
| **Academic publishers** | IEEE, Springer, Elsevier | Integration with submission systems | High (long sales cycle) |
| **Research funding bodies** | UGC India, BANBEIS Bangladesh | Credibility, subsidized access | Medium |
| **EdTech platforms** | Coursera, edX (local partners) | Distribution channel | Medium |
| **Mobile payment providers** | bKash, GCash, UPI | Enable payments, co-marketing | Low |

**Quick wins:**
1. Partner with 5 private universities in Bangladesh for free pilot (1 semester)
2. Create an "Institutional Dashboard" showing usage analytics per department
3. Offer "university admin" accounts that can manage student licenses
4. Generate case studies from pilot: "BRAC University saved 10,000 student-hours using Shothik AI"

**Agreement with Agent 13:** Mobile payment partnerships should happen IMMEDIATELY. No bKash = no Bangladesh market.

---

### Agent 18: AI/ML Specialist

Where AI adds real value vs. where it's overkill:

**High-value AI features:**
- **Research-to-data extraction** — AI reads papers and populates structured data (EXISTING in sheet-gen-service)
- **Smart paraphrasing with style preservation** — rephrase while keeping STEM terminology (EXISTING)
- **AI detection with confidence scores** — not just "AI/human" but "72% likely AI-generated" (EXISTING)
- **Statistical suggestion engine** — "Your data suggests using ANOVA, not t-test" (TO BUILD)
- **Citation auto-formatting** — AI converts raw references to any format (TO BUILD)

**Where AI is overkill:**
- AI for basic spreadsheet formulas — just use the built-in formula engine
- AI for file conversion (PDF→text) — use rule-based extractors (already built)
- AI for simple grammar fixes — rule-based catches 80% of issues cheaper
- AI for UI personalization — premature optimization for this market size

**Key insight:** Don't use Gemini/OpenAI API calls for things that can be done client-side. Each API call costs money. At $2.99/month subscription, you can afford about 200-300 Gemini calls per user per month before margins go negative.

**Challenge to Agent 9:** "Automated statistical analysis" sounds great but is computationally expensive if done via AI. Consider client-side libraries (simple-statistics, jStat) for basic stats, reserve AI for interpretation.

---

### Agent 19: Financial Analyst

Unit economics for South/Southeast Asian market:

**Cost structure per user/month:**
| Cost Item | Free User | Student ($2.99) | Researcher ($7.99) |
|-----------|-----------|-----------------|-------------------|
| AI API calls (Gemini/OpenAI) | $0.05 | $0.40 | $1.20 |
| Infrastructure (hosting, DB) | $0.02 | $0.05 | $0.08 |
| Bandwidth/CDN | $0.01 | $0.03 | $0.05 |
| Support | $0 | $0.05 | $0.10 |
| **Total cost** | **$0.08** | **$0.53** | **$1.43** |
| **Margin** | **-$0.08** | **$2.46 (82%)** | **$6.56 (82%)** |

**Key metrics to target:**
- Free-to-paid conversion: 4-5% (typical for EdTech in developing markets)
- Monthly churn: <8% for students, <3% for researchers
- Customer acquisition cost: <$2 (organic/referral-driven)
- LTV: $18 (Student, 6-month average tenure) / $72 (Researcher, 9-month tenure)
- Break-even: ~5,000 paying users

**Key insight:** The economics work IF acquisition is organic (word-of-mouth, university partnerships). Paid acquisition ($5-10 CAC via Google Ads) destroys the unit economics at $2.99/month.

**Agreement with Agent 4:** Growth MUST be organic. University partnerships and referral programs are the only sustainable acquisition channels at this price point.

---

### Agent 20: Risk Manager

Top 10 risks ranked by severity:

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|-----------|------------|
| 1 | **AI API cost overrun** — heavy users burn through Gemini credits | Critical | High | Hard limits per tier, client-side processing where possible |
| 2 | **Academic integrity backlash** — universities ban the tool for enabling cheating | Critical | Medium | Position as "writing improvement," add institutional controls |
| 3 | **Well-funded competitor launches** — SciSpace/Elicit adds spreadsheet features | High | Medium | Move fast, build switching costs (data + workflow lock-in) |
| 4 | **Scope creep** — trying to build Google Sheets + Overleaf + Grammarly + Turnitin | High | High | Strict MVP definition, say "no" to non-essential features |
| 5 | **Mobile performance** — 1MB JS bundle kills conversion on 3G | High | High | Aggressive code-splitting, lazy loading |
| 6 | **Payment integration delays** — bKash/UPI integration takes months | Medium | Medium | Start with Stripe, add local payments as fast-follow |
| 7 | **Backend service reliability** — 8 microservices, any can fail | Medium | Medium | Health checks, graceful degradation, error boundaries |
| 8 | **Data privacy regulation** — India DPDP Act compliance | Medium | Low | Implement consent flows, data retention policies |
| 9 | **Team bandwidth** — building too many features with limited engineering | High | High | Focus on Sheet AI upgrade first, defer other services |
| 10 | **Platform dependency** — heavy reliance on Google Gemini API | Medium | Low | Abstract AI provider, support OpenAI/Anthropic fallbacks |

**Key insight:** The #1 risk is scope creep. We have 8 backend services, 10+ frontend tools, and limited bandwidth. The biggest threat isn't competition — it's trying to do everything at once.

**Challenge to everyone:** Every agent here is suggesting features. But who's saying "don't build this"? We need a "NOT doing" list as much as a "doing" list.

---

## ROUND 2: Cross-Agent Debate

### Debate 1: MVP Scope (Agents 3, 9, 12, 20)

**Agent 9:** Statistical analysis should be in P0. It's the killer feature.  
**Agent 20:** Adding stats to P0 increases scope by 40%. Ship the spreadsheet first.  
**Agent 3:** Compromise — ship basic auto-stats (mean, median, count) as a sidebar that's auto-generated. No AI needed. Use a client-side library.  
**Agent 12:** The Research → Sheet handoff should also be in P0. Without it, Sheet AI is just a worse Google Sheets.  

**Consensus:** P0 = FortuneSheet + AI data population + basic auto-stats sidebar + Research handoff. Charts move to P1.

### Debate 2: Market Focus (Agents 1, 16, 4)

**Agent 16:** Drop marketing automation, focus on academics.  
**Agent 1:** Marketing automation is revenue NOW. Academic sales take 6-12 months.  
**Agent 4:** Keep marketing automation but don't invest more. Let it generate revenue while building the academic pipeline.  

**Consensus:** Marketing automation stays as-is (maintenance mode). All new development goes toward academic tools. Brand messaging pivots to "AI Research Assistant."

### Debate 3: Mobile Strategy (Agents 7, 14, 20)

**Agent 14:** 65% mobile. We can't ignore it.  
**Agent 7:** FortuneSheet on mobile is functional but not great.  
**Agent 20:** Building two UIs (desktop grid + mobile cards) doubles the work.  

**Consensus:** Ship desktop-first spreadsheet. Mobile gets a read-only "data card view" that shows results in a scrollable format. Full editing is desktop/tablet only. This serves 90% of use cases (students review data on phone, edit on lab computer).

### Debate 4: Pricing & Payments (Agents 5, 13, 19)

**Agent 13:** Without bKash/UPI, we lose 95% of the Bangladesh/India market.  
**Agent 5:** Stripe supports UPI already. bKash needs custom integration.  
**Agent 19:** Start with Stripe (covers cards + UPI). Add bKash/GCash in Month 2.  

**Consensus:** Launch with Stripe (covers international cards + Indian UPI). Prioritize bKash integration for Bangladesh within 60 days. GCash/OVO follow.

### Debate 5: Academic Integrity Positioning (Agents 15, 16, 10)

**Agent 15:** The "AI Humanizer" is a liability. Universities could ban us.  
**Agent 16:** Rebrand it as "Writing Style Enhancer" — same functionality, different framing.  
**Agent 10:** Researchers genuinely need to improve AI-assisted drafts to sound natural. It's legitimate.  

**Consensus:** Keep the tool but rebrand from "Humanize GPT" to "Style Refiner" or "Academic Voice." Add messaging: "Improve AI-assisted drafts to match your natural writing voice." Add institutional controls where admins can disable it.

---

## ROUND 3: Consolidated Recommendation Matrix

### Opportunity Scoring (1-5 scale)

| # | Opportunity | Impact | Feasibility | Market Demand | Revenue Potential | Strategic Alignment | **Total (25)** |
|---|-----------|--------|-------------|--------------|------------------|-------------------|-------------|
| 1 | Interactive Sheet AI (FortuneSheet + AI tools) | 5 | 4 | 5 | 4 | 5 | **23** |
| 2 | Research → Sheet data pipeline | 5 | 4 | 5 | 3 | 5 | **22** |
| 3 | Auto-stats sidebar (client-side) | 4 | 5 | 5 | 3 | 5 | **22** |
| 4 | Chart/graph generation | 4 | 4 | 4 | 3 | 4 | **19** |
| 5 | Sheet → Presentation handoff | 4 | 3 | 4 | 4 | 5 | **20** |
| 6 | Export (CSV/XLSX/PDF) | 3 | 5 | 4 | 3 | 3 | **18** |
| 7 | Mobile payment integration (bKash/UPI) | 3 | 3 | 5 | 5 | 3 | **19** |
| 8 | University institutional licensing | 4 | 2 | 4 | 5 | 4 | **19** |
| 9 | Writing Studio LaTeX engine (Phase 5) | 5 | 2 | 4 | 4 | 5 | **20** |
| 10 | Brand pivot to "AI Research Assistant" | 3 | 5 | 4 | 3 | 4 | **19** |
| 11 | Universal Dataset Schema (cross-service) | 4 | 3 | 2 | 2 | 5 | **16** |
| 12 | Payment system credits integration | 3 | 3 | 3 | 4 | 3 | **16** |
| 13 | Humanize GPT rebranding | 2 | 5 | 3 | 2 | 4 | **16** |
| 14 | Admin panel integration | 2 | 3 | 2 | 3 | 3 | **13** |
| 15 | ai-detector-v3 backend consolidation | 2 | 3 | 1 | 1 | 3 | **10** |

---

## FINAL CONSENSUS: Phased Implementation Plan

### ~~Phase A: Sheet AI Upgrade (Weeks 1-3) — Score: 23~~ [PARTIALLY DONE]
- ~~Embed FortuneSheet as interactive spreadsheet engine~~ DONE
- 6-8 AI cell tools (update, sort, clear, add/remove rows/columns) — Infrastructure exists, not tested
- AI selection awareness ("fix this column") — Not started
- Basic auto-stats sidebar (mean, median, count — client-side) — Not started
- Research → Sheet data handoff ("Send findings to Sheet") — Not wired
- Mobile: read-only card view — Not started

### ~~Phase B: Visualization & Cross-Tool Flow (Weeks 4-5) — Score: 20~~ [NOT STARTED]
- Chart/graph generation (Recharts — bar, line, pie, scatter)
- Sheet → Presentation handoff
- Export to CSV/XLSX
- Universal Dataset Schema for cross-service data flow

### ~~Phase C: Writing Studio & Academic Pipeline (Weeks 6-11) — Score: 20~~ [DONE — EXCEEDED SCOPE]
- ~~LaTeX engine integration (writing-studio repo — Phase 5)~~ DONE — Full 4-tab workspace built
- Insert tables/figures from Sheet AI into Writing Studio — Not wired
- ~~Citation auto-formatting across all tools~~ DONE
- ~~"Write → Check → Submit" complete workflow~~ DONE — Extended to "Write → Check → Publish → Earn"

### ~~Phase D: Monetization & Scale (Weeks 12-16) — Score: 19~~ [PARTIALLY DONE]
- Mobile payment integration (bKash, GCash) — Not started (planned Phase 4)
- Institutional licensing + admin dashboard — Admin review panel DONE; institutional licensing not started
- ~~Credit-based pricing implementation~~ — ToolPageWrapper usage tracking DONE
- University pilot programs (5 universities) — Not started (planned Phase 6)

---

## REVISED CONSENSUS: Updated Implementation Plan (February 23, 2026)

> The platform has evolved significantly since the original roundtable. The publishing platform was not anticipated but represents the most strategically significant addition. The revised plan reflects current reality and priorities.

**Phase Crosswalk** (this document → Strategic_Roadmap.md):
| This Document | Strategic_Roadmap Phase | Timeline |
|---|---|---|
| Phase A (Revised) | Phase 3: Platform Hardening | March-April 2026 |
| Phase B (Revised) | Phase 3: Platform Hardening (continued) | April 2026 |
| Phase C (Revised) | Phase 4: South Asian Market Entry | May-July 2026 |
| Phase D (Revised) | Phase 5: Growth & Advanced Features | Aug-Nov 2026 |
| Phase E (Revised) | Phase 6: Enterprise & Scale | Dec 2026-Jun 2027 |

### Phase A (REVISED): Platform Hardening — "Make It Launch-Ready" (March 2026)

| Priority | Task | Original Agent | Status |
|----------|------|----------------|--------|
| P0 | Get Convex production deploy key (stable URL) | NEW | Not Started |
| P0 | Configure Stripe API keys for live payouts | Agent 5, 19 | Not Started |
| P0 | Test publishing wizard end-to-end with real manuscript | NEW | Not Started |
| P0 | ONNX model conversion for AI Detector speed | Agent 18 | Not Started |
| P1 | Wire Writing Studio inline tool integrations (Paraphrase, Grammar, AI Detector) | Agent 12 | Not Started |
| P1 | Migrate Writing Studio projects from localStorage to Convex | NEW | Not Started |
| P2 | Production-harden Summarize tool | NEW | Not Started |

### Phase B (REVISED): Publishing Platform Activation (April 2026)

| Priority | Task | Details |
|----------|------|---------|
| P0 | Set up Google Play Books publisher account (Shothik UK company) | Required for actual book distribution |
| P0 | Activate PublishDrive distribution (purchase Pro plan) | 12 channels: Google Play, Amazon Kindle, Apple Books, Kobo, etc. |
| P1 | Sales data ingestion pipeline | Automated royalty tracking from Google Play |
| P1 | Author onboarding campaign ("First 100 Authors") | Free Enterprise plan for early publishers |
| P2 | KYC identity verification for payout accounts | Compliance requirement |

### Phase C (REVISED): South Asian Market Entry (May-July 2026)

| Priority | Task | Original Agent |
|----------|------|----------------|
| P0 | Regional pricing (BDT/INR/PKR) | Agent 1, 5, 13 |
| P0 | bKash mobile payment integration for Bangladesh | Agent 13 |
| P1 | YouTube tutorials in Bengali/Hindi ("How to publish your first book") | Agent 16 |
| P1 | UPI integration for India (via Stripe India) | Agent 5 |
| P2 | University WhatsApp/Telegram outreach campaign | Agent 4 |
| P2 | Student ambassador program | Agent 4 |

### Phase D (REVISED): Feature Expansion (Aug-Nov 2026)

| Priority | Task | Original Agent |
|----------|------|----------------|
| P1 | Research → Sheet data pipeline | Agent 3, 12 |
| P1 | Auto-stats sidebar (client-side: mean, median, correlation) | Agent 9 |
| P1 | Chart/graph generation (Recharts integration) | Agent 3 |
| P2 | Sheet → Presentation handoff | Agent 12 |
| P2 | Cross-lingual plagiarism detection | Agent 18 |
| P2 | AI Agents activation (Slides, Sheets, Deep Research) | NEW |
| P3 | Real-time collaboration in Writing Studio | Agent 7 |

### Phase E (REVISED): Enterprise & Institutional (Dec 2026-Jun 2027)

| Priority | Task | Original Agent |
|----------|------|----------------|
| P1 | SOC 2 Type 1 certification | Agent 15 |
| P1 | University pilot programs (5-10 universities) | Agent 17 |
| P2 | Institutional licensing + admin dashboard | Agent 4, 17 |
| P2 | Editorial system integrations (ScholarOne, OJS) | Agent 17 |
| P3 | Enterprise SSO + compliance reports | Agent 15 |

### NOT DOING LIST (Updated — Agent 20's legacy + new additions):
- Real-time collaborative editing — deferred to Phase D (P3)
- MCP protocol support — too technical for target market
- Voice input — nice-to-have, not essential
- Full Google Sheets feature parity — we're not Google
- New marketing automation features — maintenance mode only
- Custom AI model training — use existing Gemini/Google AI
- Humanize GPT rebranding — deferred; current name has recognition
- Browser extensions (Overleaf, Google Docs) — deferred to Phase D
- Separate "Shothik Academic" / "Shothik Creator" product tiers — single platform, tiered pricing instead

### Revenue Model Update

The roundtable originally modeled a single revenue stream (subscriptions). The platform now has **two revenue streams**:

| Stream | Model | Current State | 12-Month Target |
|--------|-------|---------------|-----------------|
| **Tool Subscriptions** | $7.99-25/mo per user | Live (ToolPageWrapper + UpgradeBanner) | $50K MRR |
| **Publishing Commission** | 15% of Google Play's 70% | Built, not yet active (needs Google Play account) | $2K MRR |

**Combined break-even:** ~3,000 paying subscribers OR ~2,000 subscribers + 200 active authors earning royalties.

**Agent 19's revised assessment:** Unit economics improved with dual revenue streams. Publishing commission has near-zero marginal cost (Convex auto-scales, admin review is manual), making it pure margin after platform investment.

---

*This analysis represents the consolidated view of 20 domain-specific perspectives, with disagreements resolved through structured debate. Updated February 23, 2026 to reflect actual platform progress, the addition of the publishing platform, and revised strategic priorities. The recommendations prioritize: (1) launch readiness (Convex production, Stripe), (2) publishing platform activation, (3) South Asian market entry, (4) feature expansion.*

**Cross-references:**
- [Strategic_Roadmap.md](Strategic_Roadmap.md) — Full platform roadmap (v2.0)
- [Service_Tracker.md](Service_Tracker.md) — 14-service platform audit
- [Publishing_Platform_Implementation_Plan.md](Publishing_Platform_Implementation_Plan.md) — Publishing platform details
