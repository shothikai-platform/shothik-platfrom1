/**
 * Parallel Slide Generation Service
 * Generates multiple slides simultaneously for 10x speed
 */

import { SlideJobData, SlideDeck, SlideContent, SlideType, SlideStatus } from '../types/index.js';
import LLMService from '../utils/llm.js';
import TemplateService from './template.js';

interface GenerationProgress {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

interface SlideGenerationResult {
  slide: SlideContent;
  index: number;
}

export class ParallelGenerationService {
  private llmService: LLMService;
  private templateService: TemplateService;
  private abortControllers: Map<string, AbortController>;

  constructor() {
    this.llmService = new LLMService();
    this.templateService = new TemplateService();
    this.abortControllers = new Map();
  }

  // Main generation method with parallel execution
  async generatePresentation(
    jobData: SlideJobData,
    onProgress: (progress: GenerationProgress) => void
  ): Promise<SlideDeck> {
    const abortController = new AbortController();
    this.abortControllers.set(jobData.jobId, abortController);

    try {
      // Step 1: Generate outline
      onProgress({ step: 'outline', status: 'in_progress', progress: 0, message: 'Creating presentation outline...' });
      const outline = await this.llmService.generateOutline(jobData);
      onProgress({ step: 'outline', status: 'completed', progress: 100 });

      // Step 2: Generate design system
      onProgress({ step: 'design', status: 'in_progress', progress: 0, message: 'Creating design system...' });
      const designSystem = await this.llmService.generateDesignSystem(
        jobData.theme,
        jobData.memoryPreferences
      );
      onProgress({ step: 'design', status: 'completed', progress: 100 });

      // Step 3: Generate slides in parallel (THE KEY OPTIMIZATION)
      onProgress({ step: 'content', status: 'in_progress', progress: 0, message: 'Generating slides...' });
      
      const slidePromises = outline.map((section, index) =>
        this.generateSingleSlide(
          section,
          index,
          outline,
          jobData,
          (slideProgress) => {
            // Calculate overall progress
            const completedSlides = index;
            const totalProgress = Math.round(
              ((completedSlides / outline.length) * 100) +
              ((slideProgress / 100) * (100 / outline.length))
            );
            onProgress({ 
              step: 'content', 
              status: 'in_progress', 
              progress: totalProgress,
              message: `Generating slide ${index + 1} of ${outline.length}...`
            });
          }
        )
      );

      // Execute all slide generations in parallel
      const slideResults = await Promise.allSettled(slidePromises);
      
      // Process results
      const slides: SlideContent[] = [];
      slideResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          slides.push(result.value.slide);
        } else {
          // Create fallback slide on error
          slides.push(this.createFallbackSlide(outline[index], index));
        }
      });

      // Sort slides by index
      slides.sort((a, b) => {
        const indexA = slideResults.findIndex(r => 
          r.status === 'fulfilled' && (r.value as SlideGenerationResult).slide.id === a.id
        );
        const indexB = slideResults.findIndex(r => 
          r.status === 'fulfilled' && (r.value as SlideGenerationResult).slide.id === b.id
        );
        return indexA - indexB;
      });

      onProgress({ step: 'content', status: 'completed', progress: 100 });

      // Step 4: Format and finalize
      onProgress({ step: 'formatting', status: 'in_progress', progress: 0, message: 'Applying final formatting...' });
      
      const deck: SlideDeck = {
        id: jobData.jobId,
        title: jobData.title,
        subtitle: '',
        slides,
        theme: jobData.theme,
        colorScheme: designSystem.colorScheme,
        fontFamily: designSystem.fontFamily,
        totalSlides: slides.length
      };

      // Apply template
      const finalDeck = this.templateService.applyTemplate(deck, jobData.theme);
      
      onProgress({ step: 'formatting', status: 'completed', progress: 100 });

      return finalDeck;

    } finally {
      this.abortControllers.delete(jobData.jobId);
    }
  }

  // Generate a single slide (called in parallel)
  private async generateSingleSlide(
    section: { title: string; type: SlideType; keyPoints: string[] },
    index: number,
    outline: Array<{ title: string; type: SlideType; keyPoints: string[] }>,
    jobData: SlideJobData,
    onSlideProgress: (progress: number) => void
  ): Promise<SlideGenerationResult> {
    const context = outline.map(o => o.title).join(' → ');
    
    onSlideProgress(25);
    
    const content = await this.llmService.generateSlideContent(
      section.title,
      section.type,
      section.keyPoints,
      context,
      jobData
    );

    onSlideProgress(75);

    const layout = this.templateService.getLayout(section.type, jobData.theme);

    const slide: SlideContent = {
      id: `slide-${index}`,
      type: section.type,
      title: section.title,
      content: content.content,
      bullets: content.bullets,
      layout,
      theme: jobData.theme,
      speakerNotes: content.speakerNotes
    };

    onSlideProgress(100);

    return { slide, index };
  }

  // Create fallback slide when generation fails
  private createFallbackSlide(
    section: { title: string; type: SlideType; keyPoints: string[] },
    index: number
  ): SlideContent {
    return {
      id: `slide-${index}`,
      type: section.type,
      title: section.title,
      bullets: section.keyPoints,
      layout: 'default',
      theme: 'professional',
      speakerNotes: `Discuss ${section.title}`
    };
  }

  // Pause generation
  pauseGeneration(jobId: string): void {
    const controller = this.abortControllers.get(jobId);
    if (controller) {
      controller.abort();
    }
  }

  // Check if generation is paused
  isPaused(jobId: string): boolean {
    const controller = this.abortControllers.get(jobId);
    return !controller || controller.signal.aborted;
  }
}

export default ParallelGenerationService;
