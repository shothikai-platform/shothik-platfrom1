#!/bin/bash
# setup_tinker.sh - Setup Tinker API environment

echo "🚀 Tinker API Setup"
echo "==================="

# Check Python version
python3 --version

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Tinker
echo "📥 Installing Tinker library..."
pip install tinker

# Install additional dependencies
echo "📥 Installing dependencies..."
pip install datasets transformers

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get API key from https://tinker.thinkingmachines.ai/"
echo "2. export TINKER_API_KEY=your_key_here"
echo "3. python tinker_paraphrase_train.py"
