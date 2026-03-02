# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: https://vercel.com/signup
2. **GitHub Account**: Already have this
3. **Stripe Account**: https://stripe.com (for payments)

---

## Step 1: Connect Repository to Vercel

### Option A: Web Interface (Easiest)

1. Go to https://vercel.com/new
2. Import GitHub repository: `shothikai-platform/shothik-platfrom1`
3. Select the repository
4. Configure project settings (see below)

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Step 2: Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

### Required

```bash
# Database
NEXT_PUBLIC_CONVEX_URL=https://your-convex-url.convex.cloud

# Auth
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# AI APIs
KIMI_API_KEY=your-kimi-key
DEEPSEEK_API_KEY=your-deepseek-key
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Services
NLP_SERVICE_URL=https://your-nlp-service.com
PARAPHRASE_SERVICE_URL=https://your-paraphrase-service.com
AI_DETECTOR_URL=https://your-ai-detector.com

# Security
API_KEY_SALT=your-random-salt
JWT_SECRET=your-jwt-secret

# Cognee (optional)
COGNEE_API_URL=https://your-cognee-instance.com
COGNEE_API_KEY=your-cognee-key
```

---

## Step 3: Build Settings

### Framework Preset
- **Framework**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Node.js Version
- **Version**: 20.x (or 18.x)

---

## Step 4: Domain Configuration

### Option A: Vercel Subdomain (Free)
- Auto-generated: `shothik-platfrom1.vercel.app`

### Option B: Custom Domain
1. Add domain in Vercel Dashboard
2. Configure DNS records:
   - Type: A, Name: @, Value: 76.76.21.21
   - Type: CNAME, Name: www, Value: cname.vercel-dns.com

---

## Step 5: Post-Deployment Checklist

### Immediate (First 5 minutes)
- [ ] Website loads without errors
- [ ] All 6 tools accessible
- [ ] Login/signup works
- [ ] No console errors

### Testing (First hour)
- [ ] Test Grammar Checker
- [ ] Test Paraphrase
- [ ] Test AI Detector
- [ ] Test Translator
- [ ] Test Humanize
- [ ] Test Summarizer
- [ ] Test Stripe checkout
- [ ] Test payment flow

### Monitoring (First day)
- [ ] Check Vercel analytics
- [ ] Monitor error logs
- [ ] Test on mobile
- [ ] Test on different browsers

---

## Troubleshooting

### Build Errors
```bash
# Common fixes
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variable Issues
- Ensure all env vars are set in Vercel Dashboard
- Check for typos in variable names
- Verify values are correct

### API Errors
- Check backend services are running
- Verify API URLs in environment variables
- Check CORS settings

### Stripe Issues
- Ensure webhook endpoint is configured
- Test with Stripe test mode first
- Check Stripe Dashboard for errors

---

## Production Checklist

### Security
- [x] No hardcoded secrets
- [x] Environment variables set
- [x] HTTPS enabled (Vercel default)
- [x] Security headers configured

### Performance
- [x] Next.js optimized build
- [x] Images optimized
- [x] Code splitting enabled
- [x] Caching configured

### Monitoring
- [ ] Vercel Analytics enabled
- [ ] Error tracking (Sentry recommended)
- [ ] Uptime monitoring
- [ ] Performance monitoring

---

## Support

If deployment fails:
1. Check Vercel logs in Dashboard
2. Verify all environment variables
3. Test build locally: `npm run build`
4. Check GitHub Issues for similar problems

---

**Ready to deploy!** 🚀
