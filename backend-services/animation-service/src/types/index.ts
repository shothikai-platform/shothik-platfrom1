/**
 * Animation Service Types
 * 
 * Type definitions for video generation service.
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const VideoStatus = z.enum([
  'pending',
  'generating_voice',
  'generating_music',
  'rendering',
  'completed',
  'failed'
]);

export type VideoStatus = z.infer<typeof VideoStatus>;

export const VideoResolution = z.enum(['720p', '1080p']);
export type VideoResolution = z.infer<typeof VideoResolution>;

export const VideoFrameRate = z.enum(['30fps', '60fps']);
export type VideoFrameRate = z.infer<typeof VideoFrameRate>;

export const VideoTemplate = z.enum([
  'explainer',
  'product_launch',
  'tutorial',
  'storytelling',
  'data_presentation',
  'minimal'
]);

export type VideoTemplate = z.infer<typeof VideoTemplate>;

// ============================================================================
// Slide Types
// ============================================================================

export const SlideContent = z.object({
  id: z.string(),
  type: z.enum(['title', 'content', 'image', 'chart', 'quote']),
  title: z.string(),
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
  duration: z.number().min(3).max(30).default(5), // seconds per slide
  transition: z.enum(['fade', 'slide', 'zoom', 'none']).default('fade')
});

export type SlideContent = z.infer<typeof SlideContent>;

export const SlideDeck = z.object({
  id: z.string(),
  title: z.string(),
  slides: z.array(SlideContent),
  totalDuration: z.number() // calculated
});

export type SlideDeck = z.infer<typeof SlideDeck>;

// ============================================================================
// Voice Types
// ============================================================================

export const VoiceSettings = z.object({
  provider: z.enum(['elevenlabs', 'openai']).default('elevenlabs'),
  voiceId: z.string().default('professional-presenter'),
  stability: z.number().min(0).max(1).default(0.5),
  similarityBoost: z.number().min(0).max(1).default(0.75),
  style: z.number().min(0).max(1).optional(),
  useSpeakerBoost: z.boolean().default(true)
});

export type VoiceSettings = z.infer<typeof VoiceSettings>;

export const VoiceCloneSettings = z.object({
  enabled: z.boolean().default(false),
  sampleUrls: z.array(z.string().url()).optional(),
  clonedVoiceId: z.string().optional()
});

export type VoiceCloneSettings = z.infer<typeof VoiceCloneSettings>;

// ============================================================================
// Music Types
// ============================================================================

export const MusicSettings = z.object({
  provider: z.enum(['suno', 'none']).default('suno'),
  prompt: z.string().optional(), // Custom prompt for music generation
  mood: z.enum([
    'professional',
    'upbeat',
    'calm',
    'dramatic',
    'inspirational',
    'corporate'
  ]).default('professional'),
  genre: z.string().optional(),
  duration: z.number().min(10).max(300), // matches video duration
  instrumental: z.boolean().default(true)
});

export type MusicSettings = z.infer<typeof MusicSettings>;

// ============================================================================
// Video Job Types
// ============================================================================

export const CreateVideoRequest = z.object({
  userId: z.string(),
  slideDeck: SlideDeck,
  template: VideoTemplate.default('explainer'),
  resolution: VideoResolution.default('1080p'),
  frameRate: VideoFrameRate.default('30fps'),
  voice: VoiceSettings.default({}),
  voiceClone: VoiceCloneSettings.default({}),
  music: MusicSettings.optional(),
  subtitles: z.boolean().default(true),
  watermark: z.boolean().default(false)
});

export type CreateVideoRequest = z.infer<typeof CreateVideoRequest>;

export const VideoJob = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  slideDeck: SlideDeck,
  template: VideoTemplate,
  resolution: VideoResolution,
  frameRate: VideoFrameRate,
  voice: VoiceSettings,
  voiceClone: VoiceCloneSettings,
  music: MusicSettings.optional(),
  subtitles: z.boolean(),
  watermark: z.boolean(),
  status: VideoStatus,
  progress: z.number().min(0).max(100).default(0),
  outputUrl: z.string().url().optional(),
  voiceoverUrl: z.string().url().optional(),
  musicUrl: z.string().url().optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type VideoJob = z.infer<typeof VideoJob>;

// ============================================================================
// API Types
// ============================================================================

export const VideoResponse = z.object({
  success: z.boolean(),
  jobId: z.string().uuid().optional(),
  data: VideoJob.optional(),
  error: z.string().optional()
});

export type VideoResponse = z.infer<typeof VideoResponse>;

// ============================================================================
// Template Types
// ============================================================================

export interface TemplateConfig {
  name: string;
  description: string;
  defaultDuration: number;
  transitions: string[];
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  animations: {
    slideIn: string;
    slideOut: string;
    textReveal: string;
  };
}

// ============================================================================
// Queue Types
// ============================================================================

export const VideoJobData = z.object({
  jobId: z.string().uuid(),
  userId: z.string(),
  slideDeck: SlideDeck,
  template: VideoTemplate,
  resolution: VideoResolution,
  frameRate: VideoFrameRate,
  voice: VoiceSettings,
  voiceClone: VoiceCloneSettings,
  music: MusicSettings.optional(),
  subtitles: z.boolean(),
  watermark: z.boolean()
});

export type VideoJobData = z.infer<typeof VideoJobData>;
