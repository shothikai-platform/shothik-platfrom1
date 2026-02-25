// convex/ai.ts - AI analysis and suggestions

import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Query: Get cached AI analysis
export const getAnalysis = query({
  args: {
    projectId: v.id("projects"),
    chapterId: v.optional(v.id("chapters")),
    type: v.string(), // 'neural' | 'nobel' | 'structure' | 'style'
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("aiAnalysis")
      .withIndex("by_project_and_type", (q) => 
        q.eq("projectId", args.projectId).eq("type", args.type)
      );

    if (args.chapterId) {
      query = query.filter((q) => q.eq(q.field("chapterId"), args.chapterId));
    }

    const analyses = await query.take(1);
    return analyses[0] || null;
  },
});

// Mutation: Cache AI analysis
export const cacheAnalysis = mutation({
  args: {
    projectId: v.id("projects"),
    chapterId: v.optional(v.id("chapters")),
    type: v.string(),
    contentHash: v.string(),
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
  },
  handler: async (ctx, args) => {
    // Check if analysis already exists
    const existing = await ctx.db
      .query("aiAnalysis")
      .withIndex("by_project_and_type", (q) => 
        q.eq("projectId", args.projectId).eq("type", args.type)
      )
      .filter((q) => args.chapterId 
        ? q.eq(q.field("chapterId"), args.chapterId)
        : q.eq(q.field("chapterId"), undefined)
      )
      .first();

    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        results: args.results,
        contentHash: args.contentHash,
        analyzedAt: now,
        expiresAt,
      });
      return existing._id;
    } else {
      // Create new
      return await ctx.db.insert("aiAnalysis", {
        projectId: args.projectId,
        chapterId: args.chapterId,
        type: args.type,
        contentHash: args.contentHash,
        results: args.results,
        analyzedAt: now,
        expiresAt,
      });
    }
  },
});

// Action: Run neural coupling analysis
export const analyzeNeuralCoupling = action({
  args: {
    projectId: v.id("projects"),
    chapterId: v.optional(v.id("chapters")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Check cache first
    const contentHash = await hashContent(args.content);
    const cached = await ctx.runQuery(api.ai.getAnalysis, {
      projectId: args.projectId,
      chapterId: args.chapterId,
      type: "neural",
    });

    if (cached && cached.contentHash === contentHash) {
      return cached.results;
    }

    // Run analysis (in production, call LLM API)
    const analysis = await runNeuralAnalysis(args.content);

    // Cache results
    await ctx.runMutation(api.ai.cacheAnalysis, {
      projectId: args.projectId,
      chapterId: args.chapterId,
      type: "neural",
      contentHash,
      results: analysis,
    });

    return analysis;
  },
});

// Action: Run Nobel impact analysis
export const analyzeNobelImpact = action({
  args: {
    projectId: v.id("projects"),
    chapterId: v.optional(v.id("chapters")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const contentHash = await hashContent(args.content);
    const cached = await ctx.runQuery(api.ai.getAnalysis, {
      projectId: args.projectId,
      chapterId: args.chapterId,
      type: "nobel",
    });

    if (cached && cached.contentHash === contentHash) {
      return cached.results;
    }

    const analysis = await runNobelAnalysis(args.content);

    await ctx.runMutation(api.ai.cacheAnalysis, {
      projectId: args.projectId,
      chapterId: args.chapterId,
      type: "nobel",
      contentHash,
      results: analysis,
    });

    return analysis;
  },
});

// Action: Generate AI suggestions
export const generateSuggestions = action({
  args: {
    projectId: v.id("projects"),
    chapterId: v.optional(v.id("chapters")),
    content: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // In production, call LLM API with full manuscript context
    const suggestions = [
      {
        id: `sugg-${Date.now()}-1`,
        type: "style",
        content: "Consider adding more sensory details to increase neural coupling.",
        position: 0,
      },
      {
        id: `sugg-${Date.now()}-2`,
        type: "structure",
        content: "The pacing in this section could benefit from more tension.",
        position: 0,
      },
    ];

    return suggestions;
  },
});

// Action: Apply AI suggestion
export const applySuggestion = action({
  args: {
    projectId: v.id("projects"),
    chapterId: v.optional(v.id("chapters")),
    suggestionId: v.string(),
    originalContent: v.string(),
    modifiedContent: v.string(),
  },
  handler: async (ctx, args) => {
    // Update content
    if (args.chapterId) {
      await ctx.db.patch(args.chapterId, {
        content: args.modifiedContent,
        wordCount: args.modifiedContent.split(/\s+/).filter(w => w.length > 0).length,
      });
    } else {
      await ctx.db.patch(args.projectId, {
        content: args.modifiedContent,
        wordCount: args.modifiedContent.split(/\s+/).filter(w => w.length > 0).length,
      });
    }

    // Save version
    await ctx.runMutation(api.projects.saveVersion, {
      projectId: args.projectId,
      userId: (await ctx.db.get(args.projectId))!.userId,
      content: args.modifiedContent,
      wordCount: args.modifiedContent.split(/\s+/).filter(w => w.length > 0).length,
      description: `Applied AI suggestion: ${args.suggestionId}`,
    });

    return { success: true };
  },
});

// Helper: Hash content for cache key
async function hashContent(content: string): Promise<string> {
  // Simple hash - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Helper: Run neural analysis (mock)
async function runNeuralAnalysis(content: string) {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  // Simple heuristic analysis
  const sensoryWords = ['see', 'hear', 'feel', 'smell', 'taste', 'look', 'sound', 'touch'];
  const emotionalWords = ['love', 'hate', 'fear', 'joy', 'sad', 'angry', 'happy'];
  
  const sensoryCount = words.filter(w => 
    sensoryWords.some(sw => w.toLowerCase().includes(sw))
  ).length;
  
  const emotionalCount = words.filter(w => 
    emotionalWords.some(ew => w.toLowerCase().includes(ew))
  ).length;
  
  const sensory = Math.min(100, Math.round((sensoryCount / words.length) * 1000));
  const emotional = Math.min(100, Math.round((emotionalCount / words.length) * 1000));
  const cognitive = 70 + Math.floor(Math.random() * 20);
  const personal = 60 + Math.floor(Math.random() * 25);
  
  const overall = Math.round((sensory + emotional + cognitive + personal) / 4);
  
  return {
    score: overall,
    analysis: `Neural coupling score: ${overall}/100. Sensory: ${sensory}%, Emotional: ${emotional}%, Cognitive: ${cognitive}%, Personal: ${personal}%`,
    suggestions: [
      sensory < 50 ? "Add more sensory details (sight, sound, smell)" : null,
      emotional < 50 ? "Include more emotional language" : null,
    ].filter(Boolean) as string[],
    benchmarks: {
      vsTagore: Math.round(overall * 0.9),
      vsTolstoy: Math.round(overall * 0.85),
      vsMorrison: Math.round(overall * 0.95),
    },
  };
}

// Helper: Run Nobel analysis (mock)
async function runNobelAnalysis(content: string) {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  // Check for universal themes
  const themes = {
    identity: ['identity', 'self', 'who', 'become'],
    love: ['love', 'heart', 'beloved'],
    loss: ['loss', 'grief', 'death'],
    freedom: ['freedom', 'liberty', 'free'],
  };
  
  const themeScores = Object.entries(themes).map(([theme, keywords]) => {
    const count = words.filter(w => 
      keywords.some(kw => w.toLowerCase().includes(kw))
    ).length;
    return { theme, prevalence: Math.min(100, Math.round((count / words.length) * 1000)) };
  });
  
  const universalThemes = Math.round(
    themeScores.reduce((sum, t) => sum + t.prevalence, 0) / themeScores.length
  );
  
  const emotionalDepth = 65 + Math.floor(Math.random() * 20);
  const structuralInnovation = 50 + Math.floor(Math.random() * 30);
  const accessibility = 75 + Math.floor(Math.random() * 15);
  const longevity = 60 + Math.floor(Math.random() * 25);
  
  const overall = Math.round(
    (universalThemes + emotionalDepth + structuralInnovation + accessibility + longevity) / 5
  );
  
  return {
    score: overall,
    analysis: `Nobel impact score: ${overall}/100. Universal themes: ${universalThemes}%, Emotional depth: ${emotionalDepth}%, Innovation: ${structuralInnovation}%`,
    suggestions: [
      universalThemes < 60 ? "Develop more universal themes" : null,
      structuralInnovation < 60 ? "Consider experimental narrative structures" : null,
    ].filter(Boolean) as string[],
    benchmarks: {
      vsTagore: Math.round(overall * 0.85),
      vsTolstoy: Math.round(overall * 0.8),
      vsMorrison: Math.round(overall * 0.9),
    },
  };
}
