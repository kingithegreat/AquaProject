#!/usr/bin/env pwsh
# Test script for Hugging Face AI Assistant

Write-Host "Testing Hugging Face API integration..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found. Please create an .env file with your Hugging Face API token." -ForegroundColor Red
    exit 1
}

# Check if HF token exists in .env
$envContent = Get-Content ".env" -Raw
if (-not ($envContent -match "EXPO_PUBLIC_HUGGINGFACE_API_KEY=")) {
    Write-Host "Error: Hugging Face API token not found in .env file." -ForegroundColor Red
    Write-Host "Please add EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_token_here to your .env file." -ForegroundColor Yellow
    exit 1
}

$token = ($envContent -split "EXPO_PUBLIC_HUGGINGFACE_API_KEY=")[1].Split("`n")[0].Trim()

if ($token -eq "YOUR_HUGGINGFACE_API_TOKEN_HERE" -or $token -eq "") {
    Write-Host "Error: Please replace the placeholder with your actual Hugging Face API token in the .env file." -ForegroundColor Red
    exit 1
}

Write-Host "Hugging Face API token found in .env file." -ForegroundColor Green

# Test API connection
Write-Host "`nTesting API connection to Hugging Face..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Define models to try
$models = @(
    "mistralai/Mistral-7B-Instruct-v0.2",
    "google/flan-t5-base",
    "gpt2"
)

$body = @{
    inputs = "Hello, this is a test message from the Aqua360 app."
    parameters = @{
        max_new_tokens = 50
        return_full_text = $false
    }
} | ConvertTo-Json

$success = $false

foreach ($model in $models) {
    Write-Host "Testing model: $model" -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "https://api-inference.huggingface.co/models/$model" -Method Post -Headers $headers -Body $body -ErrorAction Stop
        Write-Host "API connection successful with model: $model!" -ForegroundColor Green
        Write-Host "`nSample response:" -ForegroundColor Cyan
        
        if ($response -is [array]) {
            Write-Host $response[0].generated_text -ForegroundColor White    } else {
            Write-Host $response.generated_text -ForegroundColor White
        }
        
        # If we get here, we found a working model
        $success = $true
        
        # Update the model in the huggingfaceService.ts file
        Write-Host "`nUpdating Hugging Face model in the service file..." -ForegroundColor Cyan
        $serviceFile = ".\services\huggingfaceService.ts"
        
        if (Test-Path $serviceFile) {
            $content = Get-Content $serviceFile -Raw
            $updatedContent = $content -replace 'const HF_MODEL = .*', "const HF_MODEL = '$model'; // Updated by test script"
            
            Set-Content -Path $serviceFile -Value $updatedContent
            Write-Host "Service file updated with working model: $model" -ForegroundColor Green
        } else {
            Write-Host "Warning: Could not find huggingfaceService.ts to update the model." -ForegroundColor Yellow
        }
        
        # Exit the loop as we found a working model
        break
    }
    catch {
        Write-Host "Error with model $model`: $_" -ForegroundColor Red
    }
}

if ($success) {
    Write-Host "`nTest completed successfully!" -ForegroundColor Green
    Write-Host "The Hugging Face integration is ready to use in the Aqua360 app." -ForegroundColor Cyan
} else {
    Write-Host "`nAll model tests failed." -ForegroundColor Red
    Write-Host "Please check your API token permissions and internet connection." -ForegroundColor Yellow
    Write-Host "You may also need to check the Hugging Face documentation for available models." -ForegroundColor Yellow
    exit 1
}
