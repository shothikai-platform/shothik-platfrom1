import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required env vars at startup
 */

const envSchema = z.object({
  // Convex
  CONVEX_DEPLOYMENT: z.string().min(1),
  CONVEX_URL: z.string().url(),
  
  // Clerk Auth
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  
  // LLM - At least one required
  KIMI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  
  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  
  // Optional
  MCP_SERVER_URL: z.string().url().default('http://localhost:3001'),
  MCP_ENABLED: z.string().default('true'),
  REDIS_URL: z.string().url().optional(),
  
  // Feature flags
  ENABLE_AI_SUGGESTIONS: z.string().default('true'),
  ENABLE_NEURAL_ANALYSIS: z.string().default('true'),
  ENABLE_NOBEL_ANALYSIS: z.string().default('true'),
  ENABLE_ACCESSIBILITY_CHECK: z.string().default('true'),
});

/**
 * Validate environment variables
 * Call this at app startup
 */
export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.errors.forEach((error) => {
      console.error(`  - ${error.path}: ${error.message}`);
    });
    throw new Error('Environment validation failed');
  }
  
  // Check at least one LLM provider is configured
  if (!process.env.KIMI_API_KEY && !process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('At least one LLM provider (KIMI, OPENAI, or ANTHROPIC) must be configured');
  }
  
  console.log('✅ Environment variables validated');
  return result.data;
}

/**
 * Type-safe access to env vars
 */
export const env = validateEnv();
