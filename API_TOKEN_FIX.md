# 🔧 API Token Permission Fix - Authentication Error 10000

## 🔴 Problem

**Error**: `Authentication error [code: 10000]`  
**Cause**: Your API token doesn't have permissions for R2 bucket operations

```
You are logged in with an API Token.
The token is read from the CLOUDFLARE_API_TOKEN environment variable.
Error: Authentication error when accessing R2 buckets
```

## ✅ Solution: Two Options

### **Option A: Use OAuth (Recommended - Easiest)**

OAuth gives you full permissions without managing tokens.

#### Step 1: Temporarily Remove API Token

**Windows (Command Prompt):**

```cmd
set CLOUDFLARE_API_TOKEN=
set CLOUDFLARE_ACCOUNT_ID=
```

**Windows (PowerShell):**

```powershell
$env:CLOUDFLARE_API_TOKEN=""
$env:CLOUDFLARE_ACCOUNT_ID=""
```

**Windows (Git Bash):**

```bash
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID
```

**Mac/Linux:**

```bash
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID
```

#### Step 2: Rename Environment Files (Temporary)

```bash
# Temporarily rename to prevent loading
mv .env .env.backup
mv .env.local .env.local.backup
```

#### Step 3: Login with OAuth

```bash
npx wrangler login
```

This will open your browser for authentication.

#### Step 4: Run Setup Again

```bash
bash setup-r2-fix.sh
```

#### Step 5: Restore Environment Files (After Setup)

```bash
mv .env.backup .env
mv .env.local.backup .env.local
```

---

### **Option B: Create New API Token with Correct Permissions**

Create a new token with R2 access.

#### Step 1: Create New API Token

1. Go to: https://dash.cloudflare.com/5a8d674f83ca3fb12bdcb750284dd551/api-tokens
2. Click **Create Token**
3. Click **Get started** next to **Create Custom Token**

#### Step 2: Configure Token Permissions

**Token Name**: `retro-camera-r2-access`

**Permissions** (Add these):

```
Account → D1 → Edit
Account → R2 → Edit
Account → Workers R2 Storage → Edit
Account → Workers Scripts → Edit
Zone → Workers Routes → Edit
```

**Account Resources**:

- Include → Specific account → Select your account

**TTL**: Set expiration date or leave blank for no expiration

#### Step 3: Copy the Token

After creating, copy the token (you'll only see it once!)

#### Step 4: Update Environment Files

Update both `.env` and `.env.local`:

```env
# Replace with your NEW token
CLOUDFLARE_API_TOKEN=YOUR_NEW_TOKEN_HERE
CLOUDFLARE_ACCOUNT_ID=5a8d674f83ca3fb12bdcb750284dd551
```

#### Step 5: Test the Token

```bash
npx wrangler whoami
```

Should show your account without errors.

#### Step 6: Run Setup Again

```bash
bash setup-r2-fix.sh
```

---

## 🚀 Quick Fix (Recommended for Now)

For development, the easiest approach is OAuth:

### Windows (Git Bash):

```bash
# Step 1: Temporarily disable API token
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID

# Step 2: Login with OAuth
npx wrangler login

# Step 3: Verify login
npx wrangler whoami

# Step 4: Manual R2 setup (since script expects token)
# Enable R2 public access via dashboard
echo "Go to: https://dash.cloudflare.com → R2 → retro-camera-photos"
echo "Enable: Settings → Public Access → R2.dev subdomain"

# Step 5: Get public URL from dashboard and add to .env.local
echo "R2_PUBLIC_URL=https://pub-YOUR-HASH.r2.dev" > .env.local.new

# Step 6: Initialize D1 database
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql
```

### Complete Manual Setup (After OAuth Login):

```bash
# 1. Login (unset token first!)
unset CLOUDFLARE_API_TOKEN
npx wrangler login

# 2. List R2 buckets
npx wrangler r2 bucket list

# 3. If retro-camera-photos doesn't exist, create it
npx wrangler r2 bucket create retro-camera-photos

# 4. Enable public access via dashboard
# Go to: https://dash.cloudflare.com
# Navigate: R2 → retro-camera-photos → Settings
# Enable: Public Access → R2.dev subdomain
# Copy the URL: https://pub-xxxxxx.r2.dev

# 5. Create .env.local with R2 URL
cat > .env.local << EOF
# R2 Public URL for image delivery
R2_PUBLIC_URL=https://pub-YOUR-ACTUAL-HASH.r2.dev

# No API tokens needed - using OAuth for wrangler commands
# Cloudflare bindings work automatically in development
EOF

# 6. Initialize D1 database
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

# 7. Verify setup
npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"

# 8. Copy fixed route
cp src/app/api/upload/route-r2-fixed.ts src/app/api/upload/route.ts

# 9. Test
npm run dev
```

---

## 🔍 Understanding the Issue

### Current API Token Permissions

Your token has these permissions:

```
✓ Account Settings: Read
✗ R2: No access
✗ D1: No access
```

### Required Permissions for This Project

```
✓ R2: Edit (create/read/write buckets)
✓ D1: Edit (read/write database)
✓ Workers: Edit (for deployment)
```

### Why OAuth is Better for Development

| Method        | Pros                                                           | Cons                                               |
| ------------- | -------------------------------------------------------------- | -------------------------------------------------- |
| **OAuth**     | ✅ Full permissions<br>✅ Easy login<br>✅ No token management | ❌ Manual login required                           |
| **API Token** | ✅ Automated<br>✅ Works in CI/CD                              | ❌ Need correct permissions<br>❌ Token management |

**Recommendation**: Use OAuth for development, API tokens for production/CI.

---

## 📋 Verification Steps

After login (OAuth or new token):

```bash
# 1. Check authentication
npx wrangler whoami

# Expected output:
# ✓ You are logged in...
# ✓ Account: Rohitkhatri111112@gmail.com's Account

# 2. Test R2 access
npx wrangler r2 bucket list

# Expected output:
# List of buckets (or empty if none exist)

# 3. Test D1 access
npx wrangler d1 list

# Expected output:
# retro-camera-db with ID

# 4. No errors!
```

---

## 🎯 Step-by-Step Fix (Copy-Paste)

### For Windows Git Bash:

```bash
# Stop here and run each command one by one

# 1. Unset the API token (in current terminal session)
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID

# 2. Verify they're unset
echo "CLOUDFLARE_API_TOKEN: $CLOUDFLARE_API_TOKEN"
echo "CLOUDFLARE_ACCOUNT_ID: $CLOUDFLARE_ACCOUNT_ID"
# Should print empty values

# 3. Login with OAuth
npx wrangler login
# Browser will open - authorize Wrangler

# 4. Verify you're logged in
npx wrangler whoami
# Should show your account without mentioning API token

# 5. Check R2 access
npx wrangler r2 bucket list
# Should list buckets or show empty (no error!)

# 6. Create R2 bucket if doesn't exist
npx wrangler r2 bucket create retro-camera-photos

# 7. Go to dashboard to enable public access
echo "Open in browser: https://dash.cloudflare.com"
echo "Navigate: R2 → retro-camera-photos → Settings"
echo "Enable: Public Access → R2.dev subdomain"
read -p "Press Enter after enabling public access..."

# 8. Get your R2 public URL
echo "Enter your R2 public URL from dashboard:"
read R2_PUBLIC_URL

# 9. Create .env.local
cat > .env.local << EOF
# R2 Public URL for image delivery
R2_PUBLIC_URL=$R2_PUBLIC_URL
EOF

echo "✓ Created .env.local with R2_PUBLIC_URL"

# 10. Initialize D1 database
npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

# 11. Verify D1
npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
# Should show: photos

# 12. Update upload route
cp src/app/api/upload/route-r2-fixed.ts src/app/api/upload/route.ts
echo "✓ Updated upload route"

# 13. Start dev server
npm run dev
```

---

## 🔄 For Future Terminal Sessions

**Important**: The `unset` command only works for the current terminal session.

To permanently use OAuth instead of API token:

### Option 1: Remove from .env files

```bash
# Edit .env and .env.local
# Comment out or remove these lines:
# CLOUDFLARE_API_TOKEN=...
# CLOUDFLARE_ACCOUNT_ID=...
```

### Option 2: Create .env.development

```bash
# Create .env.development (loaded in dev mode only)
# Leave .env and .env.local for production
cat > .env.development << EOF
# Development uses OAuth - no tokens needed
# CLOUDFLARE_API_TOKEN is intentionally not set
EOF
```

---

## 📚 Additional Resources

- **Create API Token**: https://dash.cloudflare.com/5a8d674f83ca3fb12bdcb750284dd551/api-tokens
- **R2 Dashboard**: https://dash.cloudflare.com → R2
- **Wrangler Auth Docs**: https://developers.cloudflare.com/workers/wrangler/authentication/

---

## ❓ FAQ

**Q: Will this affect my production deployment?**  
A: No, OAuth is for local development. Production uses Wrangler secrets.

**Q: Can I use both OAuth and API tokens?**  
A: Not simultaneously. Wrangler prefers API token if `CLOUDFLARE_API_TOKEN` is set.

**Q: How long does OAuth stay logged in?**  
A: Until you run `npx wrangler logout` or clear auth cache.

**Q: What if I need API tokens for CI/CD?**  
A: Create a new token with proper permissions (Option B above) for CI/CD only.

---

## ✅ Success Criteria

You'll know it's fixed when:

- ✅ `npx wrangler whoami` works without errors
- ✅ `npx wrangler r2 bucket list` shows buckets
- ✅ No "Authentication error [code: 10000]"
- ✅ Can create/access R2 buckets and D1 databases

---

**Ready to fix?** → Run the commands in the "Step-by-Step Fix" section above.
