// convex/schema.ts - Database schema for Shothik Writing Studio

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatar: v.optional(v.string()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()), // 'light' | 'dark' | 'system'
      fontSize: v.optional(v.number()),
      autosaveInterval: v.optional(v.number()), // seconds
    })),
    subscription: v.optional(v.object({
      tier: v.string(), // 'free' | 'pro' | 'premium'
      expiresAt: v.optional(v.number()),
    })),
  })
    .index("by_email", ["email"]),

  // Projects table (books, research papers, assignments)
  projects: defineTable({
    userId: v.id("users"),
    title: v.string(),
    type: v.string(), // 'book' | 'research' | 'assignment'
    status: v.string(), // 'draft' | 'in_progress' | 'completed' | 'published'
    
    // Content
    content: v.optional(v.string()), // HTML/TipTap JSON
    contentFormat: v.optional(v.string()), // 'html' | 'json'
    wordCount: v.optional(v.number()),
    targetWordCount: v.optional(v.number()),
    
    // Metadata
    description: v.optional(v.string()),
    genre: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    
    // Progress tracking
    progress: v.optional(v.number()), // 0-100
    lastSavedAt: v.optional(v.number()),
    lastEditedAt: v.optional(v.number()),
    
    // AI features
    aiSuggestions: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      content: v.string(),
      position: v.optional(v.number()),
      applied: v.optional(v.boolean()),
      dismissed: v.optional(v.boolean()),
    }))),
    
    // Settings
    settings: v.optional(v.object({
      fontFamily: v.optional(v.string()),
      fontSize: v.optional(v.number()),
      lineSpacing: v.optional(v.number()),
      theme: v.optional(v.string()),
    })),
    
    // Publishing
    publishSettings: v.optional(v.object({
      isbn: v.optional(v.string()),
      publisher: v.optional(v.string()),
      publicationDate: v.optional(v.number()),
      price: v.optional(v.number()),
      platforms: v.optional(v.array(v.string())), // ['kdp', 'apple', 'google']
    })),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_status", ["status"]),

  // Chapters table (for books)
  chapters: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    title: v.string(),
    order: v.number(),
    content: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    status: v.optional(v.string()), // 'draft' | 'editing' | 'final'
    
    // AI analysis
    neuralScore: v.optional(v.number()),
    nobelImpact: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_order", ["projectId", "order"]),

  // Chat sessions (persistent AI chat)
  chatSessions: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    title: v.optional(v.string()),
    
    // Context for the chat
    context: v.optional(v.object({
      currentChapter: v.optional(v.id("chapters")),
      selectedText: v.optional(v.string()),
      mode: v.optional(v.string()), // 'write' | 'format' | 'publish'
    })),
    
    // Chat history
    messages: v.array(v.object({
      id: v.string(),
      role: v.string(), // 'user' | 'assistant' | 'system'
      content: v.string(),
      timestamp: v.number(),
      attachments: v.optional(v.array(v.object({
        type: v.string(),
        name: v.string(),
        content: v.optional(v.string()),
      }))),
    })),
    
    // Token usage tracking
    tokenUsage: v.optional(v.object({
      input: v.number(),
      output: v.number(),
      total: v.number(),
    })),
    
    lastActivityAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_user_and_activity", ["userId", "lastActivityAt"]),

  // Version history (for rollback)
  versions: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    chapterId: v.optional(v.id("chapters")),
    
    // Version data
    content: v.string(),
    wordCount: v.number(),
    
    // Metadata
    description: v.optional(v.string()), // e.g., "Added climax scene"
    createdAt: v.number(),
    
    // AI-generated summary of changes
    changeSummary: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_chapter", ["chapterId"])
    .index("by_project_and_date", ["projectId", "createdAt"]),

  // Character DNA (psychology profiles)
  characters: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    
    // Basic info
    name: v.string(),
    role: v.optional(v.string()), // 'protagonist' | 'antagonist' | 'supporting'
    
    // Psychology (Enneagram)
    enneagram: v.optional(v.object({
      type: v.number(), // 1-9
      wing: v.optional(v.number()),
      instinct: v.optional(v.string()), // 'sp' | 'so' | 'sx'
      tritype: v.optional(v.object({
        gut: v.number(),
        heart: v.number(),
        head: v.number(),
      })),
    })),
    
    // Core psychology
    psychology: v.optional(v.object({
      coreFear: v.optional(v.string()),
      coreDesire: v.optional(v.string()),
      coreLie: v.optional(v.string()),
      thematicTruth: v.optional(v.string()),
    })),
    
    // Character arc
    arc: v.optional(v.object({
      starting: v.string(),
      current: v.string(),
      target: v.string(),
      progress: v.number(), // 0-100
    })),
    
    // Relationships
    relationships: v.optional(v.array(v.object({
      characterId: v.id("characters"),
      type: v.string(), // 'ally' | 'enemy' | 'family' | 'romantic'
      description: v.optional(v.string()),
    }))),
    
    // Notes
    notes: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_role", ["projectId", "role"]),

  // AI analysis cache (to avoid re-analyzing)
  aiAnalysis: defineTable({
    projectId: v.id("projects"),
    chapterId: v.optional(v.id("chapters")),
    
    // Analysis type
    type: v.string(), // 'neural' | 'nobel' | 'structure' | 'style'
    
    // Results
    results: v.object({
      score: v.optional(v.number()),
      analysis: v.optional(v.string()),
      suggestions: v.optional(v.array(v.string())),
      benchmarks: v.optional(v.object({
        vsTagore: v.optional(v.number()),
        vsTolstoy: v.optional(v.number()),
        vsMorrison: v.optional(v.number()),
      })),
    }),
    
    // Cache metadata
    contentHash: v.string(), // hash of content to detect changes
    analyzedAt: v.number(),
    expiresAt: v.number(), // cache expiration
  })
    .index("by_project_and_type", ["projectId", "type"])
    .index("by_chapter_and_type", ["chapterId", "type"]),

  // Export history
  exports: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    
    format: v.string(), // 'epub' | 'pdf' | 'docx'
    status: v.string(), // 'processing' | 'completed' | 'failed'
    
    // File info
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    
    // Accessibility report
    accessibilityReport: v.optional(v.object({
      score: v.number(),
      passed: v.boolean(),
      issues: v.optional(v.number()),
    })),
    
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"]),

  // User activity tracking
  activity: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    
    type: v.string(), // 'write' | 'edit' | 'ai_suggestion' | 'export' | 'publish'
    
    // Activity details
    details: v.optional(v.object({
      wordCount: v.optional(v.number()),
      duration: v.optional(v.number()), // seconds
      aiTokens: v.optional(v.number()),
    })),
    
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_project", ["userId", "projectId"])
    .index("by_timestamp", ["timestamp"]),
});
