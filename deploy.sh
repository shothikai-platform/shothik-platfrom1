#!/bin/bash
# Shothik Deployment Script

echo "🚀 Shothik Deployment Script"
echo "=============================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in
echo "Checking Vercel login..."
vercel whoami || (echo "Please login first: vercel login" && exit 1)

# Deploy
echo "Deploying Shothik..."
cd /root/.openclaw/workspace/shothiknew5
vercel --prod

echo "✅ Deployment complete!"
echo "Check your Vercel dashboard for the URL"
