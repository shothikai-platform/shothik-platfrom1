// convex/llmActions.ts - Server-side LLM integration

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Action: Generate AI response with full context
export const generateResponse = action({
  args: {
    sessionId: v.id("chatSessions"),
    userMessage: v.string(),
    includeFullManuscript: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get session with context
    const session = await ctx.runQuery(api.chat.getSession, { 
      sessionId: args.sessionId 
    });
    
    if (!session) throw new Error("Session not found");

    // Get manuscript context
    let manuscriptContext = null;
    if (session.projectId) {
      const project = await ctx.db.get(session.projectId);
      if (project) {
        const chapters = await ctx.db
          .query("chapters")
          .withIndex("by_project", (q) => q.eq("projectId", session.projectId!))
          .collect();

        manuscriptContext = {
          title: project.title,
          type: project.type,
          wordCount: project.wordCount,
          targetWordCount: project.targetWordCount,
          progress: project.progress,
          chapters: chapters.map(c => ({
            id: c._id,
            title: c.title,
            order: c.order,
            wordCount: c.wordCount,
            content: args.includeFullManuscript ? c.content : undefined,
          })),
        };
      }
    }

    // Build messages for LLM
    const messages = [
      ...session.messages.slice(-10), // Last 10 messages for context
      { role: 'user', content: args.userMessage },
    ];

    // Call LLM API (using internal fetch)
    const llmResponse = await callLLM({
      messages,
      manuscriptContext,
      mode: session.context?.mode || 'write',
    });

    // Save response to chat
    await ctx.runMutation(api.chat.addMessage, {
      sessionId: args.sessionId,
      role: 'assistant',
      content: llmResponse.content,
      tokenCount: llmResponse.usage,
    });

    return {
      content: llmResponse.content,
      usage: llmResponse.usage,
    };
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
    const contentHash = hashString(args.content);
    const cached = await ctx.runQuery(api.ai.getAnalysis, {
      projectId: args.projectId,
      chapterId: args.chapterId,
      type: "neural",
    });

    if (cached?.contentHash === contentHash) {
      return cached.results;
    }

    // Call LLM for analysis
    const prompt = `Analyze this text for neural coupling (brain-to-brain connection):

Text: """${args.content.substring(0, 3000)}"""

Rate 0-100 for: sensory, emotional, cognitive, personal. Include suggestions.
Respond in JSON: {"sensory": N, "emotional": N, "cognitive": N, "personal": N, "suggestions": []}`;

    const response = await callLLM({
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse result
    let result;
    try {
      result = JSON.parse(response.content);
      result.score = Math.round((result.sensory + result.emotional + result.cognitive + result.personal) / 4);
    } catch {
      // Fallback
      result = calculateNeuralHeuristic(args.content);
    }

    // Cache result
    await ctx.runMutation(api.ai.cacheAnalysis, {
      projectId: args.projectId,
      chapterId: args.chapterId,
      type: "neural",
      contentHash,
      results: result,
    });

    return result;
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
    const contentHash = hashString(args.content);
    const cached = await ctx.runQuery(api.ai.getAnalysis, {
      projectId: args.projectId,
      chapterId: args.chapterId,
      type: "nobel",
    });

    if (cached?.contentHash === contentHash) {
      return cached.results;
    }

    const prompt = `Analyze this text for Nobel-level literary impact:

Text: """${args.content.substring(0, 3000)}"""

Rate 0-100 for: universalThemes, emotionalDepth, structuralInnovation, accessibility, longevity.
Respond in JSON with these fields plus "analysis" text.`;

    const response = await callLLM({
      messages: [{ role: 'user', content: prompt }],
    });

    let result;
    try {
      result = JSON.parse(response.content);
      result.score = Math.round(
        (result.universalThemes + result.emotionalDepth + result.structuralInnovation + 
         result.accessibility + result.longevity) / 5
      );
    } catch {
      result = calculateNobelHeuristic(args.content);
    }

    await ctx.runMutation(api.ai.cacheAnalysis, {
      projectId: args.projectId,
      chapterId: args.chapterId,
      type: "nobel",
      contentHash,
      results: result,
    });

    return result;
  },
});

// Action: Generate inline AI suggestion
export const generateInlineSuggestion = action({
  args: {
    projectId: v.id("projects"),
    selectedText: v.string(),
    context: v.string(),
    type: v.string(), // 'paraphrase' | 'expand' | 'condense' | 'improve'
  },
  handler: async (ctx, args) => {
    const prompts: Record<string, string> = {
      paraphrase: `Rewrite this in a different way while keeping the meaning:`,
      expand: `Expand this with more detail and description:`,
      condense: `Make this more concise while keeping key points:`,
      improve: `Improve this writing for better flow and impact:`,
    };

    const prompt = `${prompts[args.type] || prompts.improve}

Context: ${args.context.substring(0, 500)}

Selected text: """${args.selectedText}"""

Provide only the rewritten text, no explanations.`;

    const response = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1000,
    });

    return {
      original: args.selectedText,
      suggestion: response.content.trim(),
      type: args.type,
    };
  },
});

// Helper: Call LLM API
async function callLLM(params: {
  messages: Array<{ role: string; content: string }>;
  manuscriptContext?: any;
  mode?: string;
  maxTokens?: number;
}) {
  const apiKey = process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("KIMI_API_KEY not configured");
  }

  // Build system prompt if context provided
  let messages = params.messages;
  if (params.manuscriptContext) {
    const systemPrompt = `You are a writing assistant. Current manuscript: "${params.manuscriptContext.title}" (${params.manuscriptContext.wordCount} words). Mode: ${params.mode}.`;
    messages = [{ role: 'system', content: systemPrompt }, ...messages];
  }

  const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-k2-thinking',
      messages,
      temperature: 0.8,
      max_tokens: params.maxTokens || 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices[0].message.content,
    usage: {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
    },
  };
}

// Helper: Simple string hash
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

// Helper: Neural heuristic fallback
function calculateNeuralHeuristic(content: string) {
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const sensoryWords = ['see', 'hear', 'feel', 'smell', 'taste', 'look', 'sound'];
  const emotionalWords = ['love', 'hate', 'fear', 'joy', 'sad', 'angry'];
  
  const sensory = Math.min(100, Math.round(
    (words.filter(w => sensoryWords.some(sw => w.toLowerCase().includes(sw))).length / words.length) * 1000
  ));
  
  const emotional = Math.min(100, Math.round(
    (words.filter(w => emotionalWords.some(ew => w.toLowerCase().includes(ew))).length / words.length) * 1000
  ));
  
  return {
    score: Math.round((sensory + emotional + 70 + 65) / 4),
    sensory,
    emotional,
    cognitive: 70,
    personal: 65,
    suggestions: sensory < 50 ? ['Add more sensory details'] : [],
  };
}

// Helper: Nobel heuristic fallback
function calculateNobelHeuristic(content: string) {
  return {
    score: 65,
    universalThemes: 70,
    emotionalDepth: 65,
    structuralInnovation: 60,
    accessibility: 75,
    longevity: 60,
    analysis: 'Heuristic analysis (LLM unavailable)',
  };
}
