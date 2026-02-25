// ============================================
// AI Detector Service
// Detects if text is AI-generated using hybrid approach
// ============================================

import { 
  AIDetectionResult, 
  ICacheService, 
  ILLMService, 
  INLPService 
} from '../../../shared/types';

export interface AIDetectionRequest {
  text: string;
  detailed?: boolean;
}

export interface DetectionMetrics {
  perplexity: number;
  burstiness: number;
  predictability: number;
  repetitionScore: number;
  semanticCoherence: number;
}

export class AIDetectorService {
  constructor(
    private nlpService: INLPService,
    private llmService: ILLMService,
    private cacheService: ICacheService
  ) {}

  async detect(request: AIDetectionRequest): Promise<AIDetectionResult> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache
    const cached = await this.cacheService.get<AIDetectionResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Run detection pipeline
    const result = await this.runDetectionPipeline(request);
    
    // Cache result (shorter TTL for detection - 1 hour)
    await this.cacheService.set(cacheKey, result, 3600);
    
    return result;
  }

  private async runDetectionPipeline(
    request: AIDetectionRequest
  ): Promise<AIDetectionResult> {
    const { text } = request;

    // Step 1: NLP Analysis (fast, statistical)
    const nlpMetrics = await this.analyzeWithNLP(text);

    // Step 2: LLM Analysis (deep, contextual)
    const llmMetrics = await this.analyzeWithLLM(text);

    // Step 3: Combine scores
    const combinedScore = this.calculateCombinedScore(nlpMetrics, llmMetrics);

    return {
      isAI: combinedScore > 0.7,
      confidence: combinedScore,
      perplexity: nlpMetrics.perplexity,
      burstiness: nlpMetrics.burstiness,
    };
  }

  private async analyzeWithNLP(text: string): Promise<DetectionMetrics> {
    // Get token analysis from NLP service
    const nlpAnalysis = await this.nlpService.analyze(text);

    // Calculate perplexity (lower = more predictable = likely AI)
    const perplexity = this.calculatePerplexity(nlpAnalysis.tokens);

    // Calculate burstiness (lower = more uniform = likely AI)
    const burstiness = this.calculateBurstiness(text);

    // Calculate predictability based on token patterns
    const predictability = this.calculatePredictability(nlpAnalysis.tokens);

    // Calculate repetition score
    const repetitionScore = this.calculateRepetition(text);

    // Calculate semantic coherence
    const semanticCoherence = this.calculateCoherence(nlpAnalysis);

    return {
      perplexity,
      burstiness,
      predictability,
      repetitionScore,
      semanticCoherence,
    };
  }

  private async analyzeWithLLM(text: string): Promise<Partial<DetectionMetrics>> {
    const prompt = `
Analyze the following text and determine if it was written by AI or a human.

Text to analyze:
"""${text.substring(0, 2000)}"""

Provide a JSON response with the following fields:
- aiProbability: number (0-1)
- reasoning: string (brief explanation)
- indicators: string[] (list of AI indicators found)

JSON response:
`;

    try {
      const response = await this.llmService.complete({
        prompt,
        temperature: 0.1, // Low temperature for consistent analysis
        maxTokens: 500,
      });

      // Parse LLM response
      const analysis = this.parseLLMResponse(response.text);
      
      return {
        predictability: analysis.aiProbability,
      };
    } catch (error) {
      // Fallback to NLP-only if LLM fails
      return {
        predictability: 0.5,
      };
    }
  }

  private calculatePerplexity(tokens: string[]): number {
    // Simplified perplexity calculation
    // In production, this would use a proper language model
    
    if (tokens.length === 0) return 0;

    // Calculate token frequency distribution
    const frequencies = new Map<string, number>();
    for (const token of tokens) {
      frequencies.set(token, (frequencies.get(token) || 0) + 1);
    }

    // Calculate entropy
    let entropy = 0;
    for (const count of frequencies.values()) {
      const probability = count / tokens.length;
      entropy -= probability * Math.log2(probability);
    }

    // Perplexity = 2^entropy
    return Math.pow(2, entropy);
  }

  private calculateBurstiness(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length < 2) return 0;

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    
    const variance = lengths.reduce((sum, len) => {
      return sum + Math.pow(len - mean, 2);
    }, 0) / lengths.length;

    const stdDev = Math.sqrt(variance);
    
    // Burstiness = (stdDev - mean) / (stdDev + mean)
    // Human text typically has higher burstiness
    return (stdDev - mean) / (stdDev + mean);
  }

  private calculatePredictability(tokens: string[]): number {
    // Check for repetitive patterns
    const bigrams: string[] = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }

    const uniqueBigrams = new Set(bigrams).size;
    const totalBigrams = bigrams.length;

    if (totalBigrams === 0) return 0;

    // Higher ratio = more repetitive = more predictable = likely AI
    return 1 - (uniqueBigrams / totalBigrams);
  }

  private calculateRepetition(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    
    if (words.length === 0) return 0;

    // Type-token ratio
    // Lower ratio = more repetition = likely AI
    return uniqueWords.size / words.length;
  }

  private calculateCoherence(nlpAnalysis: any): number {
    // Analyze semantic coherence using entity relationships
    // This is a simplified version
    
    const entities = nlpAnalysis.entities || [];
    if (entities.length < 2) return 0.5;

    // Check for semantic diversity
    const uniqueTypes = new Set(entities.map((e: any) => e.type)).size;
    return Math.min(uniqueTypes / 5, 1); // Normalize to 0-1
  }

  private calculateCombinedScore(
    nlp: DetectionMetrics,
    llm: Partial<DetectionMetrics>
  ): number {
    // Weighted combination of metrics
    // Lower perplexity = more AI-like
    // Lower burstiness = more AI-like
    // Higher predictability = more AI-like

    const perplexityScore = Math.max(0, Math.min(1, 1 - (nlp.perplexity / 100)));
    const burstinessScore = Math.max(0, Math.min(1, 1 - ((nlp.burstiness + 1) / 2)));
    const predictabilityScore = nlp.predictability;
    const llmScore = llm.predictability || 0.5;

    // Weighted average
    // NLP metrics: 60%, LLM analysis: 40%
    const combined = (
      perplexityScore * 0.2 +
      burstinessScore * 0.2 +
      predictabilityScore * 0.2 +
      llmScore * 0.4
    );

    return Math.max(0, Math.min(1, combined));
  }

  private parseLLMResponse(text: string): { aiProbability: number; reasoning: string; indicators: string[] } {
    try {
      // Try to parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          aiProbability: parsed.aiProbability || 0.5,
          reasoning: parsed.reasoning || '',
          indicators: parsed.indicators || [],
        };
      }
    } catch (e) {
      // Fallback: extract probability from text
      const probabilityMatch = text.match(/(\d+)%/);
      if (probabilityMatch) {
        return {
          aiProbability: parseInt(probabilityMatch[1]) / 100,
          reasoning: text,
          indicators: [],
        };
      }
    }

    return {
      aiProbability: 0.5,
      reasoning: text,
      indicators: [],
    };
  }

  private generateCacheKey(request: AIDetectionRequest): string {
    const hash = Buffer.from(request.text).toString('base64').substring(0, 32);
    return `ai-detect:${hash}`;
  }
}

// ============================================
// AI Detection Indicators
// ============================================

export class AIDetectionIndicators {
  // Common patterns in AI-generated text
  static readonly PATTERNS = {
    // Overly formal transitions
    formalTransitions: [
      'furthermore', 'moreover', 'consequently', 'therefore',
      'in conclusion', 'to summarize', 'in addition',
    ],

    // Repetitive sentence starters
    repetitiveStarters: [
      'the', 'this', 'it', 'there',
    ],

    // Lack of contractions
    noContractions: [
      'do not', 'cannot', 'will not', 'is not', 'are not',
    ],

    // Generic phrases
    genericPhrases: [
      'in today\'s world', 'in recent years', 'it is important to note',
      'as we all know', 'it goes without saying',
    ],
  };

  static analyze(text: string): {
    formalTransitionCount: number;
    repetitivePatternScore: number;
    contractionUsage: number;
    genericPhraseCount: number;
  } {
    const lowerText = text.toLowerCase();

    // Count formal transitions
    const formalTransitionCount = this.PATTERNS.formalTransitions.reduce(
      (count, phrase) => count + (lowerText.includes(phrase) ? 1 : 0),
      0
    );

    // Check for repetitive patterns
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const starters = sentences.map(s => {
      const firstWord = s.trim().split(/\s+/)[0]?.toLowerCase();
      return firstWord;
    });
    
    const starterCounts = new Map<string, number>();
    for (const starter of starters) {
      starterCounts.set(starter, (starterCounts.get(starter) || 0) + 1);
    }
    
    const maxStarterCount = Math.max(...starterCounts.values(), 0);
    const repetitivePatternScore = maxStarterCount / sentences.length;

    // Check contraction usage
    const contractionMatches = text.match(/\wn't|\w're|\w've|\w'll|\w'd/gi) || [];
    const contractionUsage = contractionMatches.length / text.split(/\s+/).length;

    // Count generic phrases
    const genericPhraseCount = this.PATTERNS.genericPhrases.reduce(
      (count, phrase) => {
        const regex = new RegExp(phrase.replace(/'/g, "'"), 'gi');
        const matches = text.match(regex);
        return count + (matches ? matches.length : 0);
      },
      0
    );

    return {
      formalTransitionCount,
      repetitivePatternScore,
      contractionUsage,
      genericPhraseCount,
    };
  }
}
