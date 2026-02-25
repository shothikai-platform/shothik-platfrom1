import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ============================================
// Earnings Queries
// ============================================

export const getEarningsSummary = query({
  args: { userId: v.string() },
  returns: v.object({
    totalEarnings: v.number(),
    availableBalance: v.number(),
    pendingBalance: v.number(),
    lifetimePayouts: v.number(),
    thisMonth: v.number(),
    lastMonth: v.number(),
  }),
  handler: async (ctx, { userId }) => {
    // Get all earnings records
    const earnings = await ctx.db
      .query("earningsRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get all payouts
    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const now = new Date();
    const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount + e.holdback, 0);
    const totalPayouts = payouts
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    
    const availableBalance = totalEarnings - totalPayouts;
    
    const thisMonthEarnings = earnings
      .filter((e) => e.period === thisMonthKey)
      .reduce((sum, e) => sum + e.amount, 0);
    
    const lastMonthEarnings = earnings
      .filter((e) => e.period === lastMonthKey)
      .reduce((sum, e) => sum + e.amount, 0);

    // Pending = recent earnings not yet available (holdback)
    const pendingBalance = earnings
      .filter((e) => {
        const recordDate = new Date(e.period + "-01");
        const daysSince = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < 60; // Still in holdback period
      })
      .reduce((sum, e) => sum + e.holdback, 0);

    return {
      totalEarnings,
      availableBalance,
      pendingBalance,
      lifetimePayouts: totalPayouts,
      thisMonth: thisMonthEarnings,
      lastMonth: lastMonthEarnings,
    };
  },
});

export const getAvailableBalance = query({
  args: { userId: v.string() },
  returns: v.number(),
  handler: async (ctx, { userId }) => {
    const earnings = await ctx.db
      .query("earningsRecords")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const payouts = await ctx.db
      .query("payouts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalPayouts = payouts
      .filter((p) => p.status === "paid" || p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    return Math.max(0, totalEarnings - totalPayouts);
  },
});

export const getEarningsByBook = query({
  args: { userId: v.string(), bookId: v.optional(v.id("books")) },
  returns: v.array(v.any()),
  handler: async (ctx, { userId, bookId }) => {
    let sales;
    
    if (bookId) {
      sales = await ctx.db
        .query("salesRecords")
        .withIndex("by_book", (q) => q.eq("bookId", bookId))
        .collect();
    } else {
      // Get all books by user
      const books = await ctx.db
        .query("books")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      
      const bookIds = new Set(books.map((b) => b._id));
      
      // Get all sales for these books
      const allSales = await ctx.db
        .query("salesRecords")
        .collect();
      
      sales = allSales.filter((s) => bookIds.has(s.bookId));
    }

    // Group by book
    const byBook = new Map();
    
    for (const sale of sales) {
      if (!byBook.has(sale.bookId)) {
        const book = await ctx.db.get(sale.bookId);
        byBook.set(sale.bookId, {
          bookId: sale.bookId,
          title: book?.title || "Unknown",
          totalSales: 0,
          totalRevenue: 0,
          totalRoyalties: 0,
          sales: [],
        });
      }
      
      const record = byBook.get(sale.bookId);
      const googleRevenue = sale.amount * 0.7;
      const royalty = googleRevenue * 0.85;
      
      record.totalSales++;
      record.totalRevenue += sale.amount;
      record.totalRoyalties += royalty;
      record.sales.push({
        date: sale.date,
        amount: sale.amount,
        royalty,
      });
    }

    return Array.from(byBook.values());
  },
});

export const getMonthlyEarnings = query({
  args: { userId: v.string(), months: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, { userId, months = 12 }) => {
    const records = await ctx.db
      .query("earningsRecords")
      .withIndex("by_user_period", (q) => q.eq("userId", userId))
      .order("desc")
      .take(months);

    return records.map((r) => ({
      period: r.period,
      amount: r.amount,
      holdback: r.holdback,
      bookCount: r.bookCount,
      status: r.status,
    }));
  },
});

// ============================================
// Earnings Mutations
// ============================================

export const createEarningsRecord = internalMutation({
  args: {
    userId: v.string(),
    period: v.string(),
    amount: v.number(),
    holdback: v.number(),
    bookCount: v.number(),
  },
  returns: v.id("earningsRecords"),
  handler: async (ctx, args) => {
    // Check if record already exists
    const existing = await ctx.db
      .query("earningsRecords")
      .withIndex("by_user_period", (q) => 
        q.eq("userId", args.userId).eq("period", args.period)
      )
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        amount: args.amount,
        holdback: args.holdback,
        bookCount: args.bookCount,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    // Create new
    return await ctx.db.insert("earningsRecords", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const deductBalance = internalMutation({
  args: {
    userId: v.string(),
    amount: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, { userId, amount }) => {
    // This is handled by the payout record creation
    // The available balance is calculated dynamically
    return true;
  },
});

export const refundBalance = internalMutation({
  args: {
    stripeTransferId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { stripeTransferId }) => {
    // Find the payout
    const payout = await ctx.db
      .query("payouts")
      .withIndex("by_stripe_transfer", (q) => 
        q.eq("stripeTransferId", stripeTransferId)
      )
      .first();

    if (!payout) return false;

    // Mark as failed and refund
    await ctx.db.patch(payout._id, {
      status: "failed",
      refundedAt: Date.now(),
    });

    return true;
  },
});

export const releaseHoldbacks = internalMutation({
  args: {
    period: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, { period }) => {
    const records = await ctx.db
      .query("earningsRecords")
      .withIndex("by_period", (q) => q.eq("period", period))
      .collect();

    let released = 0;

    for (const record of records) {
      if (record.holdback > 0) {
        // Move holdback to available
        await ctx.db.patch(record._id, {
          amount: record.amount + record.holdback,
          holdback: 0,
          status: "released",
          updatedAt: Date.now(),
        });
        released++;
      }
    }

    return released;
  },
});
