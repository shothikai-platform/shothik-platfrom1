# Shothik AI — Quality & Robustness Deep Analysis
**Date:** February 17, 2026  
**Scope:** Two-level analysis — Code Quality + AI Agent Quality

---

## LEVEL 1: CODE QUALITY & SYSTEM ROBUSTNESS

### 1.1 XSS Vulnerability — Critical Priority
**Problem:** ~30 uses of `dangerouslySetInnerHTML` without DOMPurify sanitization.  
**Risk:** Attackers inject malicious scripts through shared content, research markdown, grammar suggestions, blog posts, feature popups, pricing cards.

**Affected files:**
- `src/app/shared/[contentType]/[shareId]/page.jsx` (shared content — highest risk)
- `src/components/tools/research/ResearchContentWithReferences.jsx` (markdown → HTML)
- `src/components/research/ui/ResearchContent.jsx` (markdown → HTML)
- `src/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/GrammarIssueCard/index.jsx`
- `src/components/appliers/FeaturePopupApplier.jsx`
- `src/components/(pricing-page)/PricingCard.tsx`
- `src/components/(secondary-layout)/(blogs-page)/ArticleDetailClient.jsx`
- `src/components/(secondary-layout)/(blogs-page)/ArticleDetail.tsx`
- `src/components/presentation/SlidePreview.jsx`

**Fix:** Install DOMPurify, create `sanitizeHtml()` utility, wrap all `dangerouslySetInnerHTML` calls.

**Effort:** 4 hours

---

### 1.2 Route-Level Error & Loading States — High Priority
**Problem:** Zero `error.tsx` or `loading.tsx` files in the App Router. When any page crashes, users see a white screen with no recovery option.

**What's missing:**
- `src/app/error.tsx` — Global error boundary with retry button
- `src/app/loading.tsx` — Global loading skeleton
- `src/app/(primary-layout)/error.tsx` — Dashboard error boundary
- `src/app/(primary-layout)/loading.tsx` — Dashboard loading state
- `src/app/not-found.tsx` — Custom 404 page

**What exists (good):**
- `ErrorBoundary.tsx` component (used by some tools)
- `EditingErrorBoundary.tsx` (presentation editor)
- Individual tool pages use ErrorBoundary wrapping

**Fix:** Add route-level error.tsx and loading.tsx files with Gaia UI styling.

**Effort:** 3 hours

---

### 1.3 API Route Rate Limiting — High Priority
**Problem:** Frontend API routes (`/api/ai-cowriter`, `/api/latex/*`, `/api/sheet/*`, `/api/research/*`) have zero rate limiting. The AI Co-Writer route calls Gemini on every request — easily abusable.

**Fix:** Add a lightweight rate limiter middleware for API routes using in-memory Map with sliding window. No Redis needed since these are Next.js edge/serverless routes.

**Effort:** 3 hours

---

### 1.4 Service Retry Logic — Medium Priority
**Problem:** Regular API service calls (paraphrase, grammar, AI detector, plagiarism) don't retry on transient network failures. Only SSE streaming services have reconnection logic.

**What needs retry:**
- `paraphrase.service.ts`
- `grammar-checker.service.ts`
- `ai-detector.service.ts`
- `plagiarismService.ts`
- `writing-studio.service.ts`
- `auth.service.ts`

**Fix:** Create a `fetchWithRetry()` utility (exponential backoff, 2 retries, skip 4xx errors).

**Effort:** 2 hours

---

### 1.5 Large File Decomposition — Medium Priority
**Problem:** Several component files are extremely large, making them hard to maintain:

| File | Lines | Recommended Split |
|------|-------|------------------|
| GrammarCheckerContentSection | 1,983 | Editor + Results + Navigation + Settings |
| ParaphraseContend.jsx | 1,685 | Editor + Output + Socket + Toolbar + Settings |
| WritingStudioContent.jsx | 1,443 | Editor + Sidebar + Toolbar + Panels |
| SheetChatArea.jsx | 1,482 | Chat + Input + Messages + Actions |
| DeepResearchAgentShowcase | 1,740 | Sections into separate components |

**Fix:** Gradual decomposition — extract hooks, split UI sections into sub-components.

**Effort:** 8-12 hours (can be done incrementally)

---

### 1.6 Reduced Motion Support — Low Priority
**Problem:** Only 5 files respect `prefers-reduced-motion`. Many Framer Motion animations don't check this, which affects users with vestibular disorders.

**Fix:** Create a `useReducedMotion()` hook and a motion config that globally respects the setting.

**Effort:** 2 hours

---

### 1.7 Offline Resilience — Low Priority
**Problem:** No offline queue or recovery. If internet drops during paraphrasing, work is lost. `useConnectionState.js` exists but only tracks status — doesn't queue failed requests.

**Fix:** Add offline indicator banner + local draft auto-save for text inputs (localStorage).

**Effort:** 3 hours

---

## LEVEL 2: AI AGENT QUALITY & ROBUSTNESS

### 2.1 Paraphrase Quality Scoring System — HIGH IMPACT

**Current state:** No automated quality measurement. Users get output and manually judge if it's good.

**Proposed: Multi-Metric Quality Score (displayed to user)**

| Metric | What it measures | How to compute | Target |
|--------|-----------------|----------------|--------|
| **Semantic Similarity** | Meaning preserved? | BERTScore or sentence embedding cosine similarity | > 0.85 |
| **Lexical Diversity** | Sufficiently different words? | Jaccard distance between source/output word sets | 0.3 - 0.7 |
| **Fluency** | Natural-sounding? | GPT perplexity score or grammar error count | Low perplexity |
| **STEM Integrity** | LaTeX/code preserved? | Placeholder validation pass rate | 100% |
| **Academic Tone** | Appropriate register? | Formal word ratio + passive voice detection | Field-dependent |

**Implementation approach:**
1. **Client-side quick metrics** (instant, free):
   - Word overlap ratio (already exists in `EditableOutput.jsx` line 109)
   - Character-level edit distance
   - Sentence count preservation
   - STEM placeholder validation (already built in `stemPreprocessor.ts`)
   
2. **Server-side deep metrics** (async, on-demand):
   - BERTScore via API call
   - LLM-as-Judge rubric scoring (use existing Gemini integration)
   - Tone analysis (already have ToneTab component)

3. **Quality Dashboard for users:**
   - Overall quality score (0-100) shown after each paraphrase
   - Breakdown: Meaning (%), Originality (%), Fluency (%), STEM Safety (%)
   - Color coding: Green (>80), Yellow (60-80), Red (<60)
   - "Regenerate" button if score is low

**Effort:** 8-10 hours

---

### 2.2 Paraphrase Quality Assurance Checklist

**Pre-generation checks (client-side):**
- [ ] Input text length within limits
- [ ] Language detected correctly
- [ ] STEM regions identified and masked
- [ ] Freeze words identified
- [ ] Mode appropriate for content type

**Post-generation checks (automated):**
- [ ] Output length within 70-130% of input length
- [ ] All STEM placeholders preserved (unmask validation)
- [ ] No hallucinated content (semantic similarity > threshold)
- [ ] No repeated sentences
- [ ] Grammar error count ≤ input grammar error count
- [ ] Freeze words unchanged in output
- [ ] No "as an AI" or model artifacts in output
- [ ] Appropriate academic tone maintained

**Quality gates:**
- If any critical check fails → auto-retry with adjusted prompt
- If 2+ retries fail → serve best attempt + warn user
- Log all quality failures for prompt improvement

---

### 2.3 Response Time Optimization — HIGH IMPACT

**Current latency breakdown (estimated):**
```
User types text:     0ms
Language detection:  ~50ms (client-side)
STEM detection:      ~100ms (client-side)  
Socket emit:         ~50ms
Network to backend:  ~200ms
Backend processing:  ~100ms
DeepSeek API call:   ~2000-5000ms  ← BOTTLENECK
Backend post-proc:   ~100ms
Socket response:     ~200ms
UI render:           ~100ms
────────────────────────────────
Total:               ~3-6 seconds
```

**Optimization strategies:**

| Strategy | Latency Reduction | Implementation |
|----------|-------------------|----------------|
| **Streaming tokens** | Perceived: -80% | Stream DeepSeek tokens via Socket.io as they arrive |
| **Redis cache hits** | -90% (on hit) | 4-layer cache (already planned) |
| **Prompt caching** | -40% on prompt tokens | Shared prefix optimization (already planned) |
| **Parallel pre-processing** | -200ms | Run STEM detection + language detection + freeze word analysis simultaneously |
| **Optimistic UI** | Perceived: -50% | Show "processing" skeleton immediately, animate text appearance |
| **Predictive caching** | -90% (on hit) | Pre-cache common academic phrases and STEM patterns |
| **Smaller model for simple tasks** | -60% | Route simple rewording to faster model, complex academic to full model |

**Quick wins (frontend-only, can do now):**
1. Skeleton loading animation while waiting for response
2. Typing/streaming animation for output text (appear word-by-word)
3. Parallel client-side processing (STEM + language + freeze simultaneously)
4. Show partial results immediately (sentence-by-sentence as they arrive)

**Effort:** 6 hours (frontend), 8 hours (backend streaming)

---

### 2.4 Agent Robustness Improvements

**A. Graceful Degradation Chain (already planned, but needs frontend support):**
```
DeepSeek Primary → Gemini Fallback → Stale Cache → Partial Result → Error Message
```

**Frontend needs:**
- Model indicator badge showing which model served the response
- "Served from cache" indicator when stale cache is used
- Degraded mode banner: "Using backup system — quality may vary"
- Automatic retry button when degraded

**B. Self-Healing Prompts:**
When paraphrase quality score is low, automatically:
1. Retry with adjusted temperature (lower for more conservative)
2. Retry with explicit quality constraints in prompt
3. Try alternative mode (e.g., Standard → Fluency)
4. Fall back to sentence-by-sentence paraphrasing

**C. Context-Aware Mode Selection:**
Automatically suggest the best mode based on content:
- Detected LaTeX → suggest "Academic" mode
- Code blocks found → suggest "Technical" mode  
- Informal text → suggest "Fluency" mode
- Long paragraphs → suggest "Concise" mode

**Effort:** 6 hours

---

### 2.5 LLM-as-Judge Quality Evaluation System

**Use existing Gemini integration to score paraphrase quality:**

```
System prompt for quality judge:

You are an academic writing quality evaluator. Score this paraphrase on 4 dimensions (1-5 each):

1. MEANING PRESERVATION: Does the paraphrase convey the same meaning as the original?
2. ORIGINALITY: Is the paraphrase sufficiently different in wording and structure?
3. FLUENCY: Is the paraphrase grammatically correct and natural-sounding?
4. ACADEMIC TONE: Is the language appropriate for academic/research writing?

Original: {original_text}
Paraphrase: {paraphrased_text}

Return JSON: { "meaning": N, "originality": N, "fluency": N, "tone": N, "overall": N, "feedback": "..." }
```

**When to trigger:**
- On-demand when user clicks "Check Quality" button
- Automatically for paid users after each paraphrase
- Sampling: randomly for 10% of free-tier paraphrases (for monitoring)

**Effort:** 4 hours

---

### 2.6 Research Agent Improvements

**Current state:** Deep research streams via Socket.io with Vertex AI grounding.

**Missing features:**
1. **Source credibility scoring** — Not all sources are equal. Academic papers (Semantic Scholar) should rank higher than blog posts.
2. **Citation completeness check** — Verify all claims in research output have citations.
3. **Contradiction detection** — Flag when different sources contradict each other.
4. **Research depth indicator** — Show how many unique sources were consulted, academic vs. web ratio.
5. **Follow-up question suggestions** — After research completes, suggest deeper dives.

**Effort:** 10 hours

---

### 2.7 Presentation Agent Improvements

**Current state:** SSE-based slide generation with editing capabilities.

**Missing features:**
1. **Template quality validation** — Check generated slides against design principles (font sizes, contrast ratios, content density).
2. **Content coherence check** — Ensure slide flow tells a logical story.
3. **Speaker notes auto-generation** — Generate talking points for each slide.
4. **Accessibility check** — Color contrast, alt text for images, font size minimums.

**Effort:** 8 hours

---

### 2.8 Sheet AI Improvements

**Current state:** FortuneSheet with streaming chat-based data generation.

**Missing features:**
1. **Data validation** — Check generated data for consistency (types, ranges, nulls).
2. **Formula verification** — Validate generated formulas actually compute correctly.
3. **Chart suggestions** — Based on data patterns, suggest appropriate chart types.
4. **Statistical summary** — Auto-generate mean/median/std for numerical columns.

**Effort:** 6 hours

---

## PRIORITY MATRIX

### Must-Do (Critical for production quality)

| # | Item | Level | Effort | Impact |
|---|------|-------|--------|--------|
| 1 | XSS sanitization (DOMPurify) | Code | 4h | Security |
| 2 | Paraphrase quality scoring (client-side) | Agent | 4h | User trust |
| 3 | Route error/loading states | Code | 3h | UX reliability |
| 4 | API route rate limiting | Code | 3h | Cost protection |
| 5 | Response time optimistic UI | Agent | 3h | Perceived speed |

### Should-Do (Significant improvement)

| # | Item | Level | Effort | Impact |
|---|------|-------|--------|--------|
| 6 | LLM-as-Judge quality evaluation | Agent | 4h | Quality assurance |
| 7 | Streaming token display | Agent | 6h | Perceived speed |
| 8 | Service retry logic | Code | 2h | Reliability |
| 9 | Self-healing prompts | Agent | 4h | Output quality |
| 10 | Context-aware mode suggestion | Agent | 3h | User guidance |

### Could-Do (Polish & differentiation)

| # | Item | Level | Effort | Impact |
|---|------|-------|--------|--------|
| 11 | Graceful degradation UI | Agent | 3h | Transparency |
| 12 | Research source credibility | Agent | 5h | Research quality |
| 13 | Large file decomposition | Code | 10h | Maintainability |
| 14 | Offline resilience | Code | 3h | Reliability |
| 15 | Reduced motion support | Code | 2h | Accessibility |

---

## COMPETITIVE ADVANTAGE FEATURES

These would differentiate Shothik AI from Quillbot in the STEM market:

1. **STEM Quality Score** — No competitor shows how well LaTeX/code was preserved
2. **Academic Tone Meter** — Visual indicator of formality level (unique for researchers)
3. **Self-Healing Paraphrase** — Auto-retry when quality is low (competitors just serve bad output)
4. **Model Transparency** — Show which AI model served the response (builds trust)
5. **Paraphrase Confidence Score** — Per-sentence confidence (highlight uncertain rewrites)
6. **STEM-Aware Mode Auto-Select** — Automatically picks the best mode for academic content

---

## RECOMMENDED IMPLEMENTATION ORDER

**Week 1:** Items 1-5 (Must-Do) — 17 hours
**Week 2:** Items 6-10 (Should-Do) — 19 hours  
**Week 3:** Items 11-15 (Could-Do) — 23 hours

Total: ~59 hours over 3 weeks
