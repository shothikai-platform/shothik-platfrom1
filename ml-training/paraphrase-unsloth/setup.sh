#!/bin/bash
# setup.sh - Run this on your GPU machine

echo "🚀 Setting up Unsloth Paraphrase Training Environment"

# Check if running on GPU machine
if ! command -v nvidia-smi &> /dev/null; then
    echo "⚠️  Warning: nvidia-smi not found. Make sure you have a GPU."
fi

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install Unsloth
pip install unsloth

# Install additional dependencies
pip install transformers datasets accelerate peft bitsandbytes wandb
pip install scikit-learn numpy pandas tqdm
pip install evaluate rouge-score sacrebleu

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. source venv/bin/activate"
echo "2. python prepare_data.py"
echo "3. python train.py"
