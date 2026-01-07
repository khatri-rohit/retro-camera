#!/bin/bash

# Cloudflare Setup Script for Retro Camera
# This script helps set up the necessary Cloudflare resources

echo "🚀 Setting up Cloudflare resources for Retro Camera..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Login to Cloudflare
echo ""
echo "📝 Logging into Cloudflare..."
wrangler login

# Create D1 Database
echo ""
echo "📦 Creating D1 database..."
echo "Please copy the database ID from the output and update wrangler.json"
npx wrangler d1 create retro-camera-db

echo ""
read -p "Have you updated the database_id in wrangler.json? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update wrangler.json with the database_id and run this script again."
    exit 1
fi

# Initialize database schema
echo ""
echo "📋 Initializing database schema..."
npx wrangler d1 execute retro-camera-db --file=./schema.sql

# Create R2 bucket
echo ""
echo "🪣 Creating R2 bucket..."
npx wrangler r2 bucket create retro-camera-photos

# Set environment variables
echo ""
echo "🔐 Setting up environment variables..."
read -p "Enter your Gemini API key: " GEMINI_KEY
npx wrangler secret put NEXT_PUBLIC_GEMINI_API_KEY <<< "$GEMINI_KEY"

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  Important next steps:"
echo "1. Configure R2 public access in Cloudflare Dashboard"
echo "2. Update the publicUrl in src/app/api/upload/route.ts with your R2 public URL"
echo "3. Run 'npm run preview' to test locally with Cloudflare adapter"
echo "4. Run 'npm run deploy' to deploy to Cloudflare Workers"
echo ""
echo "📚 For more information, see MIGRATION.md"
