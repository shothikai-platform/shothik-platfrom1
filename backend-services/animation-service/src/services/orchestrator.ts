/**
 * Video Orchestrator
 * 
 * Manages the video generation pipeline:
 * 1. Generate voiceover (ElevenLabs)
 * 2. Generate music (Suno) - optional
 * 3. Render video (Remotion)
 * 4. Upload to storage
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { 
  VideoJob, 
  VideoJobData, 
  VideoStatus,
  VideoTemplate 
} from '../types/index.js';
import { VoiceoverService } from './voiceover.js';
import { MusicService } from './music.js';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Job queue
const videoQueue = new Queue('video-jobs', { connection: redis });

// Services
const voiceoverService = new VoiceoverService();
const musicService = new MusicService();

/**
 * Create a new video generation job
 */
export async function createVideoJob(
  userId: string,
  request: Omit<VideoJobData, 'jobId' | 'userId'>
): Promise<VideoJob> {
  const jobId = crypto.randomUUID();
  
  const job: VideoJob = {
    id: jobId,
    userId,
    slideDeck: request.slideDeck,
    template: request.template,
    resolution: request.resolution,
    frameRate: request.frameRate,
    voice: request.voice,
    voiceClone: request.voiceClone,
    music: request.music,
    subtitles: request.subtitles,
    watermark: request.watermark,
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store job in Redis
  await redis.setex(
    `video:job:${jobId}`,
    86400, // 24 hour TTL
    JSON.stringify(job)
  );

  // Add to queue
  await videoQueue.add('render', {
    jobId,
    ...request
  } as VideoJobData);

  return job;
}

/**
 * Get video job status
 */
export async function getVideoJob(jobId: string): Promise<VideoJob | null> {
  const data = await redis.get(`video:job:${jobId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Execute video generation pipeline
 */
export async function executeVideoGeneration(jobData: VideoJobData): Promise<void> {
  const { jobId, slideDeck, voice, voiceClone, music, subtitles } = jobData;

  try {
    // Update status
    await updateJobStatus(jobId, 'generating_voice');
    await updateJobProgress(jobId, 10);

    // Step 1: Generate voiceover
    console.log(`[${jobId}] Generating voiceover...`);
    const voiceover = await voiceoverService.generateVoiceover(
      slideDeck.slides,
      voice,
      voiceClone
    );
    
    await updateJobVoiceover(jobId, voiceover.audioUrl);
    await updateJobProgress(jobId, 30);

    let musicUrl: string | undefined;
    
    // Step 2: Generate music (if enabled) - OPTIONAL: Continue without music if it fails
    if (music && music.provider !== 'none') {
      try {
        await updateJobStatus(jobId, 'generating_music');
        console.log(`[${jobId}] Generating background music...`);
        
        const musicResult = await musicService.generateMusic({
          ...music,
          duration: Math.ceil(voiceover.duration)
        });
        
        musicUrl = musicResult.audioUrl;
        await updateJobMusic(jobId, musicUrl);
        await updateJobProgress(jobId, 50);
        console.log(`[${jobId}] Background music generated: ${musicUrl}`);
      } catch (musicError) {
        // Log warning but continue without music
        console.warn(`[${jobId}] Music generation failed, continuing without music:`, musicError);
        musicUrl = undefined;
        // Still update progress since we're continuing
        await updateJobProgress(jobId, 50);
      }
    }

    // Step 3: Render video with Remotion
    await updateJobStatus(jobId, 'rendering');
    console.log(`[${jobId}] Rendering video...`);
    
    const videoUrl = await renderVideo({
      jobId,
      slideDeck,
      voiceoverUrl: voiceover.audioUrl,
      voiceoverDuration: voiceover.duration,
      voiceoverSegments: voiceover.segments,
      musicUrl,
      subtitles,
      template: jobData.template,
      resolution: jobData.resolution,
      frameRate: jobData.frameRate
    });

    await updateJobProgress(jobId, 90);

    // Step 4: Finalize
    await finalizeJob(jobId, videoUrl);
    console.log(`[${jobId}] Video generation completed: ${videoUrl}`);

  } catch (error) {
    console.error(`[${jobId}] Video generation failed:`, error);
    await failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Render video using Remotion
 */
async function renderVideo(params: {
  jobId: string;
  slideDeck: any;
  voiceoverUrl: string;
  voiceoverDuration: number;
  voiceoverSegments: Array<{ slideId: string; startTime: number; endTime: number }>;
  musicUrl?: string;
  subtitles: boolean;
  template: VideoTemplate;
  resolution: string;
  frameRate: string;
}): Promise<string> {
  // TODO: Implement actual Remotion rendering
  // For now, return a placeholder
  
  console.log('Rendering video with params:', {
    jobId: params.jobId,
    slides: params.slideDeck.slides.length,
    voiceoverDuration: params.voiceoverDuration,
    hasMusic: !!params.musicUrl,
    template: params.template
  });

  // Simulate rendering time
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Placeholder URL
  const timestamp = Date.now();
  return `https://cdn.shothik.ai/videos/${params.jobId}_${timestamp}.mp4`;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function updateJobStatus(jobId: string, status: VideoStatus): Promise<void> {
  const data = await redis.get(`video:job:${jobId}`);
  if (!data) return;

  const job: VideoJob = JSON.parse(data);
  job.status = status;
  job.updatedAt = new Date().toISOString();

  if (status === 'rendering' && !job.startedAt) {
    job.startedAt = new Date().toISOString();
  }

  await redis.setex(`video:job:${jobId}`, 86400, JSON.stringify(job));
  
  // Publish update
  await redis.publish(`video:progress:${jobId}`, JSON.stringify({ status, progress: job.progress }));
}

async function updateJobProgress(jobId: string, progress: number): Promise<void> {
  const data = await redis.get(`video:job:${jobId}`);
  if (!data) return;

  const job: VideoJob = JSON.parse(data);
  job.progress = progress;
  job.updatedAt = new Date().toISOString();

  await redis.setex(`video:job:${jobId}`, 86400, JSON.stringify(job));
  
  await redis.publish(`video:progress:${jobId}`, JSON.stringify({ status: job.status, progress }));
}

async function updateJobVoiceover(jobId: string, voiceoverUrl: string): Promise<void> {
  const data = await redis.get(`video:job:${jobId}`);
  if (!data) return;

  const job: VideoJob = JSON.parse(data);
  job.voiceoverUrl = voiceoverUrl;
  job.updatedAt = new Date().toISOString();

  await redis.setex(`video:job:${jobId}`, 86400, JSON.stringify(job));
}

async function updateJobMusic(jobId: string, musicUrl: string): Promise<void> {
  const data = await redis.get(`video:job:${jobId}`);
  if (!data) return;

  const job: VideoJob = JSON.parse(data);
  job.musicUrl = musicUrl;
  job.updatedAt = new Date().toISOString();

  await redis.setex(`video:job:${jobId}`, 86400, JSON.stringify(job));
}

async function finalizeJob(jobId: string, outputUrl: string): Promise<void> {
  const data = await redis.get(`video:job:${jobId}`);
  if (!data) return;

  const job: VideoJob = JSON.parse(data);
  job.status = 'completed';
  job.progress = 100;
  job.outputUrl = outputUrl;
  job.completedAt = new Date().toISOString();
  job.updatedAt = new Date().toISOString();

  await redis.setex(`video:job:${jobId}`, 86400, JSON.stringify(job));
  
  await redis.publish(`video:progress:${jobId}`, JSON.stringify({ 
    status: 'completed', 
    progress: 100,
    outputUrl 
  }));
}

async function failJob(jobId: string, error: string): Promise<void> {
  const data = await redis.get(`video:job:${jobId}`);
  if (!data) return;

  const job: VideoJob = JSON.parse(data);
  job.status = 'failed';
  job.error = error;
  job.completedAt = new Date().toISOString();
  job.updatedAt = new Date().toISOString();

  await redis.setex(`video:job:${jobId}`, 86400, JSON.stringify(job));
  
  await redis.publish(`video:progress:${jobId}`, JSON.stringify({ 
    status: 'failed', 
    error 
  }));
}

// ============================================================================
// Worker Setup
// ============================================================================

export function startVideoWorker(): Worker {
  const worker = new Worker('video-jobs', async (job: Job) => {
    const jobData = job.data as VideoJobData;
    await executeVideoGeneration(jobData);
  }, {
    connection: redis,
    concurrency: 2, // Limit concurrent video renders
    limiter: {
      max: 5,
      duration: 60000 // 5 videos per minute max
    }
  });

  worker.on('completed', (job) => {
    console.log(`Video job ${job.data.jobId} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Video job ${job?.data?.jobId} failed:`, err);
  });

  return worker;
}

export { videoQueue, redis };
