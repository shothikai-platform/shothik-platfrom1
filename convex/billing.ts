import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

// ==========================================
// USER LOOKUP (for Stripe webhooks)
// ==========================================

// Get user by Stripe customer ID
export const getUserByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) =>
        q.eq("stripeCustomerId", args.stripeCustomerId)
      )
      .first();
    
    return user ? { userId: user._id, email: user.email } : null;
  },
});

// Get subscription plan by Stripe price ID
export const getSubscriptionPlanByPriceId = query({
  args: { stripePriceId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("subscriptionPlans")
      .filter((q) =>
        q.or(
          q.eq(q.field("stripePriceIdMonthly"), args.stripePriceId),
          q.eq(q.field("stripePriceIdYearly"), args.stripePriceId)
        )
      )
      .first();
  },
});

// ==========================================
// USER CREDITS
// ==========================================

// Get user credits
export const getUserCredits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!credits) {
      // Create default credits for new user
      return {
        userId: args.userId,
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        tier: "free",
        monthlyLimit: 1000,
        monthlyUsed: 0,
        monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
    }
    
    return credits;
  },
});

// Initialize user credits (called on signup)
export const initializeUserCredits = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (existing) return existing;
    
    return ctx.db.insert("userCredits", {
      userId: args.userId,
      balance: 100, // Welcome bonus
      lifetimeEarned: 100,
      lifetimeSpent: 0,
      tier: "free",
      monthlyLimit: 1000,
      monthlyUsed: 0,
      monthlyResetAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now(),
    });
  },
});

// Spend credits (called when user uses AI tools)
export const spendCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    metadata: v.optional(v.object({
      tool: v.optional(v.string()),
      tokens: v.optional(v.number()),
      model: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!credits) {
      throw new Error("User credits not found");
    }
    
    if (credits.balance < args.amount) {
      throw new Error("Insufficient credits");
    }
    
    // Update balance
    const newBalance = credits.balance - args.amount;
    await ctx.db.patch(credits._id, {
      balance: newBalance,
      lifetimeSpent: credits.lifetimeSpent + args.amount,
      monthlyUsed: credits.monthlyUsed + args.amount,
      updatedAt: Date.now(),
    });
    
    // Create transaction record
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: "usage",
      amount: -args.amount,
      balanceAfter: newBalance,
      description: args.description,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
    
    return { success: true, newBalance };
  },
});

// Add credits (called on purchase, refund, or bonus)
export const addCredits = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("purchase"),
      v.literal("refund"),
      v.literal("bonus"),
      v.literal("adjustment")
    ),
    description: v.string(),
    paymentIntentId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!credits) {
      throw new Error("User credits not found");
    }
    
    const newBalance = credits.balance + args.amount;
    
    await ctx.db.patch(credits._id, {
      balance: newBalance,
      lifetimeEarned: credits.lifetimeEarned + args.amount,
      updatedAt: Date.now(),
    });
    
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: args.type,
      amount: args.amount,
      balanceAfter: newBalance,
      description: args.description,
      paymentIntentId: args.paymentIntentId,
      createdAt: Date.now(),
    });
    
    return { success: true, newBalance };
  },
});

// ==========================================
// SUBSCRIPTIONS
// ==========================================

// Get subscription plans
export const getSubscriptionPlans = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("subscriptionPlans")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("asc")
      .take(10);
  },
});

// Get user subscription
export const getUserSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!subscription) return null;
    
    const plan = await ctx.db.get(subscription.planId);
    
    return { subscription, plan };
  },
});

// Create subscription (called after Stripe checkout)
export const createSubscription = mutation({
  args: {
    userId: v.id("users"),
    planId: v.id("subscriptionPlans"),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    interval: v.union(v.literal("month"), v.literal("year")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    trialEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get plan details
    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    
    // Create subscription
    const subscriptionId = await ctx.db.insert("userSubscriptions", {
      userId: args.userId,
      planId: args.planId,
      status: args.trialEnd ? "trialing" : "active",
      interval: args.interval,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      cancelAtPeriodEnd: false,
      trialStart: args.trialEnd ? Date.now() : undefined,
      trialEnd: args.trialEnd,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Update user credits with plan benefits
    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (credits) {
      await ctx.db.patch(credits._id, {
        tier: plan.name.toLowerCase(),
        monthlyLimit: plan.features.monthlyCredits,
        updatedAt: Date.now(),
      });
    }
    
    return subscriptionId;
  },
});

// Update subscription status (called from webhook)
export const updateSubscriptionStatus = mutation({
  args: {
    stripeSubscriptionId: v.string(),
    status: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    currentPeriodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("userSubscriptions")
      .withIndex("by_stripe_subscription", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();
    
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    
    const updates: any = {
      status: args.status,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      updatedAt: Date.now(),
    };
    
    if (args.currentPeriodEnd) {
      updates.currentPeriodEnd = args.currentPeriodEnd;
    }
    
    if (args.status === "canceled") {
      updates.canceledAt = Date.now();
    }
    
    await ctx.db.patch(subscription._id, updates);
    
    // Update user tier if canceled
    if (args.status === "canceled") {
      const credits = await ctx.db
        .query("userCredits")
        .withIndex("by_user", (q) => q.eq("userId", subscription.userId))
        .first();
      
      if (credits) {
        await ctx.db.patch(credits._id, {
          tier: "free",
          monthlyLimit: 1000,
          updatedAt: Date.now(),
        });
      }
    }
    
    return { success: true };
  },
});

// ==========================================
// TRANSACTIONS & ANALYTICS
// ==========================================

// Get transaction history
export const getTransactionHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("creditTransactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    return query.take(args.limit || 50);
  },
});

// Record usage metric
export const recordUsageMetric = mutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    hour: v.optional(v.number()),
    metrics: v.object({
      grammarChecks: v.optional(v.number()),
      paraphraseRequests: v.optional(v.number()),
      aiDetectorScans: v.optional(v.number()),
      translations: v.optional(v.number()),
      humanizeRequests: v.optional(v.number()),
      summaries: v.optional(v.number()),
      aiTokensInput: v.optional(v.number()),
      aiTokensOutput: v.optional(v.number()),
      aiCost: v.optional(v.number()),
      projectsCreated: v.optional(v.number()),
      wordsWritten: v.optional(v.number()),
      exports: v.optional(v.number()),
      sessions: v.optional(v.number()),
      sessionDuration: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("usageMetrics")
      .withIndex("by_user_and_hour", (q) =>
        q.eq("userId", args.userId).eq("hour", args.hour || 0)
      )
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();
    
    if (existing) {
      // Merge metrics
      const mergedMetrics = {
        ...existing.metrics,
        ...Object.entries(args.metrics).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = (existing.metrics[key] || 0) + value;
          }
          return acc;
        }, {} as any),
      };
      
      await ctx.db.patch(existing._id, {
        metrics: mergedMetrics,
      });
      
      return existing._id;
    }
    
    return ctx.db.insert("usageMetrics", {
      userId: args.userId,
      date: args.date,
      hour: args.hour,
      metrics: {
        grammarChecks: args.metrics.grammarChecks || 0,
        paraphraseRequests: args.metrics.paraphraseRequests || 0,
        aiDetectorScans: args.metrics.aiDetectorScans || 0,
        translations: args.metrics.translations || 0,
        humanizeRequests: args.metrics.humanizeRequests || 0,
        summaries: args.metrics.summaries || 0,
        aiTokensInput: args.metrics.aiTokensInput || 0,
        aiTokensOutput: args.metrics.aiTokensOutput || 0,
        aiCost: args.metrics.aiCost || 0,
        projectsCreated: args.metrics.projectsCreated || 0,
        wordsWritten: args.metrics.wordsWritten || 0,
        exports: args.metrics.exports || 0,
        sessions: args.metrics.sessions || 0,
        sessionDuration: args.metrics.sessionDuration || 0,
      },
      createdAt: Date.now(),
    });
  },
});

// ==========================================
// WEBHOOK HANDLING
// ==========================================

// Store webhook event
export const storeWebhookEvent = mutation({
  args: {
    stripeEventId: v.string(),
    type: v.string(),
    payload: v.object({
      object: v.string(),
      objectId: v.string(),
      customerId: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("webhookEvents", {
      id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stripeEventId: args.stripeEventId,
      type: args.type,
      payload: args.payload,
      processed: false,
      createdAt: Date.now(),
    });
  },
});

// Mark webhook as processed
export const markWebhookProcessed = mutation({
  args: { stripeEventId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("webhookEvents")
      .withIndex("by_stripe_event", (q) => q.eq("stripeEventId", args.stripeEventId))
      .first();
    
    if (event) {
      await ctx.db.patch(event._id, {
        processed: true,
        processedAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

// Admin: Adjust user credits
export const adminAdjustCredits = mutation({
  args: {
    adminId: v.id("users"),
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin (simplified - add proper admin check)
    const admin = await ctx.db.get(args.adminId);
    if (!admin) throw new Error("Admin not found");
    
    const credits = await ctx.db
      .query("userCredits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!credits) throw new Error("User credits not found");
    
    const newBalance = credits.balance + args.amount;
    
    await ctx.db.patch(credits._id, {
      balance: newBalance,
      lifetimeEarned: args.amount > 0 
        ? credits.lifetimeEarned + args.amount 
        : credits.lifetimeEarned,
      updatedAt: Date.now(),
    });
    
    await ctx.db.insert("creditAdjustments", {
      userId: args.userId,
      adminId: args.adminId,
      amount: args.amount,
      reason: args.reason,
      balanceBefore: credits.balance,
      balanceAfter: newBalance,
      createdAt: Date.now(),
    });
    
    await ctx.db.insert("creditTransactions", {
      userId: args.userId,
      type: "adjustment",
      amount: args.amount,
      balanceAfter: newBalance,
      description: `Admin adjustment: ${args.reason}`,
      createdAt: Date.now(),
    });
    
    return { success: true, newBalance };
  },
});

// Admin: Get all active subscriptions
export const adminGetActiveSubscriptions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query("userSubscriptions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(args.limit || 100);
  },
});

// Admin: Get revenue metrics
export const adminGetRevenueMetrics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split("T")[0];
    
    const metrics = await ctx.db
      .query("usageMetrics")
      .filter((q) => q.gte(q.field("date"), sinceStr))
      .collect();
    
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);
    const totalAiCost = metrics.reduce((sum, m) => sum + (m.metrics.aiCost || 0), 0);
    
    return {
      totalRevenue,
      totalAiCost,
      grossMargin: totalRevenue - totalAiCost,
      activeUsers: new Set(metrics.map(m => m.userId)).size,
      totalSessions: metrics.reduce((sum, m) => sum + (m.metrics.sessions || 0), 0),
    };
  },
});
