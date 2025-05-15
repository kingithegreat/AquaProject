# Script to launch Expo app with better defaults for development
# This ensures the app runs smoothly in Expo Go

# Clear terminal for better readability
Clear-Host

Write-Host "🚀 Starting Aqua 360° in Expo Go with optimized settings..." -ForegroundColor Cyan

# Clear Metro cache to prevent stale builds
if (Test-Path -Path "node_modules/.cache") {
    Write-Host "🧹 Clearing Metro cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
}

# Get local IP address for better device connectivity
$networkConfig = Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq 'IPv4' -and 
    $_.PrefixOrigin -ne 'WellKnown' -and 
    $_.IPAddress -notlike '127.*' -and
    $_.IPAddress -notlike '169.254.*'
}

$localIP = $networkConfig.IPAddress

if (-not $localIP) {
    Write-Host "⚠️ Couldn't determine local IP address. Using localhost." -ForegroundColor Yellow
    $localIP = "localhost"
} else {
    Write-Host "🌐 Using local network IP: $localIP" -ForegroundColor Green
}

# Set environment variables for better Expo Go compatibility
$env:EXPO_PACKAGER_HOSTNAME = $localIP
$env:EXPO_OFFLINE_CACHE = "1"

# Start Expo with optimized settings
Write-Host "📱 Running Expo start with enhanced settings..." -ForegroundColor Magenta

# Use cross-platform command to run expo
npx expo start --clear --lan --dev --minify
