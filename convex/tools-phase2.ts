// Backend API Routes for Phase 2 Tools
// Convex actions for Translator, Humanize, Summarizer

import { action } from "./_generated/server";
import { v } from "convex/values";

// Translator API
export const translate = action({
  args: {
    text: v.string(),
    sourceLang: v.string(),
    targetLang: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    translation: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const { executeWithGateway } = await import("@/lib/ai-gateway");
      
      const result = await executeWithGateway(async () => {
        const prompt = `Translate the following text from ${args.sourceLang} to ${args.targetLang}. Only return the translation, no explanations:

Text: ${args.text}`;

        const response = await fetch(process.env.KIMI_API_URL || "", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.KIMI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "kimi-k2-thinking",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
          }),
        });
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      });

      return { success: true, translation: result };
    } catch (error) {
      console.error("Translation error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Translation failed" 
      };
    }
  },
});

// Humanize GPT API
export const humanize = action({
  args: {
    text: v.string(),
    mode: v.string(),
    intensity: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    humanized: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const { executeWithGateway } = await import("@/lib/ai-gateway");
      
      const modeDescriptions: Record<string, string> = {
        natural: "Make it sound natural and human-like",
        casual: "Make it casual and conversational",
        professional: "Make it professional but human",
        academic: "Make it academic but accessible",
      };

      const result = await executeWithGateway(async () => {
        const intensityDesc = args.intensity < 30 ? "subtle changes" : 
                             args.intensity < 70 ? "moderate changes" : 
                             "significant changes";
        
        const prompt = `Rewrite the following AI-generated text to make it sound more human. ${modeDescriptions[args.mode] || "Make it natural"}. Apply ${intensityDesc}.

Original text:
${args.text}

Humanized version:`;

        const response = await fetch(process.env.KIMI_API_URL || "", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.KIMI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "kimi-k2-thinking",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          }),
        });
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      });

      return { success: true, humanized: result };
    } catch (error) {
      console.error("Humanization error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Humanization failed" 
      };
    }
  },
});

// Summarizer API
export const summarize = action({
  args: {
    text: v.string(),
    type: v.string(),
    length: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    summary: v.optional(v.string()),
    keyPoints: v.optional(v.array(v.string())),
    originalLength: v.optional(v.number()),
    summaryLength: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const { executeWithGateway } = await import("@/lib/ai-gateway");
      
      const typeInstructions: Record<string, string> = {
        paragraph: "Provide a concise summary paragraph",
        bullet: "Extract key points as bullet points",
        detailed: "Provide a comprehensive summary",
      };

      const result = await executeWithGateway(async () => {
        const prompt = `Summarize the following text. ${typeInstructions[args.type] || "Provide a summary"}. Target length: ${args.length}% of original.

Text to summarize:
${args.text}

Summary:`;

        const response = await fetch(process.env.KIMI_API_URL || "", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.KIMI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "kimi-k2-thinking",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
          }),
        });
        
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
      });

      // Extract key points if bullet type
      let keyPoints: string[] = [];
      if (args.type === "bullet") {
        keyPoints = result.split("\n").filter((line: string) => line.trim().startsWith("-")).map((line: string) => line.replace(/^-\s*/, ""));
      }

      return { 
        success: true, 
        summary: result,
        keyPoints,
        originalLength: args.text.length,
        summaryLength: result.length,
      };
    } catch (error) {
      console.error("Summarization error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Summarization failed" 
      };
    }
  },
});
