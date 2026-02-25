/**
 * Research Service Types
 * 
 * Type definitions for the multi-source research service.
 * Following Zod for runtime validation + TypeScript for compile-time safety.
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const ResearchSource = z.enum([
  'arxiv',
  'pubmed',
  'semantic_scholar',
  'ieee',
  'google_scholar',
  'github',
  'stackoverflow',
  'web'
]);

export type ResearchSource = z.infer<typeof ResearchSource>;

export const ResearchStatus = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled'
]);

export type ResearchStatus = z.infer<typeof ResearchStatus>;

// ============================================================================
// Core Types
// ============================================================================

export const ResearchPaper = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  abstract: z.string().optional(),
  url: z.string().url(),
  pdfUrl: z.string().url().optional(),
  publishedDate: z.string().optional(),
  year: z.number().optional(),
  doi: z.string().optional(),
  citationCount: z.number().optional(),
  source: ResearchSource,
  keywords: z.array(z.string()).optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  fetchedAt: z.string().datetime()
});

export type ResearchPaper = z.infer<typeof ResearchPaper>;

export const ResearchQuery = z.object({
  query: z.string().min(1).max(1000),
  sources: z.array(ResearchSource).default(['arxiv', 'semantic_scholar']),
  maxResults: z.number().min(1).max(100).default(20),
  yearFrom: z.number().optional(),
  yearTo: z.number().optional(),
  requirePdf: z.boolean().default(false),
  language: z.string().default('en')
});

export type ResearchQuery = z.infer<typeof ResearchQuery>;

export const ResearchJob = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  query: ResearchQuery,
  status: ResearchStatus,
  progress: z.number().min(0).max(100).default(0),
  results: z.array(ResearchPaper).default([]),
  errors: z.array(z.object({
    source: ResearchSource,
    message: z.string(),
    timestamp: z.string().datetime()
  })).default([]),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type ResearchJob = z.infer<typeof ResearchJob>;

// ============================================================================
// Synthesis Types
// ============================================================================

export const SynthesisResult = z.object({
  jobId: z.string().uuid(),
  summary: z.string(),
  keyFindings: z.array(z.object({
    finding: z.string(),
    supportingPapers: z.array(z.string()), // paper IDs
    confidence: z.number().min(0).max(1)
  })),
  researchGaps: z.array(z.string()),
  citations: z.array(z.object({
    paperId: z.string(),
    citation: z.string() // formatted citation
  })),
  relatedTopics: z.array(z.string()),
  synthesizedAt: z.string().datetime()
});

export type SynthesisResult = z.infer<typeof SynthesisResult>;

// ============================================================================
// API Types
// ============================================================================

export const CreateResearchRequest = z.object({
  userId: z.string(),
  query: ResearchQuery
});

export type CreateResearchRequest = z.infer<typeof CreateResearchRequest>;

export const ResearchResponse = z.object({
  success: z.boolean(),
  jobId: z.string().uuid().optional(),
  data: z.union([ResearchJob, SynthesisResult]).optional(),
  error: z.string().optional()
});

export type ResearchResponse = z.infer<typeof ResearchResponse>;

// ============================================================================
// Scraper Types
// ============================================================================

export interface ScraperConfig {
  source: ResearchSource;
  baseUrl: string;
  rateLimitMs: number;
  maxRetries: number;
  timeoutMs: number;
}

export interface ScraperResult {
  papers: ResearchPaper[];
  totalFound: number;
  hasMore: boolean;
  errors: string[];
}

export interface BaseScraper {
  readonly config: ScraperConfig;
  search(query: ResearchQuery): Promise<ScraperResult>;
  getPaperDetails(paperId: string): Promise<ResearchPaper | null>;
}

// ============================================================================
// Queue Types
// ============================================================================

export const ResearchJobData = z.object({
  jobId: z.string().uuid(),
  userId: z.string(),
  query: ResearchQuery,
  sources: z.array(ResearchSource)
});

export type ResearchJobData = z.infer<typeof ResearchJobData>;

export const ResearchJobProgress = z.object({
  jobId: z.string().uuid(),
  source: ResearchSource,
  status: z.enum(['started', 'completed', 'failed']),
  papersFound: z.number(),
  error: z.string().optional()
});

export type ResearchJobProgress = z.infer<typeof ResearchJobProgress>;
