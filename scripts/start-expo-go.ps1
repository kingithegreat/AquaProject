# Simple script to start Expo Go with optimal settings for development
# This script helps with consistent settings and clears caches when needed

Write-Host "Starting Aqua360 in Expo Go with optimized settings..." -ForegroundColor Cyan

# Clean up cached files if requested
if ($args -contains "-c" -or $args -contains "--clean") {
    Write-Host "Cleaning Expo cache..." -ForegroundColor Yellow
    npx expo start --clear
    exit
}

# Check for expo-updates package
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$hasUpdates = $packageJson.dependencies.'expo-updates' -ne $null

if (-not $hasUpdates) {
    Write-Host "expo-updates package not found. Installing..." -ForegroundColor Yellow
    yarn add expo-updates
}

# Start Expo with development client
Write-Host "Starting Expo Go..." -ForegroundColor Green
npx expo start --dev-client

# Add usage instructions
<#
.SYNOPSIS
    Starts Aqua360 app in Expo Go with optimal settings.

.DESCRIPTION
    This script launches the Aqua360 app in Expo Go with settings optimized
    for development. It can also clean the cache if needed.

.PARAMETER Clean
    Cleans the Expo cache before starting the app.
    Usage: ./start-expo-go.ps1 -c or ./start-expo-go.ps1 --clean
#>
