// Backend Convex actions for Slide Generation
import { action } from "./_generated/server";
import { v } from "convex/values";

const SLIDE_SERVICE_URL = process.env.SLIDE_SERVICE_URL || "http://localhost:3004";

// Create slide generation job
export const createSlideJob = action({
  args: {
    topic: v.string(),
    slideCount: v.number(),
    template: v.string(),
    targetAudience: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    jobId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const userId = "user-123"; // Get from auth context
      
      const response = await fetch(`${SLIDE_SERVICE_URL}/slides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...args,
          userId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        return { success: true, jobId: data.jobId };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error("Slide job creation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create job",
      };
    }
  },
});

// Get job status
export const getSlideJobStatus = action({
  args: {
    jobId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    data: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${SLIDE_SERVICE_URL}/slides/${args.jobId}`);
      const data = await response.json();
      return { success: data.success, data: data.data };
    } catch (error) {
      console.error("Get job status error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get status",
      };
    }
  },
});

// Pause job
export const pauseSlideJob = action({
  args: {
    jobId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${SLIDE_SERVICE_URL}/slides/${args.jobId}/pause`, {
        method: "POST",
      });
      const data = await response.json();
      return { success: data.success };
    } catch (error) {
      console.error("Pause job error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to pause",
      };
    }
  },
});

// Resume job
export const resumeSlideJob = action({
  args: {
    jobId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${SLIDE_SERVICE_URL}/slides/${args.jobId}/resume`, {
        method: "POST",
      });
      const data = await response.json();
      return { success: data.success };
    } catch (error) {
      console.error("Resume job error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to resume",
      };
    }
  },
});
