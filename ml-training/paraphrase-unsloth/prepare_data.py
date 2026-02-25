"""
prepare_data.py - Download and prepare paraphrase datasets
"""

from datasets import load_dataset, concatenate_datasets
from transformers import AutoTokenizer
import json
import os

print("📊 Downloading and preparing paraphrase datasets...")

# Create data directory
os.makedirs("./data", exist_ok=True)

# Initialize tokenizer
tokenizer = AutoTokenizer.from_pretrained("t5-base")

def format_t5_input(example, prefix="paraphrase"):
    """Format example for T5 text-to-text format"""
    return {
        "input": f"{prefix}: {example['sentence1']}",
        "target": example['sentence2']
    }

def prepare_paws():
    """Prepare PAWS dataset"""
    print("📥 Loading PAWS dataset...")
    
    dataset = load_dataset("paws", "labeled_final")
    
    # Filter for paraphrase pairs (label=1)
    train = dataset["train"].filter(lambda x: x["label"] == 1)
    dev = dataset["validation"].filter(lambda x: x["label"] == 1)
    
    # Format for T5
    train_formatted = train.map(format_t5_input)
    dev_formatted = dev.map(format_t5_input)
    
    print(f"✅ PAWS: {len(train_formatted)} train, {len(dev_formatted)} dev")
    
    return train_formatted, dev_formatted

def prepare_quora():
    """Prepare Quora Question Pairs dataset"""
    print("📥 Loading Quora dataset...")
    
    dataset = load_dataset("quora")
    
    # Filter for duplicate pairs (is_duplicate=1)
    train = dataset["train"].filter(lambda x: x["is_duplicate"] == 1)
    
    # Rename columns to match format
    def rename_columns(example):
        return {
            "sentence1": example["questions"]["text"][0],
            "sentence2": example["questions"]["text"][1]
        }
    
    train = train.map(rename_columns)
    
    # Format for T5
    train_formatted = train.map(format_t5_input)
    
    # Split into train/dev
    split = train_formatted.train_test_split(test_size=0.1)
    
    print(f"✅ Quora: {len(split['train'])} train, {len(split['test'])} dev")
    
    return split["train"], split["test"]

def prepare_msrp():
    """Prepare MSR Paraphrase Corpus"""
    print("📥 Loading MSRP dataset...")
    
    dataset = load_dataset("glue", "mrpc")
    
    # Filter for paraphrase pairs (label=1)
    train = dataset["train"].filter(lambda x: x["label"] == 1)
    validation = dataset["validation"].filter(lambda x: x["label"] == 1)
    
    # Format for T5
    train_formatted = train.map(format_t5_input)
    dev_formatted = validation.map(format_t5_input)
    
    print(f"✅ MSRP: {len(train_formatted)} train, {len(dev_formatted)} dev")
    
    return train_formatted, dev_formatted

def main():
    datasets_info = {}
    
    # Prepare individual datasets
    try:
        paws_train, paws_dev = prepare_paws()
        datasets_info["paws"] = {"train": len(paws_train), "dev": len(paws_dev)}
    except Exception as e:
        print(f"⚠️  Error loading PAWS: {e}")
        paws_train, paws_dev = None, None
    
    try:
        quora_train, quora_dev = prepare_quora()
        datasets_info["quora"] = {"train": len(quora_train), "dev": len(quora_dev)}
    except Exception as e:
        print(f"⚠️  Error loading Quora: {e}")
        quora_train, quora_dev = None, None
    
    try:
        msrp_train, msrp_dev = prepare_msrp()
        datasets_info["msrp"] = {"train": len(msrp_train), "dev": len(msrp_dev)}
    except Exception as e:
        print(f"⚠️  Error loading MSRP: {e}")
        msrp_train, msrp_dev = None, None
    
    # Combine datasets
    print("\n🔄 Combining datasets...")
    
    train_datasets = [d for d in [paws_train, quora_train, msrp_train] if d is not None]
    dev_datasets = [d for d in [paws_dev, quora_dev, msrp_dev] if d is not None]
    
    if train_datasets:
        combined_train = concatenate_datasets(train_datasets)
        combined_dev = concatenate_datasets(dev_datasets)
        
        # Shuffle
        combined_train = combined_train.shuffle(seed=42)
        combined_dev = combined_dev.shuffle(seed=42)
        
        # Save to disk
        combined_train.save_to_disk("./data/train")
        combined_dev.save_to_disk("./data/dev")
        
        print(f"\n✅ Combined dataset saved!")
        print(f"   Train: {len(combined_train)} examples")
        print(f"   Dev: {len(combined_dev)} examples")
        
        # Save dataset info
        datasets_info["combined"] = {
            "train": len(combined_train),
            "dev": len(combined_dev)
        }
        
        with open("./data/datasets_info.json", "w") as f:
            json.dump(datasets_info, f, indent=2)
        
        # Print sample
        print("\n📄 Sample training example:")
        sample = combined_train[0]
        print(f"Input: {sample['input'][:100]}...")
        print(f"Target: {sample['target'][:100]}...")
        
    else:
        print("❌ No datasets loaded successfully")

if __name__ == "__main__":
    main()
