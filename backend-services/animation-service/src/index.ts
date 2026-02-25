/**
 * Animation Service API
 * 
 * Fastify-based REST API for video generation.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { 
  CreateVideoRequest,
  VideoResponse 
} from './types/index.js';
import { 
  createVideoJob, 
  getVideoJob,
  startVideoWorker,
  redis
} from './services/orchestrator.js';
import { VoiceoverService } from './services/voiceover.js';

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
  methods: ['GET', 'POST']
});

await app.register(multipart);

await app.register(swagger, {
  openapi: {
    info: {
      title: 'Shothik Animation Service',
      description: 'Video generation from slides API',
      version: '1.0.0'
    },
    servers: [{
      url: 'http://localhost:3002',
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

// Services
const voiceoverService = new VoiceoverService();

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
 * Create video generation job
 */
app.post('/videos', {
  schema: {
    description: 'Create a new video generation job from slides',
    body: zodToJsonSchema(CreateVideoRequest),
    response: {
      201: zodToJsonSchema(VideoResponse),
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
    const body = CreateVideoRequest.parse(request.body);
    
    const job = await createVideoJob(body.userId, {
      slideDeck: body.slideDeck,
      template: body.template,
      resolution: body.resolution,
      frameRate: body.frameRate,
      voice: body.voice,
      voiceClone: body.voiceClone,
      music: body.music,
      subtitles: body.subtitles,
      watermark: body.watermark
    });

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
 * Get video job status
 */
app.get('/videos/:jobId', {
  schema: {
    description: 'Get video generation job status',
    params: {
      type: 'object',
      properties: {
        jobId: { type: 'string', format: 'uuid' }
      }
    }
  }
}, async (request, reply) => {
  const { jobId } = request.params as { jobId: string };
  const job = await getVideoJob(jobId);

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
 * Get available voices
 */
app.get('/voices', {
  schema: {
    description: 'Get list of available voices for voiceover'
  }
}, async () => {
  try {
    const voices = await voiceoverService.getVoices();
    return {
      success: true,
      data: voices
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch voices'
    };
  }
});

/**
 * Clone voice
 */
app.post('/voices/clone', {
  schema: {
    description: 'Clone a voice from audio samples'
  }
}, async (request, reply) => {
  // TODO: Implement voice cloning endpoint with file upload
  reply.status(501);
  return {
    success: false,
    error: 'Voice cloning not yet implemented'
  };
});

/**
 * Stream video progress (SSE)
 */
app.get('/videos/:jobId/stream', {
  schema: {
    description: 'Stream video generation progress via Server-Sent Events'
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
  await subscriber.subscribe(`video:progress:${jobId}`);

  subscriber.on('message', (channel, message) => {
    reply.raw.write(`data: ${message}\n\n`);
  });

  // Send initial status
  const job = await getVideoJob(jobId);
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

/**
 * Get video templates
 */
app.get('/templates', {
  schema: {
    description: 'Get available video templates'
  }
}, async () => {
  const templates = [
    {
      id: 'explainer',
      name: 'Explainer',
      description: 'Clean, minimal design for educational content',
      previewUrl: 'https://cdn.shothik.ai/templates/explainer-preview.mp4'
    },
    {
      id: 'product_launch',
      name: 'Product Launch',
      description: 'Bold and energetic for announcements',
      previewUrl: 'https://cdn.shothik.ai/templates/product-launch-preview.mp4'
    },
    {
      id: 'tutorial',
      name: 'Tutorial',
      description: 'Step-by-step instructional style',
      previewUrl: 'https://cdn.shothik.ai/templates/tutorial-preview.mp4'
    },
    {
      id: 'storytelling',
      name: 'Storytelling',
      description: 'Cinematic and emotional',
      previewUrl: 'https://cdn.shothik.ai/templates/storytelling-preview.mp4'
    },
    {
      id: 'data_presentation',
      name: 'Data Presentation',
      description: 'Charts and numbers focused',
      previewUrl: 'https://cdn.shothik.ai/templates/data-presentation-preview.mp4'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple and elegant',
      previewUrl: 'https://cdn.shothik.ai/templates/minimal-preview.mp4'
    }
  ];

  return {
    success: true,
    data: templates
  };
});

// ============================================================================
// Error Handling
// ============================================================================

app.setErrorHandler((error, request, reply) => {
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

const PORT = parseInt(process.env.PORT || '3002');
const HOST = process.env.HOST || '0.0.0.0';

// Start worker
const worker = startVideoWorker();

// Start server
try {
  await app.listen({ port: PORT, host: HOST });
  app.log.info(`Animation service running on http://${HOST}:${PORT}`);
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
