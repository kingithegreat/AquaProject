#!/usr/bin/env pwsh
# Script to test Hugging Face Inference Providers API

Write-Host "Testing Hugging Face Inference Providers API..." -ForegroundColor Cyan

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
    exit 1
}

$apiKey = ($apiKeyLine -split "=")[1].Trim()

if ($apiKey -eq "YOUR_HUGGINGFACE_API_TOKEN_HERE") {
    Write-Host "ERROR: You need to update the Hugging Face API key in .env file with a real token." -ForegroundColor Red
    exit 1
}

Write-Host "API token found. Testing Inference Providers API..." -ForegroundColor Green

# Test the Inference Providers API
$url = "https://router.huggingface.co/novita/v3/openai/chat/completions"
$model = "deepseek/deepseek-v3-0324"
$body = @{
    messages = @(
        @{
            role = "user"
            content = "Tell me briefly about jet skiing."
        }
    )
    model = $model
    temperature = 0.7
    max_tokens = 100
    stream = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    } -Body $body -ErrorAction Stop
    
    Write-Host "
Success! Inference Providers API responded:" -ForegroundColor Green
    if ($response.choices -and $response.choices.Count -gt 0) {
        Write-Host $response.choices[0].message.content -ForegroundColor Cyan
    } else {
        Write-Host $response -ForegroundColor Cyan
    }
    
    Write-Host "
Hugging Face Inference Providers integration working!" -ForegroundColor Green
} catch {
    Write-Host "Error testing Inference Providers API: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "
Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Create a fine-grained token with access to 'Inference Providers'" -ForegroundColor Yellow
    Write-Host "2. Make sure you have enough credits for the provider" -ForegroundColor Yellow
    Write-Host "3. Check your internet connection" -ForegroundColor Yellow
    Write-Host "4. Try another model supported by Novita AI provider" -ForegroundColor Yellow
}
