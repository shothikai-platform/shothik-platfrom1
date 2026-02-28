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

  // API Keys for external developers
  apiKeys: defineTable({
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
  })
    .index("by_hash", ["keyHash"])
    .index("by_user", ["userId"])
    .index("by_id", ["id"]),

  // Security events for monitoring
  securityEvents: defineTable({
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
    }),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_type", ["type"])
    .index("by_severity", ["severity"]),

  // ==========================================
  // ECONOMIC ENGINE TABLES
  // ==========================================

  // User credits balance
  userCredits: defineTable({
    userId: v.id("users"),
    balance: v.number(), // in tokens/credits
    lifetimeEarned: v.number(),
    lifetimeSpent: v.number(),
    
    // Tier info
    tier: v.string(), // 'free' | 'pro' | 'premium'
    tierExpiresAt: v.optional(v.number()),
    
    // Usage limits
    monthlyLimit: v.number(),
    monthlyUsed: v.number(),
    monthlyResetAt: v.number(),
    
    // Auto-recharge settings
    autoRecharge: v.optional(v.object({
      enabled: v.boolean(),
      threshold: v.number(), // recharge when balance below this
      amount: v.number(), // amount to recharge
      paymentMethodId: v.string(),
    })),
    
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_tier", ["tier"]),

  // Credit transactions (mint/burn/purchase)
  creditTransactions: defineTable({
    userId: v.id("users"),
    
    // Transaction details
    type: v.union(
      v.literal("purchase"),    // bought credits
      v.literal("usage"),       // spent on AI
      v.literal("refund"),      // refunded
      v.literal("bonus"),       // promotional
      v.literal("adjustment")   // admin adjustment
    ),
    
    amount: v.number(), // positive = credit added, negative = credit spent
    balanceAfter: v.number(),
    
    // What was this for?
    description: v.string(),
    metadata: v.optional(v.object({
      tool: v.optional(v.string()), // 'grammar', 'paraphrase', etc.
      tokens: v.optional(v.number()), // AI tokens used
      model: v.optional(v.string()), // 'kimi', 'deepseek', etc.
    })),
    
    // Payment info (if purchase)
    paymentIntentId: v.optional(v.string()),
    
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_created", ["createdAt"])
    .index("by_payment_intent", ["paymentIntentId"]),

  // Subscription plans
  subscriptionPlans: defineTable({
    id: v.string(),
    name: v.string(), // 'Free', 'Pro', 'Premium'
    
    // Pricing
    priceMonthly: v.number(), // in cents
    priceYearly: v.number(), // in cents
    currency: v.string(), // 'usd', 'eur', etc.
    
    // Features
    features: v.object({
      monthlyCredits: v.number(),
      tools: v.array(v.string()), // which tools are included
      maxProjects: v.number(),
      maxStorageMB: v.number(),
      prioritySupport: v.boolean(),
      apiAccess: v.boolean(),
      customModels: v.boolean(),
    }),
    
    // Stripe price IDs
    stripePriceIdMonthly: v.optional(v.string()),
    stripePriceIdYearly: v.optional(v.string()),
    
    isActive: v.boolean(),
    displayOrder: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_display_order", ["displayOrder"]),

  // User subscriptions
  userSubscriptions: defineTable({
    userId: v.id("users"),
    
    // Current plan
    planId: v.id("subscriptionPlans"),
    status: v.union(
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("unpaid"),
      v.literal("paused")
    ),
    
    // Billing
    interval: v.union(v.literal("month"), v.literal("year")),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    
    // Stripe info
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    stripePriceId: v.string(),
    
    // Cancellation
    cancelAtPeriodEnd: v.boolean(),
    canceledAt: v.optional(v.number()),
    
    // Trial
    trialStart: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"])
    .index("by_status", ["status"]),

  // Invoices
  invoices: defineTable({
    userId: v.id("users"),
    subscriptionId: v.optional(v.id("userSubscriptions")),
    
    // Invoice details
    stripeInvoiceId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    
    amount: v.number(), // in cents
    currency: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("open"),
      v.literal("paid"),
      v.literal("uncollectible"),
      v.literal("void")
    ),
    
    // Line items
    items: v.array(v.object({
      description: v.string(),
      amount: v.number(),
      periodStart: v.optional(v.number()),
      periodEnd: v.optional(v.number()),
    })),
    
    // Dates
    createdAt: v.number(),
    dueDate: v.optional(v.number()),
    paidAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_invoice", ["stripeInvoiceId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"]),

  // Usage metrics (for analytics)
  usageMetrics: defineTable({
    userId: v.id("users"),
    
    // Time period
    date: v.string(), // YYYY-MM-DD
    hour: v.optional(v.number()), // 0-23 for hourly granularity
    
    // Usage breakdown
    metrics: v.object({
      // Tool usage
      grammarChecks: v.number(),
      paraphraseRequests: v.number(),
      aiDetectorScans: v.number(),
      translations: v.number(),
      humanizeRequests: v.number(),
      summaries: v.number(),
      
      // AI tokens
      aiTokensInput: v.number(),
      aiTokensOutput: v.number(),
      aiCost: v.number(), // in cents
      
      // Projects
      projectsCreated: v.number(),
      wordsWritten: v.number(),
      exports: v.number(),
      
      // Engagement
      sessions: v.number(),
      sessionDuration: v.number(), // total seconds
    }),
    
    // Revenue
    revenue: v.optional(v.number()), // in cents
    
    createdAt: v.number(),
  })
    .index("by_user_and_date", ["userId", "date"])
    .index("by_date", ["date"])
    .index("by_user_and_hour", ["userId", "hour"]),

  // Credit adjustments (admin actions)
  creditAdjustments: defineTable({
    userId: v.id("users"),
    adminId: v.id("users"), // who made the adjustment
    
    amount: v.number(),
    reason: v.string(),
    
    // Before/after
    balanceBefore: v.number(),
    balanceAfter: v.number(),
    
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_admin", ["adminId"])
    .index("by_created", ["createdAt"]),

  // Webhook events (from Stripe)
  webhookEvents: defineTable({
    id: v.string(),
    
    // Event details
    stripeEventId: v.string(),
    type: v.string(), // 'invoice.payment_succeeded', etc.
    
    // Payload (sanitized)
    payload: v.object({
      object: v.string(), // 'invoice', 'subscription', etc.
      objectId: v.string(),
      customerId: v.optional(v.string()),
      status: v.optional(v.string()),
    }),
    
    // Processing
    processed: v.boolean(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    
    createdAt: v.number(),
  })
    .index("by_stripe_event", ["stripeEventId"])
    .index("by_type", ["type"])
    .index("by_processed", ["processed"])
    .index("by_created", ["createdAt"]),
});
