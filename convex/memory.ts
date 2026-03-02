import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ==========================================
// COGNEE MEMORY INTEGRATION
// ==========================================

// Store memory entry
export const addMemory = mutation({
  args: {
    userId: v.id("users"),
    text: v.string(),
    type: v.string(), // 'conversation', 'research', 'writing', etc.
    metadata: v.optional(v.any()),
    cogneeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("memories", {
      userId: args.userId,
      text: args.text,
      type: args.type,
      metadata: args.metadata,
      cogneeId: args.cogneeId,
      createdAt: Date.now(),
    });
  },
});

// Get user memories
export const getMemories = query({
  args: {
    userId: v.id("users"),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.type) {
      q = q.filter((q) => q.eq(q.field("type"), args.type));
    }

    return q.take(args.limit || 50);
  },
});

// Get memory by ID
export const getMemory = query({
  args: { memoryId: v.id("memories") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.memoryId);
  },
});

// Delete memory
export const deleteMemory = mutation({
  args: {
    memoryId: v.id("memories"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (!memory || memory.userId !== args.userId) {
      throw new Error("Memory not found");
    }
    await ctx.db.delete(args.memoryId);
    return { success: true };
  },
});

// Search memories (simple text search)
export const searchMemories = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Simple text matching (in production, use vector search)
    const queryLower = args.query.toLowerCase();
    const filtered = memories.filter((m) =>
      m.text.toLowerCase().includes(queryLower)
    );

    return filtered.slice(0, args.limit || 10);
  },
});

// Get memory statistics
export const getMemoryStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const memories = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const byType: Record<string, number> = {};
    for (const m of memories) {
      byType[m.type] = (byType[m.type] || 0) + 1;
    }

    return {
      total: memories.length,
      byType,
      oldest: memories[memories.length - 1]?.createdAt,
      newest: memories[0]?.createdAt,
    };
  },
});
