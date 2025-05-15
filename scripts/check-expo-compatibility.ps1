# Script to check for common issues that might affect Expo Go compatibility

# Clear terminal for better readability
Clear-Host

Write-Host "🔍 Checking Aqua 360° for Expo Go compatibility issues..." -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a file exists
function Test-FileExists {
    param (
        [string]$FilePath,
        [string]$Description
    )
    
    Write-Host "Checking for $Description... " -NoNewline
    
    if (Test-Path $FilePath) {
        Write-Host "✅ Found" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Missing" -ForegroundColor Red
        return $false
    }
}

# Function to check for patterns in files
function Test-FileContent {
    param (
        [string]$FilePath,
        [string]$Pattern,
        [string]$Description,
        [bool]$ShouldExist = $true
    )
    
    Write-Host "Checking $Description... " -NoNewline
    
    if (-not (Test-Path $FilePath)) {
        Write-Host "❌ File not found" -ForegroundColor Red
        return $false
    }
    
    $content = Get-Content $FilePath -Raw
    $found = $content -match $Pattern
    
    if ($found -eq $ShouldExist) {
        Write-Host "✅ Good" -ForegroundColor Green
        return $true
    } else {
        if ($ShouldExist) {
            Write-Host "❌ Missing" -ForegroundColor Red
        } else {
            Write-Host "❌ Issue found" -ForegroundColor Red
        }
        return $false
    }
}

# 1. Check essential files
Write-Host "Essential Files:" -ForegroundColor Yellow
$appJson = Test-FileExists -FilePath "app.json" -Description "app.json"
$packageJson = Test-FileExists -FilePath "package.json" -Description "package.json"
$envFile = Test-FileExists -FilePath ".env" -Description ".env file"

# 2. Check Expo configuration
Write-Host "`nExpo Configuration:" -ForegroundColor Yellow
if ($appJson) {
    Test-FileContent -FilePath "app.json" -Pattern '"expo":' -Description "Expo configuration in app.json"
    Test-FileContent -FilePath "app.json" -Pattern '"scheme":' -Description "URL scheme in app.json"
    Test-FileContent -FilePath "app.json" -Pattern '"splash":' -Description "Splash screen configuration"
}

# 3. Check package.json for correct dependencies
Write-Host "`nDependencies:" -ForegroundColor Yellow
if ($packageJson) {
    Test-FileContent -FilePath "package.json" -Pattern '"expo":' -Description "Expo dependency"
    Test-FileContent -FilePath "package.json" -Pattern '"expo-router":' -Description "Expo Router"
    Test-FileContent -FilePath "package.json" -Pattern '"@react-native-async-storage/async-storage":' -Description "AsyncStorage"
    Test-FileContent -FilePath "package.json" -Pattern '"firebase":' -Description "Firebase"
}

# 4. Check for Firebase configuration
Write-Host "`nFirebase Configuration:" -ForegroundColor Yellow
Test-FileExists -FilePath "config/firebase.ts" -Description "Firebase configuration file"
if ($envFile) {
    Test-FileContent -FilePath ".env" -Pattern "EXPO_PUBLIC_FIREBASE" -Description "Firebase environment variables"
}

# 5. Check for polyfills
Write-Host "`nPolyfills and Compatibility:" -ForegroundColor Yellow
Test-FileContent -FilePath "config/firebase.ts" -Pattern "react-native-url-polyfill" -Description "URL polyfill import"
Test-FileContent -FilePath "config/firebase.ts" -Pattern "react-native-get-random-values" -Description "Crypto polyfill import"

# 6. Check for problematic native code that might not work in Expo Go
Write-Host "`nPotential Compatibility Issues:" -ForegroundColor Yellow
Test-FileContent -FilePath "config/firebase.ts" -Pattern "enableIndexedDbPersistence" -Description "IndexedDB persistence (might need modification for Expo Go)" -ShouldExist $true
$nativeModuleIssue = Test-FileContent -FilePath "app/_layout.tsx" -Pattern "NativeModules" -Description "Direct React Native NativeModules usage (problematic in Expo Go)" -ShouldExist $false

if ($nativeModuleIssue) {
    Write-Host "⚠️  Warning: Direct NativeModules usage found. This might cause issues in Expo Go." -ForegroundColor Yellow
}

# 7. Check for Expo Go specific configuration
Write-Host "`nExpo Go Configuration:" -ForegroundColor Yellow
Test-FileContent -FilePath "app.json" -Pattern '"expoGo":' -Description "Expo Go specific configuration"

Write-Host "`n=====================================================" -ForegroundColor Cyan
Write-Host "✨ Compatibility check completed!" -ForegroundColor Cyan
Write-Host "Run any missing items have been fixed? Run this script again to verify." -ForegroundColor Cyan
Write-Host "To start the app in Expo Go with optimal settings, run:" -ForegroundColor Cyan
Write-Host "./scripts/start-expo.ps1" -ForegroundColor Green
