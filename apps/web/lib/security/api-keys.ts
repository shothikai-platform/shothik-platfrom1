import { z } from "zod";
import { Redis } from "@upstash/redis";
import crypto from "crypto";
import { clerkClient } from "@clerk/nextjs/server";

const redis = Redis.fromEnv();

// API Key schema
const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum([
    "read",
    "write",
    "delete",
    "admin"
  ])).default(["read"]),
  expiresAt: z.date().optional(),
  rateLimit: z.number().default(1000), // requests per hour
  allowedIPs: z.array(z.string()).optional(),
});

export type CreateApiKeyRequest = z.infer<typeof apiKeySchema>;

interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
  rateLimit: number;
  allowedIPs?: string[];
  isRevoked: boolean;
}

interface ApiKeyUsage {
  timestamp: number;
  endpoint: string;
  status: number;
  duration: number;
}

const API_KEY_PREFIX = "shothik_";
const KEY_HASH_SALT = process.env.API_KEY_SALT || crypto.randomBytes(32).toString("hex");

/**
 * Generate a new API key
 */
export async function createApiKey(
  userId: string,
  request: CreateApiKeyRequest
): Promise<{ key: string; record: Omit<ApiKeyRecord, "keyHash"> }> {
  // Validate request
  apiKeySchema.parse(request);
  
  // Generate key
  const keyId = crypto.randomUUID();
  const keySecret = crypto.randomBytes(32).toString("base64url");
  const fullKey = `${API_KEY_PREFIX}${keyId}_${keySecret}`;
  
  // Hash the key for storage
  const keyHash = crypto
    .createHmac("sha256", KEY_HASH_SALT)
    .update(fullKey)
    .digest("hex");
  
  const record: ApiKeyRecord = {
    id: keyId,
    userId,
    name: request.name,
    keyHash,
    keyPrefix: fullKey.slice(0, 16),
    permissions: request.permissions,
    createdAt: Date.now(),
    expiresAt: request.expiresAt?.getTime(),
    usageCount: 0,
    rateLimit: request.rateLimit,
    allowedIPs: request.allowedIPs,
    isRevoked: false,
  };
  
  // Store in Redis
  await redis.setex(
    `apikey:${keyHash}`,
    60 * 60 * 24 * 365, // 1 year
    record
  );
  
  // Add to user's API keys list
  await redis.sadd(`user:${userId}:apikeys`, keyId);
  
  // Return key (only shown once) and record
  const { keyHash: _, ...recordWithoutHash } = record;
  return { key: fullKey, record: recordWithoutHash };
}

/**
 * Validate and get API key record
 */
export async function validateApiKey(
  apiKey: string,
  clientIP?: string
): Promise<ApiKeyRecord | null> {
  // Check prefix
  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }
  
  // Hash the provided key
  const keyHash = crypto
    .createHmac("sha256", KEY_HASH_SALT)
    .update(apiKey)
    .digest("hex");
  
  // Look up in Redis
  const record = await redis.get<ApiKeyRecord>(`apikey:${keyHash}`);
  
  if (!record) {
    return null;
  }
  
  // Check if revoked
  if (record.isRevoked) {
    return null;
  }
  
  // Check expiration
  if (record.expiresAt && Date.now() > record.expiresAt) {
    return null;
  }
  
  // Check IP whitelist
  if (record.allowedIPs?.length && clientIP) {
    if (!record.allowedIPs.includes(clientIP)) {
      return null;
    }
  }
  
  return record;
}

/**
 * Check rate limit for API key
 */
export async function checkApiKeyRateLimit(
  keyId: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const windowKey = `ratelimit:apikey:${keyId}:${Math.floor(Date.now() / 3600000)}`;
  const current = await redis.incr(windowKey);
  
  if (current === 1) {
    // Set expiry on first request
    await redis.expire(windowKey, 3600);
  }
  
  const remaining = Math.max(0, limit - current);
  const resetAt = Math.ceil(Date.now() / 3600000) * 3600000;
  
  return {
    allowed: current <= limit,
    remaining,
    resetAt,
  };
}

/**
 * Log API key usage
 */
export async function logApiKeyUsage(
  keyId: string,
  usage: ApiKeyUsage
): Promise<void> {
  const key = `apikey:${keyId}:usage:${Math.floor(Date.now() / 86400000)}`;
  await redis.lpush(key, JSON.stringify(usage));
  await redis.ltrim(key, 0, 999); // Keep last 1000 entries
  await redis.expire(key, 86400 * 30); // 30 days retention
  
  // Update last used and count
  const record = await redis.get<ApiKeyRecord>(`apikey:${keyId}`);
  if (record) {
    record.lastUsedAt = Date.now();
    record.usageCount++;
    await redis.setex(`apikey:${keyId}`, 60 * 60 * 24 * 365, record);
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  // Verify ownership
  const userKeys = await redis.smembers(`user:${userId}:apikeys`);
  if (!userKeys.includes(keyId)) {
    return false;
  }
  
  // Find and revoke
  const pattern = `apikey:*`;
  const keys = await redis.keys(pattern);
  
  for (const key of keys) {
    const record = await redis.get<ApiKeyRecord>(key);
    if (record?.id === keyId && record.userId === userId) {
      record.isRevoked = true;
      await redis.setex(key, 60 * 60 * 24 * 30, record); // Keep for 30 days
      return true;
    }
  }
  
  return false;
}

/**
 * List user's API keys
 */
export async function listApiKeys(
  userId: string
): Promise<Omit<ApiKeyRecord, "keyHash">[]> {
  const keyIds = await redis.smembers(`user:${userId}:apikeys`);
  const keys: Omit<ApiKeyRecord, "keyHash">[] = [];
  
  for (const keyId of keyIds) {
    const pattern = `apikey:*`;
    const allKeys = await redis.keys(pattern);
    
    for (const key of allKeys) {
      const record = await redis.get<ApiKeyRecord>(key);
      if (record?.id === keyId && record.userId === userId) {
        const { keyHash, ...withoutHash } = record;
        keys.push(withoutHash);
      }
    }
  }
  
  return keys;
}

/**
 * Middleware for API key authentication
 */
export async function authenticateApiKey(
  request: Request
): Promise<{
  success: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
  status?: number;
  headers?: Record<string, string>;
}> {
  const authHeader = request.headers.get("authorization");
  const clientIP = request.headers.get("x-forwarded-for") || 
                   request.headers.get("x-real-ip");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Missing or invalid authorization header",
      status: 401,
    };
  }
  
  const apiKey = authHeader.slice(7);
  
  // Validate key
  const record = await validateApiKey(apiKey, clientIP || undefined);
  
  if (!record) {
    return {
      success: false,
      error: "Invalid or expired API key",
      status: 401,
    };
  }
  
  // Check rate limit
  const rateLimit = await checkApiKeyRateLimit(record.id, record.rateLimit);
  
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Rate limit exceeded",
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(record.rateLimit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      },
    };
  }
  
  // Log usage
  await logApiKeyUsage(record.id, {
    timestamp: Date.now(),
    endpoint: request.url,
    status: 200,
    duration: 0, // Will be updated after response
  });
  
  return {
    success: true,
    userId: record.userId,
    permissions: record.permissions,
    headers: {
      "X-RateLimit-Limit": String(record.rateLimit),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetAt),
    },
  };
}

/**
 * Check if user has required permission
 */
export function hasPermission(
  userPermissions: string[],
  required: string
): boolean {
  if (userPermissions.includes("admin")) return true;
  return userPermissions.includes(required);
}
