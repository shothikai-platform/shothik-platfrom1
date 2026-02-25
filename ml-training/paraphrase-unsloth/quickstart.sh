#!/bin/bash
# quickstart.sh - One-command setup and training

set -e

echo "🚀 Unsloth T5 Paraphrase Fine-Tuning - Quick Start"
echo "=================================================="

# Check prerequisites
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

if ! command -v nvidia-smi &> /dev/null; then
    echo "⚠️  Warning: nvidia-smi not found. GPU training will not work."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 1: Setup
echo ""
echo "📦 Step 1/4: Setting up environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q --upgrade pip
pip install -q torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -q unsloth transformers datasets accelerate peft bitsandbytes

echo "✅ Environment ready"

# Step 2: Prepare data
echo ""
echo "📊 Step 2/4: Preparing datasets..."
python prepare_data.py

echo "✅ Datasets ready"

# Step 3: Train
echo ""
echo "🏋️  Step 3/4: Training model..."
echo "This will take ~12 hours on RTX 4090"
read -p "Start training? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python train.py
else
    echo "Skipping training. Run 'python train.py' when ready."
fi

# Step 4: Export
echo ""
echo "📦 Step 4/4: Exporting model..."
if [ -d "t5-paraphrase-unsloth/final" ]; then
    python export_model.py
else
    echo "⚠️  No trained model found. Skipping export."
fi

echo ""
echo "=================================================="
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Test: python exports/inference.py"
echo "  2. Deploy: Use exports/hf-format/"
echo "=================================================="
