# TinyFish Cookbook Analysis - Skills for Shothik Enhancement

## Date: February 24, 2026
## Source: https://github.com/tinyfish-io/tinyfish-cookbook

---

## 🎯 What is TinyFish?

**TinyFish** = Web agents as an API
- Turns any website into a programmable data source
- Natural language goals → Structured JSON output
- Handles navigation, forms, dynamic content, proxies
- Multi-step flows across many sites at once

**Key Insight:** Instead of building scrapers, use AI agents to navigate websites.

---

## 📚 Recipe Analysis - Applicable Skills

### 1. **Research Sentry** - Academic Research Agent
**What it does:**
- Voice-first academic research co-pilot
- Scans ArXiv, PubMed, Semantic Scholar, IEEE Xplore
- Multi-source parallel scraping
- Real-time synthesis

**Architecture:**
```
User Voice/Text → Intent Parser → Search Engine
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
               ArXiv Agent      PubMed Agent      Scholar Agent
                    │                 │                 │
                    └─────────────────┼─────────────────┘
                                      ▼
                              Synthesis & Deduplication
                                      │
                                      ▼
                              JSON Results + Live Terminal
```

**Skills for Shothik:**
- ✅ Multi-source research (ArXiv, PubMed, etc.)
- ✅ Voice input for research queries
- ✅ Parallel agent execution
- ✅ Real-time progress streaming
- ✅ Citation tracking

**Implementation for Shothik:**
```typescript
// Deep Research Agent Enhancement
class ResearchSentry {
  async research(query: string, sources: string[]) {
    // Parallel search across sources
    const searches = sources.map(source => 
      this.searchSource(source, query)
    );
    
    const results = await Promise.allSettled(searches);
    
    // Synthesize and deduplicate
    return this.synthesize(results);
  }
}
```

---

### 2. **TinySkills** - Multi-Source Skill Guide Generator
**What it does:**
- Generates technical skill guides
- Scrapes 4 source types in parallel:
  - Official documentation
  - GitHub issues
  - Stack Overflow
  - Dev blogs
- AI synthesis into markdown guide

**Key Pattern - Parallel Scraping:**
```typescript
// Scrape all sources in parallel
const scrapePromises = sources.map(async (source) => {
  const goal = buildScrapeGoal(source.type, topic);
  
  return await tinyfishAgent.run({
    url: source.url,
    goal,
    browser_profile: "lite"
  });
});

const results = await Promise.allSettled(scrapePromises);
```

**Skills for Shothik:**
- ✅ Multi-source content aggregation
- ✅ Source-specific extraction prompts
- ✅ Parallel execution pattern
- ✅ AI synthesis of multiple sources
- ✅ Real-time progress streaming

**Implementation for Shothik Research:**
```typescript
// Enhanced Research Agent
async function deepResearch(topic: string) {
  // Identify sources
  const sources = await identifySources(topic);
  
  // Parallel scraping
  const contents = await Promise.all(
    sources.map(s => scrapeWithGoal(s.url, s.type))
  );
  
  // Synthesize
  return await synthesizeContents(contents);
}
```

---

### 3. **Competitor Analysis** - Live Pricing Intelligence
**What it does:**
- Live competitive pricing dashboard
- Monitors competitor websites
- Price change alerts
- Historical tracking

**Skills for Shothik:**
- ✅ Scheduled agent runs
- ✅ Change detection
- ✅ Historical data tracking
- ✅ Alert system

---

### 4. **Fast QA** - No-Code Testing Platform
**What it does:**
- QA testing with parallel execution
- Live browser previews
- Test automation

**Skills for Shothik:**
- ✅ Parallel test execution
- ✅ Visual regression testing
- ✅ Live preview

---

### 5. **Logistics Sentry** - Port/Carrier Tracking
**What it does:**
- Logistics intelligence
- Port congestion tracking
- Carrier risk assessment
- Multi-source data aggregation

**Skills for Shothik:**
- ✅ Multi-source data fusion
- ✅ Real-time monitoring
- ✅ Risk assessment

---

## 🎬 Video/Audio Generation Skills (Not in TinyFish)

Since TinyFish doesn't have video/audio generation recipes, here's how Shothik can add these:

### 1. **AI Video Generation with Remotion**

**Concept:** Turn slides into motion graphics videos

```typescript
// domains/agents/video-generator/RemotionVideoAgent.ts
import { Composition, staticFile } from 'remotion';
import { z } from 'zod';

export class RemotionVideoAgent {
  async generateVideoFromSlides(slides: Slide[]) {
    // Generate video script from slides
    const script = await this.generateScript(slides);
    
    // Generate voiceover with ElevenLabs
    const voiceover = await this.generateVoiceover(script);
    
    // Create Remotion composition
    const composition = this.buildComposition(slides, voiceover);
    
    // Render video
    return await this.renderVideo(composition);
  }
  
  private async generateVoiceover(script: string) {
    // ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: script,
        voice_id: 'professional-presenter',
        model_id: 'eleven_multilingual_v2'
      })
    });
    
    return response.blob();
  }
}
```

**Remotion Components for Slides:**
```tsx
// components/video/SlideComposition.tsx
import { useVideoConfig, useCurrentFrame } from 'remotion';

export const SlideComposition: React.FC<{
  slides: Slide[];
  voiceover: string;
}> = ({ slides, voiceover }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  
  // Determine which slide to show
  const currentSlideIndex = Math.floor(frame / (fps * 5)); // 5 seconds per slide
  const slide = slides[currentSlideIndex];
  
  return (
    <div className="slide-container">
      <SlideContent slide={slide} />
      <ProgressBar current={currentSlideIndex} total={slides.length} />
    </div>
  );
};
```

---

### 2. **AI Music Generation with Suno**

**Concept:** Generate background music for presentations

```typescript
// domains/agents/audio-generator/SunoMusicAgent.ts
export class SunoMusicAgent {
  async generateBackgroundMusic(params: {
    duration: number;
    mood: 'professional' | 'upbeat' | 'calm';
    genre?: string;
  }) {
    const prompt = this.buildPrompt(params);
    
    // Suno API
    const response = await fetch('https://api.suno.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUNO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        duration: params.duration,
        tags: [params.mood, params.genre || 'corporate']
      })
    });
    
    return await response.json();
  }
  
  private buildPrompt(params: any): string {
    return `Professional background music for business presentation. 
    Mood: ${params.mood}. 
    Duration: ${params.duration} seconds.
    No vocals, instrumental only.`;
  }
}
```

---

### 3. **Voice Cloning with ElevenLabs**

**Concept:** Clone user's voice for presentation narration

```typescript
// domains/agents/voice-cloner/VoiceCloneAgent.ts
export class VoiceCloneAgent {
  async cloneVoice(audioSamples: Blob[]) {
    // Upload samples to ElevenLabs
    const formData = new FormData();
    audioSamples.forEach((sample, i) => {
      formData.append(`sample_${i}`, sample);
    });
    
    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: formData
    });
    
    return await response.json(); // Returns voice_id
  }
  
  async generateSpeech(text: string, voiceId: string) {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );
    
    return response.blob();
  }
}
```

---

## 🚀 Enhanced Shothik Agent Architecture

### Proposed New Agents

```
┌─────────────────────────────────────────────────────────────┐
│                    SHOTHIK AI PLATFORM                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  Deep Research  │  │  Slide Generator│  │Sheet Agent  │ │
│  │    (Enhanced)   │  │   (Existing)    │  │ (Existing)  │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           └────────────────────┼───────────────────┘        │
│                                │                            │
│                                ▼                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              NEW: Video Generator Agent              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  Remotion   │  │ ElevenLabs  │  │    Suno     │  │   │
│  │  │   Video     │  │   Voice     │  │   Music     │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              NEW: Research Sentry Agent              │   │
│  │  (TinyFish-style multi-source research)             │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │  ArXiv  │ │ PubMed  │ │ Scholar │ │  IEEE   │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Priority

### Phase 1: Enhanced Research (This Week)
1. Multi-source research (ArXiv, PubMed, Scholar)
2. Parallel scraping pattern
3. Voice input for research queries
4. Citation tracking

### Phase 2: Video Generation (Next 2 Weeks)
1. Remotion integration
2. ElevenLabs voiceover
3. Suno background music
4. Slide-to-video pipeline

### Phase 3: Advanced Features (Next Month)
1. Voice cloning
2. Motion graphics templates
3. Video export (MP4, YouTube)
4. Live presentation mode

---

## 💡 Key Skills from TinyFish for Shothik

| Skill | Source | Implementation |
|-------|--------|----------------|
| **Multi-source scraping** | Research Sentry, TinySkills | Parallel agent execution |
| **Voice interface** | Research Sentry | Whisper + voice recorder |
| **Real-time streaming** | All recipes | SSE for progress updates |
| **Source-specific prompts** | TinySkills | Custom extraction per source |
| **AI synthesis** | TinySkills | Multi-source consolidation |
| **Live terminal** | Research Sentry | Agent progress visualization |

---

## 🎬 New Capabilities for Shothik

### Before (Current)
- Text → Slides
- Basic research
- Static presentations

### After (With Enhancements)
- Voice → Research → Slides → Video
- Multi-source academic research
- AI-generated motion graphics
- Voice cloning for narration
- Background music generation
- YouTube-ready video export

**Positioning:**
> "Shothik: From idea to presentation to video - the complete AI content creation platform"

---

## 🔧 Technical Requirements

### New APIs Needed:
1. **TinyFish** (for web scraping agents)
2. **Remotion** (for video generation)
3. **ElevenLabs** (for voice/voice cloning)
4. **Suno** (for music generation)
5. **Whisper** (for voice transcription)

### New Backend Services:
1. `video-generator-service` (Remotion rendering)
2. `audio-generator-service` (ElevenLabs + Suno)
3. `research-sentry-service` (Multi-source research)
4. `voice-clone-service` (Voice cloning management)

---

## 🎯 Summary

**From TinyFish Cookbook:**
- Multi-source research pattern
- Parallel agent execution
- Voice interface
- Real-time streaming
- Source-specific extraction

**New for Shothik:**
- Video generation (Remotion)
- Voice generation (ElevenLabs)
- Music generation (Suno)
- Voice cloning
- Complete pipeline: Idea → Research → Slides → Video

**Next Steps:**
1. Implement multi-source research agent
2. Add Remotion video generation
3. Integrate ElevenLabs voiceover
4. Add Suno background music
