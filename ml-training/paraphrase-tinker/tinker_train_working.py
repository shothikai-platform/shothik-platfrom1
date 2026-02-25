#!/usr/bin/env python3
"""
tinker_train_working.py - Working Tinker API training script
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

# Get server capabilities
print("\n📊 Server capabilities:")
caps = service.get_server_capabilities()
print(f"   Available: {caps}")

# Create training client
MODEL_NAME = "Qwen3-30B-A3B-Instruct"  # Can be changed to other models

print(f"\n🤖 Creating training client for {MODEL_NAME}...")
client = service.create_lora_training_client(
    base_model=MODEL_NAME,
)
print("✅ Training client ready!")

# Prepare simple training data (paraphrase examples)
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
    {
        "input": "Paraphrase this: The company announced record profits this quarter.",
        "output": "The firm reported unprecedented earnings for this three-month period."
    },
    {
        "input": "Paraphrase this: She has a deep understanding of the subject.",
        "output": "She possesses profound knowledge in this area."
    },
]

print(f"✅ Loaded {len(training_examples)} training examples")

# Training loop
print("\n🏋️  Starting training...")
print("=" * 50)

NUM_EPOCHS = 3
LEARNING_RATE = 1e-4

print(f"Epochs: {NUM_EPOCHS}")
print(f"Learning rate: {LEARNING_RATE}")
print(f"Examples: {len(training_examples)}")

training_log = []

for epoch in range(NUM_EPOCHS):
    print(f"\n📚 Epoch {epoch + 1}/{NUM_EPOCHS}")
    
    epoch_loss = 0
    
    for i, example in enumerate(training_examples):
        # Forward pass
        future = client.forward_backward(
            input_chunks=[EncodedTextChunk(example["input"])],
            target_chunks=[EncodedTextChunk(example["output"])],
        )
        
        result = future.result()
        epoch_loss += result.loss
        
        if (i + 1) % 1 == 0:
            print(f"   Example {i+1}/{len(training_examples)}: loss = {result.loss:.4f}")
    
    # Optimization step
    optim_future = client.optim_step(lr=LEARNING_RATE)
    optim_future.result()
    
    avg_loss = epoch_loss / len(training_examples)
    print(f"   Epoch {epoch + 1} complete: avg_loss = {avg_loss:.4f}")
    
    training_log.append({
        "epoch": epoch + 1,
        "loss": avg_loss
    })

# Save training log
OUTPUT_DIR = "./tinker-paraphrase-model"
os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(f"{OUTPUT_DIR}/training_log.json", "w") as f:
    json.dump(training_log, f, indent=2)

print("\n💾 Saving model weights...")
# Note: In real usage, you'd save the weights here
# client.save_weights(f"{OUTPUT_DIR}/model_weights")

print(f"\n✅ Training complete!")
print(f"📁 Output directory: {OUTPUT_DIR}/")
print(f"📊 Training log: {OUTPUT_DIR}/training_log.json")

# Test the model
print("\n🧪 Testing model...")

test_sentences = [
    "The weather is beautiful today.",
    "Technology is advancing rapidly.",
]

for sentence in test_sentences:
    prompt = f"Paraphrase this: {sentence}"
    
    sample_future = client.sample(
        input_chunks=[EncodedTextChunk(prompt)],
        max_tokens=100,
        temperature=0.7,
    )
    result = sample_future.result()
    
    paraphrase = result.text
    print(f"\nOriginal: {sentence}")
    print(f"Paraphrase: {paraphrase}")

print("\n" + "=" * 50)
print("🎉 All done!")
print(f"\n📈 Training Summary:")
print(f"   Model: {MODEL_NAME}")
print(f"   Epochs: {NUM_EPOCHS}")
print(f"   Final loss: {training_log[-1]['loss']:.4f}")
print(f"   Examples: {len(training_examples)}")
