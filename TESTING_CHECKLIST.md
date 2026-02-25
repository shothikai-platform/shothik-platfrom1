# Testing Checklist - Chrome DevTools

## 🔍 Pre-Test Setup

1. Open deployed URL in Chrome
2. Open DevTools (F12)
3. Clear cache (Ctrl+Shift+R)
4. Set network throttling (Fast 3G, Slow 3G)

---

## ✅ Console Tests

### Check for Errors
- [ ] No red errors in Console
- [ ] No warnings (yellow)
- [ ] No deprecated API usage

### Check Logs
- [ ] App initialization logs
- [ ] API call logs
- [ ] Error boundary catches

---

## 🚀 Performance Tests (Lighthouse)

### Mobile Audit
- [ ] Performance: 90+
- [ ] Accessibility: 100
- [ ] Best Practices: 100
- [ ] SEO: 90+

### Desktop Audit
- [ ] Performance: 95+
- [ ] Accessibility: 100
- [ ] Best Practices: 100
- [ ] SEO: 95+

### Key Metrics
- [ ] First Contentful Paint (FCP): < 1.8s
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Time to Interactive (TTI): < 3.8s
- [ ] Cumulative Layout Shift (CLS): < 0.1

---

## 📡 Network Tests

### API Calls
- [ ] Convex queries: < 500ms
- [ ] LLM API calls: < 2s
- [ ] Stripe API: < 1s
- [ ] No failed requests (4xx/5xx)

### Resources
- [ ] JS bundles loaded
- [ ] CSS loaded
- [ ] Images optimized
- [ ] Fonts loaded

---

## 📱 Responsive Tests

### Devices to Test
- [ ] iPhone SE (375×667)
- [ ] iPhone 12 Pro (390×844)
- [ ] iPad Air (820×1180)
- [ ] Desktop (1920×1080)

### Touch Interactions
- [ ] Buttons clickable
- [ ] Forms usable
- [ ] Navigation works
- [ ] No horizontal scroll

---

## ♿ Accessibility Tests

### Keyboard Navigation
- [ ] Tab through all elements
- [ ] Enter activates buttons
- [ ] Escape closes modals
- [ ] Focus visible

### Screen Reader
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Heading hierarchy correct
- [ ] Color contrast 4.5:1+

---

## 🔒 Security Tests

### HTTPS
- [ ] All resources HTTPS
- [ ] No mixed content warnings

### Headers
- [ ] X-Frame-Options
- [ ] X-Content-Type-Options
- [ ] Referrer-Policy

---

## 🎯 Feature Tests

### Writing Studio
- [ ] Editor loads
- [ ] AI chat works
- [ ] Save functionality
- [ ] Export works

### Authentication
- [ ] Login works
- [ ] Signup works
- [ ] Protected routes
- [ ] Logout works

### Payments
- [ ] Stripe loads
- [ ] Checkout works
- [ ] Webhooks receive

---

## 📝 Issues Log

| Issue | Severity | Status | Fix |
|-------|----------|--------|-----|
|       |          |        |     |

---

## ✅ Sign-off

- [ ] All tests passed
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Ready for production

**Tester:** _______________  
**Date:** _______________
