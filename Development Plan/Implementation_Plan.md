# Shothik AI — Paraphrase Service Implementation Plan
## DeepSeek-Primary Architecture with LanguageTool Patterns

**Date:** February 17, 2026  
**Based on:** 50-Agent Architecture Debate (see `50_Agent_Architecture_Debate.md`)  
**Infrastructure:** DigitalOcean (Droplets, Managed Redis, Managed MongoDB)  
**Total Effort:** ~63 engineering hours over 4-6 weeks  
**Goal:** Replace T5/GPU dependency with DeepSeek-primary cloud architecture, add circuit breakers, caching, rate limits, and STEM masking

---

## Dependency Graph

```
P0 (Metrics) ──────────┐
                        ├──→ P2 (Circuit Breaker) ──→ P3 (Model Routing) ──→ P6 (Prompt Caching)
P1 (Redis Cache) ──────┘                                                      │
                                                                               ├──→ P8 (Admin Dashboard)
P4 (Rate Limits) ──────────────────────────────────────────────────────────────┤
                                                                               ├──→ P9 (WARN→BLOCK)
P5 (STEM Masking) ─────────────────────────────────────────────────────────────┘
                                                                               
P7 (Socket.io Fix) ──→ independent, can be done anytime

P10 (A/B Testing) ──→ depends on P3 (Model Routing) being live
```

**Critical path:** P0 → P1 → P2 → P3 → P6 → P8  
**Parallel tracks:** P4 (Rate Limits) and P5 (STEM Masking) can proceed in parallel with Phase 2  
**Independent:** P7 (Socket.io fix) can be done any time

---

## Phase 1 — Foundation: Metrics & Cache Infrastructure

**Duration:** Week 1 (10 hours)  
**Where:** Backend paraphrase microservice (DigitalOcean)  
**Dependencies:** None (foundational)

### P0: Cache Metrics (4 hours)

**Why first:** Without metrics, every optimization is guesswork. We need to measure before we optimize.

**Implementation:**

```typescript
// src/services/cache-metrics.service.ts

import Redis from 'ioredis';

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

type CacheNamespace = 'stem' | 'freeze' | 'para';

class CacheMetricsService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async recordHit(namespace: CacheNamespace): Promise<void> {
    await this.redis.incr(`cache:metrics:${namespace}:hits`);
  }

  async recordMiss(namespace: CacheNamespace): Promise<void> {
    await this.redis.incr(`cache:metrics:${namespace}:misses`);
  }

  async recordEviction(namespace: CacheNamespace): Promise<void> {
    await this.redis.incr(`cache:metrics:${namespace}:evictions`);
  }

  async getMetrics(namespace: CacheNamespace): Promise<CacheMetrics> {
    const [hits, misses, evictions] = await Promise.all([
      this.redis.get(`cache:metrics:${namespace}:hits`),
      this.redis.get(`cache:metrics:${namespace}:misses`),
      this.redis.get(`cache:metrics:${namespace}:evictions`),
    ]);

    const h = parseInt(hits || '0', 10);
    const m = parseInt(misses || '0', 10);
    const e = parseInt(evictions || '0', 10);
    const total = h + m;

    return {
      hits: h,
      misses: m,
      evictions: e,
      hitRate: total > 0 ? h / total : 0,
    };
  }

  async getAllMetrics(): Promise<Record<CacheNamespace, CacheMetrics>> {
    const [stem, freeze, para] = await Promise.all([
      this.getMetrics('stem'),
      this.getMetrics('freeze'),
      this.getMetrics('para'),
    ]);
    return { stem, freeze, para };
  }

  // Alert if hit rate drops below threshold (called periodically)
  async checkAlerts(threshold: number = 0.15): Promise<string[]> {
    const alerts: string[] = [];
    const metrics = await this.getAllMetrics();

    for (const [ns, m] of Object.entries(metrics)) {
      const total = m.hits + m.misses;
      if (total > 100 && m.hitRate < threshold) {
        alerts.push(
          `ALERT: ${ns} cache hit rate ${(m.hitRate * 100).toFixed(1)}% ` +
          `is below threshold ${(threshold * 100).toFixed(1)}% ` +
          `(${m.hits} hits / ${total} total)`
        );
      }
    }
    return alerts;
  }

  // Reset counters (call daily or weekly for rolling windows)
  async resetNamespace(namespace: CacheNamespace): Promise<void> {
    await Promise.all([
      this.redis.del(`cache:metrics:${namespace}:hits`),
      this.redis.del(`cache:metrics:${namespace}:misses`),
      this.redis.del(`cache:metrics:${namespace}:evictions`),
    ]);
  }
}

export default CacheMetricsService;
```

**Verification:** After deploying, call `GET /api/admin/cache-metrics` and confirm all namespaces return `{ hits: 0, misses: 0, hitRate: 0 }`.

---

### P1: Redis Cache Namespaces (6 hours)

**Why:** Separate caches for different data types with different TTLs maximize reuse.

**Implementation:**

```typescript
// src/services/result-cache.service.ts
// Adapted from LanguageTool's ResultCache pattern

import Redis from 'ioredis';
import crypto from 'crypto';
import CacheMetricsService from './cache-metrics.service';

interface CacheConfig {
  namespace: 'stem' | 'freeze' | 'para';
  ttlSeconds: number;
  maxEntrySizeBytes?: number;
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  stem: { namespace: 'stem', ttlSeconds: 86400 },        // 24 hours
  freeze: { namespace: 'freeze', ttlSeconds: 43200 },    // 12 hours
  para: { namespace: 'para', ttlSeconds: 14400 },        // 4 hours
};

class ResultCacheService {
  private redis: Redis;
  private metrics: CacheMetricsService;

  constructor(redis: Redis, metrics: CacheMetricsService) {
    this.redis = redis;
    this.metrics = metrics;
  }

  private hashKey(parts: string[]): string {
    return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
  }

  private normalizeFreeze(freezeWords: string[]): string {
    return [...freezeWords]
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0)
      .sort()
      .join(',');
  }

  // STEM detection cache — keyed by text only, reusable across ALL modes
  async getStemCache(text: string): Promise<any | null> {
    const key = `cache:stem:${this.hashKey([text])}`;
    const result = await this.redis.get(key);
    if (result) {
      await this.metrics.recordHit('stem');
      return JSON.parse(result);
    }
    await this.metrics.recordMiss('stem');
    return null;
  }

  async setStemCache(text: string, regions: any): Promise<void> {
    const key = `cache:stem:${this.hashKey([text])}`;
    await this.redis.setex(key, CACHE_CONFIGS.stem.ttlSeconds, JSON.stringify(regions));
  }

  // Auto-freeze cache — keyed by text + language
  async getFreezeCache(text: string, lang: string): Promise<any | null> {
    const key = `cache:freeze:${this.hashKey([text, lang])}`;
    const result = await this.redis.get(key);
    if (result) {
      await this.metrics.recordHit('freeze');
      return JSON.parse(result);
    }
    await this.metrics.recordMiss('freeze');
    return null;
  }

  async setFreezeCache(text: string, lang: string, terms: any): Promise<void> {
    const key = `cache:freeze:${this.hashKey([text, lang])}`;
    await this.redis.setex(key, CACHE_CONFIGS.freeze.ttlSeconds, JSON.stringify(terms));
  }

  // Paraphrase output cache — keyed by all parameters
  async getParaCache(
    text: string,
    mode: string,
    lang: string,
    synonymLevel: string,
    freezeWords: string[]
  ): Promise<any | null> {
    const normalized = this.normalizeFreeze(freezeWords);
    const key = `cache:para:${this.hashKey([text, mode, lang, synonymLevel, normalized])}`;
    const result = await this.redis.get(key);
    if (result) {
      await this.metrics.recordHit('para');
      return JSON.parse(result);
    }
    await this.metrics.recordMiss('para');
    return null;
  }

  async setParaCache(
    text: string,
    mode: string,
    lang: string,
    synonymLevel: string,
    freezeWords: string[],
    result: any
  ): Promise<void> {
    const normalized = this.normalizeFreeze(freezeWords);
    const key = `cache:para:${this.hashKey([text, mode, lang, synonymLevel, normalized])}`;
    await this.redis.setex(key, CACHE_CONFIGS.para.ttlSeconds, JSON.stringify(result));
  }

  // Stale-serve: get expired/any result for emergency fallback
  async getStaleParaCache(
    text: string,
    mode: string,
    lang: string,
    synonymLevel: string,
    freezeWords: string[]
  ): Promise<any | null> {
    // Same key, but check without TTL concern
    // Redis auto-deletes expired keys, so stale-serve requires
    // a separate "shadow" key with longer TTL
    const normalized = this.normalizeFreeze(freezeWords);
    const key = `cache:para:stale:${this.hashKey([text, mode, lang, synonymLevel, normalized])}`;
    const result = await this.redis.get(key);
    return result ? JSON.parse(result) : null;
  }

  async setParaCacheWithStale(
    text: string,
    mode: string,
    lang: string,
    synonymLevel: string,
    freezeWords: string[],
    result: any
  ): Promise<void> {
    const normalized = this.normalizeFreeze(freezeWords);
    const baseHash = this.hashKey([text, mode, lang, synonymLevel, normalized]);

    // Primary cache: 4 hours
    const primaryKey = `cache:para:${baseHash}`;
    await this.redis.setex(primaryKey, CACHE_CONFIGS.para.ttlSeconds, JSON.stringify(result));

    // Stale shadow: 72 hours (used only when ALL models are down)
    const staleKey = `cache:para:stale:${baseHash}`;
    await this.redis.setex(staleKey, 259200, JSON.stringify(result));
  }
}

export default ResultCacheService;
```

**Cache key design rationale:**
- `stem` is text-only → one detection result serves ALL modes/languages
- `freeze` adds language → language-specific technical terms
- `para` adds all parameters → exact configuration match required
- `para:stale` has 72h TTL → emergency fallback when all models are down

**Verification:** Run paraphrase requests, check Redis keys with `KEYS cache:*`, verify TTLs with `TTL <key>`.

---

## Phase 2 — AI Gateway: Circuit Breaker + Model Router

**Duration:** Weeks 2-3 (20 hours)  
**Where:** Backend paraphrase microservice (DigitalOcean)  
**Dependencies:** Phase 1 (metrics + cache)

### P2: Cockatiel Circuit Breaker + AI Gateway (12 hours)

**Why:** This is the core reliability improvement. When DeepSeek fails, traffic automatically routes to Gemini. When DeepSeek recovers, traffic automatically returns.

**Installation:**
```bash
npm install cockatiel
```

**Implementation:**

```typescript
// src/services/ai-gateway.service.ts
// Adapted from LanguageTool's RemoteRule pattern

import {
  circuitBreaker,
  handleAll,
  retry,
  timeout,
  wrap,
  SamplingBreaker,
  ExponentialBackoff,
  CircuitBreakerPolicy,
  TimeoutStrategy,
} from 'cockatiel';

interface ModelConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  circuitBreaker: {
    threshold: number;   // failure rate to trip (0.0-1.0)
    duration: number;    // sliding window in ms
    halfOpenAfter: number; // ms before test request
    minimumRps: number;  // minimum requests before CB activates
  };
}

interface ParaphraseRequest {
  text: string;                // masked text with [STEM_N] placeholders
  mode: string;                // Standard, Fluency, Humanize, etc.
  language: string;
  synonymLevel: string;
  stemMapping?: Record<string, string>;  // { "STEM_1": "E=mc^2", ... }
  freezeWords?: string[];                // user-selected freeze words
  userTier: 'free' | 'value_plan' | 'pro_plan' | 'unlimited';
}

interface ParaphraseResult {
  text: string;
  tagging: any[];
  synonyms: any[];
  model: string;           // which model served this
  cached: boolean;
  latencyMs: number;
}

// Circuit breaker state tracking for admin dashboard
interface CircuitState {
  provider: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailure?: Date;
  lastSuccess?: Date;
}

class AIGateway {
  private deepseekPolicy: ReturnType<typeof wrap>;
  private geminiPolicy: ReturnType<typeof wrap>;
  private deepseekBreaker: CircuitBreakerPolicy;
  private geminiBreaker: CircuitBreakerPolicy;
  private circuitStates: Map<string, CircuitState> = new Map();

  constructor(
    private deepseekConfig: ModelConfig,
    private geminiConfig: ModelConfig,
  ) {
    // DeepSeek circuit breaker
    this.deepseekBreaker = circuitBreaker(handleAll, {
      halfOpenAfter: deepseekConfig.circuitBreaker.halfOpenAfter,
      breaker: new SamplingBreaker({
        threshold: deepseekConfig.circuitBreaker.threshold,
        duration: deepseekConfig.circuitBreaker.duration,
        minimumRps: deepseekConfig.circuitBreaker.minimumRps,
      }),
    });

    // Gemini circuit breaker (more lenient — it's our last resort)
    this.geminiBreaker = circuitBreaker(handleAll, {
      halfOpenAfter: geminiConfig.circuitBreaker.halfOpenAfter,
      breaker: new SamplingBreaker({
        threshold: geminiConfig.circuitBreaker.threshold,
        duration: geminiConfig.circuitBreaker.duration,
        minimumRps: geminiConfig.circuitBreaker.minimumRps,
      }),
    });

    // DeepSeek policy: retry(1 retry = 2 total attempts) + circuit breaker + timeout(10s)
    // NOTE: Cockatiel maxAttempts counts RETRIES, not total attempts.
    // maxAttempts: 2 = 1 initial + 1 retry = 2 total calls.
    this.deepseekPolicy = wrap(
      retry(handleAll, {
        maxAttempts: 2,
        backoff: new ExponentialBackoff({ initialDelay: 2000 }),
      }),
      this.deepseekBreaker,
      timeout(deepseekConfig.timeoutMs, TimeoutStrategy.Aggressive),
    );

    // Gemini policy: no retry (it's already fallback) + circuit breaker + timeout(15s)
    this.geminiPolicy = wrap(
      this.geminiBreaker,
      timeout(geminiConfig.timeoutMs, TimeoutStrategy.Aggressive),
    );

    // Track circuit breaker state changes
    this.setupStateTracking('deepseek', this.deepseekBreaker);
    this.setupStateTracking('gemini', this.geminiBreaker);
  }

  private setupStateTracking(provider: string, breaker: CircuitBreakerPolicy): void {
    const state: CircuitState = {
      provider,
      state: 'closed',
      failureCount: 0,
    };
    this.circuitStates.set(provider, state);

    breaker.onBreak(() => {
      state.state = 'open';
      state.lastFailure = new Date();
      console.warn(`[AIGateway] ${provider} circuit OPENED — routing to fallback`);
    });

    breaker.onHalfOpen(() => {
      state.state = 'half-open';
      console.info(`[AIGateway] ${provider} circuit HALF-OPEN — testing...`);
    });

    breaker.onReset(() => {
      state.state = 'closed';
      state.lastSuccess = new Date();
      state.failureCount = 0;
      console.info(`[AIGateway] ${provider} circuit CLOSED — back to normal`);
    });
  }

  // Main entry point: try DeepSeek → Gemini → stale cache → error
  async paraphrase(
    request: ParaphraseRequest,
    cacheService: any,          // ResultCacheService
  ): Promise<ParaphraseResult> {
    const start = Date.now();

    // Layer 1: Try DeepSeek (primary)
    try {
      const result = await this.deepseekPolicy.execute(async () => {
        return await this.callDeepSeek(request);
      });
      return { ...result, model: this.getDeepSeekModel(request.userTier), cached: false, latencyMs: Date.now() - start };
    } catch (deepseekError) {
      console.warn(`[AIGateway] DeepSeek failed: ${deepseekError}`);
    }

    // Layer 2: Try Gemini (fallback)
    try {
      const result = await this.geminiPolicy.execute(async () => {
        return await this.callGemini(request);
      });
      return { ...result, model: 'gemini-flash', cached: false, latencyMs: Date.now() - start };
    } catch (geminiError) {
      console.warn(`[AIGateway] Gemini failed: ${geminiError}`);
    }

    // Layer 3: Serve stale cache (use ACTUAL freeze words from request)
    const stale = await cacheService.getStaleParaCache(
      request.text,
      request.mode,
      request.language,
      request.synonymLevel,
      request.freezeWords || [],
    );
    if (stale) {
      console.info(`[AIGateway] Serving stale cache result`);
      return { ...stale, model: 'stale-cache', cached: true, latencyMs: Date.now() - start };
    }

    // Layer 4: Graceful error
    throw new Error('All AI providers are temporarily unavailable. Please try again in 30 seconds.');
  }

  // Tier-based model selection
  private getDeepSeekModel(tier: string): string {
    const freeModel = process.env.DEEPSEEK_MODEL_FREE || 'deepseek-chat';
    const paidModel = process.env.DEEPSEEK_MODEL_PAID || 'deepseek-chat';

    switch (tier) {
      case 'free':
        return freeModel;      // V3.2-Exp in production
      case 'value_plan':
      case 'pro_plan':
      case 'unlimited':
        return paidModel;      // deepseek-chat in production
      default:
        return freeModel;
    }
  }

  private async callDeepSeek(request: ParaphraseRequest): Promise<any> {
    const model = this.getDeepSeekModel(request.userTier);
    const systemPrompt = this.buildSystemPrompt(request.mode, request.language);

    const response = await fetch(this.deepseekConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.deepseekConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.text },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    return this.parseStreamResponse(response);
  }

  private async callGemini(request: ParaphraseRequest): Promise<any> {
    // Uses Gemini Flash via existing integration
    // Implementation depends on current Gemini integration code
    throw new Error('Gemini integration placeholder — connect to existing service');
  }

  // System prompt designed for DeepSeek context caching
  // Long shared prefix (~500 tokens) + short mode suffix (~100 tokens)
  private buildSystemPrompt(mode: string, language: string): string {
    // SHARED PREFIX — identical across all requests in same mode
    // DeepSeek caches this at $0.07/M instead of $0.56/M (87% savings)
    const sharedPrefix = `You are Shothik AI, an academic paraphrasing assistant designed for STEM researchers and university students.

CRITICAL RULES — NEVER VIOLATE THESE:
1. Preserve ALL [STEM_1], [STEM_2], etc. placeholders EXACTLY as they appear in the input. Do NOT modify, move, split, merge, expand, or remove any [STEM_N] placeholder.
2. Each [STEM_N] placeholder represents a LaTeX formula, code block, or technical expression that must remain unchanged.
3. Maintain the same paragraph and sentence structure as the input.
4. Keep academic register and technical vocabulary appropriate for peer-reviewed publications.
5. Do NOT add information that is not in the original text.
6. Do NOT change the meaning of any sentence.
7. Preserve all citations, reference markers, and bibliographic notation.
8. Output ONLY the paraphrased text. Do not add explanations, notes, or metadata.

LANGUAGE: ${language}`;

    // MODE SUFFIX — varies per mode
    const modeSuffixes: Record<string, string> = {
      Standard: 'Rewrite the following text while preserving its meaning. Use different sentence structures and vocabulary where possible, but keep technical terms intact.',
      Fluency: 'Improve the fluency and readability of the following text. Fix awkward phrasing, improve flow between sentences, and ensure natural academic English while preserving all technical content.',
      Humanize: 'Rewrite the following text to sound more naturally human-written. Vary sentence length, use active voice where appropriate, and reduce formulaic academic patterns while maintaining scholarly register.',
      Formal: 'Rewrite the following text in a more formal academic register. Use passive constructions where appropriate, employ precise technical vocabulary, and maintain an objective scholarly tone.',
      Academic: 'Rewrite the following text to meet high academic standards. Use discipline-appropriate terminology, formal register, hedging language where appropriate, and clear logical structure.',
      Creative: 'Creatively rephrase the following text while maintaining its academic meaning. Use varied sentence structures, engaging transitions, and vivid yet scholarly language.',
      Shorten: 'Condense the following text to approximately 60-70% of its original length. Remove redundancies and simplify phrasing while preserving all key information and technical content.',
      Expand: 'Expand the following text to approximately 130-150% of its original length. Add clarifying details, transitional phrases, and supporting context while maintaining academic register.',
      SimplifyIt: 'Simplify the following text for a broader audience. Use shorter sentences, simpler vocabulary, and explain technical concepts in accessible language. Keep [STEM_N] placeholders intact.',
      Paraphrase: 'Deeply paraphrase the following text. Change sentence structure, vocabulary, and organization substantially while preserving the exact same meaning and all technical content.',
    };

    const suffix = modeSuffixes[mode] || modeSuffixes.Standard;
    return `${sharedPrefix}\n\nMODE: ${mode}\nINSTRUCTION: ${suffix}`;
  }

  private async parseStreamResponse(response: Response): Promise<any> {
    // Parse SSE stream from DeepSeek API
    // Implementation: collect chunks, return complete text
    // In production, this would stream to Socket.io
    const text = await response.text();
    return { text, tagging: [], synonyms: [] };
  }

  // Admin endpoint: get circuit breaker states
  getCircuitStates(): CircuitState[] {
    return Array.from(this.circuitStates.values());
  }
}

export default AIGateway;
```

**Environment variables needed:**
```
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL_FREE=deepseek-chat          # Change to V3.2-Exp when ready
DEEPSEEK_MODEL_PAID=deepseek-chat
GEMINI_API_KEY=...                          # Already managed by Replit integration
ENABLE_CIRCUIT_BREAKER=true                 # Feature flag for safe rollout
```

**Circuit breaker configuration (from 50-agent consensus):**
```
DeepSeek:
  threshold: 0.5 (50% failure rate triggers open)
  duration: 60000ms (60s sliding window)
  halfOpenAfter: 30000ms (test every 30s)
  minimumRps: 5 (CB only activates after 5+ requests/sec sustained
                  — prevents tripping on low traffic during off-hours.
                  NOTE: Cockatiel's SamplingBreaker measures actual RPS
                  within the duration window. If traffic is below this,
                  the breaker stays closed regardless of failure rate.)

Gemini (more lenient — it's fallback):
  threshold: 0.6 (60% failure rate)
  duration: 60000ms
  halfOpenAfter: 60000ms (test every 60s — less aggressive)
  minimumRps: 2 (lower threshold since Gemini gets less traffic as fallback)
```

**Verification:**
1. Stop DeepSeek API key temporarily → verify Gemini takes over within 60s
2. Restore DeepSeek → verify traffic returns within 30s
3. Check `/api/admin/circuit-states` endpoint shows correct states

---

### P3: Tier-Based DeepSeek Model Routing (8 hours)

**Implementation integrated into AIGateway above.** The `getDeepSeekModel()` method routes based on user tier:

| Tier | Model | Input Cost | Output Cost |
|------|-------|-----------|-------------|
| free | V3.2-Exp (via env var) | $0.028/M | $0.041/M |
| value_plan (Student $2.99) | deepseek-chat | $0.56/M | $1.68/M |
| pro_plan (Researcher $7.99) | deepseek-chat | $0.56/M | $1.68/M |
| unlimited | deepseek-chat | $0.56/M | $1.68/M |

**Rollout:**
1. Week 1: Set `DEEPSEEK_MODEL_FREE=deepseek-chat` (same model for all, safe)
2. Week 2: Set `DEEPSEEK_MODEL_FREE=deepseek-chat` but route 10% of free traffic to V3.2-Exp via A/B flag
3. Week 3: If V3.2-Exp quality is acceptable, set `DEEPSEEK_MODEL_FREE=deepseek-v3.2-exp` for all free users
4. Monitor: cache hit rates, latency, user feedback

---

## Phase 3 — Cost Protection: Rate Limits + STEM Masking

**Duration:** Weeks 2-3 (14 hours, parallel with Phase 2)  
**Where:** Backend + Frontend  
**Dependencies:** P1 (Redis cache for counters)

### P4: Rate Limits with LOG_ONLY Mode (6 hours)

**Implementation:**

```typescript
// src/middleware/rate-limiter.middleware.ts
// Adapted from LanguageTool's UserLimits pattern

import Redis from 'ioredis';

type LimitEnforcementMode = 'LOG_ONLY' | 'WARN' | 'BLOCK';
type UserTier = 'free' | 'value_plan' | 'pro_plan' | 'unlimited';

interface TierLimits {
  maxWordsPerDay: number;
  maxRequestsPerDay: number;
  maxTextLength: number;           // words per single request
  maxConcurrentRequests: number;
  allowedModes: string[];
}

const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: {
    maxWordsPerDay: 500,
    maxRequestsPerDay: 10,
    maxTextLength: 500,
    maxConcurrentRequests: 1,
    allowedModes: ['Standard', 'Fluency'],
  },
  value_plan: {
    maxWordsPerDay: 5000,
    maxRequestsPerDay: 100,
    maxTextLength: 3000,
    maxConcurrentRequests: 2,
    allowedModes: ['Standard', 'Fluency', 'Humanize', 'Formal', 'Academic',
                   'Creative', 'Shorten', 'Expand', 'SimplifyIt', 'Paraphrase'],
  },
  pro_plan: {
    maxWordsPerDay: 25000,
    maxRequestsPerDay: 300,
    maxTextLength: 10000,
    maxConcurrentRequests: 3,
    allowedModes: ['Standard', 'Fluency', 'Humanize', 'Formal', 'Academic',
                   'Creative', 'Shorten', 'Expand', 'SimplifyIt', 'Paraphrase'],
  },
  unlimited: {
    maxWordsPerDay: Infinity,
    maxRequestsPerDay: 1000,
    maxTextLength: 50000,
    maxConcurrentRequests: 5,
    allowedModes: ['Standard', 'Fluency', 'Humanize', 'Formal', 'Academic',
                   'Creative', 'Shorten', 'Expand', 'SimplifyIt', 'Paraphrase'],
  },
};

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    wordsToday: number;
    requestsToday: number;
    concurrent: number;
  };
  limits: TierLimits;
  enforcement: LimitEnforcementMode;
}

class RateLimiterService {
  private redis: Redis;
  private mode: LimitEnforcementMode;

  constructor(redis: Redis) {
    this.redis = redis;
    this.mode = (process.env.RATE_LIMIT_MODE as LimitEnforcementMode) || 'LOG_ONLY';
  }

  async checkLimits(
    userId: string,
    tier: UserTier,
    wordCount: number,
    mode: string
  ): Promise<RateLimitResult> {
    const limits = TIER_LIMITS[tier];
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Get current usage (atomic Redis operations)
    const [wordsToday, requestsToday, concurrent] = await Promise.all([
      this.redis.get(`ratelimit:${userId}:words:${today}`),
      this.redis.get(`ratelimit:${userId}:requests:${today}`),
      this.redis.get(`ratelimit:${userId}:concurrent`),
    ]);

    const usage = {
      wordsToday: parseInt(wordsToday || '0', 10),
      requestsToday: parseInt(requestsToday || '0', 10),
      concurrent: parseInt(concurrent || '0', 10),
    };

    // Check each limit
    const violations: string[] = [];

    if (usage.wordsToday + wordCount > limits.maxWordsPerDay) {
      violations.push(`Daily word limit exceeded (${usage.wordsToday + wordCount}/${limits.maxWordsPerDay})`);
    }
    if (usage.requestsToday >= limits.maxRequestsPerDay) {
      violations.push(`Daily request limit exceeded (${usage.requestsToday}/${limits.maxRequestsPerDay})`);
    }
    if (wordCount > limits.maxTextLength) {
      violations.push(`Text too long (${wordCount}/${limits.maxTextLength} words)`);
    }
    if (usage.concurrent >= limits.maxConcurrentRequests) {
      violations.push(`Too many concurrent requests (${usage.concurrent}/${limits.maxConcurrentRequests})`);
    }
    if (!limits.allowedModes.includes(mode)) {
      violations.push(`Mode "${mode}" not available on ${tier} plan`);
    }

    if (violations.length > 0) {
      const reason = violations.join('; ');

      // LanguageTool LimitEnforcementMode pattern
      switch (this.mode) {
        case 'LOG_ONLY':
          console.info(`[RateLimit] LOG: ${userId} (${tier}) would be limited: ${reason}`);
          return { allowed: true, reason, currentUsage: usage, limits, enforcement: this.mode };

        case 'WARN':
          console.warn(`[RateLimit] WARN: ${userId} (${tier}) approaching limits: ${reason}`);
          return { allowed: true, reason, currentUsage: usage, limits, enforcement: this.mode };

        case 'BLOCK':
          console.warn(`[RateLimit] BLOCK: ${userId} (${tier}) blocked: ${reason}`);
          return { allowed: false, reason, currentUsage: usage, limits, enforcement: this.mode };
      }
    }

    return { allowed: true, currentUsage: usage, limits, enforcement: this.mode };
  }

  // Call AFTER request is processed to update counters
  async recordUsage(userId: string, wordCount: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    const pipeline = this.redis.pipeline();

    // Increment word count
    pipeline.incrby(`ratelimit:${userId}:words:${today}`, wordCount);
    pipeline.expire(`ratelimit:${userId}:words:${today}`, 86400);

    // Increment request count
    pipeline.incr(`ratelimit:${userId}:requests:${today}`);
    pipeline.expire(`ratelimit:${userId}:requests:${today}`, 86400);

    await pipeline.exec();
  }

  // Call at START of request — TTL prevents orphaned counters on process crash
  async incrementConcurrent(userId: string): Promise<void> {
    const key = `ratelimit:${userId}:concurrent`;
    await this.redis.incr(key);
    // Safety TTL: if process crashes without decrementing,
    // key auto-expires after 5 minutes (max request duration)
    await this.redis.expire(key, 300);
  }

  // Call at END of request (MUST be in finally block)
  async decrementConcurrent(userId: string): Promise<void> {
    const key = `ratelimit:${userId}:concurrent`;
    const result = await this.redis.decr(key);
    if (result < 0) {
      await this.redis.set(key, '0');
    }
  }

  // USAGE PATTERN — callers MUST use try/finally:
  //
  //   await rateLimiter.incrementConcurrent(userId);
  //   try {
  //     const result = await aiGateway.paraphrase(request, cacheService);
  //     await rateLimiter.recordUsage(userId, wordCount);
  //     return result;
  //   } finally {
  //     await rateLimiter.decrementConcurrent(userId);
  //   }
  //
  // The 5-minute TTL on the concurrent key is a safety net:
  // if the process crashes mid-request, the key auto-expires
  // rather than permanently blocking the user.
}

export default RateLimiterService;
```

**Rollout schedule:**
```
Week 1: RATE_LIMIT_MODE=LOG_ONLY  → Observe traffic patterns, validate limits are reasonable
Week 2: RATE_LIMIT_MODE=WARN      → Show soft warning banner to users approaching limits
Week 3: RATE_LIMIT_MODE=BLOCK     → Enforce hard limits with upgrade prompt
```

---

### P5: STEM Mask-Then-Prompt (8 hours)

**Frontend changes (Next.js app, this repo):**

The existing `stemPreprocessor.ts` already detects LaTeX and code blocks. We add a masking function:

```typescript
// Addition to src/services/stemPreprocessor.ts

interface STEMMaskResult {
  maskedText: string;
  mapping: Record<string, string>;  // { "STEM_1": "E=mc^2", "STEM_2": "```python..." }
  regionCount: number;
}

export function maskSTEMRegions(text: string): STEMMaskResult {
  const regions = detectSTEMRegions(text); // existing function
  const mapping: Record<string, string> = {};

  // Filter out nested/overlapping regions (keep outermost only)
  const sorted = [...regions].sort((a, b) => a.start - b.start);
  const filtered: typeof regions = [];
  let lastEnd = -1;
  for (const region of sorted) {
    if (region.start >= lastEnd) {
      filtered.push(region);
      lastEnd = region.end;
    }
  }

  // Build result incrementally to avoid index drift from escaping
  // Each gap between regions gets literal [STEM_N] escaped, regions get placeholders
  let counter = 1;
  let result = '';
  let cursor = 0;

  for (const region of filtered) {
    // Escape any literal [STEM_N] in the gap before this region
    const gap = text.substring(cursor, region.start);
    result += gap.replace(/\[STEM_\d+\]/g, (match) => `\\${match}`);

    const placeholder = `[STEM_${counter}]`;
    const original = text.substring(region.start, region.end);
    mapping[`STEM_${counter}`] = original;
    result += placeholder;
    counter++;
    cursor = region.end;
  }

  // Escape literals in tail after last region
  const tail = text.substring(cursor);
  result += tail.replace(/\[STEM_\d+\]/g, (match) => `\\${match}`);

  return { maskedText: result, mapping, regionCount: counter - 1 };
}
```

**Backend changes (paraphrase microservice, DigitalOcean):**

```typescript
// Addition to AI Gateway post-processing

function unmaskSTEMRegions(paraphrasedText: string, mapping: Record<string, string>): {
  text: string;
  validationPassed: boolean;
  missingPlaceholders: string[];
  duplicatedPlaceholders: string[];
} {
  let result = paraphrasedText;
  const missing: string[] = [];
  const duplicated: string[] = [];

  for (const [key, original] of Object.entries(mapping)) {
    const placeholder = `[${key}]`;
    const occurrences = (result.match(new RegExp(`\\[${key}\\]`, 'g')) || []).length;

    if (occurrences === 0) {
      missing.push(key);
    } else if (occurrences > 1) {
      duplicated.push(key);
      // Replace only the FIRST occurrence, leave others as-is
      // (duplicated placeholders indicate model confusion)
      result = result.replace(placeholder, original);
    } else {
      result = result.replace(placeholder, original);
    }
  }

  // Un-escape any literal [STEM_N] that were in the original input
  result = result.replace(/\\\[STEM_\d+\]/g, (match) => match.substring(1));

  return {
    text: result,
    validationPassed: missing.length === 0 && duplicated.length === 0,
    missingPlaceholders: missing,
    duplicatedPlaceholders: duplicated,
  };
}

// IMPORTANT: When calling stale cache as fallback, pass the ACTUAL freeze words
// from the original request, not an empty array. The AIGateway.paraphrase() method
// must propagate freezeWords through the full chain:
//
//   const stale = await cacheService.getStaleParaCache(
//     request.text, request.mode, request.language,
//     request.synonymLevel, request.freezeWords  // ← NOT []
//   );
```

**Validation strategy:**
- If ALL placeholders preserved → unmask and return (happy path)
- If 1-2 missing → retry with stricter prompt ("You MUST include all [STEM_N] placeholders")
- If retry also fails → return original sentences for affected sections + paraphrased text for rest
- Log all validation failures to `cache:metrics:stem:validation_failures`

---

## Phase 4 — Optimization & Frontend Fixes

**Duration:** Week 4 (9 hours)  
**Where:** Frontend (this repo) + Backend  
**Dependencies:** Phase 2 (model router must be live)

### P6: DeepSeek System Prompt Caching (4 hours)

Already implemented in AIGateway's `buildSystemPrompt()` method above. The key optimization:

1. **Shared prefix** (~500 tokens): Identity, rules, STEM preservation instructions → CACHED at $0.07/M
2. **Mode suffix** (~100 tokens): Mode-specific instructions → NOT cached ($0.56/M, but small)
3. **User text** (variable): Never cached ($0.56/M)

**Result:** For a typical 1,000-token input, ~500 tokens (50%) are cached, saving 87% on those tokens.

**Cost savings per request:**
```
Without caching: 1,000 × $0.56/M = $0.00056
With caching:    500 × $0.07/M + 500 × $0.56/M = $0.000315
Savings: $0.000245 per request (44% reduction on input costs)
```

### P7: Socket.io Disconnect Fix (1 hour)

**File:** `src/components/tools/paraphrase/ParaphraseContend.jsx`

**Current code (line ~784):** Socket cleanup doesn't disconnect:
```javascript
// We don't disconnect the socket here
```

**Fix:** Add proper disconnect to the useEffect cleanup:
```javascript
return () => {
  socket.off("connect");
  socket.off("disconnect");
  socket.off("paraphrase-plain");
  socket.off("paraphrase-tagging");
  socket.off("paraphrase-synonyms");
  socket.disconnect();           // ADD THIS
  socketRef.current = null;      // ADD THIS
  socketIdRef.current = null;    // ADD THIS
};
```

**This prevents memory leaks from zombie socket connections accumulating over time.**

---

## Phase 5 — Operations & Rollout

**Duration:** Weeks 5-6 (14 hours)  
**Where:** Backend + Admin panel  
**Dependencies:** All previous phases

### P8: Admin Dashboard (8 hours)

**Endpoint: `GET /api/admin/dashboard`**

Returns:
```json
{
  "cache": {
    "stem": { "hits": 1234, "misses": 567, "hitRate": 0.685 },
    "freeze": { "hits": 890, "misses": 445, "hitRate": 0.667 },
    "para": { "hits": 234, "misses": 1100, "hitRate": 0.175 }
  },
  "models": {
    "deepseek_v32exp_requests": 4500,
    "deepseek_chat_requests": 2100,
    "gemini_fallback_requests": 45,
    "deepseek_percentage": 99.3,
    "gemini_percentage": 0.7
  },
  "circuitBreakers": {
    "deepseek": { "state": "closed", "failureCount": 0 },
    "gemini": { "state": "closed", "failureCount": 0 }
  },
  "rateLimits": {
    "LOG_triggers": 156,
    "WARN_triggers": 0,
    "BLOCK_triggers": 0,
    "topUsers": [
      { "userId": "...", "tier": "free", "requestsToday": 10 }
    ]
  },
  "costs": {
    "estimatedToday": "$1.23",
    "estimatedMonth": "$36.90",
    "byTier": {
      "free": "$0.15",
      "student": "$0.55",
      "researcher": "$0.53"
    }
  },
  "stemValidation": {
    "totalRequests": 450,
    "validationFailures": 12,
    "failureRate": 0.027
  }
}
```

### P9: Rate Limit WARN → BLOCK Migration (2 hours)

After 2 weeks of LOG_ONLY data:
1. Review logs for false positives (legitimate users hitting limits)
2. Adjust limits if needed (e.g., increase student daily words if too restrictive)
3. Deploy WARN mode → monitor user feedback for 1 week
4. Deploy BLOCK mode → monitor churn/upgrade rates

### P10: A/B Testing Framework (4 hours)

Simple env-var-based feature flags (LanguageTool pattern):

```bash
# Feature flags (env vars)
AB_FREE_MODEL=deepseek-chat          # or deepseek-v3.2-exp
AB_FREE_MODEL_PERCENTAGE=100         # % of free users getting this model
AB_ENABLE_STEM_MASKING=true          # gradual rollout
AB_ENABLE_RATE_LIMITS=true           # kill switch
AB_CIRCUIT_BREAKER_THRESHOLD=0.5     # tunable without deploy
```

**Measurement per variant:**
- P50/P95 latency
- STEM placeholder validation success rate
- User paraphrase acceptance rate (do they click "Use this result"?)
- Cost per request

---

## Timeline Summary

```
Week 1:  P0 (Metrics) + P1 (Cache)           ─── Foundation
Week 2:  P2 (Circuit Breaker) + P4 (Rate Limits, parallel)
Week 3:  P3 (Model Routing) + P5 (STEM Masking, parallel)
Week 4:  P6 (Prompt Caching) + P7 (Socket.io Fix)  ─── Quick wins
Week 5:  P8 (Admin Dashboard) + P9 (WARN rollout)
Week 6:  P10 (A/B Testing) + P9 (BLOCK rollout)  ─── Operational maturity
```

**Total: 63 engineering hours, 6 weeks**

---

## DigitalOcean Infrastructure Notes

**Current setup:**
- Droplets: Paraphrase microservice, main API, other services
- Managed Redis: Shared across services (cache + rate limits + metrics)
- Managed MongoDB: User data, history, configurations

**New requirements:**
- Redis memory: Additional ~50-200MB for cache namespaces (depends on text volume)
- No new Droplets needed (all changes are code, not infrastructure)
- No GPU needed (DeepSeek + Gemini are cloud APIs)

**Estimated DigitalOcean costs:** $400-800/mo for current infra (unchanged by this plan)

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| DeepSeek V3.2-Exp deprecated | Medium | Low | Env var model name, switch in seconds |
| DeepSeek pricing increase | Low | Medium | Gemini is fallback, can become primary if cheaper |
| Cache hit rate < 15% | Low | Medium | Monitor via metrics, adjust TTLs |
| STEM placeholder lost by model | Medium | Low | Post-processing validation + retry |
| Rate limits too restrictive | Medium | Medium | LOG_ONLY → WARN → BLOCK rollout |
| Both DeepSeek + Gemini down simultaneously | Very Low | High | Stale cache serves, 72h shadow TTL |
| Redis memory exhaustion | Low | Medium | Weight-based eviction, namespace size limits |

---

## Files Changed Summary

**Backend (paraphrase microservice on DigitalOcean):**
- NEW: `src/services/cache-metrics.service.ts`
- NEW: `src/services/result-cache.service.ts`
- NEW: `src/services/ai-gateway.service.ts`
- NEW: `src/middleware/rate-limiter.middleware.ts`
- MODIFY: Request handler to integrate cache → gateway → post-processing
- MODIFY: Socket.io handler to use new AI gateway
- NEW: `src/routes/admin.routes.ts` (dashboard endpoint)

**Frontend (this Next.js repo on Replit):**
- MODIFY: `src/services/stemPreprocessor.ts` — add `maskSTEMRegions()` function
- MODIFY: `src/components/tools/paraphrase/ParaphraseContend.jsx` — Socket.io disconnect fix (5 lines)

**Environment variables (DigitalOcean):**
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_API_URL`
- `DEEPSEEK_MODEL_FREE`
- `DEEPSEEK_MODEL_PAID`
- `ENABLE_CIRCUIT_BREAKER`
- `RATE_LIMIT_MODE`
- `AB_FREE_MODEL_PERCENTAGE`
