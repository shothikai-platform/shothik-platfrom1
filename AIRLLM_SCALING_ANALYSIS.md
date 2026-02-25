# AirLLM Analysis - Hosting at Scale & Cost Estimation

**Repository:** https://github.com/lyogavin/airllm  
**Analysis Date:** February 24, 2026

---

## 🎯 What is AirLLM?

AirLLM is a **memory optimization library** for LLM inference that allows running massive models on consumer GPUs:

- **70B models** on **4GB GPU** (without quantization!)
- **405B Llama 3.1** on **8GB GPU**
- Works with Llama, Qwen, Mistral, ChatGLM, Baichuan, etc.

### Key Innovation:
**Layer-wise inference** - Loads one layer at a time instead of full model

```
Traditional: Load 70B model (140GB) → Run inference
AirLLM:      Load Layer 1 → Process → Unload → Load Layer 2 → ...
              (Only 4GB needed at any time)
```

---

## 📊 Performance Characteristics

### Memory Usage

| Model Size | Traditional | AirLLM | Savings |
|------------|-------------|--------|---------|
| **7B** | 14GB | 2GB | 86% |
| **13B** | 26GB | 2GB | 92% |
| **70B** | 140GB | 4GB | 97% |
| **405B** | 810GB | 8GB | 99% |

### Speed Trade-offs

| Metric | Traditional | AirLLM | Impact |
|--------|-------------|--------|--------|
| **First token latency** | 2-5s | 10-30s | ⚠️ Slower |
| **Throughput** | High | Medium | ⚠️ Lower |
| **Memory** | Very High | Very Low | ✅ Huge savings |

**Best for:** Low-memory environments, not high-throughput production

---

## 🏗️ Hosting at Scale - Architecture Options

### Option 1: Self-Hosted with AirLLM (Not Recommended for Scale)

```
User Request → Load Layer 1 → Process → Unload → Load Layer 2 → ... → Response
                ↑_________________________________________________↓
                                    (Sequential, Slow)
```

**Problems at Scale:**
- ❌ Sequential processing (can't batch efficiently)
- ❌ High latency (10-30s per request)
- ❌ Disk I/O bottleneck
- ❌ Not designed for concurrent users

**Verdict:** ❌ **NOT suitable for production scale**

---

### Option 2: vLLM + Standard GPUs (Recommended for Scale)

```
                    ┌─────────────────┐
User Requests ─────→│  Load Balancer  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐          ┌────▼────┐          ┌────▼────┐
   │ vLLM    │          │ vLLM    │          │ vLLM    │
   │ Server 1│          │ Server 2│          │ Server 3│
   │ A100    │          │ A100    │          │ A100    │
   └─────────┘          └─────────┘          └─────────┘
```

**Benefits:**
- ✅ PagedAttention (efficient batching)
- ✅ Continuous batching
- ✅ High throughput (10-100x AirLLM)
- ✅ Production-ready

---

### Option 3: Hybrid - AirLLM for Edge, vLLM for Core

```
┌─────────────────────────────────────────────────────────┐
│                    Production Traffic                    │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │ vLLM    │   │ vLLM    │   │ vLLM    │
    │ A100    │   │ A100    │   │ A100    │
    │ 70B     │   │ 70B     │   │ 70B     │
    └─────────┘   └─────────┘   └─────────┘
         ↑             ↑             ↑
         │   90% of traffic         │
         │   (Fast, batched)        │
         │                          │
    ┌────┴──────────────────────────┘
    │
    │ 10% of traffic (Edge cases, low memory)
    ↓
┌─────────────────┐
│ AirLLM Server   │
│ RTX 4090 (24GB) │
│ 405B model      │
└─────────────────┘
```

---

## 💰 Cost Analysis - Hosting at Scale

### Scenario: 10,000 users, 100 requests/user/day = 1M requests/day

#### Option A: AirLLM (NOT RECOMMENDED)

```
Architecture: Single RTX 4090 with AirLLM
Problem: Sequential processing, 30s per request

Capacity: 1 request at a time
Throughput: 120 requests/hour = 2,880 requests/day

To handle 1M requests/day:
- Need: 1,000,000 / 2,880 = 347 servers
- Cost: 347 × $2,000 (RTX 4090) = $694,000 hardware
- Or cloud: 347 × $1.20/hour = $10,000/day = $300,000/month

❌ IMPRACTICAL
```

#### Option B: vLLM with A100 (RECOMMENDED)

```
Architecture: vLLM with continuous batching
Throughput: ~1000 requests/hour per A100

To handle 1M requests/day:
- Need: 1,000,000 / 24,000 = 42 A100s
- Cloud cost: 42 × $2.50/hour = $2,520/day = $75,600/month

✅ PRACTICAL
```

#### Option C: API-based (EASIEST)

```
Using OpenAI/Anthropic/Together API:
- Cost: ~$0.002/1K tokens
- 1M requests × 500 tokens = $1,000/day = $30,000/month

✅ SIMPLEST, comparable cost
```

---

## 📈 Detailed Cost Breakdown

### For Your Paraphrase Service

**Assumptions:**
- 10,000 active users
- 50 requests/user/day
- 500 tokens/request (input + output)
- Total: 500,000 requests/day = 250M tokens/day

| Hosting Option | Setup | Monthly Cost | Latency | Scale |
|----------------|-------|--------------|---------|-------|
| **AirLLM Self-hosted** | $50K+ | $150,000+ | 30s | ❌ Poor |
| **vLLM A100 (8x)** | $5K | $15,000 | 2s | ✅ Good |
| **vLLM A100 (Auto-scale)** | $2K | $10,000-20,000 | 2s | ✅ Excellent |
| **Together API** | $0 | $12,000 | 1s | ✅ Excellent |
| **OpenAI API** | $0 | $15,000 | 1s | ✅ Excellent |

---

## 🎯 Recommendation for Shothik

### Current Setup (T5 + Fallbacks)
```
Cost: $25/1K requests
Monthly: $12,500 (for 500K requests/day)
```

### Recommended: vLLM Self-Hosted
```
Setup:
- 4-8 × A100 40GB servers
- vLLM with continuous batching
- Load balancer

Cost:
- Setup: ~$5,000 (cloud) or $80,000 (buy hardware)
- Monthly: $10,000-15,000
- Savings: $0-2,500/month vs current

Benefits:
- Full control
- Lower latency
- Better privacy
- Custom fine-tuning
```

### Alternative: API-Based
```
Together AI or OpenAI:
- Monthly: $12,000-15,000
- Zero setup
- Instant scale
- Higher per-request cost
```

---

## 🚀 AirLLM Use Cases

### ✅ Good For:
1. **Development/Testing** - Run 70B models on laptop
2. **Edge Deployment** - Run on device with limited memory
3. **Batch Processing** - Offline jobs, not real-time
4. **Prototyping** - Test large models without big GPUs

### ❌ Bad For:
1. **High-throughput API** - Too slow for many users
2. **Real-time chat** - 30s latency unacceptable
3. **Production scale** - Can't handle concurrent requests
4. **Cost efficiency** - Needs too many instances

---

## 📋 Summary

| Question | Answer |
|----------|--------|
| **Can AirLLM host at scale?** | ❌ No - designed for memory efficiency, not throughput |
| **What to use instead?** | ✅ vLLM, TGI, or API-based solutions |
| **Cost for 10K users?** | $10K-15K/month with vLLM |
| **AirLLM best use?** | Development, edge, prototyping |

### Bottom Line:
**Don't use AirLLM for production scale.** Use vLLM with proper GPUs or API-based solutions for Shothik's paraphrase service.
