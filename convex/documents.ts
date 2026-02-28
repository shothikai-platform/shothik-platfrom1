import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ==========================================
// PARSED PDF DOCUMENTS
// ==========================================

// Store parsed PDF document
export const storeParsedDocument = mutation({
  args: {
    userId: v.id("users"),
    originalName: v.string(),
    metadata: v.object({
      title: v.string(),
      author: v.optional(v.string()),
      pages: v.number(),
      wordCount: v.number(),
      parseTime: v.number(),
    }),
    markdown: v.string(),
    structured: v.optional(v.any()),
    agent: v.string(), // 'research' | 'slide' | 'sheet'
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("parsedDocuments", {
      userId: args.userId,
      originalName: args.originalName,
      metadata: args.metadata,
      markdown: args.markdown,
      structured: args.structured,
      agent: args.agent,
      createdAt: Date.now(),
    });
  },
});

// Get user's parsed documents
export const getUserDocuments = query({
  args: {
    userId: v.id("users"),
    agent: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("parsedDocuments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.agent) {
      query = query.filter((q) => q.eq(q.field("agent"), args.agent));
    }

    return query.take(args.limit || 50);
  },
});

// Get single document
export const getDocument = query({
  args: { documentId: v.id("parsedDocuments") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.documentId);
  },
});

// Delete document
export const deleteDocument = mutation({
  args: {
    documentId: v.id("parsedDocuments"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.userId !== args.userId) {
      throw new Error("Document not found");
    }
    await ctx.db.delete(args.documentId);
    return { success: true };
  },
});

// ==========================================
// RESEARCH NOTES FROM PDF
// ==========================================

// Create research notes from PDF
export const createResearchNotes = mutation({
  args: {
    userId: v.id("users"),
    documentId: v.id("parsedDocuments"),
    title: v.string(),
    summary: v.string(),
    keyPoints: v.array(v.string()),
    citations: v.array(v.string()),
    sections: v.array(v.object({
      title: v.string(),
      content: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("researchNotes", {
      userId: args.userId,
      documentId: args.documentId,
      title: args.title,
      summary: args.summary,
      keyPoints: args.keyPoints,
      citations: args.citations,
      sections: args.sections,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get research notes
export const getResearchNotes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("researchNotes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// ==========================================
// SLIDE OUTLINES FROM PDF
// ==========================================

// Create slide outline from PDF
export const createSlideOutline = mutation({
  args: {
    userId: v.id("users"),
    documentId: v.id("parsedDocuments"),
    title: v.string(),
    totalSlides: v.number(),
    slides: v.array(v.object({
      index: v.number(),
      title: v.string(),
      bulletPoints: v.array(v.string()),
      hasImage: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("slideOutlines", {
      userId: args.userId,
      documentId: args.documentId,
      title: args.title,
      totalSlides: args.totalSlides,
      slides: args.slides,
      status: "draft",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get slide outlines
export const getSlideOutlines = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("slideOutlines")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

// ==========================================
// SHEET DATA FROM PDF
// ==========================================

// Create sheet from PDF tables
export const createSheetFromPDF = mutation({
  args: {
    userId: v.id("users"),
    documentId: v.id("parsedDocuments"),
    title: v.string(),
    tables: v.array(v.object({
      index: v.number(),
      name: v.string(),
      rows: v.number(),
      columns: v.number(),
      headers: v.array(v.string()),
      data: v.array(v.array(v.any())),
    })),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("sheetData", {
      userId: args.userId,
      documentId: args.documentId,
      title: args.title,
      tables: args.tables,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get sheet data
export const getSheetData = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("sheetData")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});
