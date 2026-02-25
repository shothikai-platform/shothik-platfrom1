/**
 * Music Generation Service
 * 
 * Handles AI music generation using Suno API.
 * Creates background music for videos.
 */

import { MusicSettings } from '../types/index.js';

const SUNO_API_BASE = 'https://api.suno.ai/v1';

export class MusicService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.SUNO_API_KEY || '';
    if (!this.apiKey) {
      console.warn('SUNO_API_KEY not set - music generation will fail');
    }
  }

  /**
   * Generate background music for a video
   */
  async generateMusic(settings: MusicSettings): Promise<{ 
    audioUrl: string; 
    duration: number;
    metadata: { title: string; tags: string[] }
  }> {
    const prompt = settings.prompt || this.buildPrompt(settings);
    
    const response = await fetch(`${SUNO_API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        duration: Math.min(settings.duration, 300), // Max 5 minutes
        tags: this.buildTags(settings),
        instrumental: settings.instrumental
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Music generation failed: ${error}`);
    }

    const data = await response.json();
    
    // Poll for completion
    const result = await this.pollForCompletion(data.id);
    
    return {
      audioUrl: result.audioUrl,
      duration: result.duration,
      metadata: {
        title: result.title,
        tags: result.tags
      }
    };
  }

  /**
   * Get generation status
   */
  async getStatus(generationId: string): Promise<{
    status: 'pending' | 'generating' | 'completed' | 'failed';
    progress: number;
    audioUrl?: string;
  }> {
    const response = await fetch(`${SUNO_API_BASE}/generate/${generationId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get generation status');
    }

    return await response.json();
  }

  /**
   * Extend an existing music clip
   */
  async extendMusic(
    audioUrl: string,
    additionalDuration: number
  ): Promise<{ audioUrl: string; duration: number }> {
    const response = await fetch(`${SUNO_API_BASE}/extend`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        duration: additionalDuration
      })
    });

    if (!response.ok) {
      throw new Error('Failed to extend music');
    }

    const data = await response.json();
    const result = await this.pollForCompletion(data.id);

    return {
      audioUrl: result.audioUrl,
      duration: result.duration
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildPrompt(settings: MusicSettings): string {
    const moodDescriptions: Record<string, string> = {
      professional: 'Professional corporate background music, clean and modern',
      upbeat: 'Upbeat and energetic background music, positive vibes',
      calm: 'Calm and relaxing ambient music, peaceful atmosphere',
      dramatic: 'Dramatic and cinematic background music, emotional impact',
      inspirational: 'Inspirational and uplifting background music, motivational',
      corporate: 'Corporate business background music, sophisticated and polished'
    };

    let prompt = moodDescriptions[settings.mood] || moodDescriptions.professional;
    
    if (settings.genre) {
      prompt += `, ${settings.genre} style`;
    }

    prompt += '. Instrumental only, no vocals. Suitable for presentation background.';

    return prompt;
  }

  private buildTags(settings: MusicSettings): string[] {
    const tags: string[] = [settings.mood];
    
    if (settings.genre) {
      tags.push(settings.genre);
    }

    if (settings.instrumental) {
      tags.push('instrumental');
    }

    tags.push('background', 'presentation');

    return tags;
  }

  private async pollForCompletion(
    generationId: string,
    maxAttempts = 60,
    intervalMs = 5000
  ): Promise<{ audioUrl: string; duration: number; title: string; tags: string[] }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getStatus(generationId);

      if (status.status === 'completed' && status.audioUrl) {
        // Fetch full metadata
        const response = await fetch(`${SUNO_API_BASE}/generate/${generationId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        });
        
        const data = await response.json();
        
        return {
          audioUrl: status.audioUrl,
          duration: data.duration || 0,
          title: data.title || 'Generated Track',
          tags: data.tags || []
        };
      }

      if (status.status === 'failed') {
        throw new Error('Music generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Music generation timed out');
  }
}

export default MusicService;
