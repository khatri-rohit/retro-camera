@echo off
REM Cloudflare Setup Script for Retro Camera (Windows)
REM This script helps set up the necessary Cloudflare resources

echo 🚀 Setting up Cloudflare resources for Retro Camera...

REM Check if wrangler is installed
where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Wrangler CLI not found. Installing...
    npm install -g wrangler
)

REM Login to Cloudflare
echo.
echo 📝 Logging into Cloudflare...
call wrangler login

REM Create D1 Database
echo.
echo 📦 Creating D1 database...
echo Please copy the database ID from the output and update wrangler.json
call npx wrangler d1 create retro-camera-db

echo.
set /p REPLY="Have you updated the database_id in wrangler.json? (y/n) "
if /i not "%REPLY%"=="y" (
    echo Please update wrangler.json with the database_id and run this script again.
    exit /b 1
)

REM Initialize database schema
echo.
echo 📋 Initializing database schema...
call npx wrangler d1 execute retro-camera-db --file=./schema.sql

REM Create R2 bucket
echo.
echo 🪣 Creating R2 bucket...
call npx wrangler r2 bucket create retro-camera-photos

REM Set environment variables
echo.
echo 🔐 Setting up environment variables...
set /p GEMINI_KEY="Enter your Gemini API key: "
echo %GEMINI_KEY% | call npx wrangler secret put NEXT_PUBLIC_GEMINI_API_KEY

echo.
echo ✅ Setup complete!
echo.
echo ⚠️  Important next steps:
echo 1. Configure R2 public access in Cloudflare Dashboard
echo 2. Update the publicUrl in src/app/api/upload/route.ts with your R2 public URL
echo 3. Run 'npm run preview' to test locally with Cloudflare adapter
echo 4. Run 'npm run deploy' to deploy to Cloudflare Workers
echo.
echo 📚 For more information, see MIGRATION.md

pause
