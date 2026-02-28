import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ==========================================
// SEED DATA
// ==========================================

// Seed subscription plans
export const seedSubscriptionPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const plans = [
      {
        id: "free",
        name: "Free",
        priceMonthly: 0,
        priceYearly: 0,
        currency: "usd",
        features: {
          monthlyCredits: 1000,
          tools: ["grammar", "paraphrase-light", "ai-detector"],
          maxProjects: 3,
          maxStorageMB: 100,
          prioritySupport: false,
          apiAccess: false,
          customModels: false,
        },
        isActive: true,
        displayOrder: 1,
      },
      {
        id: "pro",
        name: "Pro",
        priceMonthly: 999, // $9.99
        priceYearly: 9990, // $99.90 (2 months free)
        currency: "usd",
        features: {
          monthlyCredits: 10000,
          tools: ["grammar", "paraphrase", "ai-detector", "translator", "humanize", "summarize"],
          maxProjects: 10,
          maxStorageMB: 1000,
          prioritySupport: true,
          apiAccess: false,
          customModels: false,
        },
        isActive: true,
        displayOrder: 2,
      },
      {
        id: "premium",
        name: "Premium",
        priceMonthly: 2999, // $29.99
        priceYearly: 29990, // $299.90 (2 months free)
        currency: "usd",
        features: {
          monthlyCredits: 100000,
          tools: ["all"],
          maxProjects: 100,
          maxStorageMB: 10000,
          prioritySupport: true,
          apiAccess: true,
          customModels: true,
        },
        isActive: true,
        displayOrder: 3,
      },
    ];
    
    const created = [];
    for (const plan of plans) {
      const existing = await ctx.db
        .query("subscriptionPlans")
        .filter((q) => q.eq(q.field("id"), plan.id))
        .first();
      
      if (!existing) {
        const id = await ctx.db.insert("subscriptionPlans", plan);
        created.push(id);
      }
    }
    
    return { created: created.length, plans };
  },
});

// Get all seed data status
export const getSeedStatus = query({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query("subscriptionPlans").collect();
    
    return {
      subscriptionPlans: plans.length,
      plans: plans.map(p => ({ id: p.id, name: p.name, isActive: p.isActive })),
    };
  },
});
