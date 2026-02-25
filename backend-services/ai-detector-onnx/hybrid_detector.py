# AI Detector with ONNX + LLM Fallback
# Hybrid approach for best speed and accuracy

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import onnxruntime as ort
import numpy as np
from transformers import AutoTokenizer
import time
import os
from typing import Optional
import httpx

app = FastAPI(title="Shothik AI Detector - Hybrid")

# ============================================
# Configuration
# ============================================

ONNX_MODEL_PATH = os.getenv("ONNX_MODEL_PATH", "/models/ai-detector.onnx")
TOKENIZER_NAME = os.getenv("TOKENIZER_NAME", "distilbert-base-uncased")
MAX_LENGTH = 512

# Fallback thresholds
CONFIDENCE_THRESHOLD = 0.75  # Route to LLM if confidence below this
PERPLEXITY_THRESHOLD = 80    # High perplexity = likely human
BURSTINESS_THRESHOLD = 0.3   # High burstiness = likely human

# LLM API endpoints
LLM_API_URL = os.getenv("LLM_API_URL", "http://localhost:8002")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")

# ============================================
# ONNX Detector
# ============================================

class ONNXDetector:
    def __init__(self):
        self.session = None
        self.tokenizer = None
        self._load()
    
    def _load(self):
        sess_options = ort.SessionOptions()
        sess_options.intra_op_num_threads = 4
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        
        self.session = ort.InferenceSession(
            ONNX_MODEL_PATH,
            sess_options,
            providers=["CPUExecutionProvider"]
        )
        
        self.tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_NAME)
    
    def predict(self, text: str) -> dict:
        start = time.time()
        
        # Tokenize
        encoded = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=MAX_LENGTH,
            return_tensors="np"
        )
        
        # Inference
        outputs = self.session.run(
            None,
            {
                "input_ids": encoded["input_ids"].astype(np.int64),
                "attention_mask": encoded["attention_mask"].astype(np.int64)
            }
        )
        
        # Post-process
        logits = outputs[0][0]
        probs = self._softmax(logits)
        
        inference_time = (time.time() - start) * 1000
        
        return {
            "ai_probability": float(probs[1]),
            "human_probability": float(probs[0]),
            "confidence": float(max(probs)),
            "inference_time_ms": inference_time
        }
    
    def _softmax(self, x):
        exp_x = np.exp(x - np.max(x))
        return exp_x / exp_x.sum()

# ============================================
# LLM Fallback
# ============================================

class LLMFallback:
    """LLM-based detection for edge cases"""
    
    async def predict(self, text: str) -> dict:
        """Use LLM for detection when ONNX is uncertain"""
        
        prompt = f"""Analyze the following text and determine if it was written by AI or a human.

Text to analyze:
"""{text[:2000]}"""

Provide your analysis in this exact format:
AI Probability: [0-100]%
Human Probability: [0-100]%
Reasoning: [brief explanation]
"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{LLM_API_URL}/complete",
                    headers={"Authorization": f"Bearer {LLM_API_KEY}"},
                    json={
                        "prompt": prompt,
                        "temperature": 0.1,
                        "max_tokens": 200
                    },
                    timeout=10.0
                )
                
                result = response.json()
                analysis = result.get("text", "")
                
                # Parse probabilities from response
                ai_prob = self._extract_probability(analysis, "AI")
                human_prob = self._extract_probability(analysis, "Human")
                
                return {
                    "ai_probability": ai_prob,
                    "human_probability": human_prob,
                    "confidence": max(ai_prob, human_prob),
                    "reasoning": analysis,
                    "model": "llm-fallback"
                }
                
        except Exception as e:
            print(f"LLM fallback failed: {e}")
            # Return uncertain result
            return {
                "ai_probability": 0.5,
                "human_probability": 0.5,
                "confidence": 0.5,
                "error": str(e),
                "model": "llm-fallback-failed"
            }
    
    def _extract_probability(self, text: str, label: str) -> float:
        """Extract probability from LLM response"""
        import re
        
        # Look for patterns like "AI Probability: 85%" or "AI: 85%"
        pattern = rf"{label}\s*(?:Probability)?\s*[:\-]?\s*(\d+)%"
        match = re.search(pattern, text, re.IGNORECASE)
        
        if match:
            return float(match.group(1)) / 100
        
        return 0.5  # Default to uncertain

# ============================================
# Hybrid Detector
# ============================================

class HybridAIDetector:
    def __init__(self):
        self.onnx = ONNXDetector()
        self.llm = LLMFallback()
    
    async def detect(self, text: str, use_fallback: bool = True) -> dict:
        """
        Hybrid detection pipeline:
        1. Fast ONNX screening (~100-200ms)
        2. Route to LLM if confidence is low (~1-2s)
        3. Combine results
        """
        start_total = time.time()
        
        # Step 1: ONNX fast screening
        onnx_result = self.onnx.predict(text)
        onnx_time = onnx_result["inference_time_ms"]
        
        # Calculate additional metrics
        perplexity = self._estimate_perplexity(text)
        burstiness = self._calculate_burstiness(text)
        
        # Determine if LLM fallback is needed
        needs_fallback = (
            use_fallback and
            onnx_result["confidence"] < CONFIDENCE_THRESHOLD
        )
        
        if not needs_fallback:
            # Return ONNX result directly
            total_time = (time.time() - start_total) * 1000
            
            return {
                "is_ai": onnx_result["ai_probability"] > 0.5,
                "confidence": onnx_result["confidence"],
                "ai_probability": onnx_result["ai_probability"],
                "human_probability": onnx_result["human_probability"],
                "perplexity": perplexity,
                "burstiness": burstiness,
                "inference_time_ms": total_time,
                "onnx_time_ms": onnx_time,
                "llm_time_ms": 0,
                "fallback_used": False,
                "model": "onnx-distilbert"
            }
        
        # Step 2: LLM fallback for uncertain cases
        llm_start = time.time()
        llm_result = await self.llm.predict(text)
        llm_time = (time.time() - llm_start) * 1000
        
        total_time = (time.time() - start_total) * 1000
        
        # Combine results (weighted average)
        # ONNX: 60%, LLM: 40% (LLM is more accurate but slower)
        combined_ai_prob = (
            onnx_result["ai_probability"] * 0.6 +
            llm_result["ai_probability"] * 0.4
        )
        
        return {
            "is_ai": combined_ai_prob > 0.5,
            "confidence": max(combined_ai_prob, 1 - combined_ai_prob),
            "ai_probability": combined_ai_prob,
            "human_probability": 1 - combined_ai_prob,
            "perplexity": perplexity,
            "burstiness": burstiness,
            "inference_time_ms": total_time,
            "onnx_time_ms": onnx_time,
            "llm_time_ms": llm_time,
            "fallback_used": True,
            "model": "hybrid-onnx-llm",
            "llm_reasoning": llm_result.get("reasoning", "")
        }
    
    def _estimate_perplexity(self, text: str) -> float:
        words = text.split()
        if len(words) < 2:
            return 0.0
        
        unique_words = set(words)
        entropy = len(unique_words) / len(words)
        perplexity = 50 + (1 - entropy) * 100
        
        return min(150, max(50, perplexity))
    
    def _calculate_burstiness(self, text: str) -> float:
        sentences = text.split(". ")
        if len(sentences) < 2:
            return 0.0
        
        lengths = [len(s.split()) for s in sentences if s.strip()]
        if not lengths:
            return 0.0
        
        mean_len = np.mean(lengths)
        std_len = np.std(lengths)
        
        burstiness = std_len / mean_len if mean_len > 0 else 0
        return min(1.0, burstiness)

# Singleton
detector = None

def get_detector() -> HybridAIDetector:
    global detector
    if detector is None:
        detector = HybridAIDetector()
    return detector

# ============================================
# API Endpoints
# ============================================

class DetectRequest(BaseModel):
    text: str
    detailed: bool = False
    use_fallback: bool = True

class DetectResponse(BaseModel):
    is_ai: bool
    confidence: float
    ai_probability: float
    human_probability: float
    perplexity: float
    burstiness: float
    inference_time_ms: float
    onnx_time_ms: float
    llm_time_ms: float
    fallback_used: bool
    model: str

@app.get("/health")
def health_check():
    try:
        det = get_detector()
        return {
            "status": "healthy",
            "onnx_loaded": det.onnx.session is not None,
            "model_path": ONNX_MODEL_PATH
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}

@app.post("/detect", response_model=DetectResponse)
async def detect(request: DetectRequest):
    try:
        det = get_detector()
        result = await det.detect(request.text, request.use_fallback)
        return DetectResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/benchmark")
async def benchmark():
    """Benchmark ONNX vs LLM performance"""
    
    test_texts = [
        "The quick brown fox jumps over the lazy dog.",
        "In the realm of computational linguistics, transformer architectures have revolutionized natural language processing by enabling parallel processing of sequential data through self-attention mechanisms.",
        "Yo what's up! Just wanted to hit you up about the party this weekend. It's gonna be lit! 🔥",
    ]
    
    results = []
    det = get_detector()
    
    for text in test_texts:
        # ONNX only
        onnx_start = time.time()
        onnx_result = det.onnx.predict(text)
        onnx_time = (time.time() - onnx_start) * 1000
        
        # With fallback
        hybrid_start = time.time()
        hybrid_result = await det.detect(text, use_fallback=True)
        hybrid_time = (time.time() - hybrid_start) * 1000
        
        results.append({
            "text_preview": text[:50] + "...",
            "onnx_time_ms": onnx_time,
            "hybrid_time_ms": hybrid_time,
            "fallback_used": hybrid_result["fallback_used"],
            "ai_probability": hybrid_result["ai_probability"]
        })
    
    return {
        "benchmarks": results,
        "average_onnx_ms": sum(r["onnx_time_ms"] for r in results) / len(results),
        "average_hybrid_ms": sum(r["hybrid_time_ms"] for r in results) / len(results)
    }

@app.on_event("startup")
async def startup():
    print("🚀 Starting Hybrid AI Detector...")
    det = get_detector()
    
    # Warm up
    result = det.onnx.predict("Warm up text.")
    print(f"   ONNX warm-up: {result['inference_time_ms']:.1f}ms")
    print("✅ Ready")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
