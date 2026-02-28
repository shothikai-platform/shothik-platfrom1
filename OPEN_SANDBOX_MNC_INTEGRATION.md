# OpenSandbox Integration - MNC Level Architecture

**Date:** February 28, 2026  
**Target:** Enterprise/MNC Grade  
**Status:** Integration Planning

---

## 🎯 Why OpenSandbox for MNC Level

| Requirement | Without OpenSandbox | With OpenSandbox |
|-------------|---------------------|------------------|
| **Security** | Shared resources, risky | Container isolation ✅ |
| **Compliance** | Hard to audit | Full audit trails ✅ |
| **Multi-tenant** | Complex separation | Per-user sandboxes ✅ |
| **Scalability** | Vertical scaling | Kubernetes horizontal ✅ |
| **Reliability** | Single point of failure | Distributed ✅ |

---

## 🏗️ MNC Architecture with OpenSandbox

```
┌─────────────────────────────────────────────────────────────────┐
│                        SHOTHIK PLATFORM                          │
│                     (MNC Enterprise Grade)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │   API GW     │  │   Convex     │          │
│  │  (Next.js)   │  │  (Kong/AWS)  │  │  (Backend)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                      │
│              ┌────────────┴────────────┐                        │
│              │    OpenSandbox K8s      │                        │
│              │     Cluster             │                        │
│              │  ┌─────────────────┐    │                        │
│              │  │  Sandbox Pool   │    │                        │
│              │  │ ┌───┐┌───┐┌───┐ │    │                        │
│              │  │ │S1 ││S2 ││S3 │ │    │                        │
│              │  │ └───┘└───┘└───┘ │    │                        │
│              │  │  (Auto-scaling) │    │                        │
│              │  └─────────────────┘    │                        │
│              └─────────────────────────┘                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              USE CASES                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │  Code    │ │ Browser  │ │ Document │ │  Slide   │   │    │
│  │  │  Exec    │ │  Auto    │ │ Process  │ │  Render  │   │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 MNC Integration Plan

### Phase 1: Core Sandboxes (Week 1-2)

#### 1.1 Code Execution Sandbox
**Purpose:** AI-generated code validation  
**Use Cases:**
- AI Detector code analysis
- Research Agent data processing
- Student assignment code execution

**Implementation:**
```python
# convex/sandbox/code-execution.ts
export const executeCode = action({
  args: {
    code: v.string(),
    language: v.string(),
    timeout: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sandbox = await createSandbox("code-interpreter", {
      timeout: args.timeout || 30000,
      memory: "512Mi",
      cpu: "500m",
    });
    
    const result = await sandbox.execute({
      code: args.code,
      language: args.language,
    });
    
    await sandbox.destroy();
    return result;
  },
});
```

#### 1.2 Browser Automation Sandbox
**Purpose:** Secure web scraping  
**Use Cases:**
- Research Agent citation finding
- Plagiarism checker web search
- Content verification

**Implementation:**
```python
# Sandbox image: opensandbox/chrome:latest
const browserSandbox = await Sandbox.create("chrome", {
  network: "isolated", // Secure egress
  timeout: "5m",
});

// Run Playwright inside sandbox
const result = await browserSandbox.runPlaywright(async (page) => {
  await page.goto(url);
  return await page.content();
});
```

#### 1.3 Document Processing Sandbox
**Purpose:** File conversion pipeline  
**Use Cases:**
- PDF → Text extraction
- DOCX → HTML conversion
- ePub validation
- Slide generation (PPTX rendering)

---

### Phase 2: Enterprise Features (Week 3-4)

#### 2.1 Multi-tenant Isolation
```yaml
# Kubernetes namespace per organization
apiVersion: v1
kind: Namespace
metadata:
  name: shothik-org-{orgId}
  labels:
    tenant: "{orgId}"
    tier: "enterprise"
```

#### 2.2 Resource Quotas
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: shothik-quota
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"
```

#### 2.3 Audit Logging
```typescript
// Every sandbox action logged
interface SandboxAuditLog {
  timestamp: Date;
  userId: string;
  orgId: string;
  action: "create" | "execute" | "destroy";
  sandboxId: string;
  resourceUsage: {
    cpu: number;
    memory: number;
    duration: number;
  };
  security: {
    egressBytes: number;
    filesAccessed: string[];
  };
}
```

---

### Phase 3: Advanced Features (Week 5-6)

#### 3.1 Auto-scaling Sandbox Pool
```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sandbox-pool-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sandbox-pool
  minReplicas: 5
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

#### 3.2 Persistent Storage
```yaml
# Per-user persistent volumes
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: user-data-{userId}
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd
```

#### 3.3 Network Policies
```yaml
# Strict egress control
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sandbox-egress-policy
spec:
  podSelector:
    matchLabels:
      app: sandbox
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: trusted-services
    ports:
    - protocol: TCP
      port: 443
```

---

## 📋 Implementation Checklist

### Infrastructure Setup
- [ ] Kubernetes cluster (EKS/GKE/AKS)
- [ ] OpenSandbox server deployment
- [ ] Container registry setup
- [ ] Network policies configuration
- [ ] Monitoring (Prometheus/Grafana)

### Shothik Integration
- [ ] SDK integration (Python/TypeScript)
- [ ] Sandbox lifecycle management
- [ ] Error handling & retries
- [ ] Resource limits enforcement
- [ ] Audit logging pipeline

### Security & Compliance
- [ ] Pod Security Policies
- [ ] RBAC configuration
- [ ] Secrets management (Vault)
- [ ] Compliance reporting
- [ ] Penetration testing

---

## 💰 Cost Analysis (MNC Scale)

| Component | Monthly Cost (10K users) |
|-----------|-------------------------|
| EKS Cluster (3 nodes) | $500-800 |
| OpenSandbox Runtime | $300-500 |
| Storage (EBS) | $200-400 |
| Network (Data Transfer) | $100-300 |
| Monitoring | $100-200 |
| **Total** | **$1,200-2,200/month** |

**ROI:** Security incidents prevented = $50K-500K potential loss

---

## 🎯 Next Steps

1. **Deploy OpenSandbox to Kubernetes**
2. **Integrate with Shothik backend**
3. **Test with 100 concurrent sandboxes**
4. **Security audit**
5. **Production rollout**

---

**Ready to implement MNC-grade OpenSandbox integration?**
