import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedisClient } from "./RedisCacheService";

// Rate limit configurations by tier
export const RATE_LIMIT_CONFIG = {
  // Free tier
  free: {
    paraphrase: { points: 10, duration: 3600 },      // 10/hour
    grammar: { points: 20, duration: 3600 },         // 20/hour
    aiDetector: { points: 10, duration: 3600 },      // 10/hour
    humanize: { points: 5, duration: 3600 },         // 5/hour
    plagiarism: { points: 3, duration: 3600 },       // 3/hour
    summarize: { points: 10, duration: 3600 },       // 10/hour
    aiCoWriter: { points: 20, duration: 3600 },      // 20/hour
    fileUpload: { points: 5, duration: 3600 },       // 5/hour
  },
  
  // Pro tier
  pro: {
    paraphrase: { points: 100, duration: 3600 },     // 100/hour
    grammar: { points: 200, duration: 3600 },        // 200/hour
    aiDetector: { points: 100, duration: 3600 },     // 100/hour
    humanize: { points: 50, duration: 3600 },        // 50/hour
    plagiarism: { points: 20, duration: 3600 },      // 20/hour (monthly limit applies)
    summarize: { points: 100, duration: 3600 },      // 100/hour
    aiCoWriter: { points: 200, duration: 3600 },     // 200/hour
    fileUpload: { points: 20, duration: 3600 },      // 20/hour
  },
  
  // Premium tier
  premium: {
    paraphrase: { points: 500, duration: 3600 },     // 500/hour
    grammar: { points: 1000, duration: 3600 },       // 1000/hour
    aiDetector: { points: 500, duration: 3600 },     // 500/hour
    humanize: { points: 200, duration: 3600 },       // 200/hour
    plagiarism: { points: 100, duration: 3600 },     // 100/hour (monthly limit applies)
    summarize: { points: 500, duration: 3600 },      // 500/hour
    aiCoWriter: { points: 1000, duration: 3600 },    // 1000/hour
    fileUpload: { points: 50, duration: 3600 },      // 50/hour
  },
  
  // Auth endpoints - stricter
  auth: {
    login: { points: 10, duration: 900 },            // 10 per 15 min
    register: { points: 5, duration: 900 },          // 5 per 15 min
    passwordReset: { points: 3, duration: 3600 },    // 3 per hour
  },
};

// Create rate limiter instances
export function createRateLimiters() {
  const redis = getRedisClient();
  
  return {
    // Tool rate limiters by tier
    free: {
      paraphrase: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:free:para",
        ...RATE_LIMIT_CONFIG.free.paraphrase,
        blockDuration: 300, // 5 min block
      }),
      grammar: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:free:grammar",
        ...RATE_LIMIT_CONFIG.free.grammar,
        blockDuration: 300,
      }),
      aiDetector: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:free:aidetect",
        ...RATE_LIMIT_CONFIG.free.aiDetector,
        blockDuration: 300,
      }),
      humanize: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:free:humanize",
        ...RATE_LIMIT_CONFIG.free.humanize,
        blockDuration: 600, // 10 min block
      }),
      plagiarism: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:free:plag",
        ...RATE_LIMIT_CONFIG.free.plagiarism,
        blockDuration: 600,
      }),
    },
    
    pro: {
      paraphrase: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:pro:para",
        ...RATE_LIMIT_CONFIG.pro.paraphrase,
        blockDuration: 60,
      }),
      grammar: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:pro:grammar",
        ...RATE_LIMIT_CONFIG.pro.grammar,
        blockDuration: 60,
      }),
      aiDetector: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:pro:aidetect",
        ...RATE_LIMIT_CONFIG.pro.aiDetector,
        blockDuration: 60,
      }),
      humanize: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:pro:humanize",
        ...RATE_LIMIT_CONFIG.pro.humanize,
        blockDuration: 60,
      }),
      plagiarism: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:pro:plag",
        ...RATE_LIMIT_CONFIG.pro.plagiarism,
        blockDuration: 300,
      }),
    },
    
    premium: {
      paraphrase: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:premium:para",
        ...RATE_LIMIT_CONFIG.premium.paraphrase,
        blockDuration: 30,
      }),
      grammar: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:premium:grammar",
        ...RATE_LIMIT_CONFIG.premium.grammar,
        blockDuration: 30,
      }),
      aiDetector: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:premium:aidetect",
        ...RATE_LIMIT_CONFIG.premium.aiDetector,
        blockDuration: 30,
      }),
      humanize: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:premium:humanize",
        ...RATE_LIMIT_CONFIG.premium.humanize,
        blockDuration: 30,
      }),
      plagiarism: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:premium:plag",
        ...RATE_LIMIT_CONFIG.premium.plagiarism,
        blockDuration: 60,
      }),
    },
    
    // Auth rate limiters
    auth: {
      login: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:auth:login",
        ...RATE_LIMIT_CONFIG.auth.login,
        blockDuration: 900, // 15 min block
      }),
      register: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:auth:register",
        ...RATE_LIMIT_CONFIG.auth.register,
        blockDuration: 900,
      }),
      passwordReset: new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: "rl:auth:reset",
        ...RATE_LIMIT_CONFIG.auth.passwordReset,
        blockDuration: 3600,
      }),
    },
  };
}

// Singleton rate limiters
let rateLimiters: ReturnType<typeof createRateLimiters> | null = null;

export function getRateLimiters() {
  if (!rateLimiters) {
    rateLimiters = createRateLimiters();
  }
  return rateLimiters;
}

// Check rate limit helper
export async function checkRateLimit(
  userId: string,
  tier: "free" | "pro" | "premium",
  tool: string
): Promise<{ allowed: boolean; remaining: number; resetAt?: Date }> {
  const limiters = getRateLimiters();
  const limiter = limiters[tier]?.[tool as keyof typeof limiters["free"]];
  
  if (!limiter) {
    return { allowed: true, remaining: 999 };
  }
  
  const key = `${tier}:${userId}`;
  
  try {
    const result = await limiter.get(key);
    
    if (result.remainingPoints > 0) {
      await limiter.consume(key);
      return {
        allowed: true,
        remaining: result.remainingPoints - 1,
        resetAt: new Date(Date.now() + limiter.duration * 1000),
      };
    } else {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + result.msBeforeNext),
      };
    }
  } catch (error) {
    // Rate limit exceeded
    if (error instanceof Error && error.message.includes("Rate limit")) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000), // 1 min fallback
      };
    }
    throw error;
  }
}
