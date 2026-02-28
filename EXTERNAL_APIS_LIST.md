# External APIs Required for Shothik Platform

## 🔑 Core APIs (Required for Launch)

| API | Purpose | Environment Variable | Get From |
|-----|---------|---------------------|----------|
| **Kimi AI** | Primary LLM for all AI features | `KIMI_API_KEY` | https://platform.moonshot.cn |
| **Clerk** | Authentication & user management | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | https://dashboard.clerk.com |
| **Convex** | Backend database & functions | `CONVEX_DEPLOYMENT`, `CONVEX_URL` | https://dashboard.convex.dev |
| **Stripe** | Payments & payouts | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | https://dashboard.stripe.com |

---

## 🤖 AI/LLM APIs (Required)

| API | Purpose | Use Case | Fallback Priority |
|-----|---------|----------|-------------------|
| **Kimi (Moonshot)** | Primary LLM | All AI features, chat, content generation | Primary |
| **DeepSeek** | Coding tasks, reasoning | Code generation, complex analysis | Fallback 1 |
| **Google Gemini** | Fallback LLM | When Kimi/DeepSeek unavailable | Fallback 2 |
| **OpenAI** | Optional fallback | GPT-4 for specific tasks | Optional |
| **Anthropic Claude** | Optional fallback | Claude-3 for analysis | Optional |

**Environment Variables:**
```env
KIMI_API_KEY=your-kimi-key
KIMI_BASE_URL=https://api.moonshot.cn/v1

DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com

GEMINI_API_KEY=your-gemini-key

OPENAI_API_KEY=sk-... (optional)
ANTHROPIC_API_KEY=sk-ant-... (optional)
```

---

## 🎬 Animation Service APIs (Required for Video Generation)

| API | Purpose | Cost | Environment Variable |
|-----|---------|------|---------------------|
| **ElevenLabs** | Text-to-speech, voiceovers | ~$0.08-0.30/min | `ELEVENLABS_API_KEY` |
| **Suno AI** | AI music generation | ~$0.50-2.00/song | `SUNO_API_KEY` |
| **Replicate** | Video generation models | Varies by model | `REPLICATE_API_TOKEN` (optional) |

**Note:** Suno has graceful fallback - videos generate without music if Suno fails.

---

## 🔍 Research Service APIs (Required for Research Agent)

| API | Purpose | Free Tier | Environment Variable |
|-----|---------|-----------|---------------------|
| **SerpAPI** | Google Search results | 100 searches/month | `SERPAPI_KEY` |
| **Semantic Scholar** | Academic paper search | Free | `SEMANTIC_SCHOLAR_KEY` (optional) |
| **ArXiv** | Preprint papers | Free | No key needed |
| **CrossRef** | Citation data | Free | No key needed |

---

## 💾 Infrastructure APIs (Required)

| API | Purpose | Environment Variable | Provider |
|-----|---------|---------------------|----------|
| **Redis** | Caching, rate limiting | `REDIS_URL`, `REDIS_TOKEN` | Upstash / Redis Cloud |
| **Cloudflare R2 / AWS S3** | File storage | `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_BUCKET` | Cloudflare / AWS |

---

## 📊 Analytics & Monitoring (Optional but Recommended)

| API | Purpose | Free Tier | Environment Variable |
|-----|---------|-----------|---------------------|
| **PostHog** | Product analytics | 1M events/month | `NEXT_PUBLIC_POSTHOG_KEY` |
| **Sentry** | Error tracking | 5k errors/month | `NEXT_PUBLIC_SENTRY_DSN` |
| **UptimeRobot** | Uptime monitoring | 50 monitors | `UPTIME_ROBOT_API_KEY` |

---

## 🌐 Regional Payment APIs (For South Asia Launch)

| API | Region | Purpose | Environment Variable |
|-----|--------|---------|---------------------|
| **bKash** | Bangladesh | Mobile payments | `BKASH_API_KEY`, `BKASH_SECRET` |
| **Razorpay** | India | UPI, cards, wallets | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| **Paystack** | Nigeria | Cards, bank transfer | `PAYSTACK_SECRET_KEY` |

---

## 🧪 Testing APIs (Development Only)

| API | Purpose | Environment Variable |
|-----|---------|---------------------|
| **Stripe (Test)** | Test payments | `STRIPE_SECRET_KEY` (sk_test_...) |
| **Clerk (Test)** | Test auth | `CLERK_SECRET_KEY` (test mode) |
| **Kimi (Test)** | Test AI | Same as production |

---

## 📋 Complete Environment File Template

```env
# ============================================
# CORE (Required)
# ============================================

# Convex
CONVEX_DEPLOYMENT=your-deployment-name
CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/register

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ============================================
# AI/LLM (Required - at least one)
# ============================================

KIMI_API_KEY=your-kimi-key
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2-thinking

DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com

GEMINI_API_KEY=your-gemini-key

# Optional fallbacks
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# ============================================
# ANIMATION SERVICE (Required for video)
# ============================================

ELEVENLABS_API_KEY=your-elevenlabs-key
SUNO_API_KEY=your-suno-key
# REPLICATE_API_TOKEN=your-replicate-token (optional)

# ============================================
# RESEARCH SERVICE (Required for research)
# ============================================

SERPAPI_KEY=your-serpapi-key
# SEMANTIC_SCHOLAR_KEY=your-key (optional)

# ============================================
# INFRASTRUCTURE (Required)
# ============================================

REDIS_URL=redis://your-redis-url
REDIS_TOKEN=your-redis-token

# File Storage (Cloudflare R2)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=shothik-uploads
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com

# ============================================
# ANALYTICS (Optional)
# ============================================

# NEXT_PUBLIC_POSTHOG_KEY=phc_...
# NEXT_PUBLIC_SENTRY_DSN=https://...
# UPTIME_ROBOT_API_KEY=...

# ============================================
# REGIONAL PAYMENTS (Optional - South Asia)
# ============================================

# bKash (Bangladesh)
# BKASH_API_KEY=...
# BKASH_SECRET=...
# BKASH_USERNAME=...
# BKASH_PASSWORD=...

# Razorpay (India)
# RAZORPAY_KEY_ID=rzp_...
# RAZORPAY_KEY_SECRET=...

# ============================================
# FEATURE FLAGS
# ============================================

ENABLE_AI_SUGGESTIONS=true
ENABLE_NEURAL_ANALYSIS=true
ENABLE_NOBEL_ANALYSIS=true
ENABLE_ACCESSIBILITY_CHECK=true

# ============================================
# APP CONFIG
# ============================================

NEXT_PUBLIC_APP_URL=https://shothik.ai
NEXT_PUBLIC_STRIPE_MODE=production
```

---

## 💰 Estimated Monthly Costs

| API | Usage | Est. Cost |
|-----|-------|-----------|
| Kimi AI | 1M tokens/day | ~$200-400 |
| DeepSeek | 500K tokens/day | ~$50-100 |
| ElevenLabs | 1000 min audio | ~$80-300 |
| Suno AI | 500 songs | ~$250-1000 |
| SerpAPI | 1000 searches | ~$50 |
| Redis (Upstash) | 10GB | ~$20 |
| Cloudflare R2 | 100GB | ~$5 |
| Stripe | Processing | 2.9% + 30¢ per transaction |
| **Total** | | **~$655-1875/month** |

---

## 🎯 Priority Order for Setup

### Phase 1: Launch (Must Have)
1. ✅ Kimi API
2. ✅ Clerk Auth
3. ✅ Convex
4. ✅ Stripe
5. ✅ Redis

### Phase 2: Full Features
6. DeepSeek API (fallback)
7. Gemini API (fallback)
8. ElevenLabs
9. SerpAPI
10. File Storage (R2/S3)

### Phase 3: Enhancements
11. Suno AI
12. PostHog
13. Sentry
14. Regional payments (bKash, Razorpay)

---

## 🔗 Quick Links to Get API Keys

| Service | URL |
|---------|-----|
| Kimi (Moonshot) | https://platform.moonshot.cn |
| Clerk | https://dashboard.clerk.com |
| Convex | https://dashboard.convex.dev |
| Stripe | https://dashboard.stripe.com |
| DeepSeek | https://platform.deepseek.com |
| Google AI | https://aistudio.google.com/app/apikey |
| ElevenLabs | https://elevenlabs.io/app/settings/api-keys |
| Suno | https://suno.com |
| SerpAPI | https://serpapi.com/manage-api-key |
| Upstash Redis | https://console.upstash.com |
| Cloudflare | https://dash.cloudflare.com |

---

**Need help setting up any of these APIs?**
