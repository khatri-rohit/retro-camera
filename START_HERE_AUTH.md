# 🔥 AUTHENTICATION ERROR FIX - READ THIS FIRST

## Your Error

```
X [ERROR] A request to the Cloudflare API failed.
Authentication error [code: 10000]
```

## The Problem

Your `CLOUDFLARE_API_TOKEN` environment variable doesn't have R2 permissions.

## The Fix (3 Steps)

### Step 1: Remove API Token (Temporary)

```bash
unset CLOUDFLARE_API_TOKEN
unset CLOUDFLARE_ACCOUNT_ID
```

### Step 2: Login with OAuth

```bash
npx wrangler login
```

(Browser will open - authorize Wrangler)

### Step 3: Run the Auth Fix Script

```bash
bash fix-auth.sh
```

This will:

- ✅ Verify OAuth authentication
- ✅ Test R2 access
- ✅ Enable R2 public access (guided)
- ✅ Update .env.local
- ✅ Initialize D1 database
- ✅ Update upload route

---

## OR: Use the Automated Script

Just run:

```bash
bash fix-auth.sh
```

It will handle everything including unsetting the token!

---

## What's Happening?

1. **Your .env files** have `CLOUDFLARE_API_TOKEN=...`
2. **Wrangler reads it** and uses it for authentication
3. **Token lacks R2 permissions** → Authentication error
4. **OAuth gives full permissions** → Everything works

## Why OAuth Instead of Token?

| Method        | Pros                                                     | Cons                                                  |
| ------------- | -------------------------------------------------------- | ----------------------------------------------------- |
| **OAuth**     | ✅ Full permissions<br>✅ Easy<br>✅ No token management | ❌ Manual login once                                  |
| **API Token** | ✅ Automated                                             | ❌ Need correct permissions<br>❌ Your token is wrong |

**For development**: OAuth is easier and better.

---

## After Auth Fix

Your setup will work! Then you can:

1. Upload photos → R2 Storage
2. View gallery → From R2
3. Deploy → Cloudflare Workers

---

## Full Details

See **[API_TOKEN_FIX.md](API_TOKEN_FIX.md)** for:

- Detailed explanation
- How to create correct API token
- Troubleshooting steps
- Alternative methods

---

**TL;DR**: Run `bash fix-auth.sh` and follow the prompts. 5 minutes. Done. ✅
