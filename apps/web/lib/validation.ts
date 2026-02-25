import { z } from "zod";

// ============================================
// Input Validation Schemas
// ============================================

// Common validators
const idSchema = z.string().min(1).max(100);
const textSchema = z.string().min(1).max(50000); // 50KB max
const emailSchema = z.string().email();
const urlSchema = z.string().url();

// ============================================
// Writing Domain Schemas
// ============================================

export const paraphraseRequestSchema = z.object({
  text: textSchema,
  mode: z.enum(["basic", "formal", "creative", "academic", "news", "simple"]),
  language: z.string().default("en"),
  synonymLevel: z.number().min(1).max(5).default(3),
  frozenWords: z.array(z.string()).default([]),
});

export const grammarCheckSchema = z.object({
  text: textSchema,
  language: z.string().default("en"),
});

export const humanizeRequestSchema = z.object({
  text: textSchema,
  intensity: z.enum(["light", "medium", "aggressive"]).default("medium"),
  preserveMeaning: z.boolean().default(true),
});

export const aiDetectionSchema = z.object({
  text: textSchema,
  detailed: z.boolean().default(false),
});

export const summarizeSchema = z.object({
  text: textSchema,
  ratio: z.number().min(0.1).max(0.9).default(0.3),
});

export const translateSchema = z.object({
  text: textSchema,
  from: z.string().min(2).max(10),
  to: z.string().min(2).max(10),
});

// ============================================
// Studio Domain Schemas
// ============================================

export const createProjectSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["assignment", "book", "blog", "marketing", "research"]),
  description: z.string().max(1000).optional(),
  template: z.string().optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["draft", "editing", "published"]).optional(),
});

export const createChapterSchema = z.object({
  title: z.string().min(1).max(200),
  order: z.number().int().min(0).optional(),
});

export const updateChapterSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(1000000).optional(), // 1MB max
});

export const aiAssistSchema = z.object({
  action: z.enum(["continue", "rewrite", "summarize", "expand", "shorten", "tone"]),
  context: z.string().max(500).optional(),
  tone: z.string().optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
});

// ============================================
// Export Schemas
// ============================================

export const exportRequestSchema = z.object({
  format: z.enum(["pdf", "docx", "txt", "md", "html"]),
  options: z.object({
    includeTableOfContents: z.boolean().optional(),
    includePageNumbers: z.boolean().optional(),
    fontSize: z.number().min(8).max(24).optional(),
    fontFamily: z.string().optional(),
    lineSpacing: z.number().min(1).max(3).optional(),
  }).optional(),
});

// ============================================
// Validation Helper
// ============================================

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function sanitizeHtml(html: string): string {
  // Basic XSS protection - remove script tags and event handlers
  return html
    .replace(/\u003cscript[^\u003e]*\u003e[\s\S]*?\u003c\/script\u003e/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/javascript:/gi, "");
}

export function sanitizeText(text: string): string {
  // Remove null bytes and control characters
  return text
    .replace(/\x00/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}