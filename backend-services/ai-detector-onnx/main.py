# AI Detector ONNX Service
# Fast AI text detection using ONNX Runtime

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import onnxruntime as ort
import numpy as np
from transformers import AutoTokenizer
import time
import os
from typing import List, Optional

app = FastAPI(title="Shothik AI Detector - ONNX")

# ============================================
# Model Configuration
# ============================================

MODEL_PATH = os.getenv("ONNX_MODEL_PATH", "/models/ai-detector.onnx")
TOKENIZER_NAME = os.getenv("TOKENIZER_NAME", "distilbert-base-uncased")
MAX_LENGTH = 512
CONFIDENCE_THRESHOLD = 0.7  # Route to LLM if below

# ============================================
# ONNX Runtime Setup
# ============================================

class ONNXAIDetector:
    def __init__(self):
        self.session = None
        self.tokenizer = None
        self._load_model()
    
    def _load_model(self):
        """Load ONNX model and tokenizer"""
        try:
            # ONNX Runtime with CPU optimization
            sess_options = ort.SessionOptions()
            sess_options.intra_op_num_threads = 4
            sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            
            self.session = ort.InferenceSession(
                MODEL_PATH,
                sess_options,
                providers=["CPUExecutionProvider"]
            )
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_NAME)
            
            print(f"✅ ONNX model loaded: {MODEL_PATH}")
            print(f"   Input names: {[inp.name for inp in self.session.get_inputs()]}")
            print(f"   Output names: {[out.name for out in self.session.get_outputs()]}")
            
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            raise
    
    def preprocess(self, text: str) -> dict:
        """Tokenize input text"""
        encoded = self.tokenizer(
            text,
            padding="max_length",
            truncation=True,
            max_length=MAX_LENGTH,
            return_tensors="np"
        )
        return {
            "input_ids": encoded["input_ids"].astype(np.int64),
            "attention_mask": encoded["attention_mask"].astype(np.int64)
        }
    
    def predict(self, text: str) -> dict:
        """Run inference"""
        start_time = time.time()
        
        # Preprocess
        inputs = self.preprocess(text)
        
        # Run ONNX inference
        outputs = self.session.run(
            None,
            {
                "input_ids": inputs["input_ids"],
                "attention_mask": inputs["attention_mask"]
            }
        )
        
        # Post-process
        # Assuming output is [batch_size, 2] for binary classification
        # [human_prob, ai_prob]
        logits = outputs[0][0]
        probs = self._softmax(logits)
        
        human_prob = float(probs[0])
        ai_prob = float(probs[1])
        
        # Calculate perplexity and burstiness heuristics
        perplexity = self._estimate_perplexity(text)
        burstiness = self._calculate_burstiness(text)
        
        inference_time = (time.time() - start_time) * 1000  # ms
        
        return {
            "is_ai": ai_prob > 0.5,
            "confidence": max(ai_prob, human_prob),
            "ai_probability": ai_prob,
            "human_probability": human_prob,
            "perplexity": perplexity,
            "burstiness": burstiness,
            "inference_time_ms": inference_time,
            "model": "onnx-distilbert",
            "requires_llm_fallback": max(ai_prob, human_prob) < CONFIDENCE_THRESHOLD
        }
    
    def predict_batch(self, texts: List[str]) - List[dict]:
        """Batch inference for multiple texts"""
        results = []
        for text in texts:
            results.append(self.predict(text))
        return results
    
    def _softmax(self, x: np.ndarray) - np.ndarray:
        """Softmax activation"""
        exp_x = np.exp(x - np.max(x))
        return exp_x / exp_x.sum()
    
    def _estimate_perplexity(self, text: str) - float:
        """Estimate perplexity heuristically"""
        words = text.split()
        if len(words) < 2:
            return 0.0
        
        # Simple entropy-based estimation
        unique_words = set(words)
        entropy = len(unique_words) / len(words)
        
        # Convert to approximate perplexity scale (50-150 typical)
        perplexity = 50 + (1 - entropy) * 100
        return min(150, max(50, perplexity))
    
    def _calculate_burstiness(self, text: str) - float:
        """Calculate text burstiness"""
        sentences = text.split(". ")
        if len(sentences) < 2:
            return 0.0
        
        lengths = [len(s.split()) for s in sentences if s.strip()]
        if not lengths:
            return 0.0
        
        mean_len = np.mean(lengths)
        std_len = np.std(lengths)
        
        # Burstiness = std / mean
        burstiness = std_len / mean_len if mean_len > 0 else 0
        return min(1.0, burstiness)

# Singleton instance
detector = None

def get_detector() - ONNXAIDetector:
    global detector
    if detector is None:
        detector = ONNXAIDetector()
    return detector

# ============================================
# FastAPI Endpoints
# ============================================

class DetectRequest(BaseModel):
    text: str
    detailed: bool = False
    use_fallback: bool = True  # Allow LLM fallback

class DetectResponse(BaseModel):
    is_ai: bool
    confidence: float
    ai_probability: float
    human_probability: float
    perplexity: float
    burstiness: float
    inference_time_ms: float
    model: str
    fallback_used: bool = False

class BatchDetectRequest(BaseModel):
    texts: List[str]
    detailed: bool = False

@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        det = get_detector()
        return {
            "status": "healthy",
            "model_loaded": det.session is not None,
            "model_path": MODEL_PATH
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.post("/detect", response_model=DetectResponse)
def detect(request: DetectRequest):
    """Detect if text is AI-generated"""
    try:
        det = get_detector()
        result = det.predict(request.text)
        
        # TODO: Implement LLM fallback if confidence is low
        # For now, return ONNX result directly
        
        return DetectResponse(
            is_ai=result["is_ai"],
            confidence=result["confidence"],
            ai_probability=result["ai_probability"],
            human_probability=result["human_probability"],
            perplexity=result["perplexity"],
            burstiness=result["burstiness"],
            inference_time_ms=result["inference_time_ms"],
            model=result["model"],
            fallback_used=False
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect/batch")
def detect_batch(request: BatchDetectRequest):
    """Batch detection for multiple texts"""
    try:
        det = get_detector()
        results = det.predict_batch(request.texts)
        return {
            "results": results,
            "count": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
def get_metrics():
    """Get model performance metrics"""
    # TODO: Add actual metrics collection
    return {
        "model": "distilbert-onnx",
        "average_inference_time_ms": 150,  # Target
        "total_requests": 0,
        "cache_hit_rate": 0.0
    }

# ============================================
# Startup
# ============================================

@app.on_event("startup")
async def startup_event():
    """Warm up model on startup"""
    print("🚀 Starting AI Detector ONNX Service...")
    det = get_detector()
    
    # Warm up with dummy inference
    dummy_text = "This is a warm-up text to initialize the model."
    result = det.predict(dummy_text)
    print(f"   Warm-up complete: {result['inference_time_ms']:.1f}ms")
    print("✅ Service ready")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
