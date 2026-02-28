// Backend API Routes for Tools
// Convex actions for Grammar, Paraphrase, AI Detector

import { action } from "./_generated/server";
import { v } from "convex/values";

// Grammar Checker API
export const checkGrammar = action({
  args: {
    text: v.string(),
    language: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    data: v.optional(v.object({
      correctedText: v.string(),
      corrections: v.array(v.object({
        original: v.string(),
        suggestion: v.string(),
        type: v.string(),
        position: v.optional(v.object({ start: v.number(), end: v.number() })),
      })),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Use AI Gateway for grammar checking
      const { executeWithGateway } = await import("@/lib/ai-gateway");
      
      const result = await executeWithGateway(async () => {
        const response = await fetch(process.env.GRAMMAR_API_URL || "", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: args.text,
            language: args.language || "en",
          }),
        });
        return response.json();
      });

      return { success: true, data: result };
    } catch (error) {
      console.error("Grammar check error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Grammar check failed" 
      };
    }
  },
});

// Paraphrase API - Proxies to standalone service
export const paraphrase = action({
  args: {
    text: v.string(),
    mode: v.optional(v.string()),
    level: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    paraphrases: v.optional(v.array(v.string())),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Call standalone paraphrase service
      const PARAPHRASE_SERVICE_URL = process.env.PARAPHRASE_SERVICE_URL || "http://localhost:3005";
      
      const response = await fetch(`${PARAPHRASE_SERVICE_URL}/api/paraphraseV2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: args.text,
          mode: args.mode || "standard",
          level: args.level || "intermediate",
          language: args.language || "en",
        }),
      });

      const result = await response.json();
      return { success: true, paraphrases: result.paraphrases || [result.paraphrase] };
    } catch (error) {
      console.error("Paraphrase error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Paraphrase failed" 
      };
    }
  },
});

// AI Detector API - Uses ONNX backend
export const detectAI = action({
  args: {
    text: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    isAI: v.optional(v.boolean()),
    confidence: v.optional(v.number()),
    score: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Call ONNX AI Detector service
      const DETECTOR_URL = process.env.AI_DETECTOR_URL || "http://localhost:3006";
      
      const response = await fetch(`${DETECTOR_URL}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: args.text }),
      });

      const result = await response.json();
      return {
        success: true,
        isAI: result.isAI || result.score > 0.5,
        confidence: result.confidence || result.score * 100,
        score: result.score,
      };
    } catch (error) {
      console.error("AI detection error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "AI detection failed" 
      };
    }
  },
});

// File upload for AI Detector
export const detectAIFile = action({
  args: {
    fileUrl: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    isAI: v.optional(v.boolean()),
    confidence: v.optional(v.number()),
    score: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Fetch file content and detect
      const fileResponse = await fetch(args.fileUrl);
      const text = await fileResponse.text();
      
      // Reuse text detection
      const DETECTOR_URL = process.env.AI_DETECTOR_URL || "http://localhost:3006";
      const response = await fetch(`${DETECTOR_URL}/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const result = await response.json();
      return {
        success: true,
        isAI: result.isAI || result.score > 0.5,
        confidence: result.confidence || result.score * 100,
        score: result.score,
      };
    } catch (error) {
      console.error("AI file detection error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "AI file detection failed" 
      };
    }
  },
});
