// ============================================
// Writing Studio - Editor Service
// Long-form writing with AI assistance
// ============================================

import { 
  ILLMService,
  ICacheService,
  IParaphrasingService,
  IGrammarService,
  ISummarizerService 
} from '../../../shared/types';

export interface EditorState {
  projectId: string;
  chapterId: string;
  content: string;
  cursorPosition: number;
  selection?: { start: number; end: number };
}

export interface AIAssistRequest {
  editorState: EditorState;
  action: 'continue' | 'rewrite' | 'summarize' | 'expand' | 'shorten' | 'tone';
  context?: string;
}

export interface AIAssistResponse {
  text: string;
  action: string;
  confidence: number;
}

export interface InlineSuggestion {
  id: string;
  position: number;
  text: string;
  type: 'completion' | 'grammar' | 'style';
}

export class StudioEditorService {
  constructor(
    private llmService: ILLMService,
    private paraphraseService: IParaphrasingService,
    private grammarService: IGrammarService,
    private summarizerService: ISummarizerService,
    private cacheService: ICacheService
  ) {}

  // ============================================
  // AI Writing Assistance
  // ============================================

  async assist(request: AIAssistRequest): Promise<AIAssistResponse> {
    const { editorState, action, context } = request;

    switch (action) {
      case 'continue':
        return this.continueWriting(editorState, context);
      case 'rewrite':
        return this.rewriteSelection(editorState);
      case 'summarize':
        return this.summarizeSelection(editorState);
      case 'expand':
        return this.expandSelection(editorState);
      case 'shorten':
        return this.shortenSelection(editorState);
      case 'tone':
        return this.adjustTone(editorState, context);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async continueWriting(
    editorState: EditorState, 
    context?: string
  ): Promise<AIAssistResponse> {
    const prompt = this.buildContinuationPrompt(editorState, context);
    
    const response = await this.llmService.complete({
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    return {
      text: response.text.trim(),
      action: 'continue',
      confidence: 0.85,
    };
  }

  private async rewriteSelection(editorState: EditorState): Promise<AIAssistResponse> {
    if (!editorState.selection) {
      throw new Error('No text selected');
    }

    const selectedText = editorState.content.substring(
      editorState.selection.start,
      editorState.selection.end
    );

    const result = await this.paraphraseService.paraphrase({
      text: selectedText,
      mode: 'creative',
    });

    return {
      text: result.text,
      action: 'rewrite',
      confidence: 0.9,
    };
  }

  private async summarizeSelection(editorState: EditorState): Promise<AIAssistResponse> {
    if (!editorState.selection) {
      throw new Error('No text selected');
    }

    const selectedText = editorState.content.substring(
      editorState.selection.start,
      editorState.selection.end
    );

    const summary = await this.summarizerService.summarize(selectedText, 0.3);

    return {
      text: summary,
      action: 'summarize',
      confidence: 0.88,
    };
  }

  private async expandSelection(editorState: EditorState): Promise<AIAssistResponse> {
    if (!editorState.selection) {
      throw new Error('No text selected');
    }

    const selectedText = editorState.content.substring(
      editorState.selection.start,
      editorState.selection.end
    );

    const prompt = `
Expand the following text with more detail, examples, and depth:

"""${selectedText}"""

Provide an expanded version that is approximately 2x the length:
`;

    const response = await this.llmService.complete({
      prompt,
      temperature: 0.6,
      maxTokens: selectedText.length * 2,
    });

    return {
      text: response.text.trim(),
      action: 'expand',
      confidence: 0.82,
    };
  }

  private async shortenSelection(editorState: EditorState): Promise<AIAssistResponse> {
    if (!editorState.selection) {
      throw new Error('No text selected');
    }

    const selectedText = editorState.content.substring(
      editorState.selection.start,
      editorState.selection.end
    );

    const summary = await this.summarizerService.summarize(selectedText, 0.5);

    return {
      text: summary,
      action: 'shorten',
      confidence: 0.85,
    };
  }

  private async adjustTone(
    editorState: EditorState, 
    tone?: string
  ): Promise<AIAssistResponse> {
    if (!editorState.selection) {
      throw new Error('No text selected');
    }

    const selectedText = editorState.content.substring(
      editorState.selection.start,
      editorState.selection.end
    );

    const prompt = `
Rewrite the following text in a ${tone || 'professional'} tone:

"""${selectedText}"""

Rewritten version:
`;

    const response = await this.llmService.complete({
      prompt,
      temperature: 0.5,
      maxTokens: selectedText.length,
    });

    return {
      text: response.text.trim(),
      action: 'tone',
      confidence: 0.8,
    };
  }

  // ============================================
  // Inline Suggestions (Real-time)
  // ============================================

  async getInlineSuggestions(editorState: EditorState): Promise<InlineSuggestion[]> {
    const suggestions: InlineSuggestion[] = [];

    // Get completion suggestion
    const completion = await this.getCompletionSuggestion(editorState);
    if (completion) {
      suggestions.push(completion);
    }

    // Get grammar suggestions for current sentence
    const grammarSuggestions = await this.getGrammarSuggestions(editorState);
    suggestions.push(...grammarSuggestions);

    return suggestions;
  }

  private async getCompletionSuggestion(
    editorState: EditorState
  ): Promise<InlineSuggestion | null> {
    const cacheKey = `completion:${editorState.projectId}:${editorState.cursorPosition}`;
    
    const cached = await this.cacheService.get<InlineSuggestion>(cacheKey);
    if (cached) return cached;

    // Only suggest completions at end of sentences or paragraphs
    const textBefore = editorState.content.substring(0, editorState.cursorPosition);
    const lastChar = textBefore.trim().slice(-1);
    
    if (!['.', '!', '?', '\n'].includes(lastChar)) {
      return null;
    }

    const prompt = `
Continue the following text naturally:

"""${textBefore.slice(-200)}"""

Next sentence (be concise, 10-20 words):
`;

    const response = await this.llmService.complete({
      prompt,
      temperature: 0.6,
      maxTokens: 50,
    });

    const suggestion: InlineSuggestion = {
      id: this.generateSuggestionId(),
      position: editorState.cursorPosition,
      text: response.text.trim(),
      type: 'completion',
    };

    await this.cacheService.set(cacheKey, suggestion, 300); // 5 min cache

    return suggestion;
  }

  private async getGrammarSuggestions(
    editorState: EditorState
  ): Promise<InlineSuggestion[]> {
    // Get current sentence
    const sentences = editorState.content.split(/(?<=[.!?])\s+/);
    let currentPosition = 0;
    let currentSentence = '';

    for (const sentence of sentences) {
      const sentenceEnd = currentPosition + sentence.length;
      if (editorState.cursorPosition >= currentPosition && 
          editorState.cursorPosition <= sentenceEnd) {
        currentSentence = sentence;
        break;
      }
      currentPosition = sentenceEnd + 1;
    }

    if (!currentSentence || currentSentence.length < 10) {
      return [];
    }

    const issues = await this.grammarService.check(currentSentence);

    return issues.map(issue => ({
      id: this.generateSuggestionId(),
      position: currentPosition + issue.start,
      text: issue.suggestion,
      type: 'grammar',
    }));
  }

  // ============================================
  // Smart Features
  // ============================================

  async generateOutline(topic: string, type: string): Promise<string[]> {
    const prompt = `
Generate a detailed outline for a ${type} about "${topic}".

Provide 5-7 main sections:
`;

    const response = await this.llmService.complete({
      prompt,
      temperature: 0.5,
      maxTokens: 300,
    });

    // Parse outline from response
    return response.text
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
  }

  async generateTitle(content: string): Promise<string[]> {
    const prompt = `
Generate 5 catchy titles for the following content:

"""${content.substring(0, 1000)}"""

Titles:
`;

    const response = await this.llmService.complete({
      prompt,
      temperature: 0.8,
      maxTokens: 200,
    });

    return response.text
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 5);
  }

  async analyzeReadability(content: string): Promise<ReadabilityMetrics> {
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
    const paragraphs = content.split('\n\n').filter(p => p.trim()).length;

    // Simple Flesch Reading Ease approximation
    const avgSentenceLength = words / Math.max(sentences, 1);
    const avgWordLength = content.length / Math.max(words, 1);
    const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgWordLength);

    return {
      wordCount: words,
      sentenceCount: sentences,
      paragraphCount: paragraphs,
      avgSentenceLength,
      avgWordLength,
      fleschScore: Math.max(0, Math.min(100, fleschScore)),
      readingLevel: this.getReadingLevel(fleschScore),
    };
  }

  private getReadingLevel(fleschScore: number): string {
    if (fleschScore >= 90) return 'Very Easy (5th grade)';
    if (fleschScore >= 80) return 'Easy (6th grade)';
    if (fleschScore >= 70) return 'Fairly Easy (7th grade)';
    if (fleschScore >= 60) return 'Standard (8th-9th grade)';
    if (fleschScore >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (fleschScore >= 30) return 'Difficult (College)';
    return 'Very Difficult (Graduate)';
  }

  // ============================================
  // Helper Methods
  // ============================================

  private buildContinuationPrompt(editorState: EditorState, context?: string): string {
    const textBefore = editorState.content.substring(0, editorState.cursorPosition);
    const lastParagraph = textBefore.split('\n\n').pop() || '';

    return `
Continue writing the following text${context ? ` for: ${context}` : ''}:

"""${lastParagraph.slice(-500)}"""

Continue naturally (2-3 sentences):
`;
  }

  private generateSuggestionId(): string {
    return `sugg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export interface ReadabilityMetrics {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgSentenceLength: number;
  avgWordLength: number;
  fleschScore: number;
  readingLevel: string;
}
