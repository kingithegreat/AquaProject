#!/usr/bin/env pwsh
# Simple script to test Hugging Face API token

Write-Host "Testing Hugging Face API token..." -ForegroundColor Cyan

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

Write-Host "API token found. Testing API connection..." -ForegroundColor Green

# First, test if the token itself is valid by checking user info
try {
    $userResponse = Invoke-RestMethod -Uri "https://huggingface.co/api/whoami" -Headers @{
        "Authorization" = "Bearer $apiKey"
    } -Method GET -ErrorAction Stop

    Write-Host "API token is valid. Connected as: $($userResponse.name)" -ForegroundColor Green
    Write-Host "User type: $($userResponse.type)" -ForegroundColor Green
} catch {
    Write-Host "API token validation failed." -ForegroundColor Red
    Write-Host "Please create a new token at https://huggingface.co/settings/tokens with 'read' access" -ForegroundColor Red
    exit 1
}

# Try a few simple models
$models = @(
    "microsoft/DialoGPT-small",
    "facebook/bart-large-cnn",
    "distilbert-base-uncased"
)

$workingModel = $null

foreach ($model in $models) {
    Write-Host "Testing model: $model" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "https://api-inference.huggingface.co/models/$model" -Headers @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        } -Method POST -Body '{"inputs": "Hello world"}' -ErrorAction Stop
        
        Write-Host "Model $model is working!" -ForegroundColor Green
        $workingModel = $model
        break
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        Write-Host "Error with model $model. Status code: $statusCode" -ForegroundColor Red
    }
}

if ($workingModel) {
    Write-Host "`nSuccess! Found working model: $workingModel" -ForegroundColor Green
    Write-Host "Updating huggingfaceService.ts to use this model..." -ForegroundColor Yellow
    
    # Update the service file to use the working model
    $servicePath = "services/huggingfaceService.ts"
    
    if (Test-Path $servicePath) {
        $serviceContent = Get-Content $servicePath -Raw
        
        $updatedContent = $serviceContent -replace "const HF_MODEL = '.*?';", "const HF_MODEL = '$workingModel'; // Updated with working model"
        
        Set-Content -Path $servicePath -Value $updatedContent
        
        Write-Host "Updated huggingfaceService.ts to use $workingModel" -ForegroundColor Green
    } else {
        Write-Host "Could not find $servicePath to update." -ForegroundColor Red
    }
} else {
    Write-Host "`nNo working models found." -ForegroundColor Red
    Write-Host "Please try creating a new token with 'write' access at https://huggingface.co/settings/tokens" -ForegroundColor Yellow
}
