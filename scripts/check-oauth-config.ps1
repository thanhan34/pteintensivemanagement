# Google OAuth Configuration Checker
Write-Host "=== Google OAuth Configuration Check ===" -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "ERROR: .env.local file not found!" -ForegroundColor Red
    exit 1
}

# Read environment variables
$envContent = Get-Content ".env.local"
$googleClientId = ($envContent | Where-Object { $_ -match "^GOOGLE_CLIENT_ID=" }) -replace "GOOGLE_CLIENT_ID=", ""
$nextAuthUrl = ($envContent | Where-Object { $_ -match "^NEXTAUTH_URL=" }) -replace "NEXTAUTH_URL=", ""

Write-Host ""
Write-Host "Current Configuration:" -ForegroundColor Yellow
Write-Host "NEXTAUTH_URL: $nextAuthUrl" -ForegroundColor White
Write-Host "GOOGLE_CLIENT_ID: $googleClientId" -ForegroundColor White

# Calculate expected redirect URIs
$expectedRedirectUris = @(
    "$nextAuthUrl/api/auth/callback/google"
)

Write-Host ""
Write-Host "Expected Redirect URIs for Google Cloud Console:" -ForegroundColor Green
foreach ($uri in $expectedRedirectUris) {
    Write-Host "  - $uri" -ForegroundColor White
}

Write-Host ""
Write-Host "Instructions to fix redirect_uri_mismatch:" -ForegroundColor Cyan
Write-Host "1. Go to Google Cloud Console: https://console.cloud.google.com/" -ForegroundColor White
Write-Host "2. Navigate to APIs and Services > Credentials" -ForegroundColor White
Write-Host "3. Find your OAuth 2.0 Client ID: $googleClientId" -ForegroundColor White
Write-Host "4. Click Edit (pencil icon)" -ForegroundColor White
Write-Host "5. In 'Authorized redirect URIs', add:" -ForegroundColor White
foreach ($uri in $expectedRedirectUris) {
    Write-Host "   $uri" -ForegroundColor Yellow
}
Write-Host "6. Save the changes" -ForegroundColor White
Write-Host "7. Wait a few minutes for changes to propagate" -ForegroundColor White

Write-Host ""
Write-Host "Common Issues:" -ForegroundColor Red
Write-Host "- Make sure there are no trailing slashes in redirect URIs" -ForegroundColor White
Write-Host "- Ensure the domain matches exactly (http vs https)" -ForegroundColor White
Write-Host "- For production, use your actual domain instead of localhost" -ForegroundColor White

Write-Host ""
Write-Host "After updating Google Cloud Console, test the authentication again." -ForegroundColor Green
