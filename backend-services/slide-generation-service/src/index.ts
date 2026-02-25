/**
 * Slide Generation Service - Main Server
 * Fastify API with SSE support
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { SlideGenerationService } from './services/generator.js';
import { CreateSlideRequest, SlideResponse } from './types/index.js';

const PORT = process.env.PORT || 3004;

const fastify = Fastify({
  logger: true
});

// Register CORS
await fastify.register(cors, {
  origin: true,
  credentials: true
});

// Initialize service
const slideService = new SlideGenerationService();

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Create slide generation job
fastify.post<{ Body: CreateSlideRequest }>('/slides', async (request, reply): Promise<SlideResponse> => {
  try {
    const job = await slideService.createJob(request.body);
    
    return {
      success: true,
      jobId: job.id,
      data: job
    };
  } catch (error) {
    fastify.log.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create job'
    };
  }
});

// Get job status
fastify.get<{ Params: { jobId: string } }>('/slides/:jobId', async (request, reply): Promise<SlideResponse> => {
  try {
    const job = await slideService.getJob(request.params.jobId);
    
    if (!job) {
      reply.status(404);
      return {
        success: false,
        error: 'Job not found'
      };
    }

    // If completed, include result
    if (job.status === 'completed') {
      const result = await slideService.getJobResult(request.params.jobId);
      if (result) {
        job.slideDeck = result;
      }
    }
    
    return {
      success: true,
      data: job
    };
  } catch (error) {
    fastify.log.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job'
    };
  }
});

// SSE stream for job progress
fastify.get<{ Params: { jobId: string } }>('/slides/:jobId/stream', async (request, reply) => {
  const { jobId } = request.params;
  
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendProgress = async () => {
    try {
      const job = await slideService.getJob(jobId);
      
      if (!job) {
        reply.raw.write(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
        reply.raw.end();
        return;
      }

      reply.raw.write(`data: ${JSON.stringify({
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        checkpoints: job.checkpoints
      })}\n\n`);

      if (job.status === 'completed' || job.status === 'failed') {
        // Send final result
        if (job.status === 'completed') {
          const result = await slideService.getJobResult(jobId);
          reply.raw.write(`data: ${JSON.stringify({
            status: 'completed',
            progress: 100,
            slideDeck: result
          })}\n\n`);
        }
        
        reply.raw.end();
        return;
      }

      // Continue polling
      setTimeout(sendProgress, 1000);
    } catch (error) {
      reply.raw.write(`data: ${JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Stream error' 
      })}\n\n`);
      reply.raw.end();
    }
  };

  sendProgress();
});

// Pause job
fastify.post<{ Params: { jobId: string } }>('/slides/:jobId/pause', async (request, reply): Promise<SlideResponse> => {
  try {
    const success = await slideService.pauseJob(request.params.jobId);
    
    if (!success) {
      reply.status(400);
      return {
        success: false,
        error: 'Cannot pause job'
      };
    }

    return {
      success: true,
      message: 'Job paused'
    };
  } catch (error) {
    fastify.log.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause job'
    };
  }
});

// Resume job
fastify.post<{ Params: { jobId: string } }>('/slides/:jobId/resume', async (request, reply): Promise<SlideResponse> => {
  try {
    const success = await slideService.resumeJob(request.params.jobId);
    
    if (!success) {
      reply.status(400);
      return {
        success: false,
        error: 'Cannot resume job'
      };
    }

    return {
      success: true,
      message: 'Job resumed'
    };
  } catch (error) {
    fastify.log.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume job'
    };
  }
});

// Get user's jobs
fastify.get<{ Querystring: { userId: string } }>('/slides', async (request, reply): Promise<SlideResponse> => {
  try {
    const { userId } = request.query;
    
    if (!userId) {
      reply.status(400);
      return {
        success: false,
        error: 'userId is required'
      };
    }

    const jobs = await slideService.getUserJobs(userId);
    
    return {
      success: true,
      data: jobs
    };
  } catch (error) {
    fastify.log.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get jobs'
    };
  }
});

// Start server
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 Slide Generation Service running on port ${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
