# 🎯 Quick Command Reference

## One-Command Fix

### Windows

```cmd
setup-r2-fix.bat
```

### Mac/Linux

```bash
bash setup-r2-fix.sh
```

---

## Manual Commands (If needed)

### 1. Cloudflare Authentication

```bash
npx wrangler login
```

### 2. R2 Bucket Commands

```bash
# List all R2 buckets
npx wrangler r2 bucket list

# Check if your bucket exists
npx wrangler r2 bucket list | findstr "retro-camera-photos"  # Windows
npx wrangler r2 bucket list | grep "retro-camera-photos"     # Mac/Linux

# Create bucket (if needed)
npx wrangler r2 bucket create retro-camera-photos

# List files in bucket
npx wrangler r2 object list retro-camera-photos

# Get public domain info
npx wrangler r2 bucket domain list retro-camera-photos

# Delete a file (for testing)
npx wrangler r2 object delete retro-camera-photos <filename>
```

### 3. D1 Database Commands

```bash
# List all databases
npx wrangler d1 list

# Initialize local database
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

# Initialize production database
npx wrangler d1 execute retro-camera-db --remote --file=./schema.sql

# Query local database
npx wrangler d1 execute retro-camera-db --local --command="SELECT * FROM photos;"

# Query production database
npx wrangler d1 execute retro-camera-db --remote --command="SELECT * FROM photos;"

# Check tables
npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Delete all photos (for testing)
npx wrangler d1 execute retro-camera-db --local --command="DELETE FROM photos;"
```

### 4. Development & Testing

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy

# Preview before deploy
npm run preview
```

### 5. File Operations

```bash
# Windows - Copy fixed route
copy src\app\api\upload\route-r2-fixed.ts src\app\api\upload\route.ts

# Mac/Linux - Copy fixed route
cp src/app/api/upload/route-r2-fixed.ts src/app/api/upload/route.ts

# Windows - Backup original
copy src\app\api\upload\route.ts src\app\api\upload\route.ts.backup

# Mac/Linux - Backup original
cp src/app/api/upload/route.ts src/app/api/upload/route.ts.backup
```

### 6. Troubleshooting Commands

```bash
# Check Cloudflare account info
npx wrangler whoami

# Check if logged in
npx wrangler whoami | findstr "logged in"  # Windows
npx wrangler whoami | grep "logged in"     # Mac/Linux

# Logout and re-login
npx wrangler logout
npx wrangler login

# Check Node version
node --version

# Check npm version
npm --version

# Clear npm cache (if issues)
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json  # Mac/Linux
rmdir /s /q node_modules && del package-lock.json  # Windows
npm install
```

### 7. Environment Setup

```bash
# Create .env.local (Windows)
echo R2_PUBLIC_URL=https://pub-YOUR-HASH.r2.dev > .env.local

# Create .env.local (Mac/Linux)
echo "R2_PUBLIC_URL=https://pub-YOUR-HASH.r2.dev" > .env.local

# View .env.local
type .env.local  # Windows
cat .env.local   # Mac/Linux
```

---

## Complete Setup Flow (Copy-Paste Ready)

### Windows

```cmd
REM Step 1: Login
npx wrangler login

REM Step 2: Verify R2 bucket
npx wrangler r2 bucket list | findstr "retro-camera-photos"

REM Step 3: Get R2 public URL (manual - see dashboard)
REM Go to: https://dash.cloudflare.com → R2 → retro-camera-photos → Settings
REM Enable R2.dev subdomain and copy URL

REM Step 4: Update .env.local (replace YOUR-HASH)
echo R2_PUBLIC_URL=https://pub-YOUR-HASH.r2.dev > .env.local

REM Step 5: Initialize D1
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

REM Step 6: Update code
copy src\app\api\upload\route-r2-fixed.ts src\app\api\upload\route.ts

REM Step 7: Test
npm run dev
```

### Mac/Linux

```bash
# Step 1: Login
npx wrangler login

# Step 2: Verify R2 bucket
npx wrangler r2 bucket list | grep "retro-camera-photos"

# Step 3: Get R2 public URL (manual - see dashboard)
# Go to: https://dash.cloudflare.com → R2 → retro-camera-photos → Settings
# Enable R2.dev subdomain and copy URL

# Step 4: Update .env.local (replace YOUR-HASH)
echo "R2_PUBLIC_URL=https://pub-YOUR-HASH.r2.dev" > .env.local

# Step 5: Initialize D1
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

# Step 6: Update code
cp src/app/api/upload/route-r2-fixed.ts src/app/api/upload/route.ts

# Step 7: Test
npm run dev
```

---

## Verification Commands

### Test Upload Success

```bash
# 1. Start server
npm run dev

# 2. In another terminal, check R2 after upload
npx wrangler r2 object list retro-camera-photos

# 3. Check D1 database
npx wrangler d1 execute retro-camera-db --local --command="SELECT id, imageUrl, message FROM photos ORDER BY createdAt DESC LIMIT 5;"

# 4. Test public URL (replace with actual)
curl -I https://pub-YOUR-HASH.r2.dev/photo-xxxxx.jpg
```

### Check Configuration

```bash
# View wrangler.json
type wrangler.json  # Windows
cat wrangler.json   # Mac/Linux

# View .env.local
type .env.local     # Windows
cat .env.local      # Mac/Linux

# Check package.json scripts
npm run
```

---

## Common Issues & Fixes

### Issue: "Command not found: wrangler"

```bash
# Install wrangler globally
npm install -g wrangler

# Or use npx (recommended)
npx wrangler --version
```

### Issue: "Not logged in"

```bash
npx wrangler login
```

### Issue: "Database not found"

```bash
# List databases
npx wrangler d1 list

# Check wrangler.json has correct database_id
```

### Issue: "Table 'photos' doesn't exist"

```bash
# Initialize database
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql
```

### Issue: "R2 public URL returns 404"

```bash
# Check public access enabled in dashboard
# https://dash.cloudflare.com → R2 → retro-camera-photos → Settings
# Enable "R2.dev subdomain"
```

### Issue: "Module not found: @opennextjs/cloudflare"

```bash
# Reinstall dependencies
npm install
```

---

## Production Deployment

### Pre-Deployment

```bash
# 1. Initialize production D1
npx wrangler d1 execute retro-camera-db --remote --file=./schema.sql

# 2. Verify production D1
npx wrangler d1 execute retro-camera-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# 3. Build
npm run build
```

### Deploy

```bash
npm run deploy
```

### Post-Deployment

```bash
# Check deployment logs
npx wrangler tail

# Test production upload
# (Use your deployed URL)

# Check production R2
npx wrangler r2 object list retro-camera-photos

# Check production D1
npx wrangler d1 execute retro-camera-db --remote --command="SELECT COUNT(*) as total FROM photos;"
```

---

## Useful Dashboard Links

- **Main Dashboard**: https://dash.cloudflare.com/
- **R2 Storage**: https://dash.cloudflare.com/ → R2
- **D1 Databases**: https://dash.cloudflare.com/ → D1
- **Workers & Pages**: https://dash.cloudflare.com/ → Workers & Pages
- **Account Settings**: https://dash.cloudflare.com/ → Manage Account

---

## Quick Help

```bash
# Wrangler help
npx wrangler --help

# R2 help
npx wrangler r2 --help

# D1 help
npx wrangler d1 --help

# Specific command help
npx wrangler d1 execute --help
```

---

**Need more details?**

- **Full guide**: See `CLOUDFLARE_IMAGES_FIX.md`
- **Quick reference**: See `QUICK_FIX.md`
- **Visual guide**: See `VISUAL_COMPARISON.md`
- **Analysis**: See `ANALYSIS_SUMMARY.md`
