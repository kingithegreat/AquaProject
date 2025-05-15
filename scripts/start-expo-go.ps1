# Aqua360 Expo Go Startup Script
# This script helps run the Aqua360 app specifically optimized for Expo Go

Write-Host "🌊 Aqua360 Expo Go Startup 🌊" -ForegroundColor Cyan
Write-Host "-----------------------------" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command {
    param($command)
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'stop'
    try { if (Get-Command $command) { return $true } }
    catch { return $false }
    finally { $ErrorActionPreference = $oldPreference }
}

# Check if Expo CLI is installed
if (-not (Test-Command expo)) {
    Write-Host "❌ Expo CLI is not installed. Installing it now..." -ForegroundColor Red
    npm install -g expo-cli
}

# Clean up cached files if requested
if ($args -contains "-c" -or $args -contains "--clean") {
    Write-Host "🧹 Cleaning Expo cache..." -ForegroundColor Yellow
    npx expo start --clear
    exit
}

# Check for expo-updates package
$packageJson = Get-Content -Path "$PSScriptRoot\..\package.json" -Raw | ConvertFrom-Json
$hasUpdates = $null -ne $packageJson.dependencies.'expo-updates'

if (-not $hasUpdates) {
    Write-Host "📦 expo-updates package not found. Installing..." -ForegroundColor Yellow
    npm add expo-updates
}

# Check for environment variables
$envFile = Join-Path $PSScriptRoot "../.env"
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️ No .env file found! Creating a template .env file..." -ForegroundColor Yellow
    @"
# Aqua360 Environment Variables
# Replace the placeholders with your actual Firebase configuration

FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-app.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
"@ | Out-File -FilePath $envFile -Encoding utf8
    
    Write-Host "✅ Template .env file created! Please update it with your Firebase configuration." -ForegroundColor Green
}

# Check if dependencies are installed
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $PSScriptRoot "../node_modules"))) {
    Write-Host "⚠️ Node modules not found. Installing dependencies..." -ForegroundColor Yellow
    Push-Location (Join-Path $PSScriptRoot "..")
    npm install
    Pop-Location
} else {
    Write-Host "✅ Dependencies seem to be installed." -ForegroundColor Green
}

# Start Expo with development client
Write-Host "🚀 Starting Aqua360 with Expo Go compatibility..." -ForegroundColor Cyan
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
