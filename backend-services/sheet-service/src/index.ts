/**
 * Sheet Service API
 * 
 * Fastify-based REST API for spreadsheet generation
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  CreateSheetRequest,
  SheetResponse,
  ExportFormat
} from './types/index.js';
import {
  createSheetJob,
  getSheetJob,
  startSheetWorker,
  redis
} from './services/orchestrator.js';
import { exportService } from './services/exportService.js';

// Initialize Fastify
const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: { colorize: true }
    } : undefined
  }
});

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST']
});

await app.register(swagger, {
  openapi: {
    info: {
      title: 'Shothik Sheet Service',
      description: 'AI-powered spreadsheet generation API',
      version: '1.0.0'
    },
    servers: [{
      url: 'http://localhost:3003',
      description: 'Development server'
    }]
  }
});

await app.register(swaggerUi, {
  routePrefix: '/documentation',
  uiConfig: { docExpansion: 'list' }
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
    services: { redis: redisHealth }
  };
});

/**
 * Create sheet generation job
 */
app.post('/sheets', {
  schema: {
    description: 'Create a new spreadsheet generation job',
    body: zodToJsonSchema(CreateSheetRequest),
    response: {
      201: zodToJsonSchema(SheetResponse),
      400: { type: 'object', properties: { error: { type: 'string' } } }
    }
  }
}, async (request, reply) => {
  try {
    const body = CreateSheetRequest.parse(request.body);
    const job = await createSheetJob(body.userId, body);

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
 * Get sheet job status
 */
app.get('/sheets/:jobId', {
  schema: {
    description: 'Get sheet generation job status',
    params: {
      type: 'object',
      properties: { jobId: { type: 'string', format: 'uuid' } }
    }
  }
}, async (request, reply) => {
  const { jobId } = request.params as { jobId: string };
  const job = await getSheetJob(jobId);

  if (!job) {
    reply.status(404);
    return { success: false, error: 'Job not found' };
  }

  return { success: true, data: job };
});

/**
 * Export sheet to format
 */
app.get('/sheets/:jobId/export/:format', {
  schema: {
    description: 'Export sheet to Excel, CSV, or JSON',
    params: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid' },
        format: { type: 'string', enum: ['json', 'xlsx', 'csv'] }
      }
    }
  }
}, async (request, reply) => {
  const { jobId, format } = request.params as { jobId: string; format: string };

  // Validate format
  const exportFormat = ExportFormat.safeParse(format);
  if (!exportFormat.success) {
    reply.status(400);
    return { success: false, error: 'Invalid format. Use: json, xlsx, csv' };
  }

  // Get job data
  const job = await getSheetJob(jobId);
  if (!job) {
    reply.status(404);
    return { success: false, error: 'Job not found' };
  }

  if (job.status !== 'completed' || !job.data) {
    reply.status(400);
    return { success: false, error: 'Job not completed yet' };
  }

  try {
    // Check Redis for cached export
    const cacheKey = `sheet:export:exports/${jobId}.${format}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      const buffer = Buffer.from(cached, 'base64');
      const { contentType, extension } = await exportService.export(job.data, exportFormat.data);

      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', `attachment; filename="${job.title}.${extension}"`);
      return buffer;
    }

    // Generate export
    const { buffer, contentType, extension } = await exportService.export(job.data, exportFormat.data);

    // Cache it
    await redis.setex(cacheKey, 86400, buffer.toString('base64'));

    reply.header('Content-Type', contentType);
    reply.header('Content-Disposition', `attachment; filename="${job.title}.${extension}"`);
    return buffer;

  } catch (error) {
    reply.status(500);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed'
    };
  }
});

/**
 * Stream sheet progress (SSE)
 */
app.get('/sheets/:jobId/stream', {
  schema: { description: 'Stream sheet generation progress via SSE' }
}, async (request, reply) => {
  const { jobId } = request.params as { jobId: string };

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Subscribe to Redis channel
  const subscriber = redis.duplicate();
  await subscriber.subscribe(`sheet:progress:${jobId}`);

  subscriber.on('message', (channel, message) => {
    reply.raw.write(`data: ${message}\n\n`);
  });

  // Send initial status
  const job = await getSheetJob(jobId);
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

app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(error.statusCode || 500).send({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
  });
});

// ============================================================================
// Start Server
// ============================================================================

const PORT = parseInt(process.env.PORT || '3003');
const HOST = process.env.HOST || '0.0.0.0';

// Start worker
const worker = startSheetWorker();

// Start server
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Sheet service running on http://${HOST}:${PORT}`);
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
