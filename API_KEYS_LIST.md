# Complete API Keys List - Shothik Platform

**Total APIs: 20+**
**Last Updated:** February 28, 2026

---

## 🔴 TIER 1: CRITICAL (5 APIs)

| # | API Name | Environment Variable | Purpose | Get From |
|---|----------|---------------------|---------|----------|
| 1 | **Kimi AI** | `KIMI_API_KEY` | Primary LLM | platform.moonshot.cn |
| 2 | **Clerk** | `CLERK_SECRET_KEY` | Authentication | dashboard.clerk.com |
| 3 | **Convex** | `CONVEX_DEPLOYMENT` | Database | dashboard.convex.dev |
| 4 | **Stripe** | `STRIPE_SECRET_KEY` | Payments | dashboard.stripe.com |
| 5 | **Redis** | `REDIS_URL` | Caching | console.upstash.com |

---

## 🟡 TIER 2: AI FALLBACKS (4 APIs)

| # | API Name | Environment Variable | Purpose | Get From |
|---|----------|---------------------|---------|----------|
| 6 | **DeepSeek** | `DEEPSEEK_API_KEY` | Coding/Reasoning | platform.deepseek.com |
| 7 | **Gemini** | `GEMINI_API_KEY` | Fallback LLM | aistudio.google.com |
| 8 | **OpenAI** | `OPENAI_API_KEY` | Optional LLM | platform.openai.com |
| 9 | **Anthropic** | `ANTHROPIC_API_KEY` | Optional LLM | console.anthropic.com |

---

## 🟢 TIER 3: ANIMATION (3 APIs)

| # | API Name | Environment Variable | Purpose | Get From |
|---|----------|---------------------|---------|----------|
| 10 | **ElevenLabs** | `ELEVENLABS_API_KEY` | Voice/TTS | elevenlabs.io |
| 11 | **Suno AI** | `SUNO_API_KEY` | Music | suno.com |
| 12 | **Replicate** | `REPLICATE_API_TOKEN` | Video Models | replicate.com |

---

## 🔵 TIER 4: RESEARCH (2 APIs)

| # | API Name | Environment Variable | Purpose | Get From |
|---|----------|---------------------|---------|----------|
| 13 | **SerpAPI** | `SERPAPI_KEY` | Google Search | serpapi.com |
| 14 | **Semantic Scholar** | `SEMANTIC_SCHOLAR_KEY` | Academic Papers | semanticscholar.org |

---

## 🟣 TIER 5: STORAGE (1 API)

| # | API Name | Environment Variable | Purpose | Get From |
|---|----------|---------------------|---------|----------|
| 15 | **Cloudflare R2** | `R2_SECRET_ACCESS_KEY` | File Storage | dash.cloudflare.com |

---

## 🟤 TIER 6: ANALYTICS (3 APIs)

| # | API Name | Environment Variable | Purpose | Get From |
|---|----------|---------------------|---------|----------|
| 16 | **PostHog** | `NEXT_PUBLIC_POSTHOG_KEY` | Analytics | posthog.com |
| 17 | **Sentry** | `NEXT_PUBLIC_SENTRY_DSN` | Error Tracking | sentry.io |
| 18 | **UptimeRobot** | `UPTIME_ROBOT_API_KEY` | Monitoring | uptimerobot.com |

---

## 🌏 TIER 7: REGIONAL PAYMENTS (3 APIs)

| # | API Name | Environment Variable | Purpose | Get From |
|---|----------|---------------------|---------|----------|
| 19 | **bKash** | `BKASH_API_KEY` | Bangladesh | developer.bka.sh |
| 20 | **Razorpay** | `RAZORPAY_KEY_ID` | India | razorpay.com |
| 21 | **Paystack** | `PAYSTACK_SECRET_KEY` | Nigeria | paystack.com |

---

## 📊 SUMMARY: 21 APIs Total

| Tier | Category | Count | Required |
|------|----------|-------|----------|
| 1 | Core | 5 | ✅ Yes |
| 2 | AI Fallbacks | 4 | 🟡 Recommended |
| 3 | Animation | 3 | 🟢 For Video |
| 4 | Research | 2 | 🟢 For Research |
| 5 | Storage | 1 | ✅ Yes |
| 6 | Analytics | 3 | 🟡 Recommended |
| 7 | Payments | 3 | 🟢 Regional |
| **Total** | | **21** | **5 Critical** |

---

## 💰 Estimated Monthly Costs

| Tier | APIs | Est. Cost |
|------|------|-----------|
| Core | Kimi + Redis | $200-500 |
| AI | DeepSeek + Gemini | $50-100 |
| Animation | ElevenLabs + Suno | $100-500 |
| Research | SerpAPI | $50 |
| Storage | R2 | $5-20 |
| Analytics | PostHog + Sentry | Free-50 |
| **Total** | | **$405-1,220/mo** |

---

## 🚀 Priority Order to Get Keys

1. **Convex** - Start here (free, instant)
2. **Clerk** - Auth is critical (free tier)
3. **Kimi** - Primary AI (get credits)
4. **Stripe** - For payments (test mode free)
5. **Redis** - Upstash free tier
6. **DeepSeek** - Cheap fallback
7. **Gemini** - Free fallback
8. **ElevenLabs** - For animation
9. **SerpAPI** - For research
10. **R2** - For file storage

---

**Start with Tier 1 (5 APIs) for MVP launch!**
