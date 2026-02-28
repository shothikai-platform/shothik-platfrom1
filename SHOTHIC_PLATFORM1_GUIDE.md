# shothik-platfrom1 - Primary Repository

## 🎯 Repository Status

**URL:** https://github.com/shothikai-platform/shothik-platfrom1

**Status:** ✅ Active - Production Ready

**Local Path:** `/root/.openclaw/workspace/shothiknew5`

---

## 📦 What's Included

### Core Application
- ✅ Next.js 16 + React 19
- ✅ TypeScript
- ✅ Tailwind CSS + shadcn/ui
- ✅ Convex Backend
- ✅ Clerk Authentication

### AI Features
- ✅ Writing Studio (Books, Research, Assignments)
- ✅ AI Paraphraser
- ✅ Grammar Checker
- ✅ AI Detector (ONNX + LLM)
- ✅ Humanizer
- ✅ Summarizer
- ✅ Translator

### AI Agents
- ✅ Research Agent
- ✅ Sheet Agent
- ✅ Slide Agent
- ✅ Animation Agent

### Backend Services (5 Microservices)
| Service | Port | Status |
|---------|------|--------|
| AI Detector ONNX | - | ✅ Running |
| Animation Service | 3002 | ✅ Running |
| Research Service | 3001 | ✅ Running |
| Sheet Service | 3003 | ✅ Running |
| Slide Generation | 3004 | ✅ Running |

### Infrastructure
- ✅ Redis Caching
- ✅ Stripe Payments (Sandbox ready)
- ✅ AI Gateway (DeepSeek → Gemini)
- ✅ Rate Limiting
- ✅ Security Hardening

---

## 🔧 Quick Start

### 1. Environment Setup

```bash
cd /root/.openclaw/workspace/shothiknew5

# Copy environment template
cp .env.stripe-sandbox .env.local

# Edit with your keys
nano .env.local
```

### 2. Required Environment Variables

```env
# Convex
CONVEX_DEPLOYMENT=your-deployment
CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe (Sandbox)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# LLM APIs
KIMI_API_KEY=your-kimi-key
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key

# Redis
REDIS_URL=redis://localhost:6379
```

### 3. Install & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Or use Turborepo
npx turbo dev
```

### 4. Backend Services

```bash
# Start all backend services
docker-compose -f docker-compose.backend.yml up

# Or start individually:
# Animation Service
cd backend-services/animation-service && npm start

# Research Service
cd backend-services/research-service && npm start

# Sheet Service
cd backend-services/sheet-service && npm start

# Slide Service
cd backend-services/slide-generation-service && npm start
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repo: https://vercel.com/new
2. Select `shothikai-platform/shothik-platfrom1`
3. Add environment variables
4. Deploy

### Manual Deploy

```bash
# Build
npm run build

# Deploy to Vercel
vercel --prod
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:stripe
npm run test:security

# E2E tests
npm run test:e2e
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `apps/web/` | Main Next.js application |
| `convex/` | Backend functions & schema |
| `backend-services/` | 5 microservices |
| `.env.local` | Environment variables |
| `vercel.json` | Vercel deployment config |
| `.github/workflows/` | CI/CD pipelines |

---

## 🔒 Security

- ✅ 0 vulnerabilities (after fixes)
- ✅ Input validation (Zod)
- ✅ Rate limiting
- ✅ CORS configured
- ✅ Security headers
- ✅ Dependency audit

---

## 📝 Documentation

| Document | Description |
|----------|-------------|
| `STRIPE_SANDBOX_SETUP.md` | Payment testing guide |
| `REPLIT_KIMI_INTEGRATION.md` | Replit Agent integration |
| `VERCEL_DEPLOYMENT.md` | Deployment guide |
| `TESTING_CHECKLIST.md` | Pre-launch checklist |

---

## 🎯 Next Steps

1. ✅ **Code is pushed** to shothik-platfrom1
2. ⏳ **Add environment variables** to `.env.local`
3. ⏳ **Connect Vercel** and deploy
4. ⏳ **Test payments** with Stripe Sandbox
5. ⏳ **Launch!**

---

## 🆘 Support

**Repository:** https://github.com/shothikai-platform/shothik-platfrom1

**Local:** `/root/.openclaw/workspace/shothiknew5`

**Status:** Ready for production deployment
