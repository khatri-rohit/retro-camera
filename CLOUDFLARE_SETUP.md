# 🚀 Cloudflare Setup Instructions

## ⚠️ Critical: Initialize D1 Database

You're getting the error: `no such table: photos` because the D1 database hasn't been initialized with the schema yet.

### Step 1: Initialize the D1 Database

Run this command to create the photos table:

```bash
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql
```

This will create the table in your **local development** D1 database.

### Step 2: Initialize Production D1 Database

When you're ready to deploy, also initialize the production database:

```bash
npx wrangler d1 execute retro-camera-db --remote --file=./schema.sql
```

Or without the `--remote` flag (it defaults to remote):

```bash
npx wrangler d1 execute retro-camera-db --file=./schema.sql
```

### Verify Database Setup

Check if the table was created successfully:

```bash
# Local database
npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# Production database
npx wrangler d1 execute retro-camera-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see `photos` in the output.

## 📝 What the Schema Does

The `schema.sql` file creates:

1. **photos table** with columns:

   - `id` (TEXT, PRIMARY KEY)
   - `imageUrl` (TEXT, NOT NULL)
   - `message` (TEXT, nullable)
   - `positionX` (REAL, NOT NULL)
   - `positionY` (REAL, NOT NULL)
   - `rotation` (REAL, NOT NULL)
   - `createdAt` (INTEGER, NOT NULL, default: current timestamp)

2. **Index** on `createdAt` for faster queries

## 🔧 Complete Setup Checklist

### Local Development Setup

```bash
# 1. Initialize local D1 database
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

# 2. Start development server
npm run dev

# 3. Test the app at http://localhost:3000
```

### Production Deployment Setup

```bash
# 1. Login to Cloudflare
npx wrangler login

# 2. Verify your D1 database exists
npx wrangler d1 list

# 3. Initialize production database
npx wrangler d1 execute retro-camera-db --file=./schema.sql

# 4. Enable R2 public access (see below)

# 5. Deploy
npm run deploy
```

## 📦 R2 Bucket Public Access Setup

To make uploaded photos publicly accessible:

### Option 1: Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** → **retro-camera-photos**
3. Click **Settings** tab
4. Scroll to **Public Access**
5. Click **Allow Access**
6. Enable **R2.dev subdomain**
7. Copy the public URL (e.g., `https://pub-xxxxxxxxxxxx.r2.dev/`)
8. Update `src/app/api/upload/route.ts` line ~147 with this URL

### Option 2: Custom Domain (Optional)

If you want to use your own domain:

1. In R2 bucket settings, click **Add custom domain**
2. Enter your domain (e.g., `photos.yourdomain.com`)
3. Add the CNAME record to your DNS
4. Update the public URL in `src/app/api/upload/route.ts`

## 🧪 Testing After Setup

### Test Local Database

```bash
# Insert a test record
npx wrangler d1 execute retro-camera-db --local --command="INSERT INTO photos (id, imageUrl, positionX, positionY, rotation, createdAt) VALUES ('test-1', 'https://example.com/test.jpg', 0, 0, 0, 1704672000);"

# Query records
npx wrangler d1 execute retro-camera-db --local --command="SELECT * FROM photos;"

# Delete test record
npx wrangler d1 execute retro-camera-db --local --command="DELETE FROM photos WHERE id='test-1';"
```

### Test API Routes

1. **Test Gallery (should return empty array)**:

   ```bash
   curl http://localhost:3000/api/gallery
   ```

2. **Test Upload** (capture a photo in the app and upload)

3. **Test Gallery Again** (should return your uploaded photo)

## ⚡ Quick Start (TL;DR)

```bash
# Initialize local database
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

# Start dev server
npm run dev

# Open http://localhost:3000
# Capture and upload a photo
# Visit /gallery to see it
```

## 🐛 Troubleshooting

### Error: "no such table: photos"

**Solution**: Run the initialization command:

```bash
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql
```

### Error: "D1 database not found"

**Solution**: Verify database ID in `wrangler.json` matches your created database:

```bash
npx wrangler d1 list
```

### Gallery shows "Something went wrong"

**Solutions**:

1. Check if D1 database is initialized (see above)
2. Check browser console for specific errors
3. Check terminal logs for server errors

### Photos not displaying in gallery

**Solutions**:

1. Verify R2 public access is enabled
2. Check the public URL in `src/app/api/upload/route.ts` is correct
3. Try opening an image URL directly in browser

## 📊 Database Commands Reference

```bash
# List all databases
npx wrangler d1 list

# List tables in database
npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# View table schema
npx wrangler d1 execute retro-camera-db --local --command="PRAGMA table_info(photos);"

# Count records
npx wrangler d1 execute retro-camera-db --local --command="SELECT COUNT(*) as count FROM photos;"

# View recent photos
npx wrangler d1 execute retro-camera-db --local --command="SELECT id, imageUrl, createdAt FROM photos ORDER BY createdAt DESC LIMIT 10;"

# Clear all photos (careful!)
npx wrangler d1 execute retro-camera-db --local --command="DELETE FROM photos;"
```

## 🎯 After Setup

Once you've completed the setup:

1. ✅ D1 database initialized
2. ✅ R2 bucket public access enabled
3. ✅ Public URL updated in upload route
4. ✅ Local dev server running
5. ✅ Can capture and upload photos
6. ✅ Gallery displays uploaded photos

**You're ready to deploy to production!**

```bash
npm run deploy
```
