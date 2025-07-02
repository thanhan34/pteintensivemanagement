# Fix Authentication Issues Script
Write-Host "=== Fixing Authentication Issues ===" -ForegroundColor Cyan

# 1. Clear browser cache and service worker
Write-Host "`n1. Clearing browser cache and service worker..." -ForegroundColor Yellow
Write-Host "Please manually clear your browser cache and service worker by:"
Write-Host "- Open Developer Tools (F12)"
Write-Host "- Go to Application tab"
Write-Host "- Click 'Clear storage' under Storage section"
Write-Host "- Check all boxes and click 'Clear site data'"
Write-Host "- Or use Ctrl+Shift+Delete to clear browsing data"

# 2. Update cache version to force refresh
Write-Host "`n2. Updating cache version..." -ForegroundColor Yellow
$swPath = "public/sw.js"
if (Test-Path $swPath) {
    $content = Get-Content $swPath -Raw
    $newVersion = "pte-management-v" + (Get-Date -Format "yyyyMMddHHmm")
    $content = $content -replace "const CACHE_NAME = 'pte-management-v\d+';", "const CACHE_NAME = '$newVersion';"
    Set-Content $swPath $content
    Write-Host "Cache version updated to: $newVersion" -ForegroundColor Green
}

# 3. Check environment variables
Write-Host "`n3. Checking environment variables..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    $hasGoogleClientId = $envContent | Where-Object { $_ -match "GOOGLE_CLIENT_ID=" }
    $hasGoogleClientSecret = $envContent | Where-Object { $_ -match "GOOGLE_CLIENT_SECRET=" }
    $hasNextAuthSecret = $envContent | Where-Object { $_ -match "NEXTAUTH_SECRET=" }
    $hasNextAuthUrl = $envContent | Where-Object { $_ -match "NEXTAUTH_URL=" }
    
    if ($hasGoogleClientId) { Write-Host "✓ GOOGLE_CLIENT_ID found" -ForegroundColor Green }
    else { Write-Host "✗ GOOGLE_CLIENT_ID missing" -ForegroundColor Red }
    
    if ($hasGoogleClientSecret) { Write-Host "✓ GOOGLE_CLIENT_SECRET found" -ForegroundColor Green }
    else { Write-Host "✗ GOOGLE_CLIENT_SECRET missing" -ForegroundColor Red }
    
    if ($hasNextAuthSecret) { Write-Host "✓ NEXTAUTH_SECRET found" -ForegroundColor Green }
    else { Write-Host "✗ NEXTAUTH_SECRET missing" -ForegroundColor Red }
    
    if ($hasNextAuthUrl) { Write-Host "✓ NEXTAUTH_URL found" -ForegroundColor Green }
    else { Write-Host "✗ NEXTAUTH_URL missing" -ForegroundColor Red }
} else {
    Write-Host "✗ .env.local file not found" -ForegroundColor Red
}

# 4. Restart development server
Write-Host "`n4. Restarting development server..." -ForegroundColor Yellow
Write-Host "Please restart your development server:"
Write-Host "- Stop current server (Ctrl+C)"
Write-Host "- Run: npm run dev"

# 5. Test authentication
Write-Host "`n5. Testing authentication..." -ForegroundColor Yellow
Write-Host "After restarting the server, test authentication by:"
Write-Host "- Open http://localhost:3000/auth/signin"
Write-Host "- Click 'Sign in with Google'"
Write-Host "- Check browser console for any errors"

Write-Host "`n=== Fix Complete ===" -ForegroundColor Cyan
Write-Host "If issues persist, check the following:" -ForegroundColor Yellow
Write-Host "1. Google OAuth configuration in Google Cloud Console"
Write-Host "2. Authorized redirect URIs include your domain"
Write-Host "3. Firebase configuration is correct"
Write-Host "4. Network connectivity to Google services"
