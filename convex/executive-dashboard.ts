// Shothik Executive Dashboard
// Convex actions for executive intelligence

import { query } from "./_generated/server";
import { v } from "convex/values";

export const getExecutiveMetrics = query({
  args: {
    timeRange: v.optional(v.string()),
  },
  returns: v.object({
    totalBCMinted: v.number(),
    totalBCBurned: v.number(),
    grossMargin: v.number(),
    revenue: v.number(),
    infrastructureCost: v.number(),
    activeUsers: v.number(),
    fraudIncidents: v.number(),
  }),
  handler: async (ctx, args) => {
    return {
      totalBCMinted: 1000000,
      totalBCBurned: 750000,
      grossMargin: 0.35,
      revenue: 50000,
      infrastructureCost: 32500,
      activeUsers: 1250,
      fraudIncidents: 3,
    };
  },
});
