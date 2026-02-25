# LanguageTool + GPT4All → Shothik AI: Architecture Analysis & Implementation Roadmap

**Date:** February 17, 2026
**Repos Analyzed:**
- `languagetool-org/languagetool` — Open-source grammar/spell checker (Java, 3625+ files)
- `nomic-ai/gpt4all` — Local LLM inference engine (Python/C++/TypeScript)

---

## Executive Summary

After deep-diving into both codebases, **5 LanguageTool patterns** and **1 GPT4All pattern** directly apply to Shothik AI's paraphrase service architecture. The most impactful adoption is LanguageTool's **RemoteRule circuit breaker + fallback** pattern, which maps directly to Shothik's Gemini → DeepSeek → T5 model chain. Combined with GPT4All-style local inference for a budget tier, these patterns can reduce AI costs by **30-50%** and improve reliability significantly.

---

## Part 1: LanguageTool Architecture Patterns

### Pattern 1: ResultCache (Three-Level Cache with Metrics)

**What LanguageTool Does:**
```java
// Three separate caches, each with custom weighers
matchesCache      → stores rule match results (serialized)
remoteMatchesCache → stores AI/remote rule results separately
sentenceCache      → stores analyzed sentence structures

// Weight-based sizing (not just count-based)
weight = text.length / 75 + matches.size

// Built-in monitoring
cache.hitRate()      → returns double (0.0 - 1.0)
cache.requestCount() → total lookups
cache.hitCount()     → successful lookups
```

**How Shothik Should Adopt This:**

Currently, Shothik uses a single shared Redis with no separation between cache types. Adopt LanguageTool's pattern of **separate cache namespaces** with independent metrics:

```
Redis Key Structure (Adopted):
──────────────────────────────
cache:paraphrase:{hash(text+mode+lang+freeze+synonym)}  → Full paraphrase result
cache:tagging:{hash(text+mode+lang)}                    → Word-level tagging only
cache:autofreeze:{hash(text+lang)}                      → Auto-freeze detection results
cache:stem:{hash(text)}                                 → STEM content detection results

Metrics Keys:
metrics:cache:paraphrase:hits      → INCR on hit
metrics:cache:paraphrase:misses    → INCR on miss
metrics:cache:autofreeze:hits      → INCR on hit
metrics:cache:autofreeze:misses    → INCR on miss
```

**Why separate caches matter:** Auto-freeze detection results are reusable across modes (Standard, Formal, Academic all freeze the same LaTeX). By caching auto-freeze separately, a user changing from "Standard" to "Formal" mode gets an instant freeze detection from cache even though the paraphrase itself must be regenerated.

**Estimated savings:** 15-25% reduction in auto-freeze API calls (currently re-detected on every mode change).

---

### Pattern 2: PipelinePool (Pre-warmed Model Instances)

**What LanguageTool Does:**
```java
// Apache Commons Pool2 — reuses pre-configured JLanguageTool instances
class PipelinePool implements KeyedPooledObjectFactory<PipelineSettings, Pipeline> {
    
    // Prewarms pipelines on server start
    Pipeline pipeline = pipelinePool.getPipeline(setting);
    pipeline.check("LanguageTool");  // Warm up
    pipelinePool.returnPipeline(setting, pipeline);
    
    // Non-blocking: creates new if pool exhausted
    poolConfig.setBlockWhenExhausted(false);
}
```

**How Shothik Should Adopt This:**

The T5 model (self-hosted for paraphrase) has cold-start latency. When a T5 instance hasn't processed a request recently, the first request takes longer. Adopt the PipelinePool pattern:

```javascript
// T5 Pipeline Pool (Backend Service)
class T5PipelinePool {
    constructor(poolSize = 3) {
        this.pool = [];
        this.prewarm(poolSize);
    }
    
    async prewarm(count) {
        for (let i = 0; i < count; i++) {
            const pipeline = await this.createPipeline();
            await pipeline.generate("warmup text");  // Pre-load model weights
            this.pool.push(pipeline);
        }
    }
    
    async getPipeline() {
        if (this.pool.length > 0) return this.pool.pop();
        return await this.createPipeline();  // Non-blocking fallback
    }
    
    returnPipeline(pipeline) {
        if (this.pool.length < this.maxPoolSize) {
            this.pool.push(pipeline);
        }
    }
}
```

**Impact:** Eliminates T5 cold-start latency (200-500ms savings on first request after idle). More importantly, keeping T5 warm means fewer requests fall through to Gemini just because T5 was slow to respond.

---

### Pattern 3: RemoteRule Circuit Breaker + Fallback (THE MOST IMPORTANT PATTERN)

**What LanguageTool Does:**
```java
public abstract class RemoteRule extends Rule {
    // Three abstract methods define the contract:
    protected abstract RemoteRequest prepareRequest(sentences, textSessionId);
    protected abstract Callable<RemoteRuleResult> executeRequest(request, timeoutMs);
    protected abstract RemoteRuleResult fallbackResults(request);
    
    // Resilience4j circuit breaker per rule
    CircuitBreaker circuitBreaker = CircuitBreakers.registry()
        .circuitBreaker("remote-rule-" + id, config);
    
    // Config-driven fallback chain
    RemoteRuleFallbackManager.INSTANCE.init(remoteRulesConfigFile);
    // If Rule A's circuit opens → automatically try Rule B (fallback)
}
```

**How Shothik Should Adopt This:**

This maps DIRECTLY to Shothik's model chain: Redis → T5 → Gemini Flash → DeepSeek. Currently, the fallback logic is likely ad-hoc in each service. Adopt LanguageTool's structured approach:

```javascript
// Shared AI Gateway Module (all services import this)
class AIModelRouter {
    constructor(config) {
        this.circuitBreakers = {
            geminiFlash: new CircuitBreaker({
                failureRateThreshold: 50,    // Open after 50% failures
                waitDurationInOpenState: 30000, // 30s before retry
                slidingWindowSize: 10,
            }),
            deepseek: new CircuitBreaker({
                failureRateThreshold: 70,
                waitDurationInOpenState: 60000,
                slidingWindowSize: 5,
            }),
        };
        
        this.fallbackChain = config.fallbackChain;
        // e.g., ['redis', 't5-masked', 'gemini-flash', 'gemini-lite', 'deepseek']
    }
    
    async executeWithFallback(request) {
        // Step 1: Redis cache check
        const cached = await this.redis.get(this.cacheKey(request));
        if (cached) { this.metrics.incr('cache:hit'); return cached; }
        this.metrics.incr('cache:miss');
        
        // Step 2: Try primary model (with circuit breaker)
        for (const model of this.fallbackChain) {
            if (this.circuitBreakers[model]?.isOpen()) {
                this.metrics.incr(`circuit:${model}:skipped`);
                continue;  // Skip if circuit is open
            }
            
            try {
                const result = await this.callWithTimeout(model, request, 10000);
                this.circuitBreakers[model]?.recordSuccess();
                await this.redis.set(this.cacheKey(request), result, 'EX', 3600);
                this.metrics.incr(`model:${model}:success`);
                return result;
            } catch (error) {
                this.circuitBreakers[model]?.recordFailure();
                this.metrics.incr(`model:${model}:failure`);
                // Continue to next model in chain
            }
        }
        
        // Step 3: All models failed — return error
        throw new Error('All AI models unavailable');
    }
}
```

**Why this is the #1 adoption:** Right now, if Gemini is slow (not failed, just slow), Shothik probably waits the full timeout before falling back to DeepSeek. With circuit breakers, after 5 slow responses in a row, the circuit opens and ALL subsequent requests skip Gemini entirely for 30 seconds — going straight to DeepSeek or T5. This eliminates cascading latency during Gemini degradation.

**Estimated savings:** 
- 5-10% reduction in wasted API calls (retries to failing services)
- 30-50% latency improvement during partial outages
- Prevents runaway costs when a service is degraded (requests pile up)

---

### Pattern 4: UserLimits + RequestLimiter (Tiered Access Control)

**What LanguageTool Does:**
```java
class UserLimits {
    int maxTextLength;         // Anonymous: 20K chars, Premium: 100K chars
    long maxCheckTimeMillis;   // Anonymous: 8s, Premium: 20s
    Long requestsPerDay;       // Per-user daily limit
    LimitEnforcementMode;      // BLOCK vs WARN vs LOG_ONLY (gradual rollout!)
    boolean skipLimits;        // For internal test users
    
    // Transparent fallback to defaults if DB is down
    if (dbEntry == null) return getDefaultLimits(config);
}

class RequestLimiter {
    // Fingerprinting: User-Agent + Accept-Language + Referer + sessionId
    // Error rate tracking: separate limiter for requests that cause errors
    // Queue-based: keeps last 1000 events, checks against period
}
```

**How Shothik Should Adopt This:**

The `LimitEnforcementMode` is particularly clever — you can roll out rate limits gradually:
1. First deploy with `LOG_ONLY` (track who would be limited but don't block)
2. Then switch to `WARN` (show warning but allow)
3. Finally `BLOCK` (enforce)

```javascript
// Redis-backed rate limiter (Shared across all services)
const TIER_LIMITS = {
    free:       { wordsPerDay: 300,   requestsPerDay: 10,  maxTextLength: 500,   maxConcurrent: 1 },
    student:    { wordsPerDay: 5000,  requestsPerDay: 100, maxTextLength: 3000,  maxConcurrent: 2 },
    researcher: { wordsPerDay: 50000, requestsPerDay: 500, maxTextLength: 10000, maxConcurrent: 3 },
    unlimited:  { wordsPerDay: -1,    requestsPerDay: -1,  maxTextLength: 50000, maxConcurrent: 5 },
};

// LimitEnforcementMode (from LanguageTool)
const ENFORCEMENT_MODE = process.env.RATE_LIMIT_MODE || 'LOG_ONLY';
// Options: 'LOG_ONLY' | 'WARN' | 'BLOCK'
```

**Estimated savings:** Prevents abuse and controls costs. At scale, free tier users could consume 60-80% of API costs while generating 0% revenue. Rate limits cap this.

---

### Pattern 5: A/B Testing Infrastructure

**What LanguageTool Does:**
```java
// Environment variable-driven feature flags
LT_TEST_ONLY_USERS = "user1,user2"
LT_TEST_ONLY_RULES = "RULE_A,RULE_B"
LT_TEST_ONLY_LANGUAGES = "en,de"
LT_TEST_ONLY_CLIENTS = "chrome_extension"
```

**How Shothik Should Adopt This:**

```javascript
// Feature flags for gradual rollout of optimizations
const FEATURE_FLAGS = {
    ENABLE_T5_MASKING:        process.env.ENABLE_T5_MASKING === 'true',
    ENABLE_GEMINI_CACHE:      process.env.ENABLE_GEMINI_CACHE === 'true',
    ENABLE_CIRCUIT_BREAKER:   process.env.ENABLE_CIRCUIT_BREAKER === 'true',
    RATE_LIMIT_ENFORCEMENT:   process.env.RATE_LIMIT_MODE || 'LOG_ONLY',
    AB_TEST_USERS:            (process.env.AB_TEST_USERS || '').split(',').filter(Boolean),
    AB_TEST_MODEL_ROUTING:    process.env.AB_TEST_MODEL_ROUTING || 'default',
};
```

**Impact:** Zero-risk deployment of every optimization. If mask-then-T5 produces bad output for some edge case, flip one env var and it's off — no code deploy needed.

---

## Part 2: GPT4All Patterns

### Pattern 6: Local Model Inference for Budget Tier

**What GPT4All Does:**
```python
# Run LLMs locally — no API calls, no per-token costs
gpt4all = GPT4All("Phi-3-mini-4k-instruct.Q4_0.gguf")  # 2.4GB model
response = gpt4all.generate("Paraphrase: The mitochondria is the powerhouse of the cell")

# Supports streaming
for token in gpt4all.generate(prompt, streaming=True):
    print(token, end="", flush=True)

# Local embeddings for similarity search
embedder = Embed4All("all-MiniLM-L6-v2.gguf2.f16.gguf")
embeddings = embedder.embed("academic text here")
```

**How Shothik Could Adopt This (CAUTIOUSLY):**

GPT4All shows that small models (2-4GB) can run on consumer hardware. For Shothik, this opens TWO possibilities:

**Option A: Server-Side Budget Paraphrase Tier (Low Risk)**
Deploy a small quantized model (Phi-3-mini or similar) on a single DigitalOcean Droplet alongside T5 for the free tier:
- Free users get Standard/Fluency paraphrase modes only, handled by T5 + local small model
- GPT4All's generation capabilities (not embeddings) replace Gemini for basic paraphrasing
- Local Embed4All (MiniLM-L6-v2) could also provide semantic similarity for freeze word detection as a secondary optimization
- Eliminates ALL Gemini API calls for free tier users
- Cost: ~$50/mo for a small VM vs $100-300/mo in Gemini calls for free users

**Option B: Client-Side Offline Mode (High Risk, Future)**
A desktop app (Electron) could run GPT4All locally for offline paraphrasing:
- University lab computers in Bangladesh/India could run a 2GB model
- No internet required, no API costs
- Quality would be lower than Gemini, but adequate for basic Standard mode
- Significantly increases engineering complexity

**Recommendation:** Start with Option A. Deploy a small model server-side for free tier Standard paraphrase generation. Auto-freeze detection is a classification/detection task — better served by the existing LLM-based API or local embeddings (Embed4All), not GPT4All's generation mode.

**Estimated savings:** $50-200/mo (eliminates free tier Gemini costs)

---

## Part 3: What NOT to Adopt

| Pattern | Why Skip It |
|---------|-------------|
| LanguageTool's XML grammar rules engine | Shothik uses AI models, not pattern matching. Different paradigm. |
| LanguageTool's IP-based fingerprinting | Shothik users are behind university proxies — many users share IPs. Use user-id + JWT instead. |
| GPT4All's multi-backend GPU detection | Over-engineering for cloud deployment. Only relevant if building desktop app. |
| GPT4All's model download system | Shothik models are server-side. Users never download models. |
| LanguageTool's Hunspell/Morfologik dictionaries | Not relevant for paraphrasing. These are for spell-checking. |
| GPT4All's ctypes C++ bindings | T5 is already deployed. No need to wrap llama.cpp. |

---

## Part 4: Implementation Roadmap

### Phase 0: Metrics Foundation (Week 1, 4-6 hours)
- Add Redis-based cache hit/miss counters per cache type
- Add model usage counters (which model served each request)
- Add latency tracking per model
- Deploy with `LOG_ONLY` rate limit mode (track, don't enforce)

### Phase 1A: Circuit Breaker + Fallback (Week 2, 8-12 hours)
- Implement `AIModelRouter` class with Resilience4j-style circuit breakers
- Configure fallback chain: Redis → T5 (masked) → Gemini Flash → DeepSeek
- Add per-model timeout (T5: 5s, Gemini: 10s, DeepSeek: 15s)
- Deploy behind `ENABLE_CIRCUIT_BREAKER=true` feature flag

### Phase 1B: Separate Cache Namespaces (Week 2, 4-6 hours)
- Split Redis cache into paraphrase/tagging/autofreeze/stem namespaces
- Add weight-based TTL (shorter for large responses, longer for small)
- Implement cache metrics dashboard in admin panel

### Phase 2: Rate Limits + Tier Enforcement (Week 3, 6-8 hours)
- Implement `UserLimits` with tiered configuration
- Deploy with `LOG_ONLY` mode for 1 week, then switch to `WARN`, then `BLOCK`
- Add `ErrorRequestLimiter` pattern (track error-causing requests separately)

### Phase 3: T5 Pipeline Pool + Mask-then-T5 (Week 4, 8-12 hours)
- Pre-warm T5 instances on service start
- Implement mask-then-T5 for freeze words (STEM users get T5 instead of Gemini)
- Deploy behind `ENABLE_T5_MASKING=true` feature flag

### Phase 4: GPT4All Budget Tier (Week 5-6, 16-20 hours)
- Deploy Phi-3-mini on a small DigitalOcean Droplet for free tier auto-freeze
- Route free tier Standard mode through local model
- A/B test quality vs Gemini

---

## Part 5: Cost Savings Summary

| Adoption | Monthly Savings | Effort | ROI Payback |
|----------|----------------|--------|-------------|
| Circuit Breaker + Fallback | $50-150 (fewer wasted retries) | 12 hrs | 1 week |
| Separate Cache Namespaces | $30-80 (fewer duplicate calls) | 6 hrs | 3 days |
| Rate Limits | $100-500 (prevent free tier abuse) | 8 hrs | 2 days |
| T5 Pipeline Pool + Masking | $30-100 (STEM → T5 instead of Gemini) | 12 hrs | 1 week |
| GPT4All Budget Tier | $50-200 (eliminate free tier Gemini) | 20 hrs | 2 weeks |
| **Total** | **$260-1,030/mo** | **58 hrs** | |

At $260-1,030/mo savings and ~58 engineering hours, the payback period is **1-2 months** for the full adoption.

**Cost Methodology & Assumptions:**
These estimates are directional ranges, not precise calculations. They assume:
- Total current monthly spend: $960-2,100 (from prior infrastructure analysis)
- Free tier users consume ~40-60% of API calls while generating $0 revenue
- Cache hit rate on repeated edits (user changes mode/synonym level on same text): estimated 20-40%
- Gemini Flash pricing: $0.10/M input tokens, $0.40/M output tokens (as of Feb 2026)
- Average paraphrase request: ~500 tokens input, ~600 tokens output
- Circuit breaker savings based on: 5-10% of requests hitting degraded/slow services in a typical month

**To validate these estimates before implementation:** Deploy Phase 0 (metrics) first. After 1-2 weeks of data collection, recalculate with actual cache hit rates, model usage distribution, and free-tier proportion. Adjust implementation priorities based on measured data.

---

## Part 6: Final Architecture (With Adopted Patterns)

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Next.js on Replit)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ParaphraseContend.jsx                               │    │
│  │  ├── useSTEMFreeze (client-side LaTeX/code detect)  │    │
│  │  ├── useAutoFreeze (API-based term detection)       │    │
│  │  └── Socket.io → backend + HTTP fallback (NEW)      │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          PARAPHRASE SERVICE (DigitalOcean)                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ REQUEST HANDLER                                     │    │
│  │  ├── UserLimits check (LanguageTool pattern)        │    │
│  │  │    ├── Tier check (free/student/researcher)      │    │
│  │  │    ├── Rate limit (Redis atomic counters)        │    │
│  │  │    └── LimitEnforcementMode (LOG→WARN→BLOCK)     │    │
│  │  │                                                  │    │
│  │  ├── A/B Feature Flags (env-driven)                 │    │
│  │  │    ├── ENABLE_T5_MASKING                         │    │
│  │  │    ├── ENABLE_CIRCUIT_BREAKER                    │    │
│  │  │    └── AB_TEST_MODEL_ROUTING                     │    │
│  │  │                                                  │    │
│  │  └── STEM Preprocessing (already exists)            │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     ▼                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ AI MODEL ROUTER (LanguageTool RemoteRule pattern)   │    │
│  │                                                     │    │
│  │  Step 1: Cache Check                                │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │ Redis Separate Caches (ResultCache pattern)  │   │    │
│  │  │  ├── cache:paraphrase:* (output results)     │   │    │
│  │  │  ├── cache:tagging:*    (word highlighting)  │   │    │
│  │  │  ├── cache:autofreeze:* (freeze detection)   │   │    │
│  │  │  └── cache:stem:*       (STEM detection)     │   │    │
│  │  │  + hitRate() + requestCount() metrics         │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                     │ miss                          │    │
│  │                     ▼                               │    │
│  │  Step 2: Model Chain (with Circuit Breakers)        │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │                                              │   │    │
│  │  │  [Free Tier] ──→ Local Model (GPT4All)       │   │    │
│  │  │                  (Phi-3-mini, Standard only)  │   │    │
│  │  │                                              │   │    │
│  │  │  [Paid Tier] ──→ T5 Pipeline Pool            │   │    │
│  │  │    │              (pre-warmed, mask-then-T5)  │   │    │
│  │  │    │              CB: failureRate=50%         │   │    │
│  │  │    │                                         │   │    │
│  │  │    ├── fallback → Gemini Flash               │   │    │
│  │  │    │              (context cache enabled)     │   │    │
│  │  │    │              CB: failureRate=50%         │   │    │
│  │  │    │              timeout: 10s                │   │    │
│  │  │    │                                         │   │    │
│  │  │    ├── fallback → Gemini Flash-Lite          │   │    │
│  │  │    │              CB: failureRate=60%         │   │    │
│  │  │    │              timeout: 8s                 │   │    │
│  │  │    │                                         │   │    │
│  │  │    └── fallback → DeepSeek                   │   │    │
│  │  │                   CB: failureRate=70%         │   │    │
│  │  │                   timeout: 15s                │   │    │
│  │  │                                              │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                     │                               │    │
│  │                     ▼                               │    │
│  │  Step 3: Response + Cache Store + Metrics           │    │
│  │  ┌──────────────────────────────────────────────┐   │    │
│  │  │ ServerMetricsCollector                       │   │    │
│  │  │  ├── cache hit rate per namespace            │   │    │
│  │  │  ├── model usage distribution                │   │    │
│  │  │  ├── latency P50/P95/P99 per model           │   │    │
│  │  │  ├── cost per request (estimated)            │   │    │
│  │  │  ├── circuit breaker state (open/closed)     │   │    │
│  │  │  └── error rate per model                    │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ADMIN PANEL DASHBOARD (NEW metrics)                 │    │
│  │  ├── Cache hit rate: 42% (target: >30%)             │    │
│  │  ├── Model split: T5 65%, Gemini 30%, DeepSeek 5%   │    │
│  │  ├── Cost today: $4.20 (budget: $10)                │    │
│  │  ├── Circuit breakers: All CLOSED ✓                 │    │
│  │  ├── Rate limits: 12 users throttled today          │    │
│  │  └── P95 latency: 1.8s (target: <3s)               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

1. **LanguageTool's biggest gift to Shothik** is the `RemoteRule` pattern — structured fallback chains with circuit breakers. This is exactly what Shothik needs for its multi-model architecture.

2. **GPT4All's biggest gift** is proving that small quantized models (2-4GB) can handle basic NLP tasks. A Phi-3-mini could handle free tier paraphrasing at $50/mo VM cost instead of $200/mo in Gemini API calls.

3. **The cache separation pattern** from LanguageTool's ResultCache is simple but powerful — different data types (paraphrase results vs freeze detection vs tagging) have different reuse patterns and should be cached independently.

4. **LanguageTool's gradual enforcement** (`LOG_ONLY` → `WARN` → `BLOCK`) is the safest way to roll out rate limits without surprising users.

5. **Don't over-engineer.** Skip LanguageTool's XML rule engine (wrong paradigm), GPT4All's multi-backend GPU detection (unnecessary for cloud), and complex client-side inference (too risky for now).
