# 🚀 R2 Bucket Setup Complete - Next Steps

## ✅ What We Just Did

- **Created R2 bucket**: `retro-camera-photos`
- **Binding configured**: `retro_camera_photos` (already in wrangler.json)

## 🔧 Step 2: Enable Public Access (CRITICAL)

Your photos need to be publicly accessible. Here's how:

### Option A: Cloudflare Dashboard (Recommended)

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com/
2. **Navigate to R2**: Click "R2" in the sidebar
3. **Select your bucket**: Click on `retro-camera-photos`
4. **Settings tab**: Click the "Settings" tab
5. **Public Access section**: Scroll down to "Public Access"
6. **Allow Access**: Click "Allow Access"
7. **Enable R2.dev subdomain**: Toggle ON
8. **Copy the URL**: You'll get a URL like `https://pub-xxxxxxxxxxxx.r2.dev/`

### Option B: Via Wrangler CLI

```bash
# Enable public access
npx wrangler r2 bucket update retro-camera-photos --public

# Get the public URL
npx wrangler r2 bucket domain list retro-camera-photos
```

## 🔧 Step 3: Update Code with Your Public URL

Once you have the public URL from Step 2, update this file:

**File**: `src/app/api/upload/route.ts` (line ~148)

**Current code**:

```typescript
const publicUrl = `https://pub-ec81cb628e1e29554b576518a1d0b.r2.dev/${filename}`;
```

**Replace with your actual URL**:

```typescript
const publicUrl = `https://pub-YOUR-ACTUAL-HASH.r2.dev/${filename}`;
```

## 🧪 Step 4: Test Everything

### Test 1: Initialize D1 Database (if not done)

```bash
# Initialize local database
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

# Initialize production database (when deploying)
npx wrangler d1 execute retro-camera-db --file=./schema.sql
```

### Test 2: Start Development Server

```bash
npm run dev
```

### Test 3: Upload a Photo

1. Open http://localhost:3000
2. Take a photo
3. Apply a filter
4. Upload it
5. Check that it appears in the gallery

### Test 4: Verify Public Access

1. After uploading, check the browser console
2. The image should load from your R2.dev URL
3. Right-click any photo → "Open image in new tab" should work

## 📊 Verify Setup

### Check R2 Bucket

```bash
# List buckets
npx wrangler r2 bucket list

# List objects in bucket
npx wrangler r2 object list retro-camera-photos
```

### Check D1 Database

```bash
# Check tables
npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Check photos
npx wrangler d1 execute retro-camera-db --local --command="SELECT COUNT(*) as photo_count FROM photos;"
```

## 🚀 Production Deployment

When ready to deploy:

```bash
# Build and deploy
npm run deploy

# Initialize production D1 database
npx wrangler d1 execute retro-camera-db --file=./schema.sql
```

## 🐛 Troubleshooting

### Photos not loading in gallery?

1. **Check public access**: Make sure R2.dev subdomain is enabled
2. **Verify URL**: Ensure the public URL in `upload/route.ts` is correct
3. **Check CORS**: R2.dev URLs should work without CORS issues

### Upload fails?

1. **Check wrangler.json**: Ensure `retro_camera_photos` binding is correct
2. **Verify bucket exists**: `npx wrangler r2 bucket list`
3. **Check permissions**: Make sure you're logged in: `npx wrangler whoami`

### Database errors?

1. **Initialize D1**: Run the schema.sql commands above
2. **Check binding**: Ensure `retro_camera_db` binding in wrangler.json matches

## 📋 Summary

✅ **R2 bucket created**: `retro-camera-photos`
✅ **Binding configured**: `retro_camera_photos`
🔄 **Next**: Enable public access and update the URL in code
🔄 **Then**: Initialize D1 database and test

**You're almost there! Just enable public access and update the URL.**
