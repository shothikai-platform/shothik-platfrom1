import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================
// Payout Queries
// ============================================

export const getPayoutHistory = query({
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

export const getPendingPayouts = query({
  args: { userId: v.optional(v.string()) },
  returns: v.array(v.any()),
  handler: async (ctx, { userId }) => {
    let payouts;
    
    if (userId) {
      payouts = await ctx.db
        .query("payouts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    } else {
      payouts = await ctx.db.query("payouts").collect();
    }

    return payouts.filter((p) => p.status === "pending");
  },
});

// ============================================
// Payout Mutations
// ============================================

export const updatePayoutStatus = internalMutation({
  args: {
    stripeTransferId: v.string(),
    status: v.string(),
    paidAt: v.optional(v.number()),
    failureMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const payout = await ctx.db
      .query("payouts")
      .withIndex("by_stripe_transfer", (q) => 
        q.eq("stripeTransferId", args.stripeTransferId)
      )
      .first();

    if (!payout) {
      console.error(`Payout not found for transfer: ${args.stripeTransferId}`);
      return;
    }

    await ctx.db.patch(payout._id, {
      status: args.status,
      paidAt: args.paidAt,
      failureMessage: args.failureMessage,
      updatedAt: Date.now(),
    });

    // If paid, send notification
    if (args.status === "paid") {
      await ctx.runMutation(internal.notifications.createNotification, {
        userId: payout.userId,
        type: "payout_paid",
        title: "Payout Processed",
        message: `Your payout of $${(payout.amount / 100).toFixed(2)} has been processed.`,
        data: { payoutId: payout._id, amount: payout.amount },
      });
    }
  },
});

export const cancelPayout = mutation({
  args: { payoutId: v.id("payouts") },
  returns: v.boolean(),
  handler: async (ctx, { payoutId }) => {
    const payout = await ctx.db.get(payoutId);
    if (!payout) return false;

    // Can only cancel pending payouts
    if (payout.status !== "pending") {
      throw new Error("Can only cancel pending payouts");
    }

    // Refund the amount
    await ctx.runMutation(internal.earnings.createEarningsRecord, {
      userId: payout.userId,
      period: getCurrentPeriod(),
      amount: payout.amount,
      holdback: 0,
      bookCount: 0,
    });

    // Mark as cancelled
    await ctx.db.patch(payoutId, {
      status: "cancelled",
      cancelledAt: Date.now(),
    });

    return true;
  },
});

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
