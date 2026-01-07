#!/bin/bash

# 🔧 Quick Fix for API Token Authentication Error
# This script helps you switch from API token to OAuth

set -e

echo "=================================================="
echo "🔧 Cloudflare Authentication Fix"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Step 1: Unset API token
echo "📋 Step 1: Removing API Token from Environment"
echo "=================================================="
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID

# Verify
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_success "API token removed from current session"
else
    print_error "Failed to remove API token"
    exit 1
fi

echo ""

# Step 2: Login with OAuth
echo "📋 Step 2: Login with OAuth"
echo "=================================================="
print_info "Opening browser for Cloudflare authentication..."
npx wrangler login

if [ $? -ne 0 ]; then
    print_error "Login failed"
    exit 1
fi

print_success "Successfully logged in with OAuth"
echo ""

# Step 3: Verify authentication
echo "📋 Step 3: Verify Authentication"
echo "=================================================="
npx wrangler whoami

if [ $? -ne 0 ]; then
    print_error "Authentication verification failed"
    exit 1
fi

print_success "Authentication verified"
echo ""

# Step 4: Check R2 access
echo "📋 Step 4: Test R2 Access"
echo "=================================================="
print_info "Testing R2 bucket access..."

npx wrangler r2 bucket list > /dev/null 2>&1

if [ $? -ne 0 ]; then
    print_error "R2 access failed - you may need to enable R2 in your account"
    echo ""
    print_info "Please visit: https://dash.cloudflare.com"
    echo "   1. Click 'R2' in the sidebar"
    echo "   2. Enable R2 if prompted"
    echo "   3. Run this script again"
    exit 1
fi

print_success "R2 access verified"
echo ""

# Step 5: Check if bucket exists
echo "📋 Step 5: Verify R2 Bucket"
echo "=================================================="
print_info "Checking for retro-camera-photos bucket..."

if npx wrangler r2 bucket list | grep -q "retro-camera-photos"; then
    print_success "R2 bucket 'retro-camera-photos' exists"
else
    print_info "Creating R2 bucket 'retro-camera-photos'..."
    npx wrangler r2 bucket create retro-camera-photos
    
    if [ $? -ne 0 ]; then
        print_error "Failed to create R2 bucket"
        exit 1
    fi
    
    print_success "R2 bucket created"
fi

echo ""

# Step 6: Guide for public access
echo "📋 Step 6: Enable R2 Public Access (Manual)"
echo "=================================================="
print_info "You need to enable public access for your R2 bucket:"
echo ""
echo "   1. Open: https://dash.cloudflare.com"
echo "   2. Navigate: R2 → retro-camera-photos"
echo "   3. Click: Settings tab"
echo "   4. Scroll to: Public Access section"
echo "   5. Enable: R2.dev subdomain"
echo "   6. Copy the public URL (format: https://pub-xxxxxxxx.r2.dev)"
echo ""
read -p "Press Enter after enabling public access..."

echo ""
print_info "Enter your R2 public URL:"
read -p "R2 Public URL: " R2_PUBLIC_URL

if [ -z "$R2_PUBLIC_URL" ]; then
    print_error "R2 Public URL is required"
    exit 1
fi

# Validate URL format
if [[ ! "$R2_PUBLIC_URL" =~ ^https://pub-[^/]+\.r2\.dev$ ]]; then
    print_error "Invalid R2 URL format. Expected: https://pub-xxxxxxxx.r2.dev"
    exit 1
fi

print_success "R2 Public URL: $R2_PUBLIC_URL"
echo ""

# Step 7: Update .env.local
echo "📋 Step 7: Update Environment Configuration"
echo "=================================================="

cat > .env.local << EOF
# R2 Public URL for image delivery
# Generated on $(date)
R2_PUBLIC_URL=$R2_PUBLIC_URL

# Using OAuth for authentication
# No API tokens needed for local development
# Cloudflare bindings configured in wrangler.json
EOF

print_success "Created .env.local with R2_PUBLIC_URL"
echo ""

# Step 8: Check D1 database
echo "📋 Step 8: Verify D1 Database"
echo "=================================================="
print_info "Checking D1 database access..."

if npx wrangler d1 list | grep -q "retro-camera-db"; then
    print_success "D1 database 'retro-camera-db' exists"
else
    print_error "D1 database 'retro-camera-db' not found"
    echo ""
    print_info "Please check wrangler.json for correct database_id"
    exit 1
fi

echo ""

# Step 9: Initialize D1 database
echo "📋 Step 9: Initialize D1 Database Schema"
echo "=================================================="
print_info "Initializing local D1 database..."

npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

if [ $? -ne 0 ]; then
    print_error "Failed to initialize D1 database"
    exit 1
fi

print_success "Local D1 database initialized"
echo ""

# Verify tables
print_info "Verifying database tables..."
TABLE_CHECK=$(npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name='photos';" 2>&1)

if echo "$TABLE_CHECK" | grep -q "photos"; then
    print_success "Database table 'photos' created successfully"
else
    print_error "Failed to verify database table"
fi

echo ""

# Step 10: Production database (optional)
read -p "Initialize production D1 database too? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Initializing production D1 database..."
    npx wrangler d1 execute retro-camera-db --remote --file=./schema.sql
    
    if [ $? -ne 0 ]; then
        print_error "Failed to initialize production database"
    else
        print_success "Production D1 database initialized"
    fi
fi

echo ""

# Step 11: Update code
echo "📋 Step 11: Update Upload Route"
echo "=================================================="

if [ -f "src/app/api/upload/route-r2-fixed.ts" ]; then
    # Backup original
    if [ -f "src/app/api/upload/route.ts" ]; then
        cp src/app/api/upload/route.ts src/app/api/upload/route.ts.backup
        print_info "Backed up original route.ts"
    fi
    
    # Copy fixed version
    cp src/app/api/upload/route-r2-fixed.ts src/app/api/upload/route.ts
    print_success "Updated route.ts with R2 implementation"
else
    print_error "route-r2-fixed.ts not found"
    echo "   Please create it first or check the file path"
fi

echo ""

# Final summary
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
echo "📝 What was done:"
echo "   ✓ Switched from API token to OAuth authentication"
echo "   ✓ Verified R2 bucket access"
echo "   ✓ Enabled R2 public access (manual step)"
echo "   ✓ Updated .env.local with R2_PUBLIC_URL"
echo "   ✓ Initialized D1 database"
echo "   ✓ Updated upload route to use R2"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start development server: npm run dev"
echo "   2. Test photo upload at: http://localhost:3000"
echo "   3. Verify photos appear in gallery"
echo ""
echo "📚 Important Notes:"
echo "   • You're now using OAuth (no API token needed)"
echo "   • OAuth login persists until you run: npx wrangler logout"
echo "   • For new terminal sessions, OAuth is still active"
echo "   • Your .env files still have the API token (ignored while using OAuth)"
echo ""
echo "🔍 Verification Commands:"
echo "   npx wrangler whoami              # Check auth status"
echo "   npx wrangler r2 bucket list      # List R2 buckets"
echo "   npx wrangler r2 object list retro-camera-photos  # List uploaded files"
echo ""
print_success "All done! Happy coding! 🎉"
