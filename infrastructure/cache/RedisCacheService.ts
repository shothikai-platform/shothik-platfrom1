import { Redis } from "ioredis";
import { ICacheService } from "../shared/types";

// Redis client singleton
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    
    if (!redisUrl) {
      console.warn("⚠️  REDIS_URL not set, using in-memory fallback");
      // Return a mock client for development
      return createMockRedisClient();
    }

    redisClient = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err);
    });
  }

  return redisClient;
}

// Mock Redis client for development (in-memory fallback)
function createMockRedisClient(): Redis {
  const store = new Map<string, { value: string; expiry: number }>();
  
  const mockClient = {
    get: async (key: string) => {
      const item = store.get(key);
      if (!item) return null;
      if (Date.now() > item.expiry) {
        store.delete(key);
        return null;
      }
      return item.value;
    },
    set: async (key: string, value: string, ...args: any[]) => {
      let expiry = Date.now() + 3600000; // Default 1 hour
      if (args[0] === "EX" || args[0] === "PX") {
        const ttl = args[1] * (args[0] === "EX" ? 1000 : 1);
        expiry = Date.now() + ttl;
      }
      store.set(key, { value, expiry });
      return "OK";
    },
    setex: async (key: string, seconds: number, value: string) => {
      store.set(key, { value, expiry: Date.now() + seconds * 1000 });
      return "OK";
    },
    del: async (key: string) => {
      store.delete(key);
      return 1;
    },
    exists: async (key: string) => {
      const item = store.get(key);
      if (!item) return 0;
      if (Date.now() > item.expiry) {
        store.delete(key);
        return 0;
      }
      return 1;
    },
    // Rate limiting methods
    incr: async (key: string) => {
      const current = parseInt(store.get(key)?.value || "0");
      const newValue = current + 1;
      store.set(key, { value: String(newValue), expiry: Date.now() + 60000 });
      return newValue;
    },
    expire: async (key: string, seconds: number) => {
      const item = store.get(key);
      if (item) {
        item.expiry = Date.now() + seconds * 1000;
        return 1;
      }
      return 0;
    },
    // Event emitters (no-ops for mock)
    on: () => mockClient,
    quit: async () => undefined,
  } as unknown as Redis;

  return mockClient;
}

// Cache Service Implementation
export class RedisCacheService implements ICacheService {
  private redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  // Generate cache key with hash
  generateKey(prefix: string, data: any): string {
    const crypto = require("crypto");
    const hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex")
      .substring(0, 32);
    return `${prefix}:${hash}`;
  }
}

// Cache key generators for different tools
export const CacheKeys = {
  paraphrase: (text: string, mode: string, lang: string) => {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(`${text}:${mode}:${lang}`).digest("hex").substring(0, 32);
    return `para:${hash}`;
  },
  
  grammar: (text: string) => {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(text).digest("hex").substring(0, 32);
    return `grammar:${hash}`;
  },
  
  aiDetect: (text: string) => {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(text).digest("hex").substring(0, 32);
    return `aidetect:${hash}`;
  },
  
  humanize: (text: string, intensity: string) => {
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(`${text}:${intensity}`).digest("hex").substring(0, 32);
    return `humanize:${hash}`;
  },
  
  project: (projectId: string) => `project:${projectId}`,
  chapter: (chapterId: string) => `chapter:${chapterId}`,
  userQuota: (userId: string) => `quota:${userId}`,
};

// Cache TTL configurations
export const CacheTTL = {
  paraphrase: 4 * 60 * 60,      // 4 hours
  grammar: 24 * 60 * 60,        // 24 hours
  aiDetect: 60 * 60,            // 1 hour
  humanize: 24 * 60 * 60,       // 24 hours
  project: 5 * 60,              // 5 minutes
  chapter: 5 * 60,              // 5 minutes
  quota: 60,                    // 1 minute
};

export default RedisCacheService;
