import { z } from "zod";
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// API Key schema for Convex
export const apiKeySchema = v.object({
  id: v.string(),
  userId: v.string(),
  name: v.string(),
  keyHash: v.string(),
  keyPrefix: v.string(),
  permissions: v.array(v.string()),
  createdAt: v.number(),
  expiresAt: v.optional(v.number()),
  lastUsedAt: v.optional(v.number()),
  usageCount: v.number(),
  rateLimit: v.number(),
  allowedIPs: v.optional(v.array(v.string())),
  isRevoked: v.boolean(),
});

// Security event schema
export const securityEventSchema = v.object({
  id: v.string(),
  timestamp: v.number(),
  type: v.union(
    v.literal("auth_failure"),
    v.literal("rate_limit"),
    v.literal("suspicious"),
    v.literal("violation"),
    v.literal("error")
  ),
  severity: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  source: v.object({
    ip: v.string(),
    userAgent: v.optional(v.string()),
    userId: v.optional(v.string()),
  }),
  details: v.object({
    path: v.string(),
    method: v.string(),
    description: v.string(),
    metadata: v.optional(v.any()),
  }),
});

// Store API key in Convex
export const storeApiKey = mutation({
  args: {
    keyId: v.string(),
    userId: v.string(),
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
    permissions: v.array(v.string()),
    expiresAt: v.optional(v.number()),
    rateLimit: v.number(),
    allowedIPs: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const key = await ctx.db.insert("apiKeys", {
      id: args.keyId,
      userId: args.userId,
      name: args.name,
      keyHash: args.keyHash,
      keyPrefix: args.keyPrefix,
      permissions: args.permissions,
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
      lastUsedAt: undefined,
      usageCount: 0,
      rateLimit: args.rateLimit,
      allowedIPs: args.allowedIPs,
      isRevoked: false,
    });
    return key;
  },
});

// Get API key by hash
export const getApiKeyByHash = query({
  args: { keyHash: v.string() },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_hash", (q) => q.eq("keyHash", args.keyHash))
      .first();
    return key;
  },
});

// List user's API keys
export const listUserApiKeys = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return keys.map((k) => ({
      ...k,
      keyHash: undefined, // Never return the hash
    }));
  },
});

// Revoke API key
export const revokeApiKey = mutation({
  args: { keyId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_id", (q) => q.eq("id", args.keyId))
      .first();

    if (!key || key.userId !== args.userId) {
      return { success: false, error: "Key not found" };
    }

    await ctx.db.patch(key._id, { isRevoked: true });
    return { success: true };
  },
});

// Update API key usage
export const updateApiKeyUsage = mutation({
  args: { keyId: v.string() },
  handler: async (ctx, args) => {
    const key = await ctx.db
      .query("apiKeys")
      .withIndex("by_id", (q) => q.eq("id", args.keyId))
      .first();

    if (!key) return;

    await ctx.db.patch(key._id, {
      lastUsedAt: Date.now(),
      usageCount: key.usageCount + 1,
    });
  },
});

// Log security event
export const logSecurityEvent = mutation({
  args: {
    type: v.union(
      v.literal("auth_failure"),
      v.literal("rate_limit"),
      v.literal("suspicious"),
      v.literal("violation"),
      v.literal("error")
    ),
    severity: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    source: v.object({
      ip: v.string(),
      userAgent: v.optional(v.string()),
      userId: v.optional(v.string()),
    }),
    details: v.object({
      path: v.string(),
      method: v.string(),
      description: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.insert("securityEvents", {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...args,
    });

    // Alert on critical events
    if (args.severity === "critical") {
      // TODO: Send alert to admin
      console.error("🚨 CRITICAL SECURITY EVENT:", args);
    }

    return event;
  },
});

// Get security events
export const getSecurityEvents = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("securityEvents").order("desc");

    if (args.limit) {
      query = query.take(args.limit);
    }

    const events = await query.collect();

    return events.filter((e) => {
      if (args.type && e.type !== args.type) return false;
      if (args.severity && e.severity !== args.severity) return false;
      return true;
    });
  },
});

// Get security metrics
export const getSecurityMetrics = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 7;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const events = await ctx.db
      .query("securityEvents")
      .filter((q) => q.gte(q.field("timestamp"), since))
      .collect();

    const metrics = {
      totalEvents: events.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      criticalEvents: events.filter((e) => e.severity === "critical").length,
    };

    events.forEach((e) => {
      metrics.byType[e.type] = (metrics.byType[e.type] || 0) + 1;
      metrics.bySeverity[e.severity] = (metrics.bySeverity[e.severity] || 0) + 1;
    });

    return metrics;
  },
});
