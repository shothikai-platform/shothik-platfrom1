/**
 * Sheet Orchestrator
 * 
 * Manages sheet generation jobs with BullMQ
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import {
  SheetJob,
  SheetJobData,
  SheetStatus,
  CreateSheetRequest
} from '../types/index.js';
import { spreadsheetGenerator } from './spreadsheetGenerator.js';
import { exportService } from './exportService.js';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Job queue
const sheetQueue = new Queue('sheet-jobs', { connection: redis });

/**
 * Create a new sheet generation job
 */
export async function createSheetJob(
  userId: string,
  request: CreateSheetRequest
): Promise<SheetJob> {
  const jobId = crypto.randomUUID();

  const job: SheetJob = {
    id: jobId,
    userId,
    prompt: request.prompt,
    title: request.title || 'Untitled Spreadsheet',
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store job in Redis
  await redis.setex(
    `sheet:job:${jobId}`,
    86400, // 24 hour TTL
    JSON.stringify(job)
  );

  // Add to queue
  await sheetQueue.add('generate', {
    jobId,
    userId,
    prompt: request.prompt,
    title: job.title,
    rows: request.rows,
    columns: request.columns,
    includeCharts: request.includeCharts,
    includeFormulas: request.includeFormulas,
    dataTypes: request.dataTypes
  } as SheetJobData);

  return job;
}

/**
 * Get sheet job status
 */
export async function getSheetJob(jobId: string): Promise<SheetJob | null> {
  const data = await redis.get(`sheet:job:${jobId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Execute sheet generation
 */
export async function executeSheetGeneration(jobData: SheetJobData): Promise<void> {
  const { jobId, prompt, title, rows, columns, includeCharts, includeFormulas, dataTypes } = jobData;

  try {
    // Update status
    await updateJobStatus(jobId, 'generating_data');
    await updateJobProgress(jobId, 10);

    // Step 1: Generate spreadsheet data
    console.log(`[${jobId}] Generating spreadsheet data...`);
    const sheetData = await spreadsheetGenerator.generate({
      userId: jobData.userId,
      prompt,
      title,
      rows,
      columns,
      includeCharts,
      includeFormulas,
      dataTypes: dataTypes as Array<'text' | 'numbers' | 'dates' | 'currency' | 'percentages'>
    });

    await updateJobProgress(jobId, 50);

    // Step 2: Generate export files
    await updateJobStatus(jobId, 'completed');
    console.log(`[${jobId}] Generating exports...`);

    const exportUrls: Record<string, string> = {};

    // Store JSON version
    const jsonKey = `exports/${jobId}.json`;
    await redis.setex(`sheet:export:${jsonKey}`, 86400, JSON.stringify(sheetData));
    exportUrls.json = `/api/v1/sheets/${jobId}/export/json`;

    // Generate Excel
    try {
      const excelBuffer = await exportService.export(sheetData, 'xlsx');
      const excelKey = `exports/${jobId}.xlsx`;
      await redis.setex(`sheet:export:${excelKey}`, 86400, excelBuffer.buffer.toString('base64'));
      exportUrls.xlsx = `/api/v1/sheets/${jobId}/export/xlsx`;
    } catch (error) {
      console.warn(`[${jobId}] Excel export failed:`, error);
    }

    // Generate CSV
    try {
      const csvBuffer = await exportService.export(sheetData, 'csv');
      const csvKey = `exports/${jobId}.csv`;
      await redis.setex(`sheet:export:${csvKey}`, 86400, csvBuffer.buffer.toString('base64'));
      exportUrls.csv = `/api/v1/sheets/${jobId}/export/csv`;
    } catch (error) {
      console.warn(`[${jobId}] CSV export failed:`, error);
    }

    await updateJobProgress(jobId, 100);

    // Finalize job
    await finalizeJob(jobId, sheetData, exportUrls);
    console.log(`[${jobId}] Sheet generation completed`);

  } catch (error) {
    console.error(`[${jobId}] Sheet generation failed:`, error);
    await failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

async function updateJobStatus(jobId: string, status: SheetStatus): Promise<void> {
  const data = await redis.get(`sheet:job:${jobId}`);
  if (!data) return;

  const job: SheetJob = JSON.parse(data);
  job.status = status;
  job.updatedAt = new Date().toISOString();

  await redis.setex(`sheet:job:${jobId}`, 86400, JSON.stringify(job));
  await redis.publish(`sheet:progress:${jobId}`, JSON.stringify({ status, progress: job.progress }));
}

async function updateJobProgress(jobId: string, progress: number): Promise<void> {
  const data = await redis.get(`sheet:job:${jobId}`);
  if (!data) return;

  const job: SheetJob = JSON.parse(data);
  job.progress = progress;
  job.updatedAt = new Date().toISOString();

  await redis.setex(`sheet:job:${jobId}`, 86400, JSON.stringify(job));
  await redis.publish(`sheet:progress:${jobId}`, JSON.stringify({ status: job.status, progress }));
}

async function finalizeJob(
  jobId: string,
  data: any,
  exportUrls: Record<string, string>
): Promise<void> {
  const jobData = await redis.get(`sheet:job:${jobId}`);
  if (!jobData) return;

  const job: SheetJob = JSON.parse(jobData);
  job.status = 'completed';
  job.progress = 100;
  job.data = data;
  job.exportUrls = exportUrls;
  job.completedAt = new Date().toISOString();
  job.updatedAt = new Date().toISOString();

  await redis.setex(`sheet:job:${jobId}`, 86400, JSON.stringify(job));
  await redis.publish(`sheet:progress:${jobId}`, JSON.stringify({
    status: 'completed',
    progress: 100,
    data: job.data
  }));
}

async function failJob(jobId: string, error: string): Promise<void> {
  const data = await redis.get(`sheet:job:${jobId}`);
  if (!data) return;

  const job: SheetJob = JSON.parse(data);
  job.status = 'failed';
  job.error = error;
  job.completedAt = new Date().toISOString();
  job.updatedAt = new Date().toISOString();

  await redis.setex(`sheet:job:${jobId}`, 86400, JSON.stringify(job));
  await redis.publish(`sheet:progress:${jobId}`, JSON.stringify({ status: 'failed', error }));
}

// ============================================================================
// Worker Setup
// ============================================================================

export function startSheetWorker(): Worker {
  const worker = new Worker('sheet-jobs', async (job: Job) => {
    const jobData = job.data as SheetJobData;
    await executeSheetGeneration(jobData);
  }, {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000
    }
  });

  worker.on('completed', (job) => {
    console.log(`Sheet job ${job.data.jobId} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Sheet job ${job?.data?.jobId} failed:`, err);
  });

  return worker;
}

export { sheetQueue, redis };
