// ============================================
// Humanizer Service
// Makes AI-generated text bypass AI detection
// ============================================

import { ICacheService, ILLMService } from '../../../shared/types';

export interface HumanizeRequest {
  text: string;
  intensity: 'light' | 'medium' | 'aggressive';
  preserveMeaning?: boolean;
}

export interface HumanizeResult {
  text: string;
  changes: HumanizeChange[];
  metrics: {
    originalPerplexity: number;
    newPerplexity: number;
    burstiness: number;
  };
}

export interface HumanizeChange {
  original: string;
  replacement: string;
  type: 'synonym' | 'restructure' | 'idiom' | 'variation';
}

export class HumanizerService {
  constructor(
    private llmService: ILLMService,
    private cacheService: ICacheService
  ) {}

  async humanize(request: HumanizeRequest): Promise<HumanizeResult> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache
    const cached = await this.cacheService.get<HumanizeResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Generate humanized text
    const result = await this.generateHumanizedText(request);
    
    // Cache result
    await this.cacheService.set(cacheKey, result, 86400); // 24h cache
    
    return result;
  }

  private async generateHumanizedText(request: HumanizeRequest): Promise<HumanizeResult> {
    const prompt = this.buildPrompt(request);
    
    const response = await this.llmService.complete({
      prompt,
      temperature: this.getTemperature(request.intensity),
      maxTokens: request.text.length * 2,
    });

    const humanizedText = response.text;
    
    // Calculate metrics
    const metrics = await this.calculateMetrics(request.text, humanizedText);
    
    // Detect changes
    const changes = this.detectChanges(request.text, humanizedText);

    return {
      text: humanizedText,
      changes,
      metrics,
    };
  }

  private buildPrompt(request: HumanizeRequest): string {
    const intensityInstructions = {
      light: 'Make minor adjustments to vary sentence structure and word choice.',
      medium: 'Restructure sentences, use synonyms, add natural variations.',
      aggressive: 'Significantly restructure, use idioms, vary sentence lengths dramatically.',
    };

    return `
You are a text humanizer. Your task is to rewrite the following text to make it appear more human-written.

Instructions:
${intensityInstructions[request.intensity]}

Key techniques:
1. Vary sentence lengths (short and long)
2. Use conversational transitions
3. Add natural idioms where appropriate
4. Break up overly formal structures
5. Use synonyms that humans would naturally choose
6. Add slight imperfections (optional clauses, varied punctuation)

${request.preserveMeaning !== false ? 'Preserve the original meaning completely.' : ''}

Original text:
"""${request.text}"""

Provide only the humanized text, no explanations.
`;
  }

  private getTemperature(intensity: string): number {
    switch (intensity) {
      case 'light': return 0.3;
      case 'medium': return 0.6;
      case 'aggressive': return 0.9;
      default: return 0.6;
    }
  }

  private async calculateMetrics(original: string, humanized: string): Promise<HumanizeResult['metrics']> {
    // Calculate perplexity and burstiness
    // Higher perplexity = more "human-like" (less predictable)
    // Higher burstiness = more variation in sentence structure
    
    return {
      originalPerplexity: await this.calculatePerplexity(original),
      newPerplexity: await this.calculatePerplexity(humanized),
      burstiness: this.calculateBurstiness(humanized),
    };
  }

  private async calculatePerplexity(text: string): Promise<number> {
    // This would call the NLP service to calculate perplexity
    // Placeholder implementation
    return Math.random() * 100 + 50;
  }

  private calculateBurstiness(text: string): number {
    // Calculate variation in sentence lengths
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    
    if (lengths.length < 2) return 0;
    
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Burstiness = standard deviation / mean
    return stdDev / mean;
  }

  private detectChanges(original: string, humanized: string): HumanizeChange[] {
    // Simple diff detection
    // In production, this would use a proper diff algorithm
    const changes: HumanizeChange[] = [];
    
    if (original !== humanized) {
      changes.push({
        original: original.substring(0, 100) + '...',
        replacement: humanized.substring(0, 100) + '...',
        type: 'restructure',
      });
    }
    
    return changes;
  }

  private generateCacheKey(request: HumanizeRequest): string {
    // Hash the text and parameters for cache key
    const hash = Buffer.from(request.text).toString('base64').substring(0, 32);
    return `humanize:${request.intensity}:${hash}`;
  }
}

// ============================================
// Anti-Detection Strategies
// ============================================

export class AntiDetectionStrategies {
  // Strategy 1: Perplexity Injection
  static injectPerplexity(text: string): string {
    // Add unexpected but natural variations
    const variations = [
      { pattern: /\b(very|really|quite)\b/gi, replacement: 'rather' },
      { pattern: /\b(however|nevertheless)\b/gi, replacement: 'that said' },
      { pattern: /\b(additionally|furthermore)\b/gi, replacement: 'plus' },
    ];
    
    let result = text;
    for (const { pattern, replacement } of variations) {
      if (Math.random() > 0.5) {
        result = result.replace(pattern, replacement);
      }
    }
    return result;
  }

  // Strategy 2: Burstiness Enhancement
  static enhanceBurstiness(text: string): string {
    const sentences = text.split(/([.!?]+)/);
    const result: string[] = [];
    
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i];
      const punctuation = sentences[i + 1] || '.';
      
      if (sentence?.trim()) {
        // Randomly vary sentence structure
        if (Math.random() > 0.7 && sentence.length > 50) {
          // Break long sentence
          const mid = Math.floor(sentence.length / 2);
          const breakPoint = sentence.indexOf(' ', mid);
          if (breakPoint > 0) {
            result.push(sentence.substring(0, breakPoint).trim() + '.');
            result.push(sentence.substring(breakPoint).trim() + punctuation);
            continue;
          }
        }
        result.push(sentence.trim() + punctuation);
      }
    }
    
    return result.join(' ');
  }

  // Strategy 3: Idiom Injection
  static injectIdioms(text: string): string {
    const idioms = [
      { formal: 'in conclusion', idiom: 'at the end of the day' },
      { formal: 'however', idiom: 'be that as it may' },
      { formal: 'for example', idiom: 'case in point' },
      { formal: 'important', idiom: 'a big deal' },
    ];
    
    let result = text;
    for (const { formal, idiom } of idioms) {
      const regex = new RegExp(`\\b${formal}\\b`, 'gi');
      if (regex.test(result) && Math.random() > 0.6) {
        result = result.replace(regex, idiom);
      }
    }
    return result;
  }
}
