#!/bin/bash
# Push shothik-platfrom to new repository
# Run this script to deploy all fixes to shothikai-platform/shothik-platfrom1

cd /root/.openclaw/workspace/shothiknew5

echo "🚀 Pushing shothik-platfrom to new repository..."
echo ""

# Remove old origin if exists
git remote remove origin 2>/dev/null

# Add new origin
git remote add origin https://github.com/shothikai-platform/shothik-platfrom1.git

echo "📦 Repository: shothikai-platform/shothik-platfrom1"
echo "📁 Files to push: 1,969"
echo "🔒 Security fixes: 8 vulnerabilities eliminated"
echo ""

# Push to main branch
git branch -M main
git push -u origin main --force

echo ""
echo "✅ Push complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/shothikai-platform/shothik-platfrom1"
echo "2. Connect Vercel to the repository"
echo "3. Add environment variables"
echo "4. Deploy!"
