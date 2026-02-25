/**
 * Slide Generation Service Types
 */

import { z } from 'zod';

export const SlideStatus = z.enum([
  'pending',
  'researching',
  'generating_outline',
  'designing',
  'generating_content',
  'formatting',
  'completed',
  'paused',
  'failed'
]);

export type SlideStatus = z.infer<typeof SlideStatus>;

export const SlideType = z.enum([
  'title',
  'content',
  'two_column',
  'image',
  'chart',
  'quote',
  'divider',
  'bullets',
  'numbered'
]);

export type SlideType = z.infer<typeof SlideType>;

export const SlideContent = z.object({
  id: z.string(),
  type: SlideType,
  title: z.string(),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  chartData: z.any().optional(),
  layout: z.enum(['default', 'split', 'full-image', 'centered', 'left-aligned']).default('default'),
  theme: z.string().optional(),
  notes: z.string().optional(),
  speakerNotes: z.string().optional()
});

export type SlideContent = z.infer<typeof SlideContent>;

export const SlideDeck = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  slides: z.array(SlideContent),
  theme: z.string().default('professional'),
  colorScheme: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
    text: z.string(),
    accent: z.string()
  }),
  fontFamily: z.string().default('Inter'),
  totalSlides: z.number()
});

export type SlideDeck = z.infer<typeof SlideDeck>;

export const CreateSlideRequest = z.object({
  userId: z.string(),
  prompt: z.string().min(1).max(5000),
  title: z.string().optional(),
  slideCount: z.number().min(3).max(30).default(10),
  theme: z.enum([
    'professional',
    'creative',
    'minimal',
    'educational',
    'business',
    'modern',
    'dark'
  ]).default('professional'),
  includeImages: z.boolean().default(false),
  includeCharts: z.boolean().default(false),
  targetAudience: z.enum([
    'general',
    'executives',
    'students',
    'technical',
    'children'
  ]).default('general'),
  language: z.string().default('en'),
  spaceId: z.string().optional(),
  memoryPreferences: z.object({
    colors: z.array(z.string()).optional(),
    fonts: z.array(z.string()).optional(),
    layouts: z.array(z.string()).optional()
  }).optional()
});

export type CreateSlideRequest = z.infer<typeof CreateSlideRequest>;

export const SlideJob = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  spaceId: z.string().optional(),
  prompt: z.string(),
  title: z.string(),
  status: SlideStatus,
  progress: z.number().min(0).max(100).default(0),
  currentStep: z.string().default('pending'),
  slideDeck: z.optional(SlideDeck),
  outline: z.array(z.any()).optional(),
  checkpoints: z.array(z.object({
    step: z.string(),
    status: z.string(),
    progress: z.number(),
    timestamp: z.string().optional()
  })).optional(),
  error: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional()
});

export type SlideJob = z.infer<typeof SlideJob>;

export const SlideResponse = z.object({
  success: z.boolean(),
  jobId: z.string().uuid().optional(),
  data: z.union([SlideJob, SlideDeck]).optional(),
  error: z.string().optional()
});

export type SlideResponse = z.infer<typeof SlideResponse>;

export const SlideJobData = z.object({
  jobId: z.string().uuid(),
  userId: z.string(),
  spaceId: z.string().optional(),
  prompt: z.string(),
  title: z.string(),
  slideCount: z.number(),
  theme: z.string(),
  includeImages: z.boolean(),
  includeCharts: z.boolean(),
  targetAudience: z.string(),
  language: z.string(),
  memoryPreferences: z.any().optional()
});

export type SlideJobData = z.infer<typeof SlideJobData>;

// Template types
export const SlideTemplate = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['business', 'education', 'creative', 'minimal']),
  thumbnail: z.string(),
  colorScheme: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
    text: z.string(),
    accent: z.string()
  }),
  fontFamily: z.string(),
  layouts: z.array(z.string())
});

export type SlideTemplate = z.infer<typeof SlideTemplate>;
