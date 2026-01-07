#!/bin/bash

# 🚀 Cloudflare R2 Setup Script - Complete Fix for Error 5403
# This script sets up R2 storage instead of Cloudflare Images

set -e  # Exit on error

echo "=================================================="
echo "🚀 Cloudflare R2 Setup for Retro Camera"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if wrangler is installed
if ! command -v npx &> /dev/null; then
    print_error "npm/npx not found. Please install Node.js first."
    exit 1
fi

print_success "Node.js and npm found"

# Step 1: Login to Cloudflare
echo ""
echo "📋 Step 1: Cloudflare Authentication"
echo "=========================================="
print_info "Opening browser for Cloudflare login..."
npx wrangler login

print_success "Logged in to Cloudflare"

# Step 2: Check if R2 bucket exists
echo ""
echo "📋 Step 2: Verify R2 Bucket"
echo "=========================================="
print_info "Checking for retro-camera-photos bucket..."

if npx wrangler r2 bucket list | grep -q "retro-camera-photos"; then
    print_success "R2 bucket 'retro-camera-photos' exists"
else
    print_info "Creating R2 bucket 'retro-camera-photos'..."
    npx wrangler r2 bucket create retro-camera-photos
    print_success "R2 bucket created"
fi

# Step 3: Enable public access
echo ""
echo "📋 Step 3: Enable R2 Public Access"
echo "=========================================="
print_info "Checking public access configuration..."

# Get bucket info
BUCKET_INFO=$(npx wrangler r2 bucket domain list retro-camera-photos 2>&1 || true)

if echo "$BUCKET_INFO" | grep -q "r2.dev"; then
    print_success "Public access already enabled"
    R2_PUBLIC_URL=$(echo "$BUCKET_INFO" | grep -o "https://pub-[^/]*\.r2\.dev" | head -n 1)
    echo "   URL: $R2_PUBLIC_URL"
else
    print_info "Enabling R2 public access..."
    print_info "This will create a public r2.dev subdomain for your bucket"
    
    # Note: The actual command depends on Wrangler version
    # Try to enable public access
    npx wrangler r2 bucket domain add retro-camera-photos --auto-create || true
    
    print_info "Please manually enable public access in Cloudflare Dashboard:"
    echo "   1. Go to: https://dash.cloudflare.com"
    echo "   2. Click 'R2' → 'retro-camera-photos'"
    echo "   3. Click 'Settings' tab"
    echo "   4. Enable 'R2.dev subdomain' under Public Access"
    echo ""
    read -p "Press Enter after enabling public access in dashboard..."
    
    # Try to get the URL again
    BUCKET_INFO=$(npx wrangler r2 bucket domain list retro-camera-photos 2>&1 || true)
    R2_PUBLIC_URL=$(echo "$BUCKET_INFO" | grep -o "https://pub-[^/]*\.r2\.dev" | head -n 1)
fi

# Validate R2_PUBLIC_URL
if [ -z "$R2_PUBLIC_URL" ]; then
    print_error "Could not detect R2 public URL"
    echo ""
    print_info "Please enter your R2 public URL manually:"
    echo "   Format: https://pub-xxxxxxxx.r2.dev"
    read -p "R2 Public URL: " R2_PUBLIC_URL
fi

print_success "R2 Public URL: $R2_PUBLIC_URL"

# Step 4: Update .env.local
echo ""
echo "📋 Step 4: Update Environment Variables"
echo "=========================================="

# Create or update .env.local
cat > .env.local << EOF
# Cloudflare R2 Configuration
# Generated on $(date)

# R2 Public URL for image delivery
R2_PUBLIC_URL=$R2_PUBLIC_URL

# Note: All other resources (D1, R2, Workers AI) are accessed via
# Cloudflare bindings configured in wrangler.json
# No API tokens or account IDs needed for local development!
EOF

print_success "Updated .env.local with R2_PUBLIC_URL"

# Step 5: Initialize D1 Database
echo ""
echo "📋 Step 5: Initialize D1 Database"
echo "=========================================="

# Check if database exists
if npx wrangler d1 list | grep -q "retro-camera-db"; then
    print_success "D1 database 'retro-camera-db' exists"
else
    print_info "Creating D1 database..."
    npx wrangler d1 create retro-camera-db
    print_error "Please update wrangler.json with the new database_id"
    exit 1
fi

# Initialize local database
print_info "Initializing local D1 database schema..."
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql
print_success "Local D1 database initialized"

# Ask about production database
echo ""
read -p "Initialize production database too? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Initializing production D1 database..."
    npx wrangler d1 execute retro-camera-db --remote --file=./schema.sql
    print_success "Production D1 database initialized"
fi

# Step 6: Verify setup
echo ""
echo "📋 Step 6: Verify Setup"
echo "=========================================="

print_info "Checking R2 bucket..."
npx wrangler r2 bucket list | grep "retro-camera-photos" && print_success "R2 bucket OK"

print_info "Checking D1 database tables..."
TABLE_CHECK=$(npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name='photos';" 2>&1)
if echo "$TABLE_CHECK" | grep -q "photos"; then
    print_success "D1 database tables OK"
else
    print_error "D1 database tables not found"
fi

# Final instructions
echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update your code to use R2:"
echo "   cp src/app/api/upload/route-r2-fixed.ts src/app/api/upload/route.ts"
echo ""
echo "2. Update cloudflare-env.d.ts to include R2_PUBLIC_URL"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Test upload functionality at http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   - See CLOUDFLARE_IMAGES_FIX.md for detailed explanation"
echo "   - R2 Dashboard: https://dash.cloudflare.com"
echo ""
print_success "All done! Happy coding! 🎉"
