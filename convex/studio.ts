import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================
// Projects
// ============================================

export const listProjects = query({
  args: { userId: v.string() },
  returns: v.array(v.any()),
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_user_updated", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);
  },
});

export const getProject = query({
  args: { projectId: v.id("projects") },
  returns: v.any(),
  handler: async (ctx, { projectId }) => {
    const project = await ctx.db.get(projectId);
    if (!project) return null;

    // Get chapters
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_project_order", (q) => q.eq("projectId", projectId))
      .collect();

    return { ...project, chapters };
  },
});

export const createProject = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    type: v.union(
      v.literal("assignment"),
      v.literal("book"),
      v.literal("blog"),
      v.literal("marketing"),
      v.literal("research")
    ),
    description: v.optional(v.string()),
    template: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const projectId = await ctx.db.insert("projects", {
      ...args,
      status: "draft",
      wordCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Create default chapters if template provided
    if (args.template) {
      await ctx.runMutation(internal.studio.createTemplateChapters, {
        projectId,
        template: args.template,
      });
    }

    return projectId;
  },
});

export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("editing"),
      v.literal("published")
    )),
    wordCount: v.optional(v.number()),
    targetWordCount: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { projectId, ...updates } = args;
    
    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    });
    
    return true;
  },
});

export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  returns: v.boolean(),
  handler: async (ctx, { projectId }) => {
    // Delete all chapters first
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    
    for (const chapter of chapters) {
      await ctx.db.delete(chapter._id);
    }

    // Delete project
    await ctx.db.delete(projectId);
    return true;
  },
});

// ============================================
// Chapters
// ============================================

export const getChapter = query({
  args: { chapterId: v.id("chapters") },
  returns: v.any(),
  handler: async (ctx, { chapterId }) => {
    const chapter = await ctx.db.get(chapterId);
    if (!chapter) return null;

    // Get recent versions
    const versions = await ctx.db
      .query("chapterVersions")
      .withIndex("by_chapter_created", (q) => q.eq("chapterId", chapterId))
      .order("desc")
      .take(10);

    return { ...chapter, versions };
  },
});

export const createChapter = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    order: v.optional(v.number()),
  },
  returns: v.id("chapters"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Get max order if not provided
    let order = args.order;
    if (order === undefined) {
      const existingChapters = await ctx.db
        .query("chapters")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .collect();
      order = existingChapters.length;
    }

    const chapterId = await ctx.db.insert("chapters", {
      ...args,
      order,
      content: "",
      wordCount: 0,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    // Update project timestamp
    await ctx.db.patch(args.projectId, { updatedAt: now });

    return chapterId;
  },
});

export const updateChapter = mutation({
  args: {
    chapterId: v.id("chapters"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("reviewing"),
      v.literal("complete")
    )),
    wordCount: v.optional(v.number()),
    saveVersion: v.optional(v.boolean()),
    userId: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { chapterId, saveVersion, userId, ...updates } = args;
    
    const chapter = await ctx.db.get(chapterId);
    if (!chapter) return false;

    const now = Date.now();

    // Save version if requested or auto-save condition met
    if (saveVersion && userId && updates.content) {
      await ctx.db.insert("chapterVersions", {
        chapterId,
        content: updates.content,
        wordCount: updates.wordCount || chapter.wordCount,
        createdAt: now,
        createdBy: userId,
      });

      // Cleanup old versions (keep last 50)
      const versions = await ctx.db
        .query("chapterVersions")
        .withIndex("by_chapter_created", (q) => q.eq("chapterId", chapterId))
        .order("desc")
        .collect();
      
      if (versions.length > 50) {
        for (let i = 50; i < versions.length; i++) {
          await ctx.db.delete(versions[i]._id);
        }
      }
    }

    // Update chapter
    await ctx.db.patch(chapterId, {
      ...updates,
      updatedAt: now,
    });

    // Update project timestamp
    await ctx.db.patch(chapter.projectId, { updatedAt: now });

    return true;
  },
});

export const deleteChapter = mutation({
  args: { chapterId: v.id("chapters") },
  returns: v.boolean(),
  handler: async (ctx, { chapterId }) => {
    const chapter = await ctx.db.get(chapterId);
    if (!chapter) return false;

    // Delete versions
    const versions = await ctx.db
      .query("chapterVersions")
      .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
      .collect();
    
    for (const version of versions) {
      await ctx.db.delete(version._id);
    }

    // Delete auto-save drafts
    const drafts = await ctx.db
      .query("autoSaveDrafts")
      .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
      .collect();
    
    for (const draft of drafts) {
      await ctx.db.delete(draft._id);
    }

    // Delete chapter
    await ctx.db.delete(chapterId);

    // Update project timestamp
    await ctx.db.patch(chapter.projectId, { updatedAt: Date.now() });

    return true;
  },
});

export const reorderChapters = mutation({
  args: {
    projectId: v.id("projects"),
    chapterIds: v.array(v.id("chapters")),
  },
  returns: v.boolean(),
  handler: async (ctx, { projectId, chapterIds }) => {
    for (let i = 0; i < chapterIds.length; i++) {
      await ctx.db.patch(chapterIds[i], { order: i });
    }
    
    await ctx.db.patch(projectId, { updatedAt: Date.now() });
    return true;
  },
});

// ============================================
// Versions
// ============================================

export const getVersionHistory = query({
  args: { chapterId: v.id("chapters") },
  returns: v.array(v.any()),
  handler: async (ctx, { chapterId }) => {
    return await ctx.db
      .query("chapterVersions")
      .withIndex("by_chapter_created", (q) => q.eq("chapterId", chapterId))
      .order("desc")
      .take(50);
  },
});

export const restoreVersion = mutation({
  args: {
    chapterId: v.id("chapters"),
    versionId: v.id("chapterVersions"),
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { chapterId, versionId, userId }) => {
    const version = await ctx.db.get(versionId);
    if (!version || version.chapterId !== chapterId) return false;

    const chapter = await ctx.db.get(chapterId);
    if (!chapter) return false;

    // Save current as version first
    await ctx.db.insert("chapterVersions", {
      chapterId,
      content: chapter.content,
      wordCount: chapter.wordCount,
      createdAt: Date.now(),
      createdBy: userId,
    });

    // Restore version
    await ctx.db.patch(chapterId, {
      content: version.content,
      wordCount: version.wordCount,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// ============================================
// Auto-save
// ============================================

export const autoSave = mutation({
  args: {
    chapterId: v.id("chapters"),
    content: v.string(),
    cursorPosition: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { chapterId, ...data } = args;
    const now = Date.now();

    // Check for existing draft
    const existing = await ctx.db
      .query("autoSaveDrafts")
      .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...data,
        savedAt: now,
      });
    } else {
      await ctx.db.insert("autoSaveDrafts", {
        chapterId,
        ...data,
        savedAt: now,
      });
    }

    return true;
  },
});

export const getAutoSave = query({
  args: { chapterId: v.id("chapters") },
  returns: v.optional(v.any()),
  handler: async (ctx, { chapterId }) => {
    return await ctx.db
      .query("autoSaveDrafts")
      .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
      .first();
  },
});

export const clearAutoSave = mutation({
  args: { chapterId: v.id("chapters") },
  returns: v.boolean(),
  handler: async (ctx, { chapterId }) => {
    const draft = await ctx.db
      .query("autoSaveDrafts")
      .withIndex("by_chapter", (q) => q.eq("chapterId", chapterId))
      .first();
    
    if (draft) {
      await ctx.db.delete(draft._id);
    }
    
    return true;
  },
});
