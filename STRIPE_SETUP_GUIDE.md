# Stripe Integration Setup Guide

## 1. Environment Variables

Add these to your `.env.local`:

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...
STRIPE_PRICE_CREDITS_100=price_...
STRIPE_PRICE_CREDITS_500=price_...
STRIPE_PRICE_CREDITS_1000=price_...
STRIPE_PRICE_CREDITS_5000=price_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 2. Stripe Dashboard Setup

### Create Products & Prices

1. **Pro Subscription (Monthly)**
   - Name: "Shothik Pro"
   - Price: $9.99/month
   - Recurring: Monthly

2. **Pro Subscription (Yearly)**
   - Name: "Shothik Pro (Yearly)"
   - Price: $99.90/year
   - Recurring: Yearly

3. **Premium Subscription (Monthly)**
   - Name: "Shothik Premium"
   - Price: $29.99/month
   - Recurring: Monthly

4. **Premium Subscription (Yearly)**
   - Name: "Shothik Premium (Yearly)"
   - Price: $299.90/year
   - Recurring: Yearly

5. **Credit Packages** (One-time payments)
   - 100 Credits: $4.99
   - 500 Credits: $19.99
   - 1000 Credits: $34.99
   - 5000 Credits: $149.99

### Configure Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

4. Copy webhook signing secret to `.env.local`

## 3. Testing

### Test Cards

| Card Number | Scenario |
|-------------|----------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |

### Test Flow

1. Sign up as new user
2. Go to billing page
3. Select Pro plan
4. Complete checkout with test card
5. Verify:
   - Subscription created in database
   - Credits added to account
   - Webhook processed successfully

## 4. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stripe/checkout/subscription` | POST | Create subscription checkout |
| `/api/stripe/checkout/credits` | POST | Create credit purchase checkout |
| `/api/stripe/subscription` | POST | Get billing portal |
| `/api/stripe/subscription` | DELETE | Cancel subscription |
| `/api/stripe/webhook` | POST | Stripe webhooks |

## 5. Frontend Integration

```typescript
// Subscribe to Pro plan
const subscribe = async () => {
  const response = await fetch('/api/stripe/checkout/subscription', {
    method: 'POST',
    body: JSON.stringify({
      tier: 'pro',
      interval: 'month'
    })
  });
  const { url } = await response.json();
  window.location.href = url;
};

// Buy credits
const buyCredits = async () => {
  const response = await fetch('/api/stripe/checkout/credits', {
    method: 'POST',
    body: JSON.stringify({
      packageId: 'credits_1000'
    })
  });
  const { url } = await response.json();
  window.location.href = url;
};

// Open billing portal
const openBillingPortal = async () => {
  const response = await fetch('/api/stripe/subscription', {
    method: 'POST'
  });
  const { url } = await response.json();
  window.location.href = url;
};
```

## 6. Database Functions

All billing functions are in `convex/billing.ts`:

- `getUserCredits` - Get user's credit balance
- `spendCredits` - Deduct credits for AI usage
- `addCredits` - Add credits (purchase/refund/bonus)
- `createSubscription` - Create new subscription
- `updateSubscriptionStatus` - Handle Stripe updates
- `getTransactionHistory` - View all transactions

## 7. Next Steps

1. ✅ Install Stripe CLI for local webhook testing
2. ✅ Create pricing page UI
3. ✅ Add credit balance display in header
4. ✅ Implement credit checks before AI tool usage
5. ✅ Add billing history page
