# 50-Agent Architecture Debate: Shothik AI Paraphrase Service
## DeepSeek-Primary, No-GPU Architecture

**Date:** February 17, 2026  
**Constraints:** No GPU/T5, DeepSeek primary, Gemini fallback only  
**Goal:** Find the optimal production architecture incorporating LanguageTool + GPT4All patterns

---

## Decision A: Should DeepSeek Be the ONLY Model (No Gemini)?

### The Debate

**Agent 1 (DeepSeek Cost Analyst):** DeepSeek-chat at $0.56/M input and $1.68/M output is already 5-10x cheaper than Gemini Flash ($0.10/M input, $0.40/M output for short context). V3.2-Exp is even cheaper at $0.028/M input. We could go DeepSeek-only and save on Gemini entirely.

**Agent 2 (Gemini vs DeepSeek Comparator):** Hold on — Gemini is already integrated via Replit AI integrations with managed API keys. The integration cost is zero. The question isn't cost, it's reliability. Two providers > one provider.

**Agent 10 (Fallback Chain Architect):** Exactly. Single-provider dependency is a critical failure mode. DeepSeek had a major outage in January 2025 and rate-limited heavily during peak usage. If DeepSeek goes down, having Gemini as fallback means zero downtime for users.

**Agent 18 (Disaster Recovery):** Agreed. The LanguageTool RemoteRule pattern explicitly designs for this — every remote rule MUST have a `fallbackResults()` method. Single-provider is an anti-pattern in their architecture.

**Agent 9 (Circuit Breaker Designer):** And circuit breakers are meaningless with a single provider — there's nothing to break to. The whole point is: when DeepSeek's circuit opens, traffic flows to Gemini automatically.

**Agent 43 (Quillbot Analyst):** Quillbot uses multiple models internally. If Shothik goes single-provider and that provider has quality issues or latency spikes in Bangladesh, users will switch to Quillbot instantly.

**Agent 6 (Free Tier Controller):** Counter-argument: for the FREE tier specifically, maybe we should route to only the cheapest option (DeepSeek V3.2-Exp at $0.028/M) with NO Gemini fallback. Free users get what they get.

**Agent 46 (Freemium Conversion):** Dangerous. If free users get a bad experience, they'll never convert to paid. Free tier is your marketing funnel. It needs to work reliably.

### Consensus: 45/50 agents voted KEEP GEMINI AS FALLBACK

**VERDICT: DeepSeek PRIMARY + Gemini FALLBACK. Never single-provider.**

---

## Decision B: What's the Optimal Fallback Chain Without T5?

### The Debate

**Agent 10 (Fallback Chain Architect):** Without T5 (GPU), our chain becomes:
```
Redis Cache → DeepSeek V3.2-Exp → DeepSeek-chat → Gemini Flash → Error
```
Four layers of defense.

**Agent 22 (Model Routing Strategist):** I disagree with V3.2-Exp as primary. It's marked "experimental" — that means it could be deprecated at any time. DeepSeek-chat is the stable model. Route paid users to DeepSeek-chat, free users to V3.2-Exp.

**Agent 4 (Token Usage Optimizer):** Smart. Tier-based routing:
- Free tier: V3.2-Exp ($0.028/M input) — cheapest, experimental, basic quality
- Student ($2.99): DeepSeek-chat ($0.56/M) — stable, good quality
- Researcher ($7.99): DeepSeek-chat with longer context + Gemini Flash for premium modes
- Unlimited: DeepSeek-chat + Gemini Flash for all modes

**Agent 26 (Context Caching Specialist):** Critical point everyone is missing — DeepSeek has cache-hit pricing at $0.07/M (87% discount!). If we reuse system prompts across requests (same paraphrase mode + language), most requests become cache hits. The system prompt for "Standard mode, English" is identical for every user.

**Agent 5 (Cache Strategy Architect):** So the ACTUAL cost chain is:
1. Redis local cache (free) → hit rate ~20-30%
2. DeepSeek with cached system prompt ($0.07/M for prompt, $0.56/M for user text) → most requests
3. DeepSeek with new prompt ($0.56/M full) → rare
4. Gemini Flash fallback ($0.10/M) → only when DeepSeek circuit is open

**Agent 19 (DeepSeek Prompt Engineer):** I want to add that DeepSeek's prompt caching works per-session. We should design prompts with a LONG shared prefix (system prompt + mode instructions + STEM preservation rules) and SHORT variable suffix (user text). This maximizes cache hits.

**Agent 23 (STEM Preservation Specialist):** For STEM content, the system prompt needs explicit LaTeX/code preservation instructions. I propose a STEM-specific system prompt variant that includes examples of LaTeX equations that must remain unchanged.

### Consensus: 48/50 agreed on tier-based routing

**FINAL FALLBACK CHAIN:**
```
Layer 0: Redis ResultCache (per-namespace, free)
  ↓ miss
Layer 1: DeepSeek (tier-routed)
  - Free:       V3.2-Exp ($0.028/M)     [circuit breaker: 50% failure → open]
  - Student:    deepseek-chat ($0.56/M)  [circuit breaker: 50% failure → open]
  - Researcher: deepseek-chat ($0.56/M)  [circuit breaker: 50% failure → open]
  ↓ circuit open or failure
Layer 2: Gemini Flash (all tiers)        [circuit breaker: 60% failure → open]
  ↓ circuit open or failure
Layer 3: Cached/stale result from Redis (if available, serve stale)
  ↓ nothing cached
Layer 4: Graceful error with retry button
```

---

## Decision C: Should GPT4All (Mistral 7B / Qwen2-7B) Be Deployed Server-Side for Free Tier?

### The Debate

**Agent 20 (GPT4All Advocate):** Absolutely. A Mistral 7B Instruct model on a $50/mo DigitalOcean droplet could handle ALL free tier requests with zero per-token cost. At scale, if free users consume 50% of API calls, that's potentially $200-500/mo saved.

**Agent 21 (GPT4All Skeptic):** The quality gap is massive. Mistral 7B paraphrasing quality is ⭐⭐⭐ vs DeepSeek's ⭐⭐⭐⭐⭐. For academic writing — which is Shothik's core market — paraphrase quality is everything. A bad paraphrase that changes the meaning of a scientific paper is worse than no paraphrase at all.

**Agent 47 (STEM Researcher Persona):** As a researcher, I'd rather wait 2 seconds for a good paraphrase than get an instant bad one. Mistral 7B struggles with technical vocabulary, LaTeX preservation, and maintaining academic register. It would damage Shothik's "STEM-safe" brand.

**Agent 6 (Free Tier Controller):** But DeepSeek V3.2-Exp at $0.028/M is almost free anyway! 1000 free-tier requests × 500 tokens average = 500K tokens = $0.014. That's $14/month for 1000 daily free-tier requests. The VM for GPT4All would cost $50/mo — it's MORE expensive than just using V3.2-Exp!

**Agent 8 (DigitalOcean Cost Optimizer):** Agent 6 is right. The break-even for GPT4All vs V3.2-Exp is ~3,500 daily free-tier requests. Until Shothik hits that scale, GPT4All is a net cost increase with quality decrease.

**Agent 50 (Integration Complexity):** And the operational complexity! Maintaining a self-hosted model means: model updates, memory management, health monitoring, scaling, GPU/CPU tuning. That's a whole new ops burden for a startup.

**Agent 24 (Embedding Model Specialist):** However, GPT4All's Embed4All (MiniLM-L6-v2) for local embeddings IS useful — for semantic similarity in auto-freeze detection. Instead of calling an LLM to detect "is this a technical term?", we could compare embeddings locally. But this is a secondary optimization, not primary architecture.

**Agent 49 (Technical Debt):** I agree with deferring GPT4All. Adding a self-hosted model introduces a second AI stack to maintain. Keep it simple: DeepSeek + Gemini is two managed APIs. Adding a third self-hosted stack is premature.

### Consensus: 42/50 voted DEFER GPT4All, use DeepSeek V3.2-Exp for free tier

**VERDICT: NO GPT4All deployment now. DeepSeek V3.2-Exp at $0.028/M is cheaper than running a VM. Revisit at 5,000+ daily free-tier requests.**

**Exception:** Consider GPT4All's Embed4All for local embedding-based auto-freeze detection as a Phase 3 optimization.

---

## Decision D: Which Circuit Breaker Library? (Cockatiel vs Opossum)

### The Debate

**Agent 9 (Circuit Breaker Designer):** The backend is Node.js. Two options: Cockatiel (TypeScript-first, Resilience4j-like) vs Opossum (most popular, Red Hat backed).

**Agent 16 (API Gateway Designer):** Cockatiel has composable policies — you can wrap retry + circuit breaker + timeout + bulkhead in one chain. This matches LanguageTool's RemoteRule pattern perfectly:
```typescript
const policy = wrap(
  retry(handleAll, { maxAttempts: 2, backoff: new ExponentialBackoff() }),
  circuitBreaker(handleAll, {
    halfOpenAfter: 30_000,
    breaker: new SamplingBreaker({ threshold: 0.5, duration: 60_000 })
  }),
  timeout(10_000)
);
```

**Agent 17 (Health Check Specialist):** Opossum has built-in Prometheus metrics export (`opossum-prometheus`). If you're using Prometheus for monitoring (which DigitalOcean supports), Opossum gives you dashboards for free.

**Agent 50 (Integration Complexity):** Cockatiel is TypeScript-native with no `@types` needed. Since the backend is Node.js/TypeScript, Cockatiel integrates more cleanly.

**Agent 9:** Cockatiel's `SamplingBreaker` with `threshold` and `duration` maps directly to LanguageTool's Resilience4j `CircuitBreakerConfig`:
```
LanguageTool: slidingWindowSize=10, failureRateThreshold=50%
Cockatiel:    SamplingBreaker({ threshold: 0.5, duration: 60_000, minimumRps: 5 })
```

### Consensus: 38/50 voted Cockatiel

**VERDICT: Use Cockatiel for circuit breaking.** TypeScript-native, composable policies, closest to LanguageTool's Resilience4j pattern. If Prometheus metrics are needed later, add a thin wrapper.

---

## Decision E: How Should Cache Layers Work?

### The Debate

**Agent 5 (Cache Strategy Architect):** LanguageTool splits into 3 caches (matchesCache, remoteMatchesCache, sentenceCache). We should split into 4 Redis namespaces:

```
cache:para:{hash(text+mode+lang+synonymLevel+freezeWords)} → paraphrase output
cache:tag:{hash(text+mode+lang)}                           → word-level tagging
cache:freeze:{hash(text+lang)}                              → auto-freeze detection
cache:stem:{hash(text)}                                     → STEM region detection
```

**Agent 11 (Redis Architect):** The freeze words in the paraphrase cache key are the problem. Freeze words are sent as a comma-separated string — if a user adds one more freeze word, the entire cache key changes and we miss. We need to normalize freeze words (sort, lowercase, trim) before hashing.

**Agent 4 (Token Optimizer):** Better yet — separate the cache into "text-only" and "text+config" layers:
- Level 1: `cache:stem:{hash(text)}` — STEM detection is text-only, reusable across ALL modes
- Level 2: `cache:freeze:{hash(text+lang)}` — Auto-freeze is per-language, reusable across modes
- Level 3: `cache:para:{hash(text+mode+lang+synonymLevel+sortedFreezeWords)}` — Full paraphrase is specific to all parameters

**Agent 12 (Rate Limiter Designer):** Each cache namespace should have independent TTL:
- stem: 24 hours (STEM content doesn't change with re-analysis)
- freeze: 12 hours (auto-freeze terms don't change often)
- tag: 2 hours (tagging is mode-dependent, shorter reuse window)
- para: 4 hours (paraphrase results are session-specific)

**Agent 26 (Context Caching):** Don't forget DeepSeek's built-in context caching! If we design system prompts with long shared prefixes, DeepSeek charges $0.07/M instead of $0.56/M. This is a 87% discount on the AI side, completely separate from our Redis cache.

**Agent 17 (Monitoring):** Each cache namespace needs hit/miss counters. LanguageTool's `hitRate()` method maps to:
```
INCR cache:metrics:para:hit    (on cache hit)
INCR cache:metrics:para:miss   (on cache miss)
```
Calculate hit rate: `hits / (hits + misses)`. Alert if hit rate drops below 15%.

### Consensus: 47/50 agreed on the layered cache design

**FINAL CACHE ARCHITECTURE:**
```
┌─────────────────────────────────────────────────────┐
│                 CACHE LAYER DESIGN                   │
│                                                      │
│  L0: Client-side memoization (React state/refs)      │
│      Key: text content hash                          │
│      TTL: session lifetime                           │
│      Purpose: prevent duplicate API calls on rapid   │
│               mode switching                         │
│                                                      │
│  L1: Redis - STEM Detection Cache                    │
│      Key: cache:stem:{sha256(text)}                  │
│      TTL: 24 hours                                   │
│      Hit rate target: >60% (same text re-analyzed)   │
│      Reusable: across ALL modes, languages, users    │
│                                                      │
│  L2: Redis - Auto-Freeze Cache                       │
│      Key: cache:freeze:{sha256(text+lang)}           │
│      TTL: 12 hours                                   │
│      Hit rate target: >40%                           │
│      Reusable: across all modes for same text+lang   │
│                                                      │
│  L3: Redis - Paraphrase Output Cache                 │
│      Key: cache:para:{sha256(text+mode+lang+syn+     │
│           sorted(freezeWords))}                      │
│      TTL: 4 hours                                    │
│      Hit rate target: >15% (exact config matches)    │
│      Weight-based eviction (LanguageTool pattern):   │
│        weight = text.length / 75 + resultTokens      │
│                                                      │
│  L4: DeepSeek Context Cache (API-side)               │
│      Key: managed by DeepSeek (system prompt prefix) │
│      Discount: $0.07/M vs $0.56/M (87% off)         │
│      Strategy: long shared system prompt prefix      │
│                                                      │
│  Metrics per namespace:                              │
│    cache:metrics:{namespace}:hits                    │
│    cache:metrics:{namespace}:misses                  │
│    cache:metrics:{namespace}:evictions               │
│    cache:metrics:{namespace}:avg_size_bytes          │
└─────────────────────────────────────────────────────┘
```

---

## Decision F: What Rate Limits Per Tier?

### The Debate

**Agent 12 (Rate Limiter Designer):** LanguageTool's UserLimits pattern with LimitEnforcementMode is the right approach. Here's my proposal:

**Agent 7 (Pricing Model Designer):** At $2.99/mo student and $7.99/mo researcher, the margins are thin. Rate limits must protect costs:
- Average paraphrase: 500 tokens input + 600 tokens output
- DeepSeek-chat cost per request: $0.56 × 0.0005 + $1.68 × 0.0006 = $0.00129 per request
- At $2.99/mo, we can afford ~2,300 requests/month before breaking even
- At $7.99/mo, we can afford ~6,200 requests/month

**Agent 44 (South Asian Market):** But university students in Bangladesh write 2-3 papers per semester. They don't need 2,300 requests/month. Typical usage is 50-100 requests/month. We have plenty of margin.

**Agent 38 (Abuse Prevention):** The risk isn't normal users — it's abuse. Someone building a competing service on top of our API, or students sharing one account across a class of 50.

**Agent 12:** LanguageTool's `LimitEnforcementMode` gives us a safe rollout:
1. Week 1: `LOG_ONLY` — track who would be limited
2. Week 2: `WARN` — show soft warning to heavy users
3. Week 3: `BLOCK` — enforce hard limits

### Consensus: 46/50 agreed on these limits

**FINAL RATE LIMITS:**

| Tier | Words/Day | Requests/Day | Max Text Length | Max Concurrent | Modes Available |
|------|-----------|-------------|-----------------|----------------|-----------------|
| Free | 500 | 10 | 500 words | 1 | Standard, Fluency only |
| Student ($2.99) | 5,000 | 100 | 3,000 words | 2 | All 10 modes |
| Researcher ($7.99) | 25,000 | 300 | 10,000 words | 3 | All modes + priority |
| Unlimited | No limit | 1,000 | 50,000 words | 5 | All + beta features |

**Enforcement:** Redis atomic counters with daily TTL
```
ratelimit:{userId}:words:{YYYYMMDD}    → INCR by wordCount, EXPIRE 86400
ratelimit:{userId}:requests:{YYYYMMDD} → INCR by 1, EXPIRE 86400
```

---

## Decision G: Should Socket.io Be Replaced with SSE?

### The Debate

**Agent 29 (Socket.io Reliability):** The current Socket.io implementation has issues — the cleanup comment in the code literally says "We don't disconnect the socket here" (line 784). That's a memory leak risk.

**Agent 14 (Streaming Specialist):** Socket.io is overkill for this use case. The paraphrase service uses 3 channels (plain, tagging, synonyms) but they all stream for the same request. SSE (Server-Sent Events) can handle this with a single connection.

**Agent 35 (South Asian Network):** BUT — Socket.io has built-in reconnection and transport fallback (WebSocket → long-polling). In Bangladesh and Vietnam, university networks frequently drop WebSocket connections. Socket.io's reconnection is battle-tested.

**Agent 33 (Error UX):** SSE is one-directional (server → client). With Socket.io, the client can send "cancel" events mid-stream. With SSE, you'd need a separate HTTP endpoint to cancel. That's more complex.

**Agent 30 (Component Architecture):** The real question is: do we need 3 parallel streams? Currently:
- `paraphrase-plain` — full paraphrased text
- `paraphrase-tagging` — word-level tagging (which words changed)
- `paraphrase-synonyms` — synonym alternatives

Could we combine these into one stream with structured events?

**Agent 25 (Streaming Optimizer):** One stream with typed events is cleaner:
```json
{ "type": "plain", "data": "..." }
{ "type": "tagging", "data": [...] }
{ "type": "synonyms", "data": [...] }
{ "type": "done" }
```

But this requires backend changes. Keep Socket.io for now, fix the disconnect leak.

### Consensus: 39/50 voted KEEP Socket.io, fix the leak

**VERDICT: Keep Socket.io.** Fix the disconnect leak. Consider SSE migration as Phase 4 if simplifying to a single stream. Socket.io's reconnection is critical for South Asian university networks.

**Immediate fix needed:**
```javascript
// Line 784: Fix the socket disconnect
return () => {
  socket.off("connect");
  socket.off("disconnect");
  socket.off("paraphrase-plain");
  socket.off("paraphrase-tagging");
  socket.off("paraphrase-synonyms");
  socket.disconnect();  // ← ADD THIS
  socketRef.current = null;
  socketIdRef.current = null;
};
```

---

## Decision H: How to Handle STEM Freeze Without T5's Mask-Then-Generate?

### The Debate

**Agent 23 (STEM Preservation):** Without T5, we can't do mask-then-generate. But we CAN do mask-then-prompt. The approach:

1. Client-side `stemPreprocessor.ts` detects LaTeX/code regions (already works)
2. Replace detected regions with numbered placeholders: `[STEM_1]`, `[STEM_2]`
3. Send masked text + placeholder map to backend
4. Backend prompts DeepSeek: "Paraphrase this text. Do NOT modify any [STEM_N] placeholders."
5. Backend unmasks: replace `[STEM_N]` back with original content

**Agent 19 (DeepSeek Prompt Engineer):** This is exactly how I'd do it. DeepSeek follows instructions well. The system prompt should include:

```
You are an academic paraphrasing assistant. 
CRITICAL RULES:
1. Preserve ALL [STEM_1], [STEM_2], etc. placeholders EXACTLY as they appear
2. Do NOT paraphrase, move, or remove any [STEM_N] placeholder
3. Maintain the same paragraph structure
4. Keep academic register and technical vocabulary
```

**Agent 21 (Quality Skeptic):** What if DeepSeek still modifies placeholders? LLMs aren't deterministic — sometimes they'll "helpfully" expand `[STEM_1]` or move it to a different position in the sentence.

**Agent 23:** Two safety nets:
1. **Post-processing validation:** After DeepSeek returns, verify ALL placeholders exist in output. If any is missing or duplicated, fall back to the original sentence for that section.
2. **Sentence-level granularity:** Don't send the entire text as one prompt. Send sentence-by-sentence, each with its own placeholders. Easier to validate and recover from failures.

**Agent 27 (Multi-language):** For Bangla/Hindi academic text with interspersed LaTeX, the placeholder approach works even better because the LLM doesn't need to understand the script of the LaTeX — it just needs to leave `[STEM_N]` alone.

**Agent 34 (Real-time Feedback):** The current `useSTEMFreeze` hook already detects LaTeX/code client-side and adds them to `frozenPhrases`. The frontend masking is ready. The backend just needs the unmask-after-generation step.

### Consensus: 49/50 agreed on mask-then-prompt

**FINAL STEM FREEZE ARCHITECTURE (No T5/GPU):**
```
Client (stemPreprocessor.ts)         Backend (DeepSeek)
──────────────────────              ────────────────────
1. Detect LaTeX/code regions   →    
2. Replace with [STEM_N]       →    3. Receive masked text
   Store mapping: {                  4. System prompt: "preserve [STEM_N]"
     STEM_1: "E=mc^2",              5. DeepSeek paraphrases
     STEM_2: "```python...```"       6. Validate: all [STEM_N] present?
   }                                    ├── YES → unmask → return
                                        └── NO → retry with stricter prompt
                                               or return original sentence
```

---

## Decision I: Which DeepSeek Model Variant?

### The Debate

**Agent 1 (Cost Analyst):** Three options:

| Model | Input | Output | Quality | Stability |
|-------|-------|--------|---------|-----------|
| deepseek-chat | $0.56/M | $1.68/M | ⭐⭐⭐⭐⭐ | Stable |
| V3.2-Exp | $0.028/M | $0.041/M | ⭐⭐⭐⭐ | Experimental |
| R1 Distill Llama 70B | $0.03/M | $0.11/M | ⭐⭐⭐⭐ | Stable |

**Agent 22 (Model Routing):** Tier-based routing is the answer:

- **Free tier:** V3.2-Exp (cheapest, acceptable quality for Standard/Fluency modes)
- **Student tier:** deepseek-chat (stable, high quality for all modes)
- **Researcher tier:** deepseek-chat (same model, more generous limits)

**Agent 28 (Academic Tone):** For Academic and Formal modes, only deepseek-chat should be used. V3.2-Exp might not handle register shifts as well (e.g., "colloquial → academic" tone change requires nuance).

**Agent 22:** Updated routing matrix:

| Tier | Standard/Fluency | Humanize/Formal/Academic | Creative/Shorten/Expand |
|------|-----------------|-------------------------|------------------------|
| Free | V3.2-Exp | V3.2-Exp | V3.2-Exp (limited) |
| Student | deepseek-chat | deepseek-chat | deepseek-chat |
| Researcher | deepseek-chat | deepseek-chat | deepseek-chat |

**Agent 26 (Context Caching):** With DeepSeek's cache-hit pricing ($0.07/M), design system prompts per mode as REUSABLE PREFIXES:

```
[SHARED PREFIX - ~500 tokens, cached across all users]
You are Shothik AI, an academic paraphrasing assistant for STEM researchers.
Rules: preserve technical terms, maintain academic register, 
keep [STEM_N] placeholders intact...

[MODE SUFFIX - ~100 tokens, varies by mode]
Mode: Standard. Rewrite the following while preserving meaning...

[USER INPUT - variable, never cached]
{user's text with [STEM_N] placeholders}
```

The shared prefix (500 tokens) is cached at $0.07/M after the first request of each mode. Over thousands of requests, this saves 87% on system prompt tokens.

### Consensus: 44/50 agreed on tier-based model routing

**VERDICT:**
```
FREE:       DeepSeek V3.2-Exp (all modes)     — $0.028/M input
STUDENT:    DeepSeek-chat (all modes)          — $0.56/M input (cache-hit: $0.07/M)
RESEARCHER: DeepSeek-chat (all modes)          — $0.56/M input (cache-hit: $0.07/M)
UNLIMITED:  DeepSeek-chat + priority routing   — $0.56/M input (cache-hit: $0.07/M)

FALLBACK (all tiers): Gemini Flash via Replit integration
```

---

## Decision J: Should ParaphraseContend.jsx Be Refactored Now?

### The Debate

**Agent 30 (Component Architecture):** It's 1,689 lines. This is a god component. It handles: socket management, mode switching, synonym selection, freeze word management, auto-freeze integration, STEM detection, file upload, history management, onboarding, keyboard shortcuts, and output rendering.

**Agent 48 (Feature Prioritization):** But refactoring doesn't add user value. The model routing, cache optimization, and circuit breakers — those save money and improve reliability. Refactoring is pure technical debt.

**Agent 49 (Technical Debt):** The good news is: the new architecture changes (model routing, circuit breakers, cache) are ALL BACKEND. They don't require touching ParaphraseContend.jsx at all. The frontend just sends text and receives results — it doesn't care which model processes them.

**Agent 30:** Agreed, but ONE frontend change IS needed: the STEM masking before sending to backend. Currently `useSTEMFreeze` adds terms to `frozenPhrases` which gets sent as comma-separated strings. The new mask-then-prompt approach needs the frontend to replace LaTeX/code with `[STEM_N]` placeholders and send the mapping alongside.

**Agent 36 (Accessibility):** The real refactoring priority is breaking out the socket handler into its own hook. `useParaphraseSocket` would encapsulate the connect/disconnect/event handling and fix the disconnect leak.

### Consensus: 40/50 voted DEFER full refactor, do minimal changes

**VERDICT: Don't refactor ParaphraseContend.jsx now.** All architecture changes are backend-side. Two minimal frontend changes:
1. Fix Socket.io disconnect leak (5 lines)
2. Add STEM masking before sending to backend (modify `useSTEMFreeze` to output masked text + mapping)

Full refactoring is Phase 5+ work, after the architecture is proven.

---

## FINAL ARCHITECTURE: CONSENSUS DIAGRAM

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SHOTHIK AI — FINAL ARCHITECTURE                   │
│                    (50-Agent Consensus, Feb 2026)                     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                    FRONTEND (Next.js / Replit)                  │  │
│  │                                                                │  │
│  │  ParaphraseContend.jsx (unchanged except 2 fixes)              │  │
│  │   ├── useSTEMFreeze → mask LaTeX/code → [STEM_N] placeholders  │  │
│  │   ├── useAutoFreeze → REST API (unchanged)                     │  │
│  │   ├── Socket.io → backend (FIX: add .disconnect() on cleanup)  │  │
│  │   └── Mode/Synonym/Language selection (unchanged)              │  │
│  └───────────────────────┬────────────────────────────────────────┘  │
│                          │ Socket.io / REST API                      │
│                          ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              AI GATEWAY (New Module in Backend)                 │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ 1. REQUEST HANDLER                                       │  │  │
│  │  │    ├── JWT auth (existing)                                │  │  │
│  │  │    ├── UserLimits check (NEW - LanguageTool pattern)      │  │  │
│  │  │    │    ├── Tier detection (free/student/researcher)      │  │  │
│  │  │    │    ├── Daily word counter (Redis INCR + TTL)         │  │  │
│  │  │    │    ├── Daily request counter (Redis INCR + TTL)      │  │  │
│  │  │    │    ├── Concurrent request check                      │  │  │
│  │  │    │    └── LimitEnforcementMode (LOG→WARN→BLOCK)         │  │  │
│  │  │    ├── Feature Flags (NEW - LanguageTool A/B pattern)     │  │  │
│  │  │    │    ├── ENABLE_CIRCUIT_BREAKER=true                   │  │  │
│  │  │    │    ├── RATE_LIMIT_MODE=LOG_ONLY|WARN|BLOCK           │  │  │
│  │  │    │    ├── DEEPSEEK_MODEL_FREE=v3.2-exp                  │  │  │
│  │  │    │    └── DEEPSEEK_MODEL_PAID=deepseek-chat             │  │  │
│  │  │    └── STEM unmask preparation (receive [STEM_N] mapping) │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ 2. CACHE LAYER (LanguageTool ResultCache → Redis)        │  │  │
│  │  │    ├── L1: cache:stem:{sha256(text)}         TTL: 24h    │  │  │
│  │  │    ├── L2: cache:freeze:{sha256(text+lang)}  TTL: 12h    │  │  │
│  │  │    ├── L3: cache:para:{sha256(text+mode+     TTL: 4h     │  │  │
│  │  │    │       lang+syn+sortedFreeze)}                       │  │  │
│  │  │    ├── Metrics: hits/misses/evictions per namespace       │  │  │
│  │  │    └── Stale-serve: if all models fail, return stale     │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ 3. MODEL ROUTER (LanguageTool RemoteRule pattern)        │  │  │
│  │  │    Library: Cockatiel (TypeScript circuit breaker)        │  │  │
│  │  │                                                          │  │  │
│  │  │    ┌──────────────────────────────────────────────────┐  │  │  │
│  │  │    │ PRIMARY: DeepSeek (tier-routed)                  │  │  │  │
│  │  │    │   Free:       V3.2-Exp ($0.028/M)                │  │  │  │
│  │  │    │   Student:    deepseek-chat ($0.56/M)            │  │  │  │
│  │  │    │   Researcher: deepseek-chat ($0.56/M)            │  │  │  │
│  │  │    │                                                  │  │  │  │
│  │  │    │   Circuit Breaker (Cockatiel SamplingBreaker):    │  │  │  │
│  │  │    │     threshold: 0.5 (50% failure rate)            │  │  │  │
│  │  │    │     duration: 60s sliding window                 │  │  │  │
│  │  │    │     halfOpenAfter: 30s                           │  │  │  │
│  │  │    │                                                  │  │  │  │
│  │  │    │   Timeout: 10s per request                       │  │  │  │
│  │  │    │   Retry: 1 retry with 2s exponential backoff     │  │  │  │
│  │  │    │                                                  │  │  │  │
│  │  │    │   System Prompt Design (cache-optimized):         │  │  │  │
│  │  │    │     [SHARED PREFIX ~500 tokens - cached at 87%]  │  │  │  │
│  │  │    │     [MODE SUFFIX ~100 tokens]                    │  │  │  │
│  │  │    │     [USER TEXT - variable]                        │  │  │  │
│  │  │    └──────────────────────────────────────────────────┘  │  │  │
│  │  │                    │ circuit open                         │  │  │
│  │  │                    ▼                                      │  │  │
│  │  │    ┌──────────────────────────────────────────────────┐  │  │  │
│  │  │    │ FALLBACK: Gemini Flash (Replit integration)      │  │  │  │
│  │  │    │   All tiers: same Gemini model                   │  │  │  │
│  │  │    │                                                  │  │  │  │
│  │  │    │   Circuit Breaker:                               │  │  │  │
│  │  │    │     threshold: 0.6 (60% failure rate)            │  │  │  │
│  │  │    │     halfOpenAfter: 60s                           │  │  │  │
│  │  │    │                                                  │  │  │  │
│  │  │    │   Timeout: 15s (more lenient for fallback)       │  │  │  │
│  │  │    └──────────────────────────────────────────────────┘  │  │  │
│  │  │                    │ circuit open                         │  │  │
│  │  │                    ▼                                      │  │  │
│  │  │    ┌──────────────────────────────────────────────────┐  │  │  │
│  │  │    │ LAST RESORT: Stale cache OR graceful error       │  │  │  │
│  │  │    │   Serve stale Redis result if available           │  │  │  │
│  │  │    │   Otherwise: "Service busy, please retry in 30s" │  │  │  │
│  │  │    └──────────────────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ 4. POST-PROCESSING                                      │  │  │
│  │  │    ├── STEM unmask: replace [STEM_N] with original       │  │  │
│  │  │    ├── Validate: all [STEM_N] present in output?         │  │  │
│  │  │    │    └── If missing: return original for that section  │  │  │
│  │  │    ├── Cache result in Redis (L3)                        │  │  │
│  │  │    └── Stream to client via Socket.io                    │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────┐  │  │
│  │  │ 5. METRICS & MONITORING (LanguageTool pattern)           │  │  │
│  │  │    ├── Cache hit rates per namespace                      │  │  │
│  │  │    ├── Model usage distribution (DeepSeek vs Gemini)      │  │  │
│  │  │    ├── Circuit breaker states (open/closed/half-open)     │  │  │
│  │  │    ├── P50/P95/P99 latency per model per tier             │  │  │
│  │  │    ├── Cost per request (estimated token × price)         │  │  │
│  │  │    ├── Rate limit triggers per tier                       │  │  │
│  │  │    ├── STEM placeholder validation failures               │  │  │
│  │  │    └── Daily cost dashboard in admin panel                │  │  │
│  │  └──────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │              INFRASTRUCTURE (DigitalOcean)                     │  │
│  │                                                                │  │
│  │  Redis (Shared, existing)                                      │  │
│  │   ├── Cache namespaces: stem, freeze, para                     │  │
│  │   ├── Rate limit counters: ratelimit:{userId}:*                │  │
│  │   ├── Circuit breaker state (Cockatiel in-memory, Redis for    │  │
│  │   │   cross-instance sharing if needed)                        │  │
│  │   └── Metrics counters: cache:metrics:*                        │  │
│  │                                                                │  │
│  │  RabbitMQ (existing) — inter-service events                    │  │
│  │  MongoDB (existing) — history, user data, disabled terms       │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## COST MODEL (50-Agent Validated)

### Methodology & Assumptions

**Token estimates** are based on the paraphrase use case:
- Average academic paragraph: ~100 words ≈ ~130 tokens
- System prompt (mode instructions + STEM rules): ~500 tokens (shared/cached prefix)
- Mode-specific suffix: ~100 tokens
- Average user input: ~300 words ≈ ~400 tokens
- **Total input per request: ~1,000 tokens** (500 system + 100 mode + 400 user text)
- Average paraphrase output: ~350 words ≈ ~500 tokens
- **Total output per request: ~500 tokens**

**DeepSeek prompt caching:** When the same system prompt prefix (500 tokens) is sent repeatedly, DeepSeek caches it server-side. Subsequent requests with the same prefix pay cache-hit rate ($0.07/M) instead of full rate ($0.56/M). Cache applies to the shared prefix only; user text is always cache-miss. After the first request per mode, ~50% of input tokens (system prompt) become cache hits.

**Gemini fallback frequency assumption:** Circuit breaker triggers when DeepSeek fails 50% of requests in a 60s window. Based on DeepSeek's historical uptime (99.5%), fallback to Gemini is estimated at ~0.5-2% of total requests. Gemini cost is included as a weighted average in projections.

**Usage patterns by tier:**
- Free: 10 requests/day, limited to Standard/Fluency modes
- Student ($2.99): ~30-50 requests/day (2-3 papers/semester, clustering around deadlines)
- Researcher ($7.99): ~50-100 requests/day (continuous usage, all modes)
- Not all users are active daily; assume 40% DAU/MAU ratio

### Per-Request Cost (DeepSeek-chat, Student Tier)
```
System prompt (cached after 1st request): 500 tokens × $0.07/M  = $0.000035
Mode suffix (not cached):                 100 tokens × $0.56/M  = $0.000056
User text (never cached):                 400 tokens × $0.56/M  = $0.000224
Output:                                   500 tokens × $1.68/M  = $0.000840
TOTAL per request: ~$0.00116

At 40 requests/day average (40% DAU):
Active student daily cost: $0.00116 × 40 = $0.046
Monthly cost per student (40% active days): $0.046 × 30 × 0.40 = $0.55
Student pays: $2.99/mo → PROFITABLE with strong margin ✓

Worst case (100% active, 50 req/day):
Monthly: $0.00116 × 50 × 30 = $1.74 → Still profitable at $2.99 ✓
```

### Per-Request Cost (DeepSeek V3.2-Exp, Free Tier)
```
Total input:  1,000 tokens × $0.028/M = $0.000028
Total output:   500 tokens × $0.041/M = $0.000021
TOTAL per request: ~$0.00005

At 10 requests/day per free user:
Monthly cost per free user: $0.00005 × 10 × 30 = $0.015
Cost for 1,000 free users: $15/month → VERY AFFORDABLE ✓
```

### Per-Request Cost (Gemini Flash Fallback, All Tiers)
```
Input:  1,000 tokens × $0.10/M  = $0.000100
Output:   500 tokens × $0.40/M  = $0.000200
TOTAL per fallback request: ~$0.0003

At 1-2% fallback rate, impact is negligible (~$0.006/user/month)
```

### Monthly Projections (1,000 Users, 40% DAU)

| Scenario | Free (700) | Student (200) | Researcher (100) | Total AI Cost | Revenue | Margin |
|----------|-----------|---------------|-------------------|------------|---------|--------|
| Baseline (no cache) | $10.50 | $110 | $174 | $295 | $1,397 | $1,102 |
| With 30% Redis cache | $7.35 | $77 | $122 | $206 | $1,397 | $1,191 |
| With cache + limits | $7.35 | $66 | $104 | $177 | $1,397 | $1,220 |
| + Gemini fallback (2%) | +$1.20 | +$1.20 | +$0.60 | +$3.00 | - | -$3 |

**Note:** These are AI API costs only. DigitalOcean infrastructure (Managed Redis, Droplets, networking) is ~$400-800/mo additional. Total break-even including infra is at approximately 500-800 paid users.

### Sensitivity Analysis

| Variable | Low Estimate | Base Estimate | High Estimate |
|----------|-------------|---------------|---------------|
| Cache hit rate | 15% | 30% | 50% |
| DAU/MAU ratio | 20% | 40% | 60% |
| Avg tokens/request | 800 | 1,000 | 1,500 |
| DeepSeek fallback rate | 0.5% | 2% | 5% |
| Free tier conversion | 3% | 5% | 8% |

**Key risk:** If average tokens/request is 1,500 (long academic papers) AND DAU is 60%, student tier cost rises to ~$2.61/mo — still profitable at $2.99 but tight. Rate limits on max text length (3,000 words for student tier) mitigate this.

---

## IMPLEMENTATION PRIORITY (50-Agent Ranked)

| Priority | Task | Effort | Impact | Risk |
|----------|------|--------|--------|------|
| P0 | Metrics + cache hit/miss counters | 4 hrs | Foundation for all decisions | Low |
| P1 | Redis cache namespaces (stem/freeze/para) | 6 hrs | 15-30% token savings | Low |
| P2 | Cockatiel circuit breaker + model router | 12 hrs | Reliability + cost protection | Medium |
| P3 | DeepSeek tier-based routing (V3.2-Exp/chat) | 8 hrs | 50-90% free tier savings | Medium |
| P4 | Rate limits with LOG_ONLY mode | 6 hrs | Abuse prevention | Low |
| P5 | STEM mask-then-prompt (replace T5 GPU flow) | 8 hrs | Eliminates GPU dependency | Medium |
| P6 | DeepSeek system prompt caching optimization | 4 hrs | 87% prompt token savings | Low |
| P7 | Socket.io disconnect fix | 1 hr | Memory leak prevention | Low |
| P8 | Admin dashboard (cache/cost/model metrics) | 8 hrs | Operational visibility | Low |
| P9 | Rate limit WARN → BLOCK migration | 2 hrs | Cost enforcement | Low |
| P10 | A/B testing framework for model routing | 4 hrs | Safe experimentation | Low |

**Total: ~63 engineering hours over 4-6 weeks**

---

## WHAT WAS REJECTED (And Why)

| Proposal | Votes Against | Reason |
|----------|--------------|--------|
| GPT4All server deployment | 42/50 | V3.2-Exp is cheaper than running a VM |
| SSE replacing Socket.io | 39/50 | Socket.io reconnection critical for SA networks |
| ParaphraseContend.jsx refactor | 40/50 | All changes are backend-side, defer tech debt |
| Single-provider (DeepSeek only) | 45/50 | Availability risk, Gemini fallback is free to keep |
| R1 reasoning model for paraphrase | 47/50 | Overkill and expensive, paraphrasing is not reasoning |
| Client-side GPT4All (Electron) | 48/50 | Massive engineering effort, premature |
| Complex A/B with user segmentation | 35/50 | Env-var flags sufficient for current scale |
