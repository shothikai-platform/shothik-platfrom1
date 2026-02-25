#!/usr/bin/env python3
"""
tinker_train_simple.py - Simplified Tinker API training
"""

import os
import json

# Set API key
os.environ["TINKER_API_KEY"] = "tml-DWAH3U3DkjiuGcdZewOx023YYZ5eg605LyktnqVmesDhef0j4Qo019DVGOiOmvi3RAAAA"

from tinker import ServiceClient, EncodedTextChunk

print("🚀 Tinker API Paraphrase Fine-Tuning")
print("=" * 50)

# Initialize service
print("\n🔌 Connecting to Tinker API...")
service = ServiceClient()
print("✅ Connected!")

# Create training client
MODEL_NAME = "Qwen3-30B-A3B-Instruct"

print(f"\n🤖 Creating training client for {MODEL_NAME}...")
try:
    client = service.create_lora_training_client(
        base_model=MODEL_NAME,
    )
    print("✅ Training client ready!")
except Exception as e:
    print(f"❌ Error creating client: {e}")
    print("\nPossible issues:")
    print("1. Billing still processing (wait 2-3 minutes)")
    print("2. Model name incorrect")
    print("3. API key permissions")
    exit(1)

# Prepare training data
print("\n📝 Preparing training data...")

training_examples = [
    {
        "input": "Paraphrase this: The quick brown fox jumps over the lazy dog.",
        "output": "A swift auburn fox leaps over the indolent hound."
    },
    {
        "input": "Paraphrase this: Machine learning is transforming how we work.",
        "output": "Artificial intelligence is revolutionizing our work processes."
    },
    {
        "input": "Paraphrase this: Climate change is a major global challenge.",
        "output": "Global warming presents a significant worldwide problem."
    },
]

print(f"✅ Loaded {len(training_examples)} training examples")

# Training loop
print("\n🏋️  Starting training...")
print("=" * 50)

NUM_EPOCHS = 2
LEARNING_RATE = 1e-4

print(f"Epochs: {NUM_EPOCHS}")
print(f"Learning rate: {LEARNING_RATE}")

training_log = []

for epoch in range(NUM_EPOCHS):
    print(f"\n📚 Epoch {epoch + 1}/{NUM_EPOCHS}")
    
    epoch_loss = 0
    
    for i, example in enumerate(training_examples):
        print(f"   Processing example {i+1}/{len(training_examples)}...", end=" ")
        
        try:
            # Forward pass
            future = client.forward_backward(
                input_chunks=[EncodedTextChunk(example["input"])],
                target_chunks=[EncodedTextChunk(example["output"])],
            )
            
            result = future.result()
            epoch_loss += result.loss
            print(f"loss={result.loss:.4f}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            continue
    
    # Optimization step
    try:
        optim_future = client.optim_step(lr=LEARNING_RATE)
        optim_future.result()
        print(f"   ✅ Optimizer step complete")
    except Exception as e:
        print(f"   ❌ Optimizer error: {e}")
    
    avg_loss = epoch_loss / len(training_examples)
    print(f"   Epoch {epoch + 1} complete: avg_loss = {avg_loss:.4f}")
    
    training_log.append({
        "epoch": epoch + 1,
        "loss": avg_loss
    })

# Save results
OUTPUT_DIR = "./tinker-paraphrase-model"
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(f"{OUTPUT_DIR}/training_log.json", "w") as f:
    json.dump(training_log, f, indent=2)

print(f"\n✅ Training complete!")
print(f"📁 Output: {OUTPUT_DIR}/training_log.json")

# Test
print("\n🧪 Testing...")
try:
    test_prompt = "Paraphrase this: The weather is beautiful today."
    sample_future = client.sample(
        input_chunks=[EncodedTextChunk(test_prompt)],
        max_tokens=50,
        temperature=0.7,
    )
    result = sample_future.result()
    print(f"Input: The weather is beautiful today.")
    print(f"Output: {result.text}")
except Exception as e:
    print(f"❌ Test error: {e}")

print("\n🎉 Done!")
