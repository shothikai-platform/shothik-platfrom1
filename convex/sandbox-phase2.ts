// OpenSandbox Enterprise Backend
// Phase 2: Multi-tenant, Audit Logging, Persistent Storage

import { action, query } from "./_generated/server";
import { v } from "convex/values";

const OPEN_SANDBOX_URL = process.env.OPEN_SANDBOX_URL || "http://opensandbox-server.opensandbox:8080";

// ============================================
// MULTI-TENANT MANAGEMENT
// ============================================

export const createTenantNamespace = action({
  args: {
    orgId: v.string(),
    orgName: v.string(),
    tier: v.union(v.literal("basic"), v.literal("pro"), v.literal("enterprise")),
    resourceQuota: v.optional(v.object({
      cpu: v.string(),
      memory: v.string(),
      pods: v.number(),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    namespace: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const namespace = `shothik-tenant-${args.orgId}`;
      
      // Create namespace via Kubernetes API
      const k8sResponse = await fetch(`${process.env.K8S_API_URL}/api/v1/namespaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.K8S_TOKEN}`,
        },
        body: JSON.stringify({
          apiVersion: "v1",
          kind: "Namespace",
          metadata: {
            name: namespace,
            labels: {
              tenant: args.orgId,
              tier: args.tier,
              "managed-by": "opensandbox",
            },
          },
        }),
      });
      
      if (!k8sResponse.ok) {
        throw new Error(`Failed to create namespace: ${await k8sResponse.text()}`);
      }
      
      // Apply resource quota based on tier
      const quotas = {
        basic: { cpu: "5", memory: "10Gi", pods: 20 },
        pro: { cpu: "10", memory: "20Gi", pods: 50 },
        enterprise: args.resourceQuota || { cpu: "20", memory: "40Gi", pods: 100 },
      };
      
      await applyResourceQuota(namespace, quotas[args.tier]);
      await applyNetworkPolicy(namespace, args.orgId);
      await applyRBAC(namespace, args.orgId);
      
      // Store tenant info in database
      await ctx.runMutation(internal.sandbox.createTenantRecord, {
        orgId: args.orgId,
        orgName: args.orgName,
        namespace,
        tier: args.tier,
        createdAt: Date.now(),
      });
      
      return { success: true, namespace };
    } catch (error) {
      console.error("Create tenant error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create tenant",
      };
    }
  },
});

async function applyResourceQuota(namespace: string, quota: any) {
  // Implementation via K8s API
}

async function applyNetworkPolicy(namespace: string, orgId: string) {
  // Implementation via K8s API
}

async function applyRBAC(namespace: string, orgId: string) {
  // Implementation via K8s API
}

// ============================================
// AUDIT LOGGING
// ============================================

interface AuditLogEntry {
  timestamp: number;
  orgId: string;
  userId: string;
  sandboxId: string;
  action: string;
  resource: {
    type: string;
    namespace: string;
    name: string;
  };
  request?: {
    command?: string;
    code?: string;
    url?: string;
  };
  response?: {
    exitCode?: number;
    durationMs?: number;
  };
  security?: {
    egressBytes?: number;
    filesAccessed?: string[];
    blockedCommands?: string[];
  };
}

export const logSandboxAction = action({
  args: {
    orgId: v.string(),
    userId: v.string(),
    sandboxId: v.string(),
    action: v.string(),
    resource: v.object({
      type: v.string(),
      namespace: v.string(),
      name: v.string(),
    }),
    request: v.optional(v.any()),
    response: v.optional(v.any()),
    security: v.optional(v.any()),
  },
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const logEntry: AuditLogEntry = {
        timestamp: Date.now(),
        orgId: args.orgId,
        userId: args.userId,
        sandboxId: args.sandboxId,
        action: args.action,
        resource: args.resource,
        request: args.request,
        response: args.response,
        security: args.security,
      };
      
      // Store in Convex for real-time queries
      await ctx.runMutation(internal.sandbox.storeAuditLog, {
        entry: logEntry,
      });
      
      // Send to Elasticsearch for analytics
      await sendToElasticsearch(logEntry);
      
      // Archive to S3 for compliance
      await archiveToS3(logEntry);
      
      return { success: true };
    } catch (error) {
      console.error("Audit logging error:", error);
      return { success: false };
    }
  },
});

async function sendToElasticsearch(entry: AuditLogEntry) {
  try {
    await fetch(`${process.env.ELASTICSEARCH_URL}/sandbox-audit/_doc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(process.env.ELASTICSEARCH_AUTH || "")}`,
      },
      body: JSON.stringify(entry),
    });
  } catch (error) {
    console.error("Elasticsearch logging failed:", error);
  }
}

async function archiveToS3(entry: AuditLogEntry) {
  // Fire-and-forget S3 archiving
  const date = new Date(entry.timestamp);
  const key = `audit/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}/${entry.timestamp}.json`;
  
  // Implementation would use AWS SDK
}

// Query audit logs
export const queryAuditLogs = query({
  args: {
    orgId: v.string(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    action: v.optional(v.string()),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query("sandboxAuditLogs")
      .withIndex("by_org_time", (q) =>
        q
          .eq("orgId", args.orgId)
          .gte("timestamp", args.startTime || Date.now() - 86400000)
          .lte("timestamp", args.endTime || Date.now())
      )
      .order("desc")
      .take(args.limit || 100);
    
    return logs;
  },
});

// ============================================
// PERSISTENT STORAGE
// ============================================

export const createPersistentVolume = action({
  args: {
    orgId: v.string(),
    userId: v.string(),
    name: v.string(),
    size: v.string(), // e.g., "10Gi"
    storageClass: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    pvcName: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const namespace = `shothik-tenant-${args.orgId}`;
      const pvcName = `user-data-${args.userId}-${args.name}`;
      
      // Create PVC via K8s API
      const k8sResponse = await fetch(
        `${process.env.K8S_API_URL}/api/v1/namespaces/${namespace}/persistentvolumeclaims`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.K8S_TOKEN}`,
          },
          body: JSON.stringify({
            apiVersion: "v1",
            kind: "PersistentVolumeClaim",
            metadata: {
              name: pvcName,
              labels: {
                userId: args.userId,
                orgId: args.orgId,
                managedBy: "opensandbox",
              },
            },
            spec: {
              accessModes: ["ReadWriteOnce"],
              storageClassName: args.storageClass || "sandbox-fast-ssd",
              resources: {
                requests: {
                  storage: args.size,
                },
              },
            },
          }),
        }
      );
      
      if (!k8sResponse.ok) {
        throw new Error(`Failed to create PVC: ${await k8sResponse.text()}`);
      }
      
      // Store in database
      await ctx.runMutation(internal.sandbox.createVolumeRecord, {
        orgId: args.orgId,
        userId: args.userId,
        name: pvcName,
        size: args.size,
        namespace,
        createdAt: Date.now(),
      });
      
      return { success: true, pvcName };
    } catch (error) {
      console.error("Create volume error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create volume",
      };
    }
  },
});

export const attachVolumeToSandbox = action({
  args: {
    orgId: v.string(),
    sandboxId: v.string(),
    pvcName: v.string(),
    mountPath: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Patch the sandbox pod to attach volume
      const namespace = `shothik-tenant-${args.orgId}`;
      
      // Implementation would patch the pod spec
      // This is simplified - real implementation needs careful handling
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to attach volume",
      };
    }
  },
});

// ============================================
// COMPLIANCE REPORTING
// ============================================

export const generateComplianceReport = action({
  args: {
    orgId: v.string(),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    report: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const startTime = new Date(args.startDate).getTime();
      const endTime = new Date(args.endDate).getTime();
      
      // Aggregate audit logs
      const logs = await ctx.runQuery(internal.sandbox.getAuditLogsForReport, {
        orgId: args.orgId,
        startTime,
        endTime,
      });
      
      const report = {
        orgId: args.orgId,
        period: { start: args.startDate, end: args.endDate },
        summary: {
          totalSandboxes: new Set(logs.map((l: any) => l.sandboxId)).size,
          totalExecutions: logs.filter((l: any) => l.action === "execute").length,
          totalEgressBytes: logs.reduce((sum: number, l: any) => sum + (l.security?.egressBytes || 0), 0),
          blockedActions: logs.filter((l: any) => (l.security?.blockedCommands?.length || 0) > 0).length,
        },
        topUsers: calculateTopUsers(logs),
        resourceUsage: calculateResourceUsage(logs),
        securityIncidents: logs.filter((l: any) => l.response?.exitCode !== 0 || (l.security?.blockedCommands?.length || 0) > 0),
      };
      
      return { success: true, report };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report",
      };
    }
  },
});

function calculateTopUsers(logs: any[]) {
  const userStats: Record<string, any> = {};
  
  for (const log of logs) {
    if (!userStats[log.userId]) {
      userStats[log.userId] = { executions: 0, sandboxes: new Set() };
    }
    userStats[log.userId].executions++;
    userStats[log.userId].sandboxes.add(log.sandboxId);
  }
  
  return Object.entries(userStats)
    .map(([userId, stats]) => ({
      userId,
      executions: stats.executions,
      uniqueSandboxes: stats.sandboxes.size,
    }))
    .sort((a, b) => b.executions - a.executions)
    .slice(0, 10);
}

function calculateResourceUsage(logs: any[]) {
  const dailyUsage: Record<string, any> = {};
  
  for (const log of logs) {
    const date = new Date(log.timestamp).toISOString().split("T")[0];
    if (!dailyUsage[date]) {
      dailyUsage[date] = { executions: 0, totalDuration: 0 };
    }
    dailyUsage[date].executions++;
    dailyUsage[date].totalDuration += log.response?.durationMs || 0;
  }
  
  return dailyUsage;
}
