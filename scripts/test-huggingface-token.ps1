#!/usr/bin/env pwsh
# Script to test Hugging Face API token and find working models

Write-Host "Testing Hugging Face API token..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found." -ForegroundColor Red
    exit 1
}

# Read API key from .env
$envContents = Get-Content ".env" -ErrorAction SilentlyContinue
$apiKeyLine = $envContents | Where-Object { $_ -match "EXPO_PUBLIC_HUGGINGFACE_API_KEY=" }

if (-not $apiKeyLine) {
    Write-Host "ERROR: Hugging Face API key not found in .env file." -ForegroundColor Red
    exit 1
}

$apiKey = ($apiKeyLine -split "=")[1].Trim()

if ($apiKey -eq "YOUR_HUGGINGFACE_API_TOKEN_HERE") {
    Write-Host "ERROR: You need to update the Hugging Face API key in .env file with a real token." -ForegroundColor Red
    exit 1
}

Write-Host "API token found. Testing API connection..." -ForegroundColor Green

# First, test if the token itself is valid by checking user info
try {
    $userResponse = Invoke-RestMethod -Uri "https://huggingface.co/api/whoami" -Headers @{
        "Authorization" = "Bearer $apiKey"
    } -Method GET -ErrorAction Stop    
    Write-Host "[SUCCESS] API token is valid. Connected as: $($userResponse.name)" -ForegroundColor Green
    Write-Host "User type: $($userResponse.type)" -ForegroundColor Green
    
    if ($userResponse.isPro) {
        Write-Host "Account has PRO status" -ForegroundColor Green
    } else {
        Write-Host "Account has standard access" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API token validation failed: $($_.Exception.Response.StatusCode) $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    Write-Host "Please create a new token at https://huggingface.co/settings/tokens with 'read' access" -ForegroundColor Red
    exit 1
}

# Test list of simpler models that should work with free API
$models = @(
    "facebook/bart-large-cnn",
    "distilbert-base-uncased",
    "t5-small",
    "bert-base-uncased",
    "gpt2-medium",
    "microsoft/DialoGPT-small"
)

$workingModels = @()

foreach ($model in $models) {
    Write-Host "Testing model: $model" -ForegroundColor Cyan
    
    try {
        # For simpler testing, we'll use Hugging Face's feature-extraction endpoint
        $response = Invoke-RestMethod -Uri "https://api-inference.huggingface.co/models/$model" -Headers @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        } -Method POST -Body '{"inputs": "Hello world", "wait_for_model": true}' -ErrorAction Stop
        
        Write-Host "✅ Model $model is working!" -ForegroundColor Green
        $workingModels += $model
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
          if ($statusCode -eq 503) {
            Write-Host "[WARNING] Model $model is loading or under high demand. Try again later." -ForegroundColor Yellow
        } else {
            Write-Host "[ERROR] Model $model: $($_.Exception.Response.StatusCode) $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
            
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "   Response body: $responseBody" -ForegroundColor Red
            } catch {
                Write-Host "   Could not read response body" -ForegroundColor Red
            }
        }
    }
}

# Summary
Write-Host "`nTest Results Summary:" -ForegroundColor Cyan
Write-Host "-------------------" -ForegroundColor Cyan

if ($workingModels.Count -gt 0) {
    Write-Host "Working models:" -ForegroundColor Green
    foreach ($model in $workingModels) {
        Write-Host "- $model" -ForegroundColor Green
    }
    
    # Recommend updating the service with a working model
    Write-Host "`nRecommendation:" -ForegroundColor Yellow
    Write-Host "Update the HF_MODEL constant in services/huggingfaceService.ts with one of the working models." -ForegroundColor Yellow
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "const HF_MODEL = '$($workingModels[0])'; // Working model" -ForegroundColor Yellow
} else {
    Write-Host "No models are working with your current API token." -ForegroundColor Red
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Your API token has 'write' permissions" -ForegroundColor Yellow
    Write-Host "2. You have a stable internet connection" -ForegroundColor Yellow
    Write-Host "3. The Hugging Face Inference API service status" -ForegroundColor Yellow
}

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. If no models are working, create a new API token at https://huggingface.co/settings/tokens" -ForegroundColor Yellow
Write-Host "2. Update your .env file with the new token" -ForegroundColor Yellow
Write-Host "3. Run this test script again to verify" -ForegroundColor Yellow
