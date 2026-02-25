// convex/chat.ts - Persistent AI chat with full manuscript access

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Query: Get chat session with messages
export const getSession = query({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    // Get project context if available
    let projectContext = null;
    if (session.projectId) {
      const project = await ctx.db.get(session.projectId);
      if (project) {
        const chapters = await ctx.db
          .query("chapters")
          .withIndex("by_project", (q) => q.eq("projectId", session.projectId!))
          .collect();
        
        projectContext = {
          title: project.title,
          type: project.type,
          wordCount: project.wordCount,
          progress: project.progress,
          chapters: chapters.map(c => ({
            id: c._id,
            title: c.title,
            order: c.order,
            wordCount: c.wordCount,
          })),
        };
      }
    }

    return {
      ...session,
      projectContext,
    };
  },
});

// Query: List chat sessions for user
export const listSessions = query({
  args: { 
    userId: v.id("users"),
    projectId: v.optional(v.id("projects"))
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("chatSessions")
      .withIndex("by_user_and_activity", (q) => q.eq("userId", args.userId));

    if (args.projectId) {
      query = query.filter((q) => q.eq(q.field("projectId"), args.projectId));
    }

    return await query.order("desc").take(20);
  },
});

// Mutation: Create new chat session
export const createSession = mutation({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    title: v.optional(v.string()),
    context: v.optional(v.object({
      currentChapter: v.optional(v.id("chapters")),
      selectedText: v.optional(v.string()),
      mode: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const sessionId = await ctx.db.insert("chatSessions", {
      userId: args.userId,
      projectId: args.projectId,
      title: args.title || "New Chat",
      context: args.context,
      messages: [{
        id: `system-${now}`,
        role: "system",
        content: "I'm your writing assistant. I have access to your full manuscript and can help with analysis, suggestions, and improvements.",
        timestamp: now,
      }],
      tokenUsage: { input: 0, output: 0, total: 0 },
      lastActivityAt: now,
    });

    return sessionId;
  },
});

// Mutation: Add message to chat
export const addMessage = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    role: v.string(), // 'user' | 'assistant'
    content: v.string(),
    attachments: v.optional(v.array(v.object({
      type: v.string(),
      name: v.string(),
      content: v.optional(v.string()),
    }))),
    tokenCount: v.optional(v.object({
      input: v.number(),
      output: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Chat session not found");

    const now = Date.now();
    
    // Add message
    const newMessage = {
      id: `${args.role}-${now}`,
      role: args.role,
      content: args.content,
      timestamp: now,
      attachments: args.attachments,
    };

    // Update token usage
    const tokenUsage = session.tokenUsage || { input: 0, output: 0, total: 0 };
    if (args.tokenCount) {
      tokenUsage.input += args.tokenCount.input;
      tokenUsage.output += args.tokenCount.output;
      tokenUsage.total += args.tokenCount.input + args.tokenCount.output;
    }

    // Keep only last 100 messages to prevent bloat
    const messages = [...session.messages, newMessage].slice(-100);

    await ctx.db.patch(args.sessionId, {
      messages,
      tokenUsage,
      lastActivityAt: now,
    });

    return { success: true, messageId: newMessage.id };
  },
});

// Mutation: Update chat context
export const updateContext = mutation({
  args: {
    sessionId: v.id("chatSessions"),
    context: v.object({
      currentChapter: v.optional(v.id("chapters")),
      selectedText: v.optional(v.string()),
      mode: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      context: args.context,
      lastActivityAt: Date.now(),
    });

    return { success: true };
  },
});

// Mutation: Delete chat session
export const deleteSession = mutation({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
    return { success: true };
  },
});

// Action: Get full manuscript context for AI
export const getManuscriptContext = action({
  args: { 
    sessionId: v.id("chatSessions"),
    includeFullText: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(api.chat.getSession, { 
      sessionId: args.sessionId 
    });
    
    if (!session || !session.projectId) {
      return { hasProject: false };
    }

    const project = await ctx.db.get(session.projectId);
    if (!project) return { hasProject: false };

    // Get all chapters with content
    const chapters = await ctx.db
      .query("chapters")
      .withIndex("by_project_and_order", (q) => 
        q.eq("projectId", session.projectId!)
      )
      .collect();

    // Build manuscript context
    const manuscriptContext = {
      hasProject: true,
      project: {
        title: project.title,
        type: project.type,
        wordCount: project.wordCount,
        targetWordCount: project.targetWordCount,
        progress: project.progress,
        description: project.description,
      },
      chapters: chapters.map(c => ({
        id: c._id,
        title: c.title,
        order: c.order,
        wordCount: c.wordCount,
        status: c.status,
        // Include full content if requested and size permits
        content: args.includeFullText ? c.content : undefined,
      })),
      currentContext: session.context,
      chatHistory: session.messages.slice(-20), // Last 20 messages for context
    };

    return manuscriptContext;
  },
});

// Action: Summarize chat for storage optimization
export const summarizeChat = action({
  args: { sessionId: v.id("chatSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // If more than 50 messages, summarize older ones
    if (session.messages.length > 50) {
      const recentMessages = session.messages.slice(-30);
      const olderMessages = session.messages.slice(0, -30);

      // Create summary of older messages (in production, use LLM)
      const summary = {
        id: `summary-${Date.now()}`,
        role: "system",
        content: `[Summary of ${olderMessages.length} earlier messages: ${olderMessages[0].content.substring(0, 100)}...]`,
        timestamp: olderMessages[olderMessages.length - 1].timestamp,
        isSummary: true,
      };

      await ctx.db.patch(args.sessionId, {
        messages: [summary, ...recentMessages],
      });

      return { summarized: true, messageCount: olderMessages.length };
    }

    return { summarized: false };
  },
});

// Query: Get token usage stats
export const getTokenStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = sessions.reduce((acc, session) => {
      const usage = session.tokenUsage || { input: 0, output: 0, total: 0 };
      return {
        totalInput: acc.totalInput + usage.input,
        totalOutput: acc.totalOutput + usage.output,
        totalTokens: acc.totalTokens + usage.total,
        sessionCount: acc.sessionCount + 1,
        messageCount: acc.messageCount + session.messages.length,
      };
    }, {
      totalInput: 0,
      totalOutput: 0,
      totalTokens: 0,
      sessionCount: 0,
      messageCount: 0,
    });

    return stats;
  },
});
