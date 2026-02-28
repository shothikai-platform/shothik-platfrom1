# Complete API Keys List - Shothik Platform

**Total APIs Required: 20+**
**Last Updated:** February 28, 2026

---

## 🔴 TIER 1: CRITICAL (Required for Launch)

### 1. KIMI AI (Moonshot)
```env
KIMI_API_KEY=your-kimi-api-key
KIMI_BASE_URL=https://api.moonshot.cn/v1
KIMI_MODEL=kimi-k2-thinking
```
**Purpose:** Primary LLM for all AI features  
**Get:** https://platform.moonshot.cn

---

### 2. CLERK AUTHENTICATION
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/register
```
**Purpose:** User authentication  
**Get:** https://dashboard.clerk.com

---

### 3. CONVEX DATABASE
```env
CONVEX_DEPLOYMENT=your-deployment-name
CONVEX_URL=https://your-deployment.convex.cloud
```
**Purpose:** Backend database  
**Get:** https://dashboard.convex.dev

---

### 4. STRIPE PAYMENTS
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
**Purpose:** Payments, subscriptions  
**Get:** https://dashboard.stripe.com

---

### 5. REDIS CACHE
```env
REDIS_URL=redis://your-redis-url
REDIS_TOKEN=your-redis-token
```
**Purpose:** Caching, rate limiting  
**Get:** https://console.upstash.com

---

## 🟡 TIER 2: AI FALLBACKS

### 6. DEEPSEEK AI
```env
DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```
**Purpose:** Coding, reasoning fallback  
**Get:** https://platform.deepseek.com

---

### 7. GOOGLE GEMINI
```env
GEMINI_API_KEY=your-gemini-key
```
**Purpose:** General fallback LLM  
**Get:** https://aistudio.google.com/app/apikey

---

### 8. OPENAI (Optional)
```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
```
**Purpose:** Optional fallback  
**Get:** https://platform.openai.com

---

### 9. ANTHROPIC CLAUDE (Optional)
```env
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-opus-20240229
```
**Purpose:** Analysis fallback  
**Get:** https://console.anthropic.com

---

## 🟢 TIER 3: ANIMATION SERVICE

### 10. ELEVENLABS
```env
ELEVENLABS_API_KEY=your-elevenlabs-key
```
**Purpose:** Text-to-speech  
**Get:** https://elevenlabs.io/app/settings/api-keys

---

### 11. SUNO AI
```env
SUNO_API_KEY=your-suno-key
```
**Purpose:** AI music generation  
**Get:** https://suno.com

---

### 12. REPLICATE (Optional)
```env
REPLICATE_API_TOKEN=your-replicate-token
```
**Purpose:** Video models  
**Get:** https://replicate.com/account/api-tokens

---

## 🔵 TIER 4: RESEARCH SERVICE

### 13. SERPAPI
```env
SERPAPI_KEY=your-serpapi-key
```
**Purpose:** Google Search  
**Get:** https://serpapi.com/manage-api-key

---

### 14. SEMANTIC SCHOLAR (Optional)
```env
SEMANTIC_SCHOLAR_KEY=your-key
```
**Purpose:** Academic papers  
**Get:** https://www.semanticscholar.org/product/api

---

## 🟣 TIER 5: FILE STORAGE

### 15. CLOUDFLARE R2
```env
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=shothik-uploads
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```
**Purpose:** File uploads  
**Get:** https://dash.cloudflare.com

---

## 🟤 TIER 6: ANALYTICS

### 16. POSTHOG
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_...
```
**Purpose:** Product analytics  
**Get:** https://app.posthog.com

---

### 17. SENTRY
```env
NEXT_PUBLIC_SENTRY_DSN=https://...
```
**Purpose:** Error tracking  
**Get:** https://sentry.io

---

### 18. UPTIME ROBOT (Optional)
```env
UPTIME_ROBOT_API_KEY=your-key
```
**Purpose:** Uptime monitoring  
**Get:** https://uptimerobot.com/dashboard

---

## 🌏 TIER 7: REGIONAL PAYMENTS

### 19. BKASH (Bangladesh)
```env
BKASH_API_KEY=your-bkash-key
BKASH_SECRET=your-bkash-secret
BKASH_USERNAME=your-username
BKASH_PASSWORD=your-password
```
**Purpose:** Bangladesh payments  
**Get:** https://developer.bka.sh

---

### 20. RAZORPAY (India)
```env
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=your-secret
```
**Purpose:** India payments  
**Get:** https://dashboard.razorpay.com

---

### 21. PAYSTACK (Nigeria - Optional)
```env
PAYSTACK_SECRET_KEY=sk_...
```
**Purpose:** Nigeria payments  
**Get:** https://dashboard.paystack.com

---

## 📊 API KEYS SUMMARY

| Tier | APIs | Required | Purpose |
|------|------|----------|---------|
| 🔴 Critical | 5 | Yes | Core platform |
| 🟡 AI Fallbacks | 4 | Recommended | LLM redundancy |
| 🟢 Animation | 3 | For video | Video generation |
| 🔵 Research | 2 | For research | Academic search |
| 🟣 Storage | 1 | Yes | File uploads |
| 🟤 Analytics | 3 | Optional | Monitoring |
| 🌏 Regional | 3 | Optional | Local payments |
| **TOTAL** | **21** | **8 Required** | |

---

## 🔗 Quick Links

| Service | URL |
|---------|-----|
| Kimi | https://platform.moonshot.cn |
| Clerk | https://dashboard.clerk.com |
| Convex | https://dashboard.convex.dev |
| Stripe | https://dashboard.stripe.com |
| Upstash | https://console.upstash.com |
| DeepSeek | https://platform.deepseek.com |
| Google AI | https://aistudio.google.com/app/apikey |
| ElevenLabs | https://elevenlabs.io |
| Suno | https://suno.com |
| SerpAPI | https://serpapi.com |
| Cloudflare | https://dash.cloudflare.com |
| PostHog | https://app.posthog.com |
| Sentry | https://sentry.io |
| bKash | https://developer.bka.sh |
| Razorpay | https://dashboard.razorpay.com |
