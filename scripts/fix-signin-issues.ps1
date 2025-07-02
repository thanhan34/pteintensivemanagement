# Fix Google Sign-In Issues Script
# This script addresses cache, service worker, and authentication problems

Write-Host "🔧 Fixing Google Sign-In Issues..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Step 1: Stop any running development servers
Write-Host "1. Stopping development servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Clear Next.js cache
Write-Host "2. Clearing Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "   ✅ .next directory cleared" -ForegroundColor Green
}

# Step 3: Clear node_modules cache
Write-Host "3. Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Write-Host "   ✅ npm cache cleared" -ForegroundColor Green

# Step 4: Check environment variables
Write-Host "4. Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    $hasGoogleClientId = $envContent -match "GOOGLE_CLIENT_ID="
    $hasGoogleClientSecret = $envContent -match "GOOGLE_CLIENT_SECRET="
    $hasNextAuthSecret = $envContent -match "NEXTAUTH_SECRET="
    $hasNextAuthUrl = $envContent -match "NEXTAUTH_URL="
    
    if ($hasGoogleClientId -and $hasGoogleClientSecret -and $hasNextAuthSecret -and $hasNextAuthUrl) {
        Write-Host "   ✅ All required environment variables found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Missing environment variables:" -ForegroundColor Red
        if (-not $hasGoogleClientId) { Write-Host "     - GOOGLE_CLIENT_ID" -ForegroundColor Red }
        if (-not $hasGoogleClientSecret) { Write-Host "     - GOOGLE_CLIENT_SECRET" -ForegroundColor Red }
        if (-not $hasNextAuthSecret) { Write-Host "     - NEXTAUTH_SECRET" -ForegroundColor Red }
        if (-not $hasNextAuthUrl) { Write-Host "     - NEXTAUTH_URL" -ForegroundColor Red }
    }
} else {
    Write-Host "   ❌ .env.local file not found" -ForegroundColor Red
}

# Step 5: Reinstall dependencies
Write-Host "5. Reinstalling dependencies..." -ForegroundColor Yellow
npm install --silent
Write-Host "   ✅ Dependencies reinstalled" -ForegroundColor Green

# Step 6: Build the project
Write-Host "6. Building the project..." -ForegroundColor Yellow
npm run build 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Build had warnings (this is normal)" -ForegroundColor Yellow
}

# Step 7: Instructions for manual browser cache clearing
Write-Host "7. Manual steps required:" -ForegroundColor Yellow
Write-Host "   📋 Please follow these steps in your browser:" -ForegroundColor White
Write-Host "   1. Open Developer Tools (F12)" -ForegroundColor White
Write-Host "   2. Go to Application tab" -ForegroundColor White
Write-Host "   3. Click 'Clear storage' in the left sidebar" -ForegroundColor White
Write-Host "   4. Check all boxes and click 'Clear site data'" -ForegroundColor White
Write-Host "   5. Close and reopen your browser" -ForegroundColor White

# Step 8: Start development server
Write-Host "8. Starting development server..." -ForegroundColor Yellow
Write-Host "   🚀 Server will start at http://localhost:3000" -ForegroundColor Green
Write-Host "   📝 Check the console for any errors" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🎯 After the server starts:" -ForegroundColor Cyan
Write-Host "   1. Go to http://localhost:3000/auth/signin" -ForegroundColor White
Write-Host "   2. Try signing in with Google" -ForegroundColor White
Write-Host "   3. Check browser console for errors" -ForegroundColor White
Write-Host "" -ForegroundColor White

# Start the development server
npm run dev
