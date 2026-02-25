# Vercel Deployment Guide
## shothik-platfrom

## 🚀 Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## 🔐 Step 2: Login to Vercel

```bash
vercel login
# Follow browser authentication
```

## ⚙️ Step 3: Configure Project

### Create `vercel.json` in root:
```json
{
  "version": 2,
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk-publishable-key",
    "CLERK_SECRET_KEY": "@clerk-secret-key",
    "CONVEX_DEPLOYMENT": "@convex-deployment",
    "CONVEX_URL": "@convex-url",
    "KIMI_API_KEY": "@kimi-api-key",
    "STRIPE_SECRET_KEY": "@stripe-secret-key",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "@stripe-publishable-key"
  }
}
```

## 🔑 Step 4: Add Environment Variables

```bash
# Add secrets to Vercel
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add CONVEX_DEPLOYMENT
vercel env add CONVEX_URL
vercel env add KIMI_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

## 🚀 Step 5: Deploy

```bash
# From project root
vercel --prod
```

## 🧪 Step 6: Chrome DevTools Testing

### Performance Audit
1. Open deployed URL in Chrome
2. Press F12 → Lighthouse tab
3. Run audit (Mobile + Desktop)
4. Target scores:
   - Performance: 90+
   - Accessibility: 100
   - Best Practices: 100
   - SEO: 100

### Console Check
1. Open Console tab
2. Check for errors/warnings
3. Fix any issues locally
4. Redeploy

### Network Analysis
1. Open Network tab
2. Check API response times
3. Verify Convex/LLM calls
4. Optimize slow requests

### Mobile Testing
1. Toggle device toolbar (Ctrl+Shift+M)
2. Test iPhone, iPad, Android
3. Verify responsive design
4. Check touch interactions

## 🔄 Iteration Workflow

```
1. Fix locally
2. git commit -m "fix: description"
3. vercel --prod
4. Chrome DevTools test
5. Repeat until perfect
```

## ✅ Pre-Deployment Checklist

- [ ] All env vars configured in Vercel
- [ ] Build passes locally: `npm run build`
- [ ] No console errors
- [ ] Lighthouse score 90+
- [ ] Mobile responsive
- [ ] All features tested

## 🎯 Post-Deployment

Once perfect on Vercel:
```bash
git push origin main
```
