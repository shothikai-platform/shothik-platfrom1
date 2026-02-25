"""
train.py - Fine-tune T5 for paraphrasing using Unsloth
"""

import torch
from unsloth import FastLanguageModel
from transformers import (
    TrainingArguments,
    DataCollatorForSeq2Seq,
    AutoTokenizer
)
from datasets import load_from_disk
from trl import SFTTrainer
import os
import json

print("🚀 Starting Unsloth T5 Paraphrase Training")
print("=" * 50)

# Configuration
MODEL_NAME = "t5-base"  # Options: t5-small, t5-base, t5-large, t5-3b
MAX_SEQ_LENGTH = 512
BATCH_SIZE = 8
GRADIENT_ACCUMULATION_STEPS = 4
LEARNING_RATE = 3e-4
NUM_EPOCHS = 3
OUTPUT_DIR = "./t5-paraphrase-unsloth"

# Check GPU
if torch.cuda.is_available():
    print(f"✅ GPU: {torch.cuda.get_device_name(0)}")
    print(f"   Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
else:
    print("❌ No GPU found! Training will be very slow.")
    exit(1)

# Load datasets
print("\n📊 Loading datasets...")
train_dataset = load_from_disk("./data/train")
dev_dataset = load_from_disk("./data/dev")

print(f"   Train: {len(train_dataset)} examples")
print(f"   Dev: {len(dev_dataset)} examples")

# Load model with Unsloth optimizations
print(f"\n🤖 Loading {MODEL_NAME} with Unsloth...")

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_NAME,
    max_seq_length=MAX_SEQ_LENGTH,
    dtype=torch.bfloat16,
    load_in_4bit=True,  # QLoRA for memory efficiency
)

# Add LoRA adapters
print("🔧 Adding LoRA adapters...")
model = FastLanguageModel.get_peft_model(
    model,
    r=16,  # LoRA rank - higher = more parameters but better quality
    target_modules=["q", "v", "k", "o", "wi", "wo"],  # T5 attention layers
    lora_alpha=32,
    lora_dropout=0.05,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=42,
)

# Print trainable parameters
model.print_trainable_parameters()

# Format dataset for training
def format_for_training(examples):
    """Format examples for T5 training"""
    inputs = examples["input"]
    targets = examples["target"]
    
    # Tokenize inputs
    model_inputs = tokenizer(
        inputs,
        max_length=MAX_SEQ_LENGTH,
        truncation=True,
        padding="max_length"
    )
    
    # Tokenize targets
    labels = tokenizer(
        targets,
        max_length=MAX_SEQ_LENGTH,
        truncation=True,
        padding="max_length"
    )
    
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

print("\n📝 Formatting datasets...")
train_formatted = train_dataset.map(
    format_for_training,
    batched=True,
    remove_columns=train_dataset.column_names
)
dev_formatted = dev_dataset.map(
    format_for_training,
    batched=True,
    remove_columns=dev_dataset.column_names
)

# Data collator
data_collator = DataCollatorForSeq2Seq(
    tokenizer=tokenizer,
    model=model,
    padding=True,
    max_length=MAX_SEQ_LENGTH,
)

# Training arguments optimized with Unsloth
print("\n⚙️  Setting up training...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=NUM_EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    gradient_accumulation_steps=GRADIENT_ACCUMULATION_STEPS,
    learning_rate=LEARNING_RATE,
    weight_decay=0.01,
    warmup_ratio=0.1,
    logging_steps=50,
    evaluation_strategy="steps",
    eval_steps=500,
    save_strategy="steps",
    save_steps=500,
    save_total_limit=3,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
    bf16=True,  # Unsloth optimized for bfloat16
    dataloader_num_workers=4,
    remove_unused_columns=False,
    report_to="none",  # Change to "wandb" for tracking
)

# Initialize trainer
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=train_formatted,
    eval_dataset=dev_formatted,
    args=training_args,
    data_collator=data_collator,
    max_seq_length=MAX_SEQ_LENGTH,
)

# Train
print("\n🏋️  Starting training...")
print("=" * 50)

trainer.train()

# Save model
print("\n💾 Saving model...")
trainer.save_model(f"{OUTPUT_DIR}/final")
tokenizer.save_pretrained(f"{OUTPUT_DIR}/final")

# Save training info
training_info = {
    "model_name": MODEL_NAME,
    "max_seq_length": MAX_SEQ_LENGTH,
    "batch_size": BATCH_SIZE,
    "gradient_accumulation_steps": GRADIENT_ACCUMULATION_STEPS,
    "learning_rate": LEARNING_RATE,
    "num_epochs": NUM_EPOCHS,
    "train_examples": len(train_dataset),
    "dev_examples": len(dev_dataset),
    "lora_r": 16,
    "lora_alpha": 32,
}

with open(f"{OUTPUT_DIR}/training_info.json", "w") as f:
    json.dump(training_info, f, indent=2)

print(f"\n✅ Training complete!")
print(f"   Model saved to: {OUTPUT_DIR}/final")
print(f"   Training info: {OUTPUT_DIR}/training_info.json")

# Test the model
print("\n🧪 Testing model...")
model.eval()

test_sentences = [
    "The quick brown fox jumps over the lazy dog.",
    "Machine learning is transforming the way we work.",
    "Climate change is one of the biggest challenges facing humanity.",
]

for sentence in test_sentences:
    input_text = f"paraphrase: {sentence}"
    inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True).to("cuda")
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=512,
            num_beams=4,
            early_stopping=True
        )
    
    paraphrase = tokenizer.decode(outputs[0], skip_special_tokens=True)
    print(f"\nOriginal: {sentence}")
    print(f"Paraphrase: {paraphrase}")

print("\n🎉 All done! Model is ready for deployment.")
