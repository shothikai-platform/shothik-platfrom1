import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const redis = Redis.fromEnv();

// DDoS Protection Configuration
const DDOS_CONFIG = {
  // Window-based rate limiting
  WINDOW_SIZE_MS: 60000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100, // per IP per minute
  
  // Burst protection
  BURST_THRESHOLD: 20, // requests in 10 seconds
  BURST_WINDOW_MS: 10000,
  
  // Global rate limiting (across all IPs)
  GLOBAL_MAX_RPS: 1000, // max requests per second globally
  
  // Auto-block thresholds
  AUTO_BLOCK_THRESHOLD: 500, // requests in 1 minute = auto-block
  AUTO_BLOCK_DURATION: 3600, // 1 hour
  
  // Challenge thresholds
  CHALLENGE_THRESHOLD: 200, // requests in 1 minute = require challenge
};

interface DDoSCheck {
  allowed: boolean;
  action: "allow" | "challenge" | "block" | "rate-limit";
  reason?: string;
  retryAfter?: number;
}

/**
 * Advanced DDoS protection with multiple layers
 */
export async function checkDDoSProtection(
  req: NextRequest,
  userId?: string
): Promise<DDoSCheck> {
  const clientIP = req.ip || req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "";
  const path = req.nextUrl.pathname;
  
  // Layer 1: Check if IP is already blocked
  const isBlocked = await redis.get(`block:ddos:${clientIP}`);
  if (isBlocked) {
    return {
      allowed: false,
      action: "block",
      reason: "IP blocked due to suspicious activity",
      retryAfter: await redis.ttl(`block:ddos:${clientIP}`),
    };
  }
  
  // Layer 2: Check global rate limit (protect server resources)
  const globalKey = `ratelimit:global:${Math.floor(Date.now() / 1000)}`;
  const globalCount = await redis.incr(globalKey);
  if (globalCount === 1) {
    await redis.expire(globalKey, 2); // 2 second window
  }
  
  if (globalCount > DDOS_CONFIG.GLOBAL_MAX_RPS) {
    return {
      allowed: false,
      action: "rate-limit",
      reason: "Server overloaded, try again later",
      retryAfter: 2,
    };
  }
  
  // Layer 3: Burst detection (10-second window)
  const burstKey = `burst:${clientIP}:${Math.floor(Date.now() / DDOS_CONFIG.BURST_WINDOW_MS)}`;
  const burstCount = await redis.incr(burstKey);
  if (burstCount === 1) {
    await redis.expire(burstKey, DDOS_CONFIG.BURST_WINDOW_MS / 1000);
  }
  
  if (burstCount > DDOS_CONFIG.BURST_THRESHOLD) {
    // Auto-block for burst attacks
    await redis.setex(`block:ddos:${clientIP}`, DDOS_CONFIG.AUTO_BLOCK_DURATION, "burst");
    await logDDoSEvent(clientIP, "burst_attack", burstCount);
    
    return {
      allowed: false,
      action: "block",
      reason: "Burst attack detected",
      retryAfter: DDOS_CONFIG.AUTO_BLOCK_DURATION,
    };
  }
  
  // Layer 4: Per-IP rate limiting (1-minute window)
  const windowKey = `window:${clientIP}:${Math.floor(Date.now() / DDOS_CONFIG.WINDOW_SIZE_MS)}`;
  const windowCount = await redis.incr(windowKey);
  if (windowCount === 1) {
    await redis.expire(windowKey, 60);
  }
  
  // Layer 5: Auto-block for excessive requests
  if (windowCount > DDOS_CONFIG.AUTO_BLOCK_THRESHOLD) {
    await redis.setex(`block:ddos:${clientIP}`, DDOS_CONFIG.AUTO_BLOCK_DURATION, "excessive");
    await logDDoSEvent(clientIP, "excessive_requests", windowCount);
    
    return {
      allowed: false,
      action: "block",
      reason: "Excessive requests detected",
      retryAfter: DDOS_CONFIG.AUTO_BLOCK_DURATION,
    };
  }
  
  // Layer 6: Challenge for suspicious activity
  if (windowCount > DDOS_CONFIG.CHALLENGE_THRESHOLD) {
    return {
      allowed: false,
      action: "challenge",
      reason: "Please verify you're human",
    };
  }
  
  // Layer 7: Bot detection heuristics
  const botCheck = await detectBot(clientIP, userAgent, req);
  if (!botCheck.allowed) {
    return botCheck;
  }
  
  return { allowed: true, action: "allow" };
}

/**
 * Bot detection heuristics
 */
async function detectBot(
  ip: string,
  userAgent: string,
  req: NextRequest
): Promise<DDoSCheck> {
  // Check 1: No user agent
  if (!userAgent || userAgent.length < 10) {
    await redis.setex(`block:ddos:${ip}`, 3600, "no_ua");
    return { allowed: false, action: "block", reason: "Invalid client" };
  }
  
  // Check 2: Known bot signatures
  const botSignatures = [
    "bot", "crawler", "spider", "scraper", "curl", "wget",
    "python-requests", "axios", "postman", "insomnia"
  ];
  
  const uaLower = userAgent.toLowerCase();
  if (botSignatures.some(sig => uaLower.includes(sig))) {
    // Allow if authenticated, block if not
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return {
        allowed: false,
        action: "challenge",
        reason: "Automated traffic detected",
      };
    }
  }
  
  // Check 3: Request pattern analysis
  const patternKey = `pattern:${ip}`;
  const patterns = await redis.lrange(patternKey, 0, 9);
  
  if (patterns.length >= 10) {
    // Check for uniform timing (bot signature)
    const timestamps = patterns.map(p => parseInt(p));
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i-1] - timestamps[i]);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, int) => sum + Math.pow(int - avgInterval, 2), 0) / intervals.length;
    
    // Low variance = uniform timing = likely bot
    if (variance < 100 && avgInterval < 1000) {
      await redis.setex(`block:ddos:${ip}`, 3600, "pattern");
      return { allowed: false, action: "block", reason: "Automated pattern detected" };
    }
  }
  
  // Log pattern
  await redis.lpush(patternKey, Date.now().toString());
  await redis.ltrim(patternKey, 0, 99);
  await redis.expire(patternKey, 300);
  
  return { allowed: true, action: "allow" };
}

/**
 * Log DDoS event for monitoring
 */
async function logDDoSEvent(ip: string, type: string, count: number): Promise<void> {
  const event = {
    timestamp: Date.now(),
    ip,
    type,
    count,
    date: new Date().toISOString().split("T")[0],
  };
  
  await redis.lpush("ddos:events", JSON.stringify(event));
  await redis.ltrim("ddos:events", 0, 999);
  
  // Alert if high volume
  if (count > 1000) {
    console.error(`🚨 DDoS ALERT: ${type} from ${ip} - ${count} requests`);
    // TODO: Send alert to admin (PagerDuty, Slack, etc.)
  }
}

/**
 * Get DDoS statistics
 */
export async function getDDoSStats(): Promise<{
  blockedIPs: number;
  recentEvents: number;
  topThreats: Array<{ ip: string; count: number }>;
}> {
  const blockedKeys = await redis.keys("block:ddos:*");
  const events = await redis.lrange("ddos:events", 0, 99);
  
  const ipCounts: Record<string, number> = {};
  for (const event of events) {
    try {
      const parsed = JSON.parse(event);
      ipCounts[parsed.ip] = (ipCounts[parsed.ip] || 0) + 1;
    } catch {}
  }
  
  const topThreats = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    blockedIPs: blockedKeys.length,
    recentEvents: events.length,
    topThreats,
  };
}

/**
 * Manually block an IP (admin function)
 */
export async function blockIP(
  ip: string,
  duration: number = 3600,
  reason: string
): Promise<void> {
  await redis.setex(`block:ddos:${ip}`, duration, reason);
  await logDDoSEvent(ip, "manual_block", 0);
}

/**
 * Unblock an IP (admin function)
 */
export async function unblockIP(ip: string): Promise<void> {
  await redis.del(`block:ddos:${ip}`);
}
