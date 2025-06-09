# Test OAuth Configuration Script
Write-Host "=== Testing OAuth Configuration ===" -ForegroundColor Cyan

# Check if development server is running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
    }
} catch {
    $serverRunning = $false
}

if (-not $serverRunning) {
    Write-Host ""
    Write-Host "Development server is not running. Starting it now..." -ForegroundColor Yellow
    Write-Host "Running: npm run dev" -ForegroundColor White
    
    # Start the development server
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    
    Write-Host "Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
} else {
    Write-Host ""
    Write-Host "Development server is already running at http://localhost:3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "Opening authentication test page..." -ForegroundColor Cyan
Start-Process "http://localhost:3000/auth/signin"

Write-Host ""
Write-Host "Test Steps:" -ForegroundColor Yellow
Write-Host "1. The sign-in page should open in your browser" -ForegroundColor White
Write-Host "2. Click 'Sign in with Google'" -ForegroundColor White
Write-Host "3. If you see the redirect_uri_mismatch error, follow the instructions from check-oauth-config.ps1" -ForegroundColor White
Write-Host "4. If authentication succeeds, you should be redirected to the home page" -ForegroundColor White

Write-Host ""
Write-Host "If you still get errors after updating Google Cloud Console:" -ForegroundColor Red
Write-Host "- Wait 5-10 minutes for changes to propagate" -ForegroundColor White
Write-Host "- Clear your browser cache and cookies" -ForegroundColor White
Write-Host "- Try in an incognito/private browser window" -ForegroundColor White
