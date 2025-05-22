#!/usr/bin/env pwsh
# Setup script for Aqua360 AI Assistant

Write-Host "Setting up Aqua360 AI Assistant..." -ForegroundColor Cyan

# Check if .env file exists, create if not
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -Path ".env" -ItemType File
}

# Check if Hugging Face API token is already in .env
$envContents = Get-Content ".env" -ErrorAction SilentlyContinue
$hasHuggingFaceKey = $envContents -match "EXPO_PUBLIC_HUGGINGFACE_API_KEY="

if (-not $hasHuggingFaceKey) {
    Write-Host "Adding Hugging Face API token placeholder to .env file..." -ForegroundColor Yellow
    Add-Content -Path ".env" -Value "EXPO_PUBLIC_HUGGINGFACE_API_KEY=YOUR_HUGGINGFACE_API_TOKEN_HERE"
}

# Prompt user to enter their Hugging Face API token
Write-Host "`nTo use the AI Assistant, you need a Hugging Face API token." -ForegroundColor Green
Write-Host "You can get one from https://huggingface.co/settings/tokens" -ForegroundColor Green
$response = Read-Host "Do you have a Hugging Face API token to enter now? (y/n)"

if ($response -eq "y" -or $response -eq "Y") {
    $apiKey = Read-Host "Enter your Hugging Face API token"
    
    if (-not [string]::IsNullOrWhiteSpace($apiKey)) {
        # Update the .env file with the provided API token
        if ($hasHuggingFaceKey) {
            # Replace existing key
            (Get-Content ".env") -replace "EXPO_PUBLIC_HUGGINGFACE_API_KEY=.*", "EXPO_PUBLIC_HUGGINGFACE_API_KEY=$apiKey" | Set-Content ".env"
        } else {
            # Add new key
            Add-Content -Path ".env" -Value "EXPO_PUBLIC_HUGGINGFACE_API_KEY=$apiKey"
        }
        Write-Host "Hugging Face API token has been added to .env file." -ForegroundColor Green
    } else {
        Write-Host "No API token entered. Using placeholder value." -ForegroundColor Yellow
    }
} else {
    Write-Host "You can add your Hugging Face API token to the .env file later." -ForegroundColor Yellow
    Write-Host "The AI Assistant will not work until you add a valid API token." -ForegroundColor Yellow
}

# No additional packages needed for Hugging Face implementation since it uses fetch API
Write-Host "`nChecking for required packages..." -ForegroundColor Cyan
# No special packages needed - the implementation uses the standard fetch API

Write-Host "`nSetup complete!" -ForegroundColor Cyan
Write-Host "You can now use the AI Assistant feature in the Aqua360 app." -ForegroundColor Cyan
Write-Host "For more information, see ./docs/ai-assistant.md and ./docs/huggingface-api-setup.md" -ForegroundColor Cyan
