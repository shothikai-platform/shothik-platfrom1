import { v } from "convex/values";
import { query, mutation, action, httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================
// Stripe Connect - Author Onboarding
// ============================================

export const createConnectAccount = action({
  args: { userId: v.string(), email: v.string() },
  returns: v.object({
    accountId: v.string(),
    onboardingUrl: v.string(),
  }),
  handler: async (ctx, { userId, email }) => {
    // Call Stripe API to create Express account
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        userId,
        platform: "shothik",
      },
    });

    // Store account in database
    await ctx.runMutation(internal.stripe.storeConnectAccount, {
      userId,
      stripeAccountId: account.id,
      status: "pending",
    });

    // Create onboarding link
    const onboarding = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/payouts/onboarding?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payouts/onboarding?success=true`,
      type: "account_onboarding",
    });

    return {
      accountId: account.id,
      onboardingUrl: onboarding.url,
    };
  },
});

export const storeConnectAccount = internalMutation({
  args: {
    userId: v.string(),
    stripeAccountId: v.string(),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("restricted")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("stripeAccounts", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getConnectAccountStatus = query({
  args: { userId: v.string() },
  returns: v.optional(v.object({
    accountId: v.string(),
    status: v.string(),
    payoutsEnabled: v.boolean(),
    requirements: v.array(v.string()),
  })),
  handler: async (ctx, { userId }) => {
    const account = await ctx.db
      .query("stripeAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!account) return null;

    // Fetch fresh status from Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const stripeAccount = await stripe.accounts.retrieve(account.stripeAccountId);

    return {
      accountId: account.stripeAccountId,
      status: stripeAccount.status,
      payoutsEnabled: stripeAccount.payouts_enabled,
      requirements: stripeAccount.requirements?.currently_due || [],
    };
  },
});

// ============================================
// Payouts
// ============================================

export const createPayout = action({
  args: {
    userId: v.string(),
    amount: v.number(), // in cents
    currency: v.string(),
  },
  returns: v.object({
    payoutId: v.id("payouts"),
    stripeTransferId: v.optional(v.string()),
    status: v.string(),
    estimatedArrival: v.optional(v.number()),
  }),
  handler: async (ctx, { userId, amount, currency }) => {
    // Validate minimum payout
    if (amount < 2500) { // $25 minimum
      throw new Error("Minimum payout is $25");
    }

    // Get author's Stripe account
    const account = await ctx.db
      .query("stripeAccounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!account || account.status !== "active") {
      throw new Error("Stripe account not connected or not active");
    }

    // Check available balance
    const availableBalance = await ctx.runQuery(internal.earnings.getAvailableBalance, {
      userId,
    });

    if (availableBalance < amount) {
      throw new Error("Insufficient balance");
    }

    // Create Stripe transfer
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    
    let stripeTransfer;
    try {
      stripeTransfer = await stripe.transfers.create({
        amount,
        currency: currency.toLowerCase(),
        destination: account.stripeAccountId,
        description: `Shothik royalty payout`,
        metadata: {
          userId,
          platform: "shothik",
        },
      });
    } catch (error) {
      throw new Error(`Stripe transfer failed: ${error.message}`);
    }

    // Record payout in database
    const payoutId = await ctx.runMutation(internal.payouts.recordPayout, {
      userId,
      amount,
      currency,
      stripeTransferId: stripeTransfer.id,
      status: "pending",
      estimatedArrival: Date.now() + 2 * 24 * 60 * 60 * 1000, // 2 days
    });

    // Deduct from available balance
    await ctx.runMutation(internal.earnings.deductBalance, {
      userId,
      amount,
    });

    return {
      payoutId,
      stripeTransferId: stripeTransfer.id,
      status: "pending",
      estimatedArrival: Date.now() + 2 * 24 * 60 * 60 * 1000,
    };
  },
});

export const recordPayout = internalMutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    currency: v.string(),
    stripeTransferId: v.string(),
    status: v.string(),
    estimatedArrival: v.number(),
  },
  returns: v.id("payouts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("payouts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listPayouts = query({
  args: { userId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("payouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

// ============================================
// Webhook Handlers
// ============================================

export const stripeWebhook = httpAction({
  handler: async (ctx, request) => {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response("Invalid signature", { status: 400 });
    }

    // Handle events
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object;
        await ctx.runMutation(internal.stripe.updateAccountStatus, {
          stripeAccountId: account.id,
          status: account.status,
          payoutsEnabled: account.payouts_enabled,
        });
        break;
      }

      case "transfer.paid": {
        const transfer = event.data.object;
        await ctx.runMutation(internal.payouts.updatePayoutStatus, {
          stripeTransferId: transfer.id,
          status: "paid",
          paidAt: Date.now(),
        });
        break;
      }

      case "transfer.failed": {
        const transfer = event.data.object;
        await ctx.runMutation(internal.payouts.updatePayoutStatus, {
          stripeTransferId: transfer.id,
          status: "failed",
          failureMessage: transfer.failure_message,
        });
        // Refund the balance
        await ctx.runMutation(internal.earnings.refundBalance, {
          stripeTransferId: transfer.id,
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response("OK", { status: 200 });
  },
});

export const updateAccountStatus = internalMutation({
  args: {
    stripeAccountId: v.string(),
    status: v.string(),
    payoutsEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("stripeAccounts")
      .withIndex("by_stripe_account", (q) => q.eq("stripeAccountId", args.stripeAccountId))
      .first();

    if (account) {
      await ctx.db.patch(account._id, {
        status: args.status,
        payoutsEnabled: args.payoutsEnabled,
        updatedAt: Date.now(),
      });
    }
  },
});

// ============================================
// Earnings Calculation
// ============================================

export const calculateMonthlyRoyalties = action({
  args: { period: v.string() }, // "2026-02"
  returns: v.object({
    totalAuthors: v.number(),
    totalPayouts: v.number(),
    totalAmount: v.number(),
  }),
  handler: async (ctx, { period }) => {
    // Get all sales for the period
    const sales = await ctx.db
      .query("salesRecords")
      .withIndex("by_period", (q) => q.eq("period", period))
      .collect();

    // Group by author
    const authorEarnings = new Map();
    
    for (const sale of sales) {
      const book = await ctx.db.get(sale.bookId);
      if (!book) continue;

      const authorId = book.userId;
      
      // Calculate royalty: 85% of Google's 70% = 59.5% of list price
      // Actually: Google keeps 30%, we get 70%
      // We give author 85% of our 70% = 59.5%
      const googleRevenue = sale.amount * 0.7; // After Google's 30%
      const authorRoyalty = googleRevenue * 0.85; // Author gets 85%
      const platformFee = googleRevenue * 0.15; // We keep 15%
      
      // 10% reserve holdback for first 60 days
      const holdback = authorRoyalty * 0.10;
      const availableNow = authorRoyalty - holdback;

      if (!authorEarnings.has(authorId)) {
        authorEarnings.set(authorId, {
          total: 0,
          holdback: 0,
          books: new Set(),
        });
      }

      const current = authorEarnings.get(authorId);
      current.total += availableNow;
      current.holdback += holdback;
      current.books.add(sale.bookId);
    }

    // Create earnings records
    let totalPayouts = 0;
    let totalAmount = 0;

    for (const [authorId, earnings] of authorEarnings) {
      await ctx.runMutation(internal.earnings.createEarningsRecord, {
        userId: authorId,
        period,
        amount: Math.round(earnings.total),
        holdback: Math.round(earnings.holdback),
        bookCount: earnings.books.size,
      });

      totalPayouts++;
      totalAmount += earnings.total;
    }

    // Release holdbacks from 2 months ago
    const twoMonthsAgo = getTwoMonthsAgo(period);
    await ctx.runMutation(internal.earnings.releaseHoldbacks, {
      period: twoMonthsAgo,
    });

    return {
      totalAuthors: authorEarnings.size,
      totalPayouts,
      totalAmount,
    };
  },
});

function getTwoMonthsAgo(period: string): string {
  const [year, month] = period.split("-").map(Number);
  let newMonth = month - 2;
  let newYear = year;
  
  if (newMonth <= 0) {
    newMonth += 12;
    newYear--;
  }
  
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}
