import { v } from "convex/values";
import { defineSchema, defineTable } from "convex/server";

// ============================================================================
// Research Agent Schema
// ============================================================================

const ResearchSource = v.union(
  v.literal("arxiv"),
  v.literal("pubmed"),
  v.literal("semantic_scholar"),
  v.literal("ieee"),
  v.literal("google_scholar"),
  v.literal("github"),
  v.literal("stackoverflow"),
  v.literal("web")
);

const ResearchStatus = v.union(
  v.literal("pending"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled")
);

export const ResearchPaper = v.object({
  id: v.string(),
  title: v.string(),
  authors: v.array(v.string()),
  abstract: v.optional(v.string()),
  url: v.string(),
  pdfUrl: v.optional(v.string()),
  publishedDate: v.optional(v.string()),
  year: v.optional(v.number()),
  doi: v.optional(v.string()),
  citationCount: v.optional(v.number()),
  source: ResearchSource,
  keywords: v.optional(v.array(v.string())),
  relevanceScore: v.optional(v.number()),
  fetchedAt: v.string()
});

// Research jobs (tracks multi-source research)
const researchJobs = defineTable({
  userId: v.string(),
  query: v.string(),
  sources: v.array(ResearchSource),
  maxResults: v.number(),
  yearFrom: v.optional(v.number()),
  yearTo: v.optional(v.number()),
  status: ResearchStatus,
  progress: v.number(), // 0-100
  results: v.array(ResearchPaper),
  errors: v.array(v.object({
    source: ResearchSource,
    message: v.string(),
    timestamp: v.number()
  })),
  synthesis: v.optional(v.object({
    summary: v.string(),
    keyFindings: v.array(v.object({
      finding: v.string(),
      supportingPapers: v.array(v.string()),
      confidence: v.number()
    })),
    researchGaps: v.array(v.string()),
    relatedTopics: v.array(v.string()),
    synthesizedAt: v.number()
  })),
  serviceJobId: v.optional(v.string()), // Reference to backend service job
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"])
  .index("by_status", ["status"]);

// Research projects (group related research)
const researchProjects = defineTable({
  userId: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  jobIds: v.array(v.id("researchJobs")),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"]);

// ============================================================================
// Animation Agent Schema
// ============================================================================

const VideoStatus = v.union(
  v.literal("pending"),
  v.literal("generating_voice"),
  v.literal("generating_music"),
  v.literal("rendering"),
  v.literal("completed"),
  v.literal("failed")
);

const VideoTemplate = v.union(
  v.literal("explainer"),
  v.literal("product_launch"),
  v.literal("tutorial"),
  v.literal("storytelling"),
  v.literal("data_presentation"),
  v.literal("minimal")
);

const VideoResolution = v.union(v.literal("720p"), v.literal("1080p"));
const VideoFrameRate = v.union(v.literal("30fps"), v.literal("60fps"));

const SlideContent = v.object({
  id: v.string(),
  type: v.union(
    v.literal("title"),
    v.literal("content"),
    v.literal("image"),
    v.literal("chart"),
    v.literal("quote")
  ),
  title: v.string(),
  content: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  duration: v.number(), // seconds
  transition: v.union(
    v.literal("fade"),
    v.literal("slide"),
    v.literal("zoom"),
    v.literal("none")
  )
});

// Video generation jobs
const videoJobs = defineTable({
  userId: v.string(),
  slideDeckId: v.id("slideDecks"), // Reference to slides
  template: VideoTemplate,
  resolution: VideoResolution,
  frameRate: VideoFrameRate,
  voice: v.object({
    provider: v.union(v.literal("elevenlabs"), v.literal("openai")),
    voiceId: v.string(),
    stability: v.number(),
    similarityBoost: v.number(),
    useSpeakerBoost: v.boolean()
  }),
  voiceClone: v.optional(v.object({
    enabled: v.boolean(),
    clonedVoiceId: v.optional(v.string())
  })),
  music: v.optional(v.object({
    provider: v.union(v.literal("suno"), v.literal("none")),
    mood: v.string(),
    genre: v.optional(v.string()),
    instrumental: v.boolean()
  })),
  subtitles: v.boolean(),
  watermark: v.boolean(),
  status: VideoStatus,
  progress: v.number(),
  outputUrl: v.optional(v.string()),
  voiceoverUrl: v.optional(v.string()),
  musicUrl: v.optional(v.string()),
  error: v.optional(v.string()),
  serviceJobId: v.optional(v.string()),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_status", ["userId", "status"])
  .index("by_slide_deck", ["slideDeckId"]);

// Slide decks (for animation input)
const slideDecks = defineTable({
  userId: v.string(),
  title: v.string(),
  slides: v.array(SlideContent),
  totalDuration: v.number(),
  source: v.optional(v.union(
    v.literal("slide_agent"),
    v.literal("manual"),
    v.literal("import")
  )),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"]);

// ============================================================================
// Updated Schema Export
// ============================================================================

export default defineSchema({
  // ... existing tables from original schema ...
  
  // Research Agent
  researchJobs,
  researchProjects,
  
  // Animation Agent
  videoJobs,
  slideDecks,
});
