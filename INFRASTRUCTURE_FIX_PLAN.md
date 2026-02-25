# HIGH Priority Infrastructure Fixes

## Issues to Fix

1. **Redis Caching** - Set up Redis for rate limiting and AI tool caching
2. **Convex Production Deploy** - Get stable production URL
3. **Writing Studio Persistence** - Migrate from localStorage to Convex
4. **ONNX Conversion** - Speed up AI Detector (2s → 500ms)
5. **Circuit Breakers** - AI Gateway with DeepSeek → Gemini fallback

---

## Execution Order

1. Redis Setup (infrastructure)
2. Convex Production Deploy (backend)
3. Writing Studio Migration (frontend + backend)
4. AI Gateway + Circuit Breakers (backend)
5. ONNX Conversion (AI/ML)

Let me start.
