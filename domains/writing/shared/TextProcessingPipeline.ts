// ============================================
// Text Processing Pipeline
// Unified processing for all writing tools
// ============================================

import { 
  ParaphraseRequest, 
  ParaphraseResult, 
  GrammarIssue,
  TextChange 
} from '../../shared/types';

export interface TextInput {
  text: string;
  userId: string;
  feature: 'paraphrase' | 'grammar' | 'summarize' | 'translate';
  options?: Record<string, unknown>;
}

export interface TextOutput {
  text: string;
  metadata: {
    processingTime: number;
    engine: 'nlp' | 'llm' | 'hybrid';
    cacheHit: boolean;
  };
}

export interface ProcessingStage {
  name: string;
  execute(input: string, context: ProcessingContext): Promise<string>;
}

export interface ProcessingContext {
  userId: string;
  feature: string;
  options: Record<string, unknown>;
  startTime: number;
}

export class TextProcessingPipeline {
  private stages: ProcessingStage[] = [];

  addStage(stage: ProcessingStage): this {
    this.stages.push(stage);
    return this;
  }

  async process(input: TextInput): Promise<TextOutput> {
    const context: ProcessingContext = {
      userId: input.userId,
      feature: input.feature,
      options: input.options || {},
      startTime: Date.now(),
    };

    let currentText = input.text;

    // Execute each stage
    for (const stage of this.stages) {
      currentText = await stage.execute(currentText, context);
    }

    const processingTime = Date.now() - context.startTime;

    return {
      text: currentText,
      metadata: {
        processingTime,
        engine: this.detectEngine(context),
        cacheHit: false, // Will be set by cache layer
      },
    };
  }

  private detectEngine(context: ProcessingContext): 'nlp' | 'llm' | 'hybrid' {
    // Logic to determine which engine was used
    if (context.feature === 'grammar') return 'nlp';
    if (context.feature === 'paraphrase' && context.options?.mode === 'academic') {
      return 'llm';
    }
    return 'hybrid';
  }
}

// ============================================
// Pre-built Stages
// ============================================

export class PreprocessStage implements ProcessingStage {
  name = 'preprocess';

  async execute(input: string): Promise<string> {
    // Clean input text
    return input
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width chars
  }
}

export class PostprocessStage implements ProcessingStage {
  name = 'postprocess';

  async execute(input: string): Promise<string> {
    // Clean output text
    return input
      .trim()
      .replace(/\s+/g, ' ');
  }
}

export class DetectionStage implements ProcessingStage {
  name = 'detection';

  constructor(private aiDetector: any) {}

  async execute(input: string): Promise<string> {
    // Optional: Check if output looks AI-generated
    // Could trigger humanization if needed
    return input;
  }
}

// ============================================
// Pipeline Factory
// ============================================

export class PipelineFactory {
  static createParaphrasePipeline(
    nlpEngine: any,
    llmEngine: any,
    cache: any
  ): TextProcessingPipeline {
    return new TextProcessingPipeline()
      .addStage(new PreprocessStage())
      .addStage(new EngineSelectionStage(nlpEngine, llmEngine))
      .addStage(new PostprocessStage());
  }

  static createGrammarPipeline(nlpEngine: any): TextProcessingPipeline {
    return new TextProcessingPipeline()
      .addStage(new PreprocessStage())
      .addStage(new GrammarCheckStage(nlpEngine))
      .addStage(new PostprocessStage());
  }
}

// Engine Selection Stage
class EngineSelectionStage implements ProcessingStage {
  name = 'engine-selection';

  constructor(
    private nlpEngine: any,
    private llmEngine: any
  ) {}

  async execute(input: string, context: ProcessingContext): Promise<string> {
    // Select engine based on complexity
    if (context.feature === 'grammar') {
      return this.nlpEngine.process(input);
    }
    
    if (context.feature === 'paraphrase') {
      const mode = context.options?.mode;
      if (mode === 'basic' || mode === 'light') {
        return this.nlpEngine.paraphrase(input);
      }
      return this.llmEngine.paraphrase(input, mode);
    }

    return input;
  }
}

// Grammar Check Stage
class GrammarCheckStage implements ProcessingStage {
  name = 'grammar-check';

  constructor(private nlpEngine: any) {}

  async execute(input: string): Promise<string> {
    const issues = await this.nlpEngine.checkGrammar(input);
    // Apply corrections
    return this.applyCorrections(input, issues);
  }

  private applyCorrections(text: string, issues: GrammarIssue[]): string {
    // Sort by position (descending) to avoid offset issues
    const sorted = [...issues].sort((a, b) => b.start - a.start);
    
    let result = text;
    for (const issue of sorted) {
      result = result.slice(0, issue.start) + 
               issue.suggestion + 
               result.slice(issue.end);
    }
    return result;
  }
}
