# Stripe Integration Plan

## Goals
1. Stripe Connect - Author onboarding (Express accounts)
2. Payouts - Transfer royalties to authors
3. Webhooks - Handle payment events
4. Dashboard - Earnings and payout tracking

## Architecture

```
Author (Bangladesh/India/Pakistan/UK/US)
    │
    ├──► Stripe Connect (Express account)
    │    ├──► Identity verification
    │    ├──► Bank account / bKash / Payoneer
    │    └──► Payout schedule
    │
    └──► Earnings Dashboard
         ├──► Monthly royalties
         ├──► Per-book breakdown
         └──► Payout history

Shothik Platform
    │
    ├──► Royalty Calculation Engine
    │    ├──► Google Play sales import
    │    ├──► 85% to author, 15% platform
    │    └──► Reserve holdback (10% for 60 days)
    │
    └──► Payout Orchestration
         ├──► Stripe (US/UK/EU)
         ├──► Payoneer (Bangladesh)
         └──► Manual bank transfer
```

## Implementation Steps

1. Stripe Connect OAuth flow
2. Payout creation API
3. Webhook handlers
4. Earnings calculation
5. Dashboard integration

---

## Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...
```
