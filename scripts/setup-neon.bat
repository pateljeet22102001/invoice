@echo off
echo ============================================
echo  HisabSaathi - Neon PostgreSQL Setup
echo ============================================
echo.

findstr /C:"YOUR_NEON_URL_HERE" .env >nul 2>&1
if %errorlevel%==0 (
  echo ERROR: You still need to paste your Neon connection string in .env
  echo.
  echo 1. Go to https://console.neon.tech
  echo 2. Create a project ^(pick region: Asia Pacific Mumbai if available^)
  echo 3. Copy the connection string
  echo 4. Open web\.env and replace YOUR_NEON_URL_HERE with your URL
  echo 5. Run this script again
  exit /b 1
)

echo Creating database tables...
call npx prisma db push
if %errorlevel% neq 0 (
  echo.
  echo ERROR: Could not connect to database. Check your DATABASE_URL in .env
  exit /b 1
)

echo.
echo Seeding demo data...
call npm run db:seed

echo.
echo ============================================
echo  Setup complete!
echo  Run: npm run dev
echo  Then open: http://localhost:3000/api/health
echo ============================================
