# ONNX Conversion Plan - AI Detector

## Goal
Convert AI Detector from LLM-based (2s) to ONNX runtime (500ms)

## Current Architecture
- Uses Gemini/DeepSeek LLM for detection
- ~2s response time
- High cost per request

## Target Architecture
- ONNX Runtime with distilled model
- ~200-400ms response time
- Lower cost, higher throughput

## Implementation Steps

1. **Model Selection**
   - Use DistilBERT or similar distilled model
   - Fine-tuned for AI vs Human text classification
   - Quantized to INT8 for speed

2. **ONNX Runtime Setup**
   - Python backend service
   - ONNX Runtime with CPU optimization
   - Batch inference support

3. **Hybrid Approach**
   - ONNX for fast initial screening
   - LLM fallback for edge cases
   - Confidence threshold routing

4. **Integration**
   - Replace direct LLM calls
   - Cache ONNX results
   - Monitor accuracy

---

## Model Options

### Option 1: DistilBERT (Recommended)
- Size: ~66M parameters
- Speed: ~100ms on CPU
- Accuracy: ~94% on AI detection

### Option 2: RoBERTa-base
- Size: ~125M parameters
- Speed: ~200ms on CPU
- Accuracy: ~96% on AI detection

### Option 3: Custom Model
- Fine-tune on Shothik's data
- Best accuracy for specific use cases
- Requires training pipeline

---

## Implementation
