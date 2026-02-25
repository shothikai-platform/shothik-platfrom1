#!/usr/bin/env python3
"""
tinker_inference.py - Inference using fine-tuned Tinker model
"""

import os
from tinker import ServiceInterface, TrainingClient, EncodedTextChunk
from tinker.renderers import Qwen3Renderer

print("🚀 Tinker Paraphrase Inference")
print("=" * 50)

# Check API key
if not os.getenv("TINKER_API_KEY"):
    print("❌ Error: TINKER_API_KEY not set")
    exit(1)

# Initialize
service = ServiceInterface()
renderer = Qwen3Renderer()

# Load fine-tuned model
MODEL_PATH = "./tinker-paraphrase-model/model_weights"

print(f"📥 Loading model from {MODEL_PATH}...")
client = TrainingClient(
    service_interface=service,
    base_model="Qwen3-30B-A3B-Instruct",  # Same as training
    checkpoint_path=MODEL_PATH,
)
print("✅ Model loaded")

def paraphrase(text: str, num_variants: int = 3) -> list:
    """Generate paraphrases for input text"""
    
    prompt = f"Paraphrase this text in {num_variants} different ways: {text}"
    rendered = renderer.render_chat([{"role": "user", "content": prompt}])
    
    results = []
    for _ in range(num_variants):
        future = client.sample(
            input_chunks=[EncodedTextChunk(rendered)],
            max_tokens=200,
            temperature=0.8,  # Higher for variety
            top_p=0.95,
        )
        result = future.result()
        results.append(result.decode())
    
    return results

# Interactive mode
print("\n✅ Ready! Enter text to paraphrase (or 'quit' to exit):")

while True:
    try:
        text = input("\n> ")
        if text.lower() in ["quit", "exit", "q"]:
            break
        
        if not text.strip():
            continue
        
        print("\n🔄 Generating paraphrases...")
        paraphrases = paraphrase(text, num_variants=3)
        
        print("\n📝 Results:")
        for i, p in enumerate(paraphrases, 1):
            print(f"   {i}. {p}")
            
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        break
    except Exception as e:
        print(f"❌ Error: {e}")
