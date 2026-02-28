# Stripe Sandbox Setup Guide

## 🚀 Quick Start

### 1. Get Sandbox API Keys

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)

### 2. Configure Environment

```bash
cd /root/.openclaw/workspace/shothiknew5

# Copy sandbox config
cp .env.stripe-sandbox .env.local

# Edit with your keys
nano .env.local
```

Replace:
- `pk_test_your_publishable_key_here` → Your actual pk_test key
- `sk_test_your_secret_key_here` → Your actual sk_test key

### 3. Setup Webhook (Local Testing)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret (starts with `whsec_`) to `.env.local`.

### 4. Test Payment Flow

#### Test Card Numbers

| Card Number | Result | Use Case |
|-------------|--------|----------|
| `4242 4242 4242 4242` | ✅ Success | Default test |
| `4000 0000 0000 0002` | ❌ Declined | Error handling |
| `4000 0025 0000 3155` | 🔄 3D Secure | Authentication |
| `4000 0035 6000 0008` | 🌐 India | Regional testing |
| `4000 0000 0000 3220` | 📅 Subscription | Recurring payments |

#### Test Connect (Author Onboarding)

In sandbox mode:
- Accounts are auto-approved
- No real document verification
- Use fake SSN: `000-00-0000`
- Use fake phone: `+1 000-000-0000`

### 5. Verify Integration

```bash
# Run tests
npm run test:stripe

# Or manual check
npm run dev
# Go to http://localhost:3000/payments/test
```

---

## 🔧 Sandbox vs Production

| Feature | Sandbox | Production |
|---------|---------|------------|
| Real money | ❌ No | ✅ Yes |
| Card processing | Simulated | Real |
| Connect approval | Instant | 1-2 days |
| Webhooks | CLI/Dashboard | Live endpoint |
| API Keys | `pk_test_` / `sk_test_` | `pk_live_` / `sk_live_` |

---

## 📋 Testing Checklist

### Payments
- [ ] Create payment intent
- [ ] Process successful payment
- [ ] Handle declined payment
- [ ] Test 3D Secure flow
- [ ] Test subscription creation
- [ ] Test refund

### Connect (Authors)
- [ ] Create Connect account
- [ ] Complete onboarding
- [ ] Check account status
- [ ] Create transfer
- [ ] Verify payout

### Webhooks
- [ ] Receive payment_intent.succeeded
- [ ] Receive transfer.paid
- [ ] Handle account.updated
- [ ] Verify signature

---

## 🐛 Common Issues

### "Invalid API Key"
```bash
# Make sure you're using test keys, not live keys
# Check .env.local has sk_test_ not sk_live_
```

### "Webhook signature verification failed"
```bash
# Make sure STRIPE_WEBHOOK_SECRET matches
# The secret from: stripe listen --forward-to ...
```

### "Account not found"
```bash
# In sandbox, create test accounts via dashboard
# https://dashboard.stripe.com/test/connect/accounts
```

---

## 🎯 Switch to Production

When ready for real payments:

1. Get live keys: https://dashboard.stripe.com/apikeys
2. Update `.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_MODE=production
   ```
3. Update webhook endpoint to production URL
4. Complete Stripe Connect verification
5. Test with small real payment

---

## 📚 Resources

- [Stripe Testing Docs](https://stripe.com/docs/testing)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)
- [Connect Testing](https://stripe.com/docs/connect/testing)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
