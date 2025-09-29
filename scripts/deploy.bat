@echo off
REM Production Deployment Script for AI Reels Platform (Windows)
REM This script handles database migrations and deployment preparation

echo 🚀 Starting production deployment...

REM Check if required environment variables are set
if "%DATABASE_URL%"=="" (
    echo ❌ ERROR: DATABASE_URL environment variable is not set
    exit /b 1
)

if "%JWT_SECRET%"=="" (
    echo ❌ ERROR: JWT_SECRET environment variable is not set
    exit /b 1
)

if "%NEXTAUTH_SECRET%"=="" (
    echo ❌ ERROR: NEXTAUTH_SECRET environment variable is not set
    exit /b 1
)

echo ✅ Environment variables validated

REM Generate Prisma client
echo 📦 Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    exit /b 1
)

REM Run database migrations
echo 🗄️ Running database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo ❌ Database migration failed
    exit /b 1
)

REM Seed database with initial data (only if needed)
if "%SEED_DATABASE%"=="true" (
    echo 🌱 Seeding database...
    call npx tsx prisma/seed.ts
    if errorlevel 1 (
        echo ⚠️ Database seeding failed, but continuing...
    )
)

echo ✅ Database setup complete

REM Build the application
echo 🔨 Building application...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)

echo ✅ Production deployment preparation complete!
echo 📝 Next steps:
echo    1. Deploy to Vercel using 'vercel --prod'
echo    2. Set environment variables in Vercel dashboard
echo    3. Test the deployed application

pause