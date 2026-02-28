import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

const redis = Redis.fromEnv();

interface SecurityEvent {
  id: string;
  timestamp: number;
  type: "auth_failure" | "rate_limit" | "suspicious" | "violation" | "error";
  severity: "low" | "medium" | "high" | "critical";
  source: {
    ip: string;
    userAgent?: string;
    userId?: string;
  };
  details: {
    path: string;
    method: string;
    description: string;
    metadata?: Record<string, unknown>;
  };
}

interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  authFailures: number;
  rateLimitHits: number;
  suspiciousActivity: number;
  violations: number;
  avgResponseTime: number;
  errorRate: number;
}

/**
 * Log security event
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, "id" | "timestamp">): Promise<void> {
  const fullEvent: SecurityEvent = {
    ...event,
    id: generateEventId(),
    timestamp: Date.now(),
  };
  
  // Store in time-series format
  const dateKey = new Date().toISOString().split("T")[0];
  const hourKey = new Date().getHours();
  
  // Add to daily log
  await redis.lpush(
    `security:events:${dateKey}`,
    JSON.stringify(fullEvent)
  );
  
  // Trim to keep last 10000 events per day
  await redis.ltrim(`security:events:${dateKey}`, 0, 9999);
  
  // Add to hourly counter
  await redis.hincrby(`security:counters:${dateKey}`, `${event.type}:${hourKey}`, 1);
  
  // Set expiration (30 days)
  await redis.expire(`security:events:${dateKey}`, 86400 * 30);
  await redis.expire(`security:counters:${dateKey}`, 86400 * 30);
  
  // Alert on critical events
  if (event.severity === "critical") {
    await alertCriticalEvent(fullEvent);
  }
}

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function alertCriticalEvent(event: SecurityEvent): Promise<void> {
  // TODO: Integrate with alerting system (PagerDuty, Slack, etc.)
  console.error("🚨 CRITICAL SECURITY EVENT:", event);
  
  // Store in critical queue
  await redis.lpush("security:critical", JSON.stringify(event));
  await redis.expire("security:critical", 86400);
}

/**
 * Get security metrics for dashboard
 */
export async function getSecurityMetrics(
  days: number = 7
): Promise<SecurityMetrics> {
  const metrics: SecurityMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    authFailures: 0,
    rateLimitHits: 0,
    suspiciousActivity: 0,
    violations: 0,
    avgResponseTime: 0,
    errorRate: 0,
  };
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];
    
    // Get counters
    const counters = await redis.hgetall<Record<string, string>>(
      `security:counters:${dateKey}`
    );
    
    if (counters) {
      for (const [key, value] of Object.entries(counters)) {
        const count = parseInt(value) || 0;
        
        if (key.startsWith("auth_failure")) {
          metrics.authFailures += count;
          metrics.blockedRequests += count;
        } else if (key.startsWith("rate_limit")) {
          metrics.rateLimitHits += count;
          metrics.blockedRequests += count;
        } else if (key.startsWith("suspicious")) {
          metrics.suspiciousActivity += count;
        } else if (key.startsWith("violation")) {
          metrics.violations += count;
          metrics.blockedRequests += count;
        }
      }
    }
  }
  
  return metrics;
}

/**
 * Get recent security events
 */
export async function getRecentEvents(
  limit: number = 100,
  type?: SecurityEvent["type"]
): Promise<SecurityEvent[]> {
  const dateKey = new Date().toISOString().split("T")[0];
  const events = await redis.lrange(`security:events:${dateKey}`, 0, limit - 1);
  
  const parsed = events
    .map(e => {
      try {
        return JSON.parse(e) as SecurityEvent;
      } catch {
        return null;
      }
    })
    .filter((e): e is SecurityEvent => e !== null);
  
  if (type) {
    return parsed.filter(e => e.type === type);
  }
  
  return parsed;
}

/**
 * Detect suspicious patterns
 */
export async function detectSuspiciousActivity(
  req: NextRequest,
  userId?: string
): Promise<{
  isSuspicious: boolean;
  reasons: string[];
  action: "allow" | "warn" | "block";
}> {
  const reasons: string[] = [];
  const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown";
  
  // Check for rapid requests from same IP
  const ipKey = `rate:ip:${ip}`;
  const ipRequests = await redis.incr(ipKey);
  
  if (ipRequests === 1) {
    await redis.expire(ipKey, 60); // 1 minute window
  }
  
  if (ipRequests > 100) {
    reasons.push("Excessive requests from single IP");
  }
  
  // Check for failed auth attempts
  if (userId) {
    const authFailures = await redis.get(`auth:fails:${userId}`);
    if (parseInt(authFailures || "0") > 5) {
      reasons.push("Multiple authentication failures");
    }
  }
  
  // Check for unusual user agents
  const userAgent = req.headers.get("user-agent") || "";
  const suspiciousAgents = ["sqlmap", "nikto", "nmap", "masscan", "zgrab"];
  
  if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
    reasons.push("Suspicious user agent detected");
  }
  
  // Check for path traversal attempts
  const path = req.nextUrl.pathname;
  if (path.includes("..") || path.includes("%2e%2e")) {
    reasons.push("Path traversal attempt detected");
  }
  
  // Determine action
  let action: "allow" | "warn" | "block" = "allow";
  
  if (reasons.length >= 3) {
    action = "block";
  } else if (reasons.length >= 1) {
    action = "warn";
  }
  
  // Log if suspicious
  if (reasons.length > 0) {
    await logSecurityEvent({
      type: "suspicious",
      severity: action === "block" ? "high" : "medium",
      source: {
        ip,
        userAgent: userAgent || undefined,
        userId,
      },
      details: {
        path,
        method: req.method,
        description: reasons.join("; "),
      },
    });
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons,
    action,
  };
}

/**
 * Block IP address
 */
export async function blockIP(
  ip: string,
  duration: number = 3600,
  reason: string
): Promise<void> {
  await redis.setex(`block:ip:${ip}`, duration, reason);
  
  await logSecurityEvent({
    type: "violation",
    severity: "high",
    source: { ip },
    details: {
      path: "N/A",
      method: "N/A",
      description: `IP blocked: ${reason}`,
      metadata: { duration },
    },
  });
}

/**
 * Check if IP is blocked
 */
export async function isIPBlocked(ip: string): Promise<{
  blocked: boolean;
  reason?: string;
  expiresAt?: number;
}> {
  const reason = await redis.get(`block:ip:${ip}`);
  const ttl = await redis.ttl(`block:ip:${ip}`);
  
  if (reason) {
    return {
      blocked: true,
      reason,
      expiresAt: Date.now() + ttl * 1000,
    };
  }
  
  return { blocked: false };
}

/**
 * Get security dashboard data
 */
export async function getSecurityDashboard(): Promise<{
  metrics: SecurityMetrics;
  recentEvents: SecurityEvent[];
  topThreats: Array<{ type: string; count: number }>;
  blockedIPs: number;
}> {
  const [metrics, recentEvents, blockedIPsCount] = await Promise.all([
    getSecurityMetrics(7),
    getRecentEvents(50),
    redis.keys("block:ip:*").then(keys => keys.length),
  ]);
  
  // Calculate top threats
  const threatCounts: Record<string, number> = {};
  recentEvents.forEach(event => {
    threatCounts[event.type] = (threatCounts[event.type] || 0) + 1;
  });
  
  const topThreats = Object.entries(threatCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  return {
    metrics,
    recentEvents,
    topThreats,
    blockedIPs: blockedIPsCount,
  };
}
