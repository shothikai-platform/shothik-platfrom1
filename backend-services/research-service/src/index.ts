/**
 * Research Service API
 * 
 * Fastify-based REST API for the research service.
 * Includes Swagger documentation and health checks.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { 
  CreateResearchRequest, 
  ResearchResponse
} from './types/index.js';
import { 
  createResearchJob, 
  getResearchJob, 
  cancelResearchJob,
  synthesizeResearch,
  getSynthesis,
  startResearchWorker,
  redis
} from './services/orchestrator.js';

// Initialize Fastify
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    } : undefined
  }
});

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE']
});

await app.register(swagger, {
  openapi: {
    info: {
      title: 'Shothik Research Service',
      description: 'Multi-source academic research API',
      version: '1.0.0'
    },
    servers: [{
      url: 'http://localhost:3001',
      description: 'Development server'
    }]
  }
});

await app.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'list'
  }
});

// ============================================================================
// Routes
// ============================================================================

/**
 * Health check
 */
app.get('/health', async () => {
  const redisHealth = await redis.ping().then(() => 'connected').catch(() => 'disconnected');
  
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisHealth
    }
  };
});

/**
 * Create research job
 */
app.post('/research', {
  schema: {
    description: 'Create a new research job',
    body: zodToJsonSchema(CreateResearchRequest),
    response: {
      201: zodToJsonSchema(ResearchResponse),
      400: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    const body = CreateResearchRequest.parse(request.body);
    const job = await createResearchJob(body.userId, body.query);

    reply.status(201);
    return {
      success: true,
      jobId: job.id,
      data: job
    };
  } catch (error) {
    reply.status(400);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request'
    };
  }
});

/**
 * Get research job status
 */
app.get('/research/:jobId', {
  schema: {
    description: 'Get research job status and results',
    params: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid' }
      }
    },
    response: {
      200: zodToJsonSchema(ResearchResponse),
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  const { jobId } = request.params as { jobId: string };
  const job = await getResearchJob(jobId);

  if (!job) {
    reply.status(404);
    return {
      success: false,
      error: 'Job not found'
    };
  }

  return {
    success: true,
    data: job
  };
});

/**
 * Cancel research job
 */
app.delete('/research/:jobId', {
  schema: {
    description: 'Cancel a running research job',
    params: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid' }
      }
    }
  }
}, async (request, reply) => {
  const { jobId } = request.params as { jobId: string };
  const cancelled = await cancelResearchJob(jobId);

  if (!cancelled) {
    reply.status(400);
    return {
      success: false,
      error: 'Job cannot be cancelled (not found or already completed)'
    };
  }

  return {
    success: true
  };
});

/**
 * Synthesize research results
 */
app.post('/research/:jobId/synthesize', {
  schema: {
    description: 'Generate AI synthesis of research results',
    params: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid' }
      }
    }
  }
}, async (request, reply) => {
  const { jobId } = request.params as { jobId: string };
  
  // Check if synthesis already exists
  const existing = await getSynthesis(jobId);
  if (existing) {
    return {
      success: true,
      data: existing
    };
  }

  try {
    // TODO: Pass actual LLM gateway instance
    const llmGateway = {
      complete: async ({ prompt }: { prompt: string }) => ({
        text: `{"summary": "Synthesis placeholder for: ${prompt.slice(0, 50)}..."}`
      })
    };

    const synthesis = await synthesizeResearch(jobId, llmGateway);

    return {
      success: true,
      data: synthesis
    };
  } catch (error) {
    reply.status(400);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Synthesis failed'
    };
  }
});

/**
 * Get synthesis result
 */
app.get('/research/:jobId/synthesis', {
  schema: {
    description: 'Get AI synthesis of research results'
  }
}, async (request, reply) => {
  const { jobId } = request.params as { jobId: string };
  const synthesis = await getSynthesis(jobId);

  if (!synthesis) {
    reply.status(404);
    return {
      success: false,
      error: 'Synthesis not found. Generate it first using POST /research/:jobId/synthesize'
    };
  }

  return {
    success: true,
    data: synthesis
  };
});

/**
 * Stream research progress (SSE)
 */
app.get('/research/:jobId/stream', {
  schema: {
    description: 'Stream research progress via Server-Sent Events'
  }
}, async (request, reply) => {
  const { jobId } = request.params as { jobId: string };

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Subscribe to Redis channel for progress updates
  const subscriber = redis.duplicate();
  await subscriber.subscribe(`research:progress:${jobId}`);

  subscriber.on('message', (_channel, message) => {
    reply.raw.write(`data: ${message}\n\n`);
  });

  // Send initial status
  const job = await getResearchJob(jobId);
  if (job) {
    reply.raw.write(`data: ${JSON.stringify({ type: 'status', job })}\n\n`);
  }

  // Keep connection alive
  const keepAlive = setInterval(() => {
    reply.raw.write(':heartbeat\n\n');
  }, 30000);

  // Clean up on close
  request.raw.on('close', () => {
    clearInterval(keepAlive);
    subscriber.unsubscribe();
    subscriber.quit();
  });
});

// ============================================================================
// Error Handling
// ============================================================================

app.setErrorHandler((error, _request, reply) => {
  app.log.error(error);
  
  reply.status(error.statusCode || 500).send({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  });
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

// Start worker
const worker = startResearchWorker();

// Start server
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Research service running on http://${HOST}:${PORT}`);
  app.log.info(`Documentation available at http://${HOST}:${PORT}/documentation`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, shutting down gracefully');
  await app.close();
  await worker.close();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  app.log.info('SIGINT received, shutting down gracefully');
  await app.close();
  await worker.close();
  await redis.quit();
  process.exit(0);
});
