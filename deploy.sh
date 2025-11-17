#!/bin/bash

# Plank Timer Deployment Script
# This script helps deploy the app to Vercel

echo "🏋️  Plank Timer Deployment Script"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
    echo ""
fi

# Run build test
echo "🔨 Testing production build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi
echo "✅ Build successful"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Vercel CLI not found. Installing..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI"
        exit 1
    fi
    echo "✅ Vercel CLI installed"
    echo ""
fi

# Ask user what to do
echo "Choose deployment option:"
echo "1. Deploy to preview"
echo "2. Deploy to production"
echo "3. Cancel"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to preview..."
        vercel
        ;;
    2)
        echo ""
        echo "🚀 Deploying to production..."
        vercel --prod
        ;;
    3)
        echo "❌ Deployment cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "Next steps:"
    echo "1. Test the deployed URL on desktop and mobile"
    echo "2. Verify camera access works"
    echo "3. Test video recording and download"
    echo "4. Share the URL with your community!"
else
    echo ""
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi
