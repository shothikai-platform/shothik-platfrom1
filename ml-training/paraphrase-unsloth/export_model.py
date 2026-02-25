"""
export_model.py - Export fine-tuned model to various formats
"""

import torch
from unsloth import FastLanguageModel
from transformers import AutoTokenizer
import os

print("📦 Exporting fine-tuned model")
print("=" * 50)

# Load the fine-tuned model
MODEL_PATH = "./t5-paraphrase-unsloth/final"
OUTPUT_DIR = "./exports"
os.makedirs(OUTPUT_DIR, exist_ok=True)

print(f"📥 Loading model from {MODEL_PATH}...")

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name=MODEL_PATH,
    max_seq_length=512,
    dtype=torch.bfloat16,
    load_in_4bit=False,  # Load full precision for export
)

# 1. Export to HuggingFace format (default)
print("\n1️⃣  Saving to HuggingFace format...")
hf_path = f"{OUTPUT_DIR}/hf-format"
model.save_pretrained(hf_path)
tokenizer.save_pretrained(hf_path)
print(f"   Saved to: {hf_path}")

# 2. Export to ONNX for faster inference
try:
    print("\n2️⃣  Exporting to ONNX...")
    from unsloth import export_to_onnx
    
    onnx_path = f"{OUTPUT_DIR}/t5-paraphrase.onnx"
    export_to_onnx(
        model,
        tokenizer,
        output_path=onnx_path,
        max_length=512,
    )
    print(f"   Saved to: {onnx_path}")
    print("   ✅ Use with ONNX Runtime for 2x faster CPU inference")
except Exception as e:
    print(f"   ⚠️  ONNX export failed: {e}")

# 3. Export to GGUF for llama.cpp
try:
    print("\n3️⃣  Exporting to GGUF...")
    from unsloth import export_to_gguf
    
    gguf_path = f"{OUTPUT_DIR}/t5-paraphrase.gguf"
    export_to_gguf(
        model,
        tokenizer,
        quantization="q4_k_m",  # 4-bit quantization
        output_path=gguf_path,
    )
    print(f"   Saved to: {gguf_path}")
    print("   ✅ Use with llama.cpp for edge deployment")
except Exception as e:
    print(f"   ⚠️  GGUF export failed: {e}")

# 4. Merge LoRA weights for standalone use
print("\n4️⃣  Merging LoRA weights...")
merged_path = f"{OUTPUT_DIR}/merged"
model.save_pretrained_merged(
    merged_path,
    tokenizer,
    save_method="merged_16bit",
)
print(f"   Saved to: {merged_path}")
print("   ✅ Standalone model without LoRA adapters")

# 5. Create inference script
inference_script = '''#!/usr/bin/env python3
"""
Inference script for fine-tuned T5 paraphrase model
"""

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

def load_model(model_path="./exports/hf-format"):
    """Load the fine-tuned model"""
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSeq2SeqLM.from_pretrained(
        model_path,
        torch_dtype=torch.bfloat16,
        device_map="auto"
    )
    return model, tokenizer

def paraphrase(text, model, tokenizer, num_beams=4):
    """Paraphrase a single text"""
    input_text = f"paraphrase: {text}"
    inputs = tokenizer(
        input_text,
        return_tensors="pt",
        max_length=512,
        truncation=True
    ).to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=512,
            num_beams=num_beams,
            early_stopping=True,
            do_sample=False,  # Set to True for more variety
        )
    
    return tokenizer.decode(outputs[0], skip_special_tokens=True)

def main():
    print("🚀 Loading model...")
    model, tokenizer = load_model()
    
    print("\\n✅ Model loaded! Enter text to paraphrase (or 'quit' to exit):")
    
    while True:
        text = input("\\n> ")
        if text.lower() == "quit":
            break
        
        result = paraphrase(text, model, tokenizer)
        print(f"\\nParaphrase: {result}")

if __name__ == "__main__":
    main()
'''

with open(f"{OUTPUT_DIR}/inference.py", "w") as f:
    f.write(inference_script)

os.chmod(f"{OUTPUT_DIR}/inference.py", 0o755)
print(f"\n5️⃣  Created inference script: {OUTPUT_DIR}/inference.py")

# Summary
print("\n" + "=" * 50)
print("📦 Export Summary:")
print("=" * 50)
print(f"\n✅ HuggingFace format: {OUTPUT_DIR}/hf-format/")
print(f"✅ Merged model: {OUTPUT_DIR}/merged/")
print(f"✅ Inference script: {OUTPUT_DIR}/inference.py")

print("\n🚀 Deployment Options:")
print("   1. HuggingFace Transformers: Use hf-format/")
print("   2. ONNX Runtime: Use t5-paraphrase.onnx")
print("   3. llama.cpp: Use t5-paraphrase.gguf")
print("   4. Standalone: Use merged/")

print("\n📝 Quick Start:")
print("   python exports/inference.py")
