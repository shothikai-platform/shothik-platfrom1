#!/usr/bin/env python3
"""
tinker_paraphrase_train.py - Fine-tune T5 for paraphrasing using Tinker API

Tinker API by Thinking Machines Lab: https://tinker-docs.thinkingmachines.ai/
- No GPU management needed
- Distributed training handled automatically
- Pay only for compute time used
"""

import os
import json
from typing import List, Dict
from datasets import load_dataset

# Check for API key
if not os.getenv("TINKER_API_KEY"):
    print("❌ Error: TINKER_API_KEY not set")
    print("   Get your key from: https://tinker.thinkingmachines.ai/")
    print("   Then run: export TINKER_API_KEY=your_key_here")
    exit(1)

try:
    from tinker import ServiceInterface, TrainingClient, EncodedTextChunk
    from tinker.renderers import Qwen3Renderer
except ImportError:
    print("📦 Installing Tinker library...")
    os.system("pip install -q tinker")
    from tinker import ServiceInterface, TrainingClient, EncodedTextChunk
    from tinker.renderers import Qwen3Renderer

print("🚀 Tinker API Paraphrase Fine-Tuning")
print("=" * 50)

# Configuration
MODEL_NAME = "Qwen3-30B-A3B-Instruct"  # Or "Llama-3.1-8B-Instruct"
OUTPUT_DIR = "./tinker-paraphrase-model"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"\n📋 Configuration:")
print(f"   Model: {MODEL_NAME}")
print(f"   Output: {OUTPUT_DIR}")

# Initialize Tinker service
print("\n🔌 Connecting to Tinker API...")
service = ServiceInterface()

# List available models
print("\n📊 Available models:")
models = service.list_models()
for model in models[:5]:  # Show first 5
    print(f"   - {model}")

# Create training client
print(f"\n🤖 Creating training client for {MODEL_NAME}...")
client = TrainingClient(
    service_interface=service,
    base_model=MODEL_NAME,
)
print("✅ Training client ready")

# Prepare datasets
def prepare_paraphrase_data() -> List[Dict]:
    """Prepare paraphrase training data"""
    print("\n📊 Loading datasets...")
    
    examples = []
    
    # Load PAWS dataset
    try:
        print("   Loading PAWS...")
        paws = load_dataset("paws", "labeled_final", split="train")
        paws = paws.filter(lambda x: x["label"] == 1)  # Only paraphrases
        
        for item in paws.select(range(min(1000, len(paws)))):  # Limit for demo
            examples.append({
                "input": f"Paraphrase this: {item['sentence1']}",
                "output": item["sentence2"]
            })
        print(f"   ✅ PAWS: {len(examples)} examples")
    except Exception as e:
        print(f"   ⚠️  PAWS failed: {e}")
    
    # Load Quora dataset
    try:
        print("   Loading Quora...")
        quora = load_dataset("quora", split="train")
        quora = quora.filter(lambda x: x["is_duplicate"] == 1)
        
        start_idx = len(examples)
        for item in quora.select(range(min(1000, len(quora)))):
            q1 = item["questions"]["text"][0]
            q2 = item["questions"]["text"][1]
            examples.append({
                "input": f"Paraphrase this: {q1}",
                "output": q2
            })
        print(f"   ✅ Quora: {len(examples) - start_idx} examples")
    except Exception as e:
        print(f"   ⚠️  Quora failed: {e}")
    
    print(f"\n📈 Total examples: {len(examples)}")
    return examples

# Prepare training data
training_data = prepare_paraphrase_data()

# Convert to Tinker format
print("\n📝 Formatting for Tinker...")
renderer = Qwen3Renderer()

tinker_examples = []
for ex in training_data[:100]:  # Start with 100 for testing
    # Render input and output
    input_rendered = renderer.render_chat([
        {"role": "user", "content": ex["input"]}
    ])
    
    output_rendered = renderer.render_chat([
        {"role": "assistant", "content": ex["output"]}
    ])
    
    tinker_examples.append({
        "input": input_rendered,
        "output": output_rendered
    })

print(f"✅ Formatted {len(tinker_examples)} examples")

# Training loop
print("\n🏋️  Starting training...")
print("=" * 50)

NUM_EPOCHS = 3
BATCH_SIZE = 8
LEARNING_RATE = 1e-4

print(f"Epochs: {NUM_EPOCHS}")
print(f"Batch size: {BATCH_SIZE}")
print(f"Learning rate: {LEARNING_RATE}")
print(f"Examples: {len(tinker_examples)}")

# Simple training loop
training_log = []

for epoch in range(NUM_EPOCHS):
    print(f"\n📚 Epoch {epoch + 1}/{NUM_EPOCHS}")
    
    epoch_loss = 0
    num_batches = 0
    
    # Process in batches
    for i in range(0, len(tinker_examples), BATCH_SIZE):
        batch = tinker_examples[i:i + BATCH_SIZE]
        
        # Forward pass
        futures = []
        for example in batch:
            future = client.forward_backward(
                input_chunks=[EncodedTextChunk(example["input"])],
                target_chunks=[EncodedTextChunk(example["output"])],
            )
            futures.append(future)
        
        # Wait for completion
        for future in futures:
            result = future.result()
            epoch_loss += result.loss
            num_batches += 1
        
        # Optimization step
        optim_future = client.optim_step(lr=LEARNING_RATE)
        optim_future.result()
        
        if (i // BATCH_SIZE) % 5 == 0:
            avg_loss = epoch_loss / num_batches
            print(f"   Batch {i//BATCH_SIZE}: loss = {avg_loss:.4f}")
    
    avg_epoch_loss = epoch_loss / num_batches
    print(f"   Epoch {epoch + 1} complete: avg_loss = {avg_epoch_loss:.4f}")
    
    training_log.append({
        "epoch": epoch + 1,
        "loss": avg_epoch_loss
    })

# Save training log
with open(f"{OUTPUT_DIR}/training_log.json", "w") as f:
    json.dump(training_log, f, indent=2)

print("\n💾 Saving model weights...")
client.save_weights(f"{OUTPUT_DIR}/model_weights")

# Test the model
print("\n🧪 Testing model...")

test_sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Machine learning is transforming how we work.",
    "Climate change is a major global challenge.",
]

results = []
for sentence in test_sentences:
    prompt = f"Paraphrase this: {sentence}"
    rendered = renderer.render_chat([{"role": "user", "content": prompt}])
    
    sample_future = client.sample(
        input_chunks=[EncodedTextChunk(rendered)],
        max_tokens=100,
        temperature=0.7,
    )
    result = sample_future.result()
    
    paraphrase = result.decode()
    results.append({
        "original": sentence,
        "paraphrase": paraphrase
    })
    
    print(f"\nOriginal: {sentence}")
    print(f"Paraphrase: {paraphrase}")

# Save results
with open(f"{OUTPUT_DIR}/test_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\n" + "=" * 50)
print("🎉 Training complete!")
print(f"📁 Model saved to: {OUTPUT_DIR}/")
print(f"📊 Training log: {OUTPUT_DIR}/training_log.json")
print(f"🧪 Test results: {OUTPUT_DIR}/test_results.json")

# Print summary
print("\n📈 Training Summary:")
print(f"   Model: {MODEL_NAME}")
print(f"   Epochs: {NUM_EPOCHS}")
print(f"   Final loss: {training_log[-1]['loss']:.4f}")
print(f"   Examples: {len(tinker_examples)}")

print("\n🚀 Next steps:")
print("   1. Download weights: client.save_weights('path')")
print("   2. Deploy to vLLM or TGI")
print("   3. Integrate with Shothik API")
