/**
 * LLM Client for Slide Generation
 * Supports DeepSeek and Gemini with fallback
 */

import { SlideJobData, SlideDeck, SlideContent, SlideType } from '../types/index.js';

interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

interface LLMClient {
  generateContent(prompt: string, systemPrompt?: string): Promise<LLMResponse>;
}

class DeepSeekClient implements LLMClient {
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }
}

class GeminiClient implements LLMClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
    
    const response = await fetch(
      `${this.baseUrl}/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text
    };
  }
}

export class LLMService {
  private primaryClient: LLMClient;
  private fallbackClient: LLMClient | null;
  private useFallback = false;

  constructor() {
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!deepseekKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    this.primaryClient = new DeepSeekClient(deepseekKey);
    this.fallbackClient = geminiKey ? new GeminiClient(geminiKey) : null;
  }

  async generateWithFallback(prompt: string, systemPrompt?: string): Promise<LLMResponse> {
    try {
      if (this.useFallback && this.fallbackClient) {
        return await this.fallbackClient.generateContent(prompt, systemPrompt);
      }
      return await this.primaryClient.generateContent(prompt, systemPrompt);
    } catch (error) {
      console.warn('Primary LLM failed, trying fallback:', error);
      
      if (this.fallbackClient) {
        this.useFallback = true;
        return await this.fallbackClient.generateContent(prompt, systemPrompt);
      }
      
      throw error;
    }
  }

  // Generate presentation outline
  async generateOutline(jobData: SlideJobData): Promise<Array<{title: string; type: SlideType; keyPoints: string[]}>> {
    const systemPrompt = `You are an expert presentation designer. Create a detailed outline for a presentation.
    Return ONLY a JSON array with no markdown formatting.`;

    const prompt = `Create a ${jobData.slideCount}-slide presentation outline for: "${jobData.prompt}"
    
Target Audience: ${jobData.targetAudience}
Theme: ${jobData.theme}
Language: ${jobData.language}

Requirements:
1. First slide must be a title slide
2. Include content slides with key points
3. Add a conclusion slide
4. Each slide should have 3-5 key points

Return format:
[
  {
    "title": "Slide Title",
    "type": "title|content|bullets|two_column|quote",
    "keyPoints": ["point 1", "point 2", "point 3"]
  }
]`;

    const response = await this.generateWithFallback(prompt, systemPrompt);
    
    try {
      // Extract JSON from response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response.content);
    } catch (error) {
      console.error('Failed to parse outline:', error);
      // Return default outline
      return this.generateDefaultOutline(jobData);
    }
  }

  // Generate content for a single slide
  async generateSlideContent(
    slideTitle: string,
    slideType: SlideType,
    keyPoints: string[],
    context: string,
    jobData: SlideJobData
  ): Promise<{content: string; bullets: string[]; speakerNotes: string}> {
    const systemPrompt = `You are an expert content writer for presentations. Create engaging, concise content.
    Target audience: ${jobData.targetAudience}. Tone: ${jobData.theme}.`;

    const prompt = `Create content for a presentation slide:

Title: ${slideTitle}
Type: ${slideType}
Key Points to Cover: ${keyPoints.join(', ')}
Presentation Context: ${context}

Requirements:
1. Content should be concise and impactful
2. Use bullet points for readability
3. Include speaker notes for the presenter
4. Match the ${jobData.theme} style

Return format:
{
  "content": "Main paragraph content (if applicable)",
  "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"],
  "speakerNotes": "Notes for the presenter"
}`;

    const response = await this.generateWithFallback(prompt, systemPrompt);
    
    try {
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response.content);
    } catch (error) {
      return {
        content: keyPoints.join('. '),
        bullets: keyPoints,
        speakerNotes: `Discuss ${slideTitle}`
      };
    }
  }

  // Generate design system
  async generateDesignSystem(theme: string, memoryPreferences?: any): Promise<{
    colorScheme: {primary: string; secondary: string; background: string; text: string; accent: string};
    fontFamily: string;
  }> {
    const themeConfigs: Record<string, any> = {
      professional: {
        colorScheme: { primary: '#0066CC', secondary: '#4A90E2', background: '#FFFFFF', text: '#333333', accent: '#F5F5F5' },
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      creative: {
        colorScheme: { primary: '#FF6B35', secondary: '#F7931E', background: '#FFF5F0', text: '#2D2D2D', accent: '#FFE4D6' },
        fontFamily: 'Poppins, system-ui, sans-serif'
      },
      minimal: {
        colorScheme: { primary: '#333333', secondary: '#666666', background: '#FFFFFF', text: '#000000', accent: '#F0F0F0' },
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      educational: {
        colorScheme: { primary: '#10B981', secondary: '#34D399', background: '#F0FDF4', text: '#1F2937', accent: '#D1FAE5' },
        fontFamily: 'Roboto, system-ui, sans-serif'
      },
      business: {
        colorScheme: { primary: '#1E3A5F', secondary: '#2E5A8F', background: '#FFFFFF', text: '#1A1A1A', accent: '#E8EEF4' },
        fontFamily: 'Segoe UI, system-ui, sans-serif'
      },
      modern: {
        colorScheme: { primary: '#8B5CF6', secondary: '#A78BFA', background: '#FAF5FF', text: '#1F2937', accent: '#E9D5FF' },
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      dark: {
        colorScheme: { primary: '#60A5FA', secondary: '#93C5FD', background: '#111827', text: '#F9FAFB', accent: '#1F2937' },
        fontFamily: 'Inter, system-ui, sans-serif'
      }
    };

    const config = themeConfigs[theme] || themeConfigs.professional;

    // Apply memory preferences if available
    if (memoryPreferences?.colors?.length > 0) {
      config.colorScheme.primary = memoryPreferences.colors[0];
    }
    if (memoryPreferences?.fonts?.length > 0) {
      config.fontFamily = memoryPreferences.fonts[0];
    }

    return config;
  }

  private generateDefaultOutline(jobData: SlideJobData): Array<{title: string; type: SlideType; keyPoints: string[]}> {
    const outline = [];
    
    // Title slide
    outline.push({
      title: jobData.title || jobData.prompt.slice(0, 50),
      type: 'title' as SlideType,
      keyPoints: ['Introduction', 'Overview']
    });

    // Content slides
    const contentSlides = jobData.slideCount - 2;
    for (let i = 0; i < contentSlides; i++) {
      outline.push({
        title: `Key Point ${i + 1}`,
        type: 'content' as SlideType,
        keyPoints: ['Important detail 1', 'Important detail 2', 'Important detail 3']
      });
    }

    // Conclusion slide
    outline.push({
      title: 'Conclusion',
      type: 'content' as SlideType,
      keyPoints: ['Summary', 'Next steps', 'Call to action']
    });

    return outline;
  }
}

export default LLMService;
