#!/usr/bin/env pwsh
# Script to update the Hugging Face token in .env file

param (
    [Parameter(Mandatory=$true)]
    [string]$token
)

Write-Host "Updating Hugging Face token in .env file..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    New-Item -Path ".env" -ItemType File
}

# Read existing content
$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
$hasHuggingFaceKey = $envContent | Where-Object { $_ -match "EXPO_PUBLIC_HUGGINGFACE_API_KEY=" }

if ($hasHuggingFaceKey) {
    # Replace existing key
    $updatedContent = $envContent -replace "EXPO_PUBLIC_HUGGINGFACE_API_KEY=.*", "EXPO_PUBLIC_HUGGINGFACE_API_KEY=$token"
    Set-Content -Path ".env" -Value $updatedContent
    Write-Host "Updated Hugging Face API token in .env file." -ForegroundColor Green
} else {
    # Add new key
    Add-Content -Path ".env" -Value "EXPO_PUBLIC_HUGGINGFACE_API_KEY=$token"
    Write-Host "Added Hugging Face API token to .env file." -ForegroundColor Green
}

# Verify the token was added
$newContent = Get-Content ".env"
$tokenLine = $newContent | Where-Object { $_ -match "EXPO_PUBLIC_HUGGINGFACE_API_KEY=" }

if ($tokenLine) {
    Write-Host "Token successfully added: $tokenLine" -ForegroundColor Green
    Write-Host "Now run: npm run test-hf-models" -ForegroundColor Yellow
} else {
    Write-Host "Failed to update token in .env file." -ForegroundColor Red
}
