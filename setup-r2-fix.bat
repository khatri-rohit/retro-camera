@echo off
REM 🚀 Cloudflare R2 Setup Script - Complete Fix for Error 5403 (Windows)
REM This script sets up R2 storage instead of Cloudflare Images

echo ==================================================
echo 🚀 Cloudflare R2 Setup for Retro Camera
echo ==================================================
echo.

REM Check if npm is installed
where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ✗ npm/npx not found. Please install Node.js first.
    exit /b 1
)

echo ✓ Node.js and npm found
echo.

REM Step 1: Login to Cloudflare
echo ================================================
echo 📋 Step 1: Cloudflare Authentication
echo ================================================
echo Opening browser for Cloudflare login...
call npx wrangler login

if %ERRORLEVEL% NEQ 0 (
    echo ✗ Login failed
    exit /b 1
)

echo ✓ Logged in to Cloudflare
echo.

REM Step 2: Check if R2 bucket exists
echo ================================================
echo 📋 Step 2: Verify R2 Bucket
echo ================================================
echo Checking for retro-camera-photos bucket...

call npx wrangler r2 bucket list | findstr /C:"retro-camera-photos" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ R2 bucket 'retro-camera-photos' exists
) else (
    echo Creating R2 bucket 'retro-camera-photos'...
    call npx wrangler r2 bucket create retro-camera-photos
    if %ERRORLEVEL% NEQ 0 (
        echo ✗ Failed to create R2 bucket
        exit /b 1
    )
    echo ✓ R2 bucket created
)
echo.

REM Step 3: Enable public access
echo ================================================
echo 📋 Step 3: Enable R2 Public Access
echo ================================================
echo.
echo ℹ Please manually enable public access in Cloudflare Dashboard:
echo   1. Go to: https://dash.cloudflare.com
echo   2. Click 'R2' -^> 'retro-camera-photos'
echo   3. Click 'Settings' tab
echo   4. Enable 'R2.dev subdomain' under Public Access
echo   5. Copy the public URL (format: https://pub-xxxxxxxx.r2.dev)
echo.
set /p R2_PUBLIC_URL="Enter your R2 Public URL: "

if "%R2_PUBLIC_URL%"=="" (
    echo ✗ R2 Public URL is required
    exit /b 1
)

echo ✓ R2 Public URL: %R2_PUBLIC_URL%
echo.

REM Step 4: Update .env.local
echo ================================================
echo 📋 Step 4: Update Environment Variables
echo ================================================

(
echo # Cloudflare R2 Configuration
echo # Generated on %DATE% %TIME%
echo.
echo # R2 Public URL for image delivery
echo R2_PUBLIC_URL=%R2_PUBLIC_URL%
echo.
echo # Note: All other resources (D1, R2, Workers AI^) are accessed via
echo # Cloudflare bindings configured in wrangler.json
echo # No API tokens or account IDs needed for local development!
) > .env.local

echo ✓ Updated .env.local with R2_PUBLIC_URL
echo.

REM Step 5: Initialize D1 Database
echo ================================================
echo 📋 Step 5: Initialize D1 Database
echo ================================================

call npx wrangler d1 list | findstr /C:"retro-camera-db" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ✗ D1 database 'retro-camera-db' not found
    echo Please create it first or update wrangler.json
    exit /b 1
)

echo ✓ D1 database 'retro-camera-db' exists
echo.

echo Initializing local D1 database schema...
call npx wrangler d1 execute retro-camera-db --local --file=./schema.sql

if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to initialize local database
    exit /b 1
)

echo ✓ Local D1 database initialized
echo.

set /p INIT_PROD="Initialize production database too? (y/N): "
if /i "%INIT_PROD%"=="y" (
    echo Initializing production D1 database...
    call npx wrangler d1 execute retro-camera-db --remote --file=./schema.sql
    if %ERRORLEVEL% NEQ 0 (
        echo ✗ Failed to initialize production database
    ) else (
        echo ✓ Production D1 database initialized
    )
)
echo.

REM Step 6: Verify setup
echo ================================================
echo 📋 Step 6: Verify Setup
echo ================================================

echo Checking R2 bucket...
call npx wrangler r2 bucket list | findstr /C:"retro-camera-photos" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ R2 bucket OK
) else (
    echo ✗ R2 bucket not found
)

echo Checking D1 database tables...
call npx wrangler d1 execute retro-camera-db --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name='photos';" | findstr /C:"photos" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ D1 database tables OK
) else (
    echo ✗ D1 database tables not found
)
echo.

REM Final instructions
echo ==================================================
echo ✅ Setup Complete!
echo ==================================================
echo.
echo 📝 Next Steps:
echo.
echo 1. Update your code to use R2:
echo    copy src\app\api\upload\route-r2-fixed.ts src\app\api\upload\route.ts
echo.
echo 2. Update cloudflare-env.d.ts to include R2_PUBLIC_URL
echo.
echo 3. Start development server:
echo    npm run dev
echo.
echo 4. Test upload functionality at http://localhost:3000
echo.
echo 📚 Documentation:
echo    - See CLOUDFLARE_IMAGES_FIX.md for detailed explanation
echo    - R2 Dashboard: https://dash.cloudflare.com
echo.
echo ✓ All done! Happy coding! 🎉
pause
