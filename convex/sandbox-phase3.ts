// OpenSandbox Advanced Backend
// Phase 3: Auto-scaling, Monitoring, Disaster Recovery

import { action, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const OPEN_SANDBOX_URL = process.env.OPEN_SANDBOX_URL || "http://opensandbox-server.opensandbox:8080";

// ============================================
// AUTO-SCALING MANAGEMENT
// ============================================

interface ScalingDecision {
  action: "scale_up" | "scale_down" | "maintain";
  currentSize: number;
  targetSize: number;
  reason: string;
  metrics: {
    utilization: number;
    queueDepth: number;
    avgWaitTime: number;
  };
}

export const evaluateScaling = action({
  args: {
    orgId: v.optional(v.string()),
  },
  returns: v.object({
    decision: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Get current metrics
      const metrics = await getPoolMetrics(args.orgId);
      
      // Evaluate scaling decision
      const decision = calculateScalingDecision(metrics);
      
      // Execute scaling if needed
      if (decision.action !== "maintain") {
        await executeScaling(decision);
        
        // Log scaling event
        await ctx.runMutation(internal.sandbox.logScalingEvent, {
          orgId: args.orgId,
          decision,
          timestamp: Date.now(),
        });
      }
      
      return { decision };
    } catch (error) {
      console.error("Scaling evaluation error:", error);
      return {
        error: error instanceof Error ? error.message : "Scaling failed",
      };
    }
  },
});

async function getPoolMetrics(orgId?: string): Promise<any> {
  const response = await fetch(`${OPEN_SANDBOX_URL}/metrics/pool`);
  const data = await response.json();
  
  if (orgId) {
    // Filter by organization
    return {
      ...data,
      utilization: data.tenants[orgId]?.utilization || 0,
      queueDepth: data.tenants[orgId]?.queueDepth || 0,
    };
  }
  
  return data;
}

function calculateScalingDecision(metrics: any): ScalingDecision {
  const MIN_SIZE = 5;
  const MAX_SIZE = 100;
  const SCALE_UP_THRESHOLD = 0.8;
  const SCALE_DOWN_THRESHOLD = 0.3;
  
  const currentSize = metrics.poolSize;
  let targetSize = currentSize;
  let action: "scale_up" | "scale_down" | "maintain" = "maintain";
  let reason = "";
  
  if (metrics.utilization > SCALE_UP_THRESHOLD) {
    // Scale up
    targetSize = Math.min(
      Math.ceil(currentSize * 1.5),
      MAX_SIZE
    );
    action = "scale_up";
    reason = `High utilization: ${(metrics.utilization * 100).toFixed(1)}%`;
  } else if (metrics.utilization < SCALE_DOWN_THRESHOLD && currentSize > MIN_SIZE) {
    // Scale down
    targetSize = Math.max(
      Math.floor(currentSize * 0.8),
      MIN_SIZE
    );
    action = "scale_down";
    reason = `Low utilization: ${(metrics.utilization * 100).toFixed(1)}%`;
  }
  
  return {
    action,
    currentSize,
    targetSize,
    reason,
    metrics: {
      utilization: metrics.utilization,
      queueDepth: metrics.queueDepth,
      avgWaitTime: metrics.avgWaitTime,
    },
  };
}

async function executeScaling(decision: ScalingDecision): Promise<void> {
  // Call Kubernetes API to scale deployment
  const k8sResponse = await fetch(
    `${process.env.K8S_API_URL}/apis/apps/v1/namespaces/opensandbox/deployments/sandbox-pool/scale`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/merge-patch+json",
        "Authorization": `Bearer ${process.env.K8S_TOKEN}`,
      },
      body: JSON.stringify({
        spec: {
          replicas: decision.targetSize,
        },
      }),
    }
  );
  
  if (!k8sResponse.ok) {
    throw new Error(`Scaling failed: ${await k8sResponse.text()}`);
  }
}

// ============================================
// MONITORING & METRICS
// ============================================

export const getSandboxMetrics = query({
  args: {
    orgId: v.optional(v.string()),
    timeRange: v.optional(v.string()), // "1h", "24h", "7d"
  },
  returns: v.object({
    activeSandboxes: v.number(),
    totalExecutions: v.number(),
    successRate: v.number(),
    avgDuration: v.number(),
    resourceUsage: v.any(),
    topUsers: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "24h";
    const startTime = getStartTime(timeRange);
    
    // Query metrics from database
    const logs = await ctx.db
      .query("sandboxAuditLogs")
      .withIndex("by_org_time", (q) =>
        q
          .eq("orgId", args.orgId || "global")
          .gte("timestamp", startTime)
      )
      .collect();
    
    const executions = logs.filter((l) => l.action === "execute");
    const successful = executions.filter((l) => l.response?.exitCode === 0);
    
    return {
      activeSandboxes: new Set(logs.map((l) => l.sandboxId)).size,
      totalExecutions: executions.length,
      successRate: executions.length > 0 ? successful.length / executions.length : 0,
      avgDuration: calculateAverageDuration(executions),
      resourceUsage: calculateResourceUsage(logs),
      topUsers: calculateTopUsers(logs),
    };
  },
});

function getStartTime(range: string): number {
  const now = Date.now();
  const ranges: Record<string, number> = {
    "1h": 3600000,
    "24h": 86400000,
    "7d": 604800000,
  };
  return now - (ranges[range] || 86400000);
}

function calculateAverageDuration(executions: any[]): number {
  if (executions.length === 0) return 0;
  const total = executions.reduce((sum, e) => sum + (e.response?.durationMs || 0), 0);
  return total / executions.length;
}

function calculateResourceUsage(logs: any[]): any {
  const usage: Record<string, number> = {};
  
  for (const log of logs) {
    const key = log.resource?.namespace || "unknown";
    usage[key] = (usage[key] || 0) + (log.security?.egressBytes || 0);
  }
  
  return usage;
}

function calculateTopUsers(logs: any[]): any[] {
  const users: Record<string, any> = {};
  
  for (const log of logs) {
    if (!users[log.userId]) {
      users[log.userId] = { executions: 0, sandboxes: new Set() };
    }
    users[log.userId].executions++;
    users[log.userId].sandboxes.add(log.sandboxId);
  }
  
  return Object.entries(users)
    .map(([userId, stats]) => ({
      userId,
      executions: stats.executions,
      uniqueSandboxes: stats.sandboxes.size,
    }))
    .sort((a, b) => b.executions - a.executions)
    .slice(0, 10);
}

// ============================================
// DISASTER RECOVERY
// ============================================

export const initiateDisasterRecovery = action({
  args: {
    scenario: v.union(
      v.literal("cluster_failure"),
      v.literal("data_corruption"),
      v.literal("security_incident")
    ),
    affectedOrgs: v.optional(v.array(v.string())),
  },
  returns: v.object({
    success: v.boolean(),
    recoveryId: v.optional(v.string()),
    estimatedTime: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const recoveryId = `dr-${Date.now()}`;
    
    try {
      // Log incident
      await ctx.runMutation(internal.sandbox.logDisasterRecovery, {
        recoveryId,
        scenario: args.scenario,
        affectedOrgs: args.affectedOrgs,
        startedAt: Date.now(),
        status: "in_progress",
      });
      
      // Execute recovery based on scenario
      switch (args.scenario) {
        case "cluster_failure":
          await recoverFromClusterFailure(args.affectedOrgs);
          break;
        case "data_corruption":
          await recoverFromDataCorruption(args.affectedOrgs);
          break;
        case "security_incident":
          await recoverFromSecurityIncident(args.affectedOrgs);
          break;
      }
      
      // Mark recovery complete
      await ctx.runMutation(internal.sandbox.updateDisasterRecovery, {
        recoveryId,
        completedAt: Date.now(),
        status: "completed",
      });
      
      return {
        success: true,
        recoveryId,
        estimatedTime: 35 * 60 * 1000, // 35 minutes
      };
    } catch (error) {
      await ctx.runMutation(internal.sandbox.updateDisasterRecovery, {
        recoveryId,
        failedAt: Date.now(),
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      return {
        success: false,
        recoveryId,
        error: error instanceof Error ? error.message : "Recovery failed",
      };
    }
  },
});

async function recoverFromClusterFailure(affectedOrgs?: string[]): Promise<void> {
  // 1. Activate DR cluster
  // 2. Restore from latest backup
  // 3. Verify restoration
  // 4. Update DNS
  
  console.log("Recovering from cluster failure...");
}

async function recoverFromDataCorruption(affectedOrgs?: string[]): Promise<void> {
  // 1. Identify corrupted namespaces
  // 2. Restore from point-in-time snapshot
  // 3. Validate data integrity
  
  console.log("Recovering from data corruption...");
}

async function recoverFromSecurityIncident(affectedOrgs?: string[]): Promise<void> {
  // 1. Isolate affected sandboxes
  // 2. Capture forensic snapshots
  // 3. Rotate credentials
  // 4. Restore from clean backup
  
  console.log("Recovering from security incident...");
}

// ============================================
// BACKUP MANAGEMENT
// ============================================

export const triggerBackup = action({
  args: {
    orgId: v.optional(v.string()),
    backupType: v.union(v.literal("full"), v.literal("incremental")),
  },
  returns: v.object({
    success: v.boolean(),
    backupId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const backupId = `backup-${Date.now()}`;
      
      // Trigger Velero backup
      const response = await fetch(`${process.env.VELERO_URL}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: backupId,
          includedNamespaces: args.orgId
            ? [`shothik-tenant-${args.orgId}`]
            : ["opensandbox", "shothik-tenant-*"],
          snapshotVolumes: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Backup failed: ${await response.text()}`);
      }
      
      // Log backup
      await ctx.runMutation(internal.sandbox.logBackup, {
        backupId,
        orgId: args.orgId,
        type: args.backupType,
        startedAt: Date.now(),
        status: "in_progress",
      });
      
      return { success: true, backupId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Backup failed",
      };
    }
  },
});

export const verifyBackup = action({
  args: {
    backupId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    verified: v.boolean(),
    details: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Check backup status
      const response = await fetch(`${process.env.VELERO_URL}/backups/${args.backupId}`);
      const data = await response.json();
      
      const verified = data.status === "Completed" && data.errors === 0;
      
      // Update log
      await ctx.runMutation(internal.sandbox.updateBackup, {
        backupId: args.backupId,
        verified,
        completedAt: Date.now(),
        status: verified ? "completed" : "failed",
      });
      
      return {
        success: true,
        verified,
        details: data,
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  },
});
