import { Mutex, Semaphore } from "async-mutex";
import { EventEmitter } from "events";

// Job queue with priority and concurrency control
interface Job {
  id: string;
  type: "research" | "sheet" | "slide";
  priority: number; // 1-10, higher = more important
  data: any;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// Rate limiter using token bucket algorithm
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(maxTokens: number, refillRatePerSecond: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = refillRatePerSecond / 1000;
  }

  async acquire(tokens: number = 1): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    
    return false;
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Parallel job processor
export class ParallelJobProcessor extends EventEmitter {
  private queue: Job[] = [];
  private running: Map<string, Job> = new Map();
  private maxConcurrency: number;
  private mutex = new Mutex();
  private semaphore: Semaphore;
  private rateLimiter: TokenBucket;

  constructor(
    maxConcurrency: number = 4,
    rateLimitPerSecond: number = 10
  ) {
    super();
    this.maxConcurrency = maxConcurrency;
    this.semaphore = new Semaphore(maxConcurrency);
    this.rateLimiter = new TokenBucket(rateLimitPerSecond, rateLimitPerSecond);
  }

  // Add job to queue
  async submit<T>(
    type: "research" | "sheet" | "slide",
    data: any,
    priority: number = 5
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const job: Job = {
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        priority,
        data,
        resolve,
        reject,
        createdAt: Date.now(),
      };

      this.mutex.runExclusive(() => {
        // Insert by priority (higher first)
        const insertIndex = this.queue.findIndex(j => j.priority < priority);
        if (insertIndex === -1) {
          this.queue.push(job);
        } else {
          this.queue.splice(insertIndex, 0, job);
        }
        
        this.emit("job:queued", job);
        this.processQueue();
      });
    });
  }

  private async processQueue() {
    if (this.running.size >= this.maxConcurrency) return;
    if (this.queue.length === 0) return;

    const canProceed = await this.rateLimiter.acquire();
    if (!canProceed) {
      // Retry after rate limit resets
      setTimeout(() => this.processQueue(), 100);
      return;
    }

    const job = await this.mutex.runExclusive(() => this.queue.shift());
    if (!job) return;

    this.running.set(job.id, job);
    job.startedAt = Date.now();
    
    this.emit("job:started", job);

    // Process with semaphore for concurrency control
    this.semaphore.runExclusive(async () => {
      try {
        const result = await this.executeJob(job);
        job.completedAt = Date.now();
        job.resolve(result);
        this.emit("job:completed", job, result);
      } catch (error) {
        job.reject(error);
        this.emit("job:failed", job, error);
      } finally {
        this.running.delete(job.id);
        this.processQueue(); // Process next job
      }
    });
  }

  private async executeJob(job: Job): Promise<any> {
    switch (job.type) {
      case "research":
        return this.executeResearchJob(job.data);
      case "sheet":
        return this.executeSheetJob(job.data);
      case "slide":
        return this.executeSlideJob(job.data);
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  private async executeResearchJob(data: any): Promise<any> {
    // Parallel research from multiple sources
    const sources = data.sources || ["arxiv", "semantic_scholar", "google_scholar"];
    
    const results = await Promise.all(
      sources.map(async (source: string) => {
        // Simulate API call
        await this.delay(100 + Math.random() * 200);
        return { source, data: `Results from ${source}` };
      })
    );
    
    // Combine results
    return {
      query: data.query,
      results: results.flat(),
      sources: sources.length,
    };
  }

  private async executeSheetJob(data: any): Promise<any> {
    // Parallel cell generation
    const rows = data.rows || 10;
    const cols = data.cols || 5;
    
    const cells = await this.parallelChunkProcessing(
      Array.from({ length: rows * cols }, (_, i) => i),
      async (index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        await this.delay(10); // Simulate processing
        return { row, col, value: `Cell ${row},${col}` };
      },
      20 // Process 20 cells at a time
    );
    
    return {
      rows,
      cols,
      cells,
    };
  }

  private async executeSlideJob(data: any): Promise<any> {
    // Parallel slide generation
    const slides = data.slides || [];
    
    const generatedSlides = await Promise.all(
      slides.map(async (slide: any, index: number) => {
        // Simulate slide generation
        await this.delay(200 + Math.random() * 300);
        return {
          index,
          title: slide.title,
          content: `Generated content for ${slide.title}`,
          layout: slide.layout,
        };
      })
    );
    
    return {
      totalSlides: slides.length,
      slides: generatedSlides,
    };
  }

  // Process items in chunks with concurrency control
  private async parallelChunkProcessing<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    chunkSize: number
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(item => processor(item))
      );
      results.push(...chunkResults);
    }
    
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get queue statistics
  getStats() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      maxConcurrency: this.maxConcurrency,
      averageWaitTime: this.calculateAverageWaitTime(),
    };
  }

  private calculateAverageWaitTime(): number {
    const completedJobs = Array.from(this.running.values()).filter(
      j => j.completedAt
    );
    
    if (completedJobs.length === 0) return 0;
    
    const totalWait = completedJobs.reduce(
      (sum, j) => sum + ((j.startedAt || 0) - j.createdAt),
      0
    );
    
    return totalWait / completedJobs.length;
  }

  // Cancel job by ID
  async cancelJob(jobId: string): Promise<boolean> {
    return this.mutex.runExclusive(() => {
      const index = this.queue.findIndex(j => j.id === jobId);
      if (index > -1) {
        const job = this.queue.splice(index, 1)[0];
        job.reject(new Error("Job cancelled"));
        this.emit("job:cancelled", job);
        return true;
      }
      return false;
    });
  }

  // Clear all pending jobs
  async clearQueue(): Promise<void> {
    return this.mutex.runExclusive(() => {
      this.queue.forEach(job => {
        job.reject(new Error("Queue cleared"));
      });
      this.queue = [];
    });
  }
}

// Producer-Consumer pattern for batch processing
export class BatchProcessor<T, R> {
  private buffer: T[] = [];
  private readonly bufferSize: number;
  private readonly processor: (batch: T[]) => Promise<R[]>;
  private readonly flushInterval: number;
  private timeout?: NodeJS.Timeout;

  constructor(
    processor: (batch: T[]) => Promise<R[]>,
    bufferSize: number = 100,
    flushInterval: number = 1000
  ) {
    this.processor = processor;
    this.bufferSize = bufferSize;
    this.flushInterval = flushInterval;
  }

  async add(item: T): Promise<void> {
    this.buffer.push(item);
    
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush(): Promise<R[]> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    
    if (this.buffer.length === 0) return [];
    
    const batch = this.buffer.splice(0, this.buffer.length);
    return this.processor(batch);
  }

  async close(): Promise<void> {
    await this.flush();
  }
}

// Singleton instances
let researchProcessor: ParallelJobProcessor | null = null;
let sheetProcessor: ParallelJobProcessor | null = null;
let slideProcessor: ParallelJobProcessor | null = null;

export function getResearchProcessor(): ParallelJobProcessor {
  if (!researchProcessor) {
    researchProcessor = new ParallelJobProcessor(4, 5); // 4 concurrent, 5/sec rate limit
  }
  return researchProcessor;
}

export function getSheetProcessor(): ParallelJobProcessor {
  if (!sheetProcessor) {
    sheetProcessor = new ParallelJobProcessor(8, 20); // 8 concurrent, 20/sec
  }
  return sheetProcessor;
}

export function getSlideProcessor(): ParallelJobProcessor {
  if (!slideProcessor) {
    slideProcessor = new ParallelJobProcessor(2, 2); // 2 concurrent, 2/sec (GPU intensive)
  }
  return slideProcessor;
}
