/**
 * Voiceover Service
 * 
 * Handles text-to-speech generation using ElevenLabs API.
 * Supports voice cloning and multiple voice settings.
 */

import { VoiceSettings, VoiceCloneSettings, SlideContent } from '../types/index.js';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export class VoiceoverService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ELEVENLABS_API_KEY not set - voice generation will fail');
    }
  }

  /**
   * Generate voiceover for a slide deck
   */
  async generateVoiceover(
    slides: SlideContent[],
    settings: VoiceSettings,
    cloneSettings: VoiceCloneSettings
  ): Promise<{ audioUrl: string; duration: number; segments: Array<{ slideId: string; startTime: number; endTime: number }> }> {
    // Generate script from slides
    const script = this.buildScript(slides);
    
    // Determine voice ID
    const voiceId = cloneSettings.enabled && cloneSettings.clonedVoiceId
      ? cloneSettings.clonedVoiceId
      : settings.voiceId;

    // Generate audio
    const audioBuffer = await this.synthesizeSpeech(script, voiceId, settings);
    
    // Upload to storage and get URL
    const audioUrl = await this.uploadAudio(audioBuffer);
    
    // Estimate duration (rough calculation: ~150 words per minute)
    const wordCount = script.split(' ').length;
    const duration = (wordCount / 150) * 60;

    // Calculate segment timings
    const segments = this.calculateSegmentTimings(slides, duration);

    return { audioUrl, duration, segments };
  }

  /**
   * Clone a voice from audio samples
   */
  async cloneVoice(
    name: string,
    sampleFiles: Buffer[]
  ): Promise<{ voiceId: string; status: string }> {
    const formData = new FormData();
    formData.append('name', name);
    
    sampleFiles.forEach((file, index) => {
      // Convert Buffer to ArrayBuffer for Blob
      const arrayBuffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      formData.append(`files`, blob, `sample_${index}.mp3`);
    });

    const response = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voice cloning failed: ${error}`);
    }

    const data = await response.json();
    return {
      voiceId: data.voice_id,
      status: 'created'
    };
  }

  /**
   * Get available voices
   */
  async getVoices(): Promise<Array<{ voiceId: string; name: string; category: string; previewUrl: string }>> {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data = await response.json();
    
    return data.voices.map((v: any) => ({
      voiceId: v.voice_id,
      name: v.name,
      category: v.category,
      previewUrl: v.preview_url
    }));
  }

  /**
   * Delete a cloned voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    const response = await fetch(`${ELEVENLABS_API_BASE}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete voice');
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildScript(slides: SlideContent[]): string {
    return slides
      .map(slide => {
        let text = slide.title;
        if (slide.content) {
          text += '. ' + slide.content;
        }
        return text;
      })
      .join('.\n\n');
  }

  private async synthesizeSpeech(
    text: string,
    voiceId: string,
    settings: VoiceSettings
  ): Promise<Buffer> {
    const response = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarityBoost,
            style: settings.style,
            use_speaker_boost: settings.useSpeakerBoost
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Speech synthesis failed: ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async uploadAudio(buffer: Buffer): Promise<string> {
    // TODO: Implement actual upload to S3/R2/Cloudflare
    // For now, return a placeholder
    const timestamp = Date.now();
    const key = `voiceovers/${timestamp}.mp3`;
    
    // Placeholder - implement actual upload
    console.log(`Uploading audio to ${key} (${buffer.length} bytes)`);
    
    return `https://cdn.shothik.ai/${key}`;
  }

  private calculateSegmentTimings(
    slides: SlideContent[],
    totalDuration: number
  ): Array<{ slideId: string; startTime: number; endTime: number }> {
    const segments: Array<{ slideId: string; startTime: number; endTime: number }> = [];
    let currentTime = 0;

    // Calculate text length per slide for proportional timing
    const totalTextLength = slides.reduce((sum, slide) => {
      const text = slide.title + (slide.content || '');
      return sum + text.length;
    }, 0);

    for (const slide of slides) {
      const text = slide.title + (slide.content || '');
      const proportion = text.length / totalTextLength;
      const segmentDuration = totalDuration * proportion;

      segments.push({
        slideId: slide.id,
        startTime: currentTime,
        endTime: currentTime + segmentDuration
      });

      currentTime += segmentDuration;
    }

    return segments;
  }
}

export default VoiceoverService;
