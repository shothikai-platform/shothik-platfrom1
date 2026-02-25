# AI Detector ONNX - Deployment Guide

## Overview
Hybrid AI detection service with ONNX Runtime + LLM fallback.

**Performance Target:**
- ONNX only: ~100-200ms
- With fallback: ~200-500ms (vs current 2s)

---

## Quick Start

### 1. Build Model (One-time)

```bash
cd backend-services/ai-detector-onnx

# Download and convert model
python convert_model.py \
  --model distilbert-base-uncased \
  --output /models/ai-detector.onnx \
  --quantize \
  --optimize

# Or use pre-converted model
wget https://shothik-models.s3.amazonaws.com/ai-detector-quantized.onnx \
  -O /models/ai-detector.onnx
```

### 2. Run with Docker

```bash
# Build image
docker build -t shothik-ai-detector .

# Run
docker run -p 8001:8001 \
  -v /models:/models \
  -e ONNX_MODEL_PATH=/models/ai-detector.onnx \
  -e LLM_API_URL=http://llm-service:8002 \
  shothik-ai-detector
```

### 3. Test

```bash
# Health check
curl http://localhost:8001/health

# Detection
curl -X POST http://localhost:8001/detect \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test sentence."}'

# Benchmark
curl http://localhost:8001/benchmark
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/detect` | POST | Detect AI-generated text |
| `/benchmark` | GET | Performance benchmark |

### Detect Request

```json
{
  "text": "Text to analyze...",
  "detailed": false,
  "use_fallback": true
}
```

### Detect Response

```json
{
  "is_ai": true,
  "confidence": 0.89,
  "ai_probability": 0.89,
  "human_probability": 0.11,
  "perplexity": 65.2,
  "burstiness": 0.15,
  "inference_time_ms": 145,
  "onnx_time_ms": 120,
  "llm_time_ms": 0,
  "fallback_used": false,
  "model": "onnx-distilbert"
}
```

---

## Configuration

| Env Variable | Default | Description |
|--------------|---------|-------------|
| `ONNX_MODEL_PATH` | `/models/ai-detector.onnx` | Path to ONNX model |
| `TOKENIZER_NAME` | `distilbert-base-uncased` | HuggingFace tokenizer |
| `CONFIDENCE_THRESHOLD` | `0.75` | Route to LLM below this |
| `LLM_API_URL` | `http://localhost:8002` | LLM fallback endpoint |
| `LLM_API_KEY` | - | API key for LLM service |

---

## Performance Tuning

### ONNX Runtime Options

```python
# In main.py, adjust these for your hardware:

sess_options.intra_op_num_threads = 4  # Match CPU cores
sess_options.inter_op_num_threads = 4

# Providers (priority order)
providers = [
    "CUDAExecutionProvider",  # If GPU available
    "CPUExecutionProvider"
]
```

### Expected Performance

| Hardware | ONNX Only | With Fallback |
|----------|-----------|---------------|
| CPU (4 cores) | ~150ms | ~200-400ms |
| CPU (8 cores) | ~100ms | ~150-300ms |
| GPU (T4) | ~50ms | ~100-250ms |

---

## Model Training (Optional)

To train your own model for better accuracy:

```python
# Fine-tune DistilBERT on AI vs Human text
from transformers import DistilBertForSequenceClassification, Trainer

model = DistilBertForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=2
)

# Train on dataset
trainer = Trainer(
    model=model,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset
)
trainer.train()

# Convert to ONNX
python convert_model.py --model ./fine-tuned-model --output /models/ai-detector.onnx
```

### Recommended Datasets

- **HC3** (Human ChatGPT Comparison Corpus)
- **GhostBuster** dataset
- **Shothik internal data** (user-labeled examples)

---

## Monitoring

```bash
# Check circuit breaker status
curl http://localhost:8001/metrics

# View logs
docker logs -f shothik-ai-detector
```

---

## Integration with Main App

Update `apps/web/services/ai-detector.ts`:

```typescript
const ONNX_API_URL = process.env.NEXT_PUBLIC_ONNX_API_URL || "http://localhost:8001";

export async function detectAI(text: string) {
  const response = await fetch(`${ONNX_API_URL}/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, use_fallback: true })
  });
  return response.json();
}
```
