/**
 * Research Orchestrator
 * 
 * Manages parallel research across multiple sources.
 * Uses BullMQ for job queuing and Redis for state management.
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { 
  ResearchJob, 
  ResearchJobData, 
  ResearchJobProgress,
  ResearchQuery,
  ResearchPaper,
  ResearchSource,
  SynthesisResult 
} from '../types/index.js';
import { ArxivScraper } from '../scrapers/arxiv.js';
import { SemanticScholarScraper } from '../scrapers/semantic-scholar.js';

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null
});

// Job queue
const researchQueue = new Queue('research-jobs', { connection: redis });

// Scraper registry
const scrapers = {
  arxiv: new ArxivScraper(),
  semantic_scholar: new SemanticScholarScraper(),
  // Add more scrapers here
};

/**
 * Create a new research job
 */
export async function createResearchJob(
  userId: string, 
  query: ResearchQuery
): Promise<ResearchJob> {
  const jobId = crypto.randomUUID();
  
  const job: ResearchJob = {
    id: jobId,
    userId,
    query,
    status: 'pending',
    progress: 0,
    results: [],
    errors: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Store job in Redis
  await redis.setex(
    `research:job:${jobId}`,
    86400, // 24 hour TTL
    JSON.stringify(job)
  );

  // Add to queue
  await researchQueue.add('research', {
    jobId,
    userId,
    query,
    sources: query.sources
  } as ResearchJobData);

  return job;
}

/**
 * Get job status and results
 */
export async function getResearchJob(jobId: string): Promise<ResearchJob | null> {
  const data = await redis.get(`research:job:${jobId}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Cancel a running research job
 */
export async function cancelResearchJob(jobId: string): Promise<boolean> {
  const job = await getResearchJob(jobId);
  if (!job || job.status === 'completed' || job.status === 'failed') {
    return false;
  }

  // Update status
  job.status = 'cancelled';
  job.updatedAt = new Date().toISOString();
  
  await redis.setex(
    `research:job:${jobId}`,
    86400,
    JSON.stringify(job)
  );

  // Remove from queue if pending
  const queuedJobs = await researchQueue.getJobs(['waiting', 'paused']);
  const targetJob = queuedJobs.find(j => j.data.jobId === jobId);
  if (targetJob) {
    await targetJob.remove();
  }

  return true;
}

/**
 * Execute research across multiple sources in parallel
 */
export async function executeResearch(jobData: ResearchJobData): Promise<void> {
  const { jobId, query, sources } = jobData;

  // Update job status
  await updateJobStatus(jobId, 'in_progress');

  const allResults: ResearchPaper[] = [];
  const allErrors: Array<{ source: ResearchSource; message: string; timestamp: string }> = [];

  // Execute scrapers in parallel with concurrency limit
  const concurrencyLimit = 3;
  const chunks = chunkArray(sources, concurrencyLimit);

  for (const chunk of chunks) {
    const promises = chunk.map(async (source) => {
      try {
        await updateJobProgress(jobId, source, 'started', 0);

        const scraper = scrapers[source as keyof typeof scrapers];
        if (!scraper) {
          throw new Error(`No scraper available for source: ${source}`);
        }

        const result = await scraper.search(query);
        
        allResults.push(...result.papers);
        allErrors.push(...result.errors.map(e => ({
          source,
          message: e,
          timestamp: new Date().toISOString()
        })));

        await updateJobProgress(jobId, source, 'completed', result.papers.length);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        allErrors.push({
          source,
          message,
          timestamp: new Date().toISOString()
        });
        await updateJobProgress(jobId, source, 'failed', 0, message);
      }
    });

    await Promise.all(promises);
  }

  // Deduplicate results by title similarity
  const deduplicatedResults = deduplicatePapers(allResults);

  // Sort by relevance (citation count + recency)
  const sortedResults = sortByRelevance(deduplicatedResults);

  // Update final job status
  await finalizeJob(jobId, sortedResults, allErrors);
}

/**
 * Synthesize research results using AI
 */
export async function synthesizeResearch(
  jobId: string,
  llmGateway: any // Replace with actual LLM gateway type
): Promise<SynthesisResult> {
  const job = await getResearchJob(jobId);
  if (!job || job.status !== 'completed') {
    throw new Error('Job not found or not completed');
  }

  const papers = job.results;
  
  // Prepare context for LLM
  const context = papers.slice(0, 20).map(p => ({
    title: p.title,
    abstract: p.abstract?.slice(0, 500),
    authors: p.authors,
    year: p.year,
    citationCount: p.citationCount
  }));

  // Generate synthesis
  const prompt = `Synthesize the following research papers on "${job.query.query}".

Papers:
${JSON.stringify(context, null, 2)}

Provide:
1. A comprehensive summary (300-500 words)
2. 5-7 key findings with confidence scores
3. Research gaps identified
4. Related topics for further exploration

Format as JSON with fields: summary, keyFindings (array of {finding, supportingPapers, confidence}), researchGaps (array), relatedTopics (array)`;

  const synthesis = await llmGateway.complete({
    prompt,
    temperature: 0.3,
    maxTokens: 2000
  });

  // Parse synthesis (with fallback)
  let parsedSynthesis: any;
  try {
    parsedSynthesis = JSON.parse(synthesis.text);
  } catch {
    // Fallback: create structured response from raw text
    parsedSynthesis = {
      summary: synthesis.text.slice(0, 1000),
      keyFindings: [],
      researchGaps: [],
      relatedTopics: []
    };
  }

  const result: SynthesisResult = {
    jobId,
    summary: parsedSynthesis.summary,
    keyFindings: parsedSynthesis.keyFindings || [],
    researchGaps: parsedSynthesis.researchGaps || [],
    citations: papers.map(p => ({
      paperId: p.id,
      citation: formatCitation(p)
    })),
    relatedTopics: parsedSynthesis.relatedTopics || [],
    synthesizedAt: new Date().toISOString()
  };

  // Store synthesis
  await redis.setex(
    `research:synthesis:${jobId}`,
    86400,
    JSON.stringify(result)
  );

  return result;
}

/**
 * Get synthesis result
 */
export async function getSynthesis(jobId: string): Promise<SynthesisResult | null> {
  const data = await redis.get(`research:synthesis:${jobId}`);
  return data ? JSON.parse(data) : null;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function updateJobStatus(jobId: string, status: ResearchJob['status']): Promise<void> {
  const data = await redis.get(`research:job:${jobId}`);
  if (!data) return;

  const job: ResearchJob = JSON.parse(data);
  job.status = status;
  job.updatedAt = new Date().toISOString();

  if (status === 'in_progress' && !job.startedAt) {
    job.startedAt = new Date().toISOString();
  }

  if (status === 'completed' || status === 'failed') {
    job.completedAt = new Date().toISOString();
  }

  await redis.setex(`research:job:${jobId}`, 86400, JSON.stringify(job));
}

async function updateJobProgress(
  jobId: string,
  source: ResearchSource,
  status: 'started' | 'completed' | 'failed',
  papersFound: number,
  error?: string
): Promise<void> {
  const progress: ResearchJobProgress = {
    jobId,
    source,
    status,
    papersFound,
    error
  };

  // Publish progress update
  await redis.publish(`research:progress:${jobId}`, JSON.stringify(progress));
}

async function finalizeJob(
  jobId: string,
  results: ResearchPaper[],
  errors: Array<{ source: ResearchSource; message: string; timestamp: string }>
): Promise<void> {
  const data = await redis.get(`research:job:${jobId}`);
  if (!data) return;

  const job: ResearchJob = JSON.parse(data);
  job.results = results;
  job.errors = errors;
  job.progress = 100;
  job.status = errors.length > 0 && results.length === 0 ? 'failed' : 'completed';
  job.completedAt = new Date().toISOString();
  job.updatedAt = new Date().toISOString();

  await redis.setex(`research:job:${jobId}`, 86400, JSON.stringify(job));
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

function deduplicatePapers(papers: ResearchPaper[]): ResearchPaper[] {
  const seen = new Set<string>();
  const deduplicated: ResearchPaper[] = [];

  for (const paper of papers) {
    // Create a normalized key from title (lowercase, remove punctuation)
    const key = paper.title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(paper);
    }
  }

  return deduplicated;
}

function sortByRelevance(papers: ResearchPaper[]): ResearchPaper[] {
  return papers.sort((a, b) => {
    // Score based on citation count and recency
    const scoreA = (a.citationCount || 0) + (a.year ? (a.year - 2000) * 10 : 0);
    const scoreB = (b.citationCount || 0) + (b.year ? (b.year - 2000) * 10 : 0);
    return scoreB - scoreA;
  });
}

function formatCitation(paper: ResearchPaper): string {
  const authors = paper.authors.slice(0, 3).join(', ');
  const etAl = paper.authors.length > 3 ? ' et al.' : '';
  const year = paper.year || 'n.d.';
  
  return `${authors}${etAl} (${year}). ${paper.title}. ${paper.doi || paper.url}`;
}

// ============================================================================
// Worker Setup
// ============================================================================

export function startResearchWorker(): Worker {
  const worker = new Worker('research-jobs', async (job: Job) => {
    const jobData = job.data as ResearchJobData;
    await executeResearch(jobData);
  }, {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000
    }
  });

  worker.on('completed', (job) => {
    console.log(`Research job ${job.data.jobId} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Research job ${job?.data?.jobId} failed:`, err);
  });

  return worker;
}

export { researchQueue, redis };
