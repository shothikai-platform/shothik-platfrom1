/**
 * Main Slide Generation Service
 * Orchestrates the entire generation process
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import {
  SlideJobData,
  SlideJob,
  SlideDeck,
  SlideStatus,
  CreateSlideRequest
} from '../types/index.js';
import ParallelGenerationService from './parallel.js';

export class SlideGenerationService {
  private queue: Queue;
  private worker: Worker;
  private redis: Redis;
  private parallelService: ParallelGenerationService;
  private activeJobs: Map<string, { status: SlideStatus; progress: number }>;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null
    });
    
    this.queue = new Queue('slide-generation', {
      connection: this.redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });

    this.parallelService = new ParallelGenerationService();
    this.activeJobs = new Map();

    this.setupWorker();
  }

  private setupWorker(): void {
    // Create worker to process jobs
    this.worker = new Worker('slide-generation', async (job: Job) => {
      const jobData = job.data as SlideJobData;
      
      try {
        await this.processJob(jobData, (progress) => {
          job.updateProgress(progress.progress);
          this.activeJobs.set(jobData.jobId, {
            status: progress.step as SlideStatus,
            progress: progress.progress
          });
        });
        return { success: true };
      } catch (error) {
        console.error(`Job ${jobData.jobId} failed:`, error);
        throw error;
      }
    }, {
      connection: this.redis,
      concurrency: 3
    });

    // Handle worker events
    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });
  }

  private async processJob(
    jobData: SlideJobData,
    onProgress: (progress: { step: string; progress: number }) => void
  ): Promise<void> {
    // Update status to generating
    await this.updateJobStatus(jobData.jobId, 'generating_content', 0);

    // Generate presentation using parallel service
    const deck = await this.parallelService.generatePresentation(
      jobData,
      (progress) => {
        onProgress({ step: progress.step, progress: progress.progress });
        this.updateJobStatus(
          jobData.jobId,
          progress.step as SlideStatus,
          progress.progress
        );
      }
    );

    // Save result to Redis
    await this.saveJobResult(jobData.jobId, deck);
    await this.updateJobStatus(jobData.jobId, 'completed', 100);
  }

  // Create new slide generation job
  async createJob(request: CreateSlideRequest): Promise<SlideJob> {
    const jobId = crypto.randomUUID();
    
    const jobData: SlideJobData = {
      jobId,
      userId: request.userId,
      spaceId: request.spaceId,
      prompt: request.prompt,
      title: request.title || request.prompt.slice(0, 50),
      slideCount: request.slideCount,
      theme: request.theme,
      includeImages: request.includeImages,
      includeCharts: request.includeCharts,
      targetAudience: request.targetAudience,
      language: request.language,
      memoryPreferences: request.memoryPreferences
    };

    const now = new Date().toISOString();
    
    const job: SlideJob = {
      id: jobId,
      userId: request.userId,
      spaceId: request.spaceId,
      prompt: request.prompt,
      title: jobData.title,
      status: 'pending',
      progress: 0,
      currentStep: 'pending',
      checkpoints: [
        { step: 'outline', status: 'pending', progress: 0 },
        { step: 'design', status: 'pending', progress: 0 },
        { step: 'content', status: 'pending', progress: 0 },
        { step: 'formatting', status: 'pending', progress: 0 },
        { step: 'review', status: 'pending', progress: 0 }
      ],
      createdAt: now,
      updatedAt: now
    };

    // Save job to Redis
    await this.redis.setex(
      `slide-job:${jobId}`,
      3600, // 1 hour TTL
      JSON.stringify(job)
    );

    // Save job data for resume
    await this.redis.setex(
      `slide-job-data:${jobId}`,
      3600,
      JSON.stringify(jobData)
    );

    // Add to queue
    await this.queue.add('generate-slides', jobData, {
      jobId,
      removeOnComplete: 100,
      removeOnFail: 50
    });

    // Update status to researching
    await this.updateJobStatus(jobId, 'researching', 5);

    return job;
  }

  // Get job status
  async getJob(jobId: string): Promise<SlideJob | null> {
    // Check Redis first
    const data = await this.redis.get(`slide-job:${jobId}`);
    if (data) {
      return JSON.parse(data);
    }

    // Check active jobs
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      return {
        id: jobId,
        userId: '',
        prompt: '',
        title: '',
        status: activeJob.status,
        progress: activeJob.progress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as SlideJob;
    }

    return null;
  }

  // Get job result (completed deck)
  async getJobResult(jobId: string): Promise<SlideDeck | null> {
    const data = await this.redis.get(`slide-result:${jobId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  // Pause job
  async pauseJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    this.parallelService.pauseGeneration(jobId);
    await this.updateJobStatus(jobId, 'paused', job.progress);
    
    return true;
  }

  // Resume job
  async resumeJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job || job.status !== 'paused') {
      return false;
    }

    // Re-queue the job
    const jobData = await this.redis.get(`slide-job-data:${jobId}`);
    if (jobData) {
      await this.queue.add('generate-slides', JSON.parse(jobData), {
        jobId,
        removeOnComplete: 100,
        removeOnFail: 50
      });
      
      await this.updateJobStatus(jobId, 'generating_content', job.progress);
      return true;
    }

    return false;
  }

  // Update job status
  private async updateJobStatus(
    jobId: string,
    status: SlideStatus,
    progress: number
  ): Promise<void> {
    const data = await this.redis.get(`slide-job:${jobId}`);
    if (data) {
      const job: SlideJob = JSON.parse(data);
      job.status = status;
      job.progress = progress;
      job.currentStep = status;
      job.updatedAt = new Date().toISOString();

      // Update checkpoint
      if (job.checkpoints) {
        const checkpoint = job.checkpoints.find(c => c.step === status);
        if (checkpoint) {
          checkpoint.status = progress >= 100 ? 'completed' : 'in_progress';
          checkpoint.progress = progress;
          checkpoint.timestamp = new Date().toISOString();
        }
      }

      if (status === 'completed') {
        job.completedAt = new Date().toISOString();
      }

      await this.redis.setex(
        `slide-job:${jobId}`,
        3600,
        JSON.stringify(job)
      );
    }

    this.activeJobs.set(jobId, { status, progress });
  }

  // Save job result
  private async saveJobResult(jobId: string, deck: SlideDeck): Promise<void> {
    await this.redis.setex(
      `slide-result:${jobId}`,
      86400, // 24 hours TTL
      JSON.stringify(deck)
    );
  }

  // Get all jobs for a user
  async getUserJobs(userId: string): Promise<SlideJob[]> {
    const keys = await this.redis.keys(`slide-job:*`);
    const jobs: SlideJob[] = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        const job: SlideJob = JSON.parse(data);
        if (job.userId === userId) {
          jobs.push(job);
        }
      }
    }

    return jobs.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Cleanup old jobs
  async cleanup(): Promise<void> {
    // Clean completed jobs from queue
    await this.queue.clean(0, 0, 'completed');
    await this.queue.clean(0, 0, 'failed');
  }

  // Close connections
  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

export default SlideGenerationService;
