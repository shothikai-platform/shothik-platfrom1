import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
async function getAuthenticatedUserId(ctx, passedUserId) {
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject) {
        return identity.subject;
    }
    if (passedUserId) {
        return passedUserId;
    }
    throw new Error("Authentication required");
}
export const list = query({
    args: {
        userId: v.optional(v.string()),
        type: v.optional(v.union(v.literal("book"), v.literal("research"), v.literal("assignment"))),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId).catch(() => null);
        if (!userId) {
            return [];
        }
        if (args.type) {
            return await ctx.db
                .query("projects")
                .withIndex("by_user_type", (q) => q.eq("userId", userId).eq("type", args.type))
                .order("desc")
                .collect();
        }
        return await ctx.db
            .query("projects")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});
export const get = query({
    args: { id: v.id("projects") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});
export const create = mutation({
    args: {
        title: v.string(),
        type: v.union(v.literal("book"), v.literal("research"), v.literal("assignment")),
        template: v.optional(v.string()),
        description: v.optional(v.string()),
        userId: v.optional(v.string()),
        sections: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            content: v.optional(v.string()),
            order: v.number(),
            children: v.optional(v.array(v.object({
                id: v.string(),
                title: v.string(),
                content: v.optional(v.string()),
                order: v.number(),
                status: v.optional(v.string()),
            }))),
        }))),
        settings: v.optional(v.object({
            citationStyle: v.optional(v.string()),
            targetJournal: v.optional(v.string()),
            deadline: v.optional(v.string()),
            dailyGoal: v.optional(v.number()),
            fontFamily: v.optional(v.string()),
            fontSize: v.optional(v.number()),
            trimSize: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const { userId: _passedUserId, ...rest } = args;
        const projectId = await ctx.db.insert("projects", {
            ...rest,
            userId,
            content: "",
            wordCount: 0,
            progress: 0,
            lastEditedAt: Date.now(),
            starred: false,
        });
        return projectId;
    },
});
export const update = mutation({
    args: {
        id: v.id("projects"),
        userId: v.optional(v.string()),
        title: v.optional(v.string()),
        content: v.optional(v.string()),
        sections: v.optional(v.any()),
        settings: v.optional(v.any()),
        wordCount: v.optional(v.number()),
        progress: v.optional(v.number()),
        starred: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const { id, userId: _passedUserId, ...updates } = args;
        const project = await ctx.db.get(id);
        if (!project)
            throw new Error("Project not found");
        if (project.userId && project.userId !== userId) {
            throw new Error("Unauthorized");
        }
        const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
        filtered.lastEditedAt = Date.now();
        await ctx.db.patch(id, filtered);
    },
});
export const remove = mutation({
    args: { id: v.id("projects"), userId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthenticatedUserId(ctx, args.userId);
        const project = await ctx.db.get(args.id);
        if (!project)
            throw new Error("Project not found");
        if (project.userId && project.userId !== userId) {
            throw new Error("Unauthorized");
        }
        await ctx.db.delete(args.id);
    },
});
