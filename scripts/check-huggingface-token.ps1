#!/usr/bin/env pwsh
# Simple script to verify Hugging Face API token

Write-Host "Checking Hugging Face API token..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found." -ForegroundColor Red
    exit 1
}

# Read API key from .env
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$apiKeyLine = $envContent | Where-Object { $_ -match "EXPO_PUBLIC_HUGGINGFACE_API_KEY=" }

if (-not $apiKeyLine) {
    Write-Host "ERROR: Hugging Face API key not found in .env file." -ForegroundColor Red
    Write-Host "Please add a line with EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_token_here to your .env file." -ForegroundColor Yellow
    exit 1
}

$apiKey = ($apiKeyLine -split "=")[1].Trim()

if ($apiKey -eq "YOUR_HUGGINGFACE_API_TOKEN_HERE" -or [string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "ERROR: You need to update the Hugging Face API key in .env file with a real token." -ForegroundColor Red
    Write-Host "Please follow the guide at ./docs/huggingface-token-fix.md" -ForegroundColor Yellow
    exit 1
}

Write-Host "API token found: $($apiKey.Substring(0, 5))..." -ForegroundColor Green

# First, test if the token itself is valid by checking user info
try {
    Write-Host "Validating token with Hugging Face API..." -ForegroundColor Cyan
    $userResponse = Invoke-RestMethod -Uri "https://huggingface.co/api/whoami" -Headers @{
        "Authorization" = "Bearer $apiKey"
    } -Method GET -ErrorAction Stop

    Write-Host "SUCCESS! API token is valid" -ForegroundColor Green
    Write-Host "Connected as: $($userResponse.name)" -ForegroundColor Green
    Write-Host "User type: $($userResponse.type)" -ForegroundColor Green
    
    if ($userResponse.isPro) {
        Write-Host "Account has PRO status" -ForegroundColor Green
    } else {
        Write-Host "Account has standard access" -ForegroundColor Yellow
    }
    
    # Now test the simplest model
    Write-Host "`nTesting DialoGPT model..." -ForegroundColor Cyan
    $model = "microsoft/DialoGPT-small"
    
    try {
        $response = Invoke-RestMethod -Uri "https://api-inference.huggingface.co/models/$model" -Headers @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        } -Method POST -Body '{"inputs": "Hello"}' -ErrorAction Stop
        
        Write-Host "SUCCESS! DialoGPT model works with your token" -ForegroundColor Green
    } catch {
        Write-Host "Error testing DialoGPT model. Details:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        
        Write-Host "`nYOUR TOKEN WORKS, but there's an issue with the model access." -ForegroundColor Yellow
        Write-Host "This is likely due to permission settings on your Hugging Face account." -ForegroundColor Yellow
        Write-Host "Please follow the guide at ./docs/huggingface-token-fix.md to create a token with WRITE access." -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Invalid token. Details:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host "`nPlease follow these steps to fix:" -ForegroundColor Yellow
    Write-Host "1. Visit https://huggingface.co/settings/tokens" -ForegroundColor Yellow 
    Write-Host "2. Create a NEW token with WRITE access" -ForegroundColor Yellow
    Write-Host "3. Copy the new token to your .env file" -ForegroundColor Yellow
    Write-Host "4. See ./docs/huggingface-token-fix.md for detailed instructions" -ForegroundColor Yellow
}
