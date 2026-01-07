# Cloudflare Migration Guide

## Migration Completed ✅

This project has been successfully migrated from Firebase to Cloudflare Workers.

## Changes Made

### 1. **Storage Migration**
- **From:** Firebase Storage
- **To:** Cloudflare R2
- Files are now stored in Cloudflare R2 bucket

### 2. **Database Migration**
- **From:** Firestore
- **To:** Cloudflare D1 (SQLite)
- New schema created in `schema.sql`

### 3. **AI Image Processing**
- **From:** Firebase AI SDK (Gemini via Firebase)
- **To:** Direct Google Gemini API calls
- Updated to use `NEXT_PUBLIC_GEMINI_API_KEY`

### 4. **Deployment Platform**
- **From:** Firebase Hosting/Cloud Functions
- **To:** Cloudflare Workers/Pages
- Using OpenNext adapter for Next.js on Cloudflare

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Cloudflare Resources

#### Create D1 Database
```bash
npx wrangler d1 create retro-camera-db
```
Copy the database ID from the output and update `wrangler.json`:
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "retro-camera-db",
    "database_id": "YOUR_DATABASE_ID_HERE"
  }
]
```

#### Initialize Database Schema
```bash
npx wrangler d1 execute retro-camera-db --file=./schema.sql
```

#### Create R2 Bucket
```bash
npx wrangler r2 bucket create retro-camera-photos
```

#### Configure R2 Public Access (Optional)
You can enable public access to your R2 bucket:
1. Go to Cloudflare Dashboard
2. Navigate to R2
3. Select your bucket
4. Enable public access and note the public URL
5. Update the `publicUrl` in `src/app/api/upload/route.ts` with your R2 public domain

Alternatively, you can use custom domains for R2.

### 3. Set Environment Variables

#### For Development (.env.local)
```bash
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

#### For Production (Cloudflare)
Set via wrangler CLI:
```bash
npx wrangler secret put NEXT_PUBLIC_GEMINI_API_KEY
```

Or set in Cloudflare Dashboard under Workers & Pages > Your Project > Settings > Environment Variables

### 4. Development

Run Next.js development server:
```bash
npm run dev
```

### 5. Test with Cloudflare Adapter

Preview with Cloudflare Workers runtime:
```bash
npm run preview
```

### 6. Deploy to Cloudflare

```bash
npm run deploy
```

Or use Cloudflare's Git integration:
1. Connect your Git repository to Cloudflare Pages
2. Set build command: `npm run deploy`
3. Enable automatic deployments

## Key Files

- `wrangler.json` - Cloudflare Workers configuration
- `open-next.config.ts` - OpenNext adapter configuration
- `schema.sql` - D1 database schema
- `cloudflare-env.d.ts` - TypeScript definitions for Cloudflare bindings
- `src/app/api/upload/route.ts` - Updated to use R2 and D1
- `src/app/api/gallery/route.ts` - Updated to use D1
- `src/app/geminiImageEdit.ts` - New AI image editing using Gemini API directly

## Important Notes

1. **R2 Public URL**: You need to update the `publicUrl` in `src/app/api/upload/route.ts` with your actual R2 public URL or custom domain after setting up public access to your R2 bucket.

2. **Database IDs**: Make sure to update the database_id in `wrangler.json` with your actual D1 database ID after creating it.

3. **Rate Limiting**: The current rate limiting uses in-memory storage. For production, consider using Cloudflare KV or Durable Objects for distributed rate limiting.

4. **Migrating Existing Data**: If you have existing data in Firebase, you'll need to:
   - Export photos from Firebase Storage and upload to R2
   - Export Firestore data and import into D1

## Useful Commands

```bash
# Type generation for Cloudflare bindings
npm run cf-typegen

# View D1 database contents
npx wrangler d1 execute retro-camera-db --command="SELECT * FROM photos;"

# List R2 buckets
npx wrangler r2 bucket list

# View deployment logs
npx wrangler tail
```

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [OpenNext Documentation](https://opennext.js.org/cloudflare)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
