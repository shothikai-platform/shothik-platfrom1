// convex/projects.ts - Project management functions

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Query: Get all projects for a user
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// Query: Get a single project with chapters
export const get = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_project_and_order", (q) => q.eq("projectId", args.projectId))
      .collect();

    return { ...project, chapters };
  },
});

// Mutation: Create a new project
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    targetWordCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const projectId = await ctx.db.insert("projects", {
      userId: args.userId,
      title: args.title,
      type: args.type,
      status: "draft",
      wordCount: 0,
      targetWordCount: args.targetWordCount || 50000,
      description: args.description,
      progress: 0,
      lastSavedAt: now,
      lastEditedAt: now,
      settings: {
        fontFamily: "Inter",
        fontSize: 16,
        lineSpacing: 1.6,
        theme: "dark",
      },
    });

    // Create initial version
    await ctx.db.insert("versions", {
      projectId,
      userId: args.userId,
      content: "",
      wordCount: 0,
      description: "Initial version",
      createdAt: now,
    });

    return projectId;
  },
});

// Mutation: Update project content
export const updateContent = mutation({
  args: {
    projectId: v.id("projects"),
    content: v.string(),
    wordCount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.patch(args.projectId, {
      content: args.content,
      wordCount: args.wordCount,
      lastEditedAt: now,
    });

    // Auto-save version every 5 minutes (simplified)
    // In production, check if enough time has passed
    return { success: true, savedAt: now };
  },
});

// Mutation: Save a version
export const saveVersion = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    content: v.string(),
    wordCount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Create version
    await ctx.db.insert("versions", {
      projectId: args.projectId,
      userId: args.userId,
      content: args.content,
      wordCount: args.wordCount,
      description: args.description || `Version at ${new Date(now).toLocaleString()}`,
      createdAt: now,
    });

    // Update project last saved
    await ctx.db.patch(args.projectId, {
      lastSavedAt: now,
    });

    return { success: true };
  },
});

// Query: Get version history
export const getVersions = query({
  args: { projectId: v.id("projects"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("versions")
      .withIndex("by_project_and_date", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(args.limit || 20);
  },
});

// Mutation: Restore a version
export const restoreVersion = mutation({
  args: {
    projectId: v.id("projects"),
    versionId: v.id("versions"),
  },
  handler: async (ctx, args) => {
    const version = await ctx.db.get(args.versionId);
    if (!version || version.projectId !== args.projectId) {
      throw new Error("Version not found");
    }

    const now = Date.now();

    // Restore content
    await ctx.db.patch(args.projectId, {
      content: version.content,
      wordCount: version.wordCount,
      lastEditedAt: now,
    });

    // Create new version marking the restore
    await ctx.db.insert("versions", {
      projectId: args.projectId,
      userId: version.userId,
      content: version.content,
      wordCount: version.wordCount,
      description: `Restored from version ${args.versionId}`,
      createdAt: now,
    });

    return { success: true };
  },
});

// Mutation: Update project settings
export const updateSettings = mutation({
  args: {
    projectId: v.id("projects"),
    settings: v.object({
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      lineSpacing: v.optional(v.number()),
      theme: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    await ctx.db.patch(args.projectId, {
      settings: { ...project.settings, ...args.settings },
    });

    return { success: true };
  },
});

// Mutation: Delete project
export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    // Delete related data
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const chapter of chapters) {
      await ctx.db.delete(chapter._id);
    }

    const versions = await ctx.db
      .query("versions")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    // Delete project
    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});

// Action: Calculate project statistics
export const getStats = action({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.runQuery(api.projects.get, { projectId: args.projectId });
    if (!project) throw new Error("Project not found");

    const versions = await ctx.runQuery(api.projects.getVersions, { 
      projectId: args.projectId,
      limit: 100 
    });

    // Calculate statistics
    const totalVersions = versions.length;
    const wordsWritten = project.wordCount || 0;
    const targetWords = project.targetWordCount || 50000;
    const progress = Math.min(100, Math.round((wordsWritten / targetWords) * 100));

    // Calculate writing velocity (words per day)
    const firstVersion = versions[versions.length - 1];
    const daysSinceStart = firstVersion 
      ? Math.max(1, Math.floor((Date.now() - firstVersion.createdAt) / (1000 * 60 * 60 * 24)))
      : 1;
    const velocity = Math.round(wordsWritten / daysSinceStart);

    // Estimate completion
    const remainingWords = Math.max(0, targetWords - wordsWritten);
    const estimatedDays = velocity > 0 ? Math.ceil(remainingWords / velocity) : null;

    return {
      totalVersions,
      wordsWritten,
      targetWords,
      progress,
      velocity,
      estimatedDays,
      lastEdited: project.lastEditedAt,
    };
  },
});
