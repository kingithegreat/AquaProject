#!/usr/bin/env pwsh
# Cleanup script for Claude API references

Write-Host "Cleaning up Claude API references..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "Error: .env file not found." -ForegroundColor Red
    exit 1
}

# Comment out Claude API key in .env if it exists
$envContent = Get-Content ".env" -Raw
if ($envContent -match "EXPO_PUBLIC_CLAUDE_API_KEY=") {
    Write-Host "Backing up Claude API key in .env file..." -ForegroundColor Yellow
    $updatedContent = $envContent -replace "(EXPO_PUBLIC_CLAUDE_API_KEY=.+)", "# $1 (kept as backup)"
    Set-Content -Path ".env" -Value $updatedContent
    Write-Host "Claude API key commented out in .env file." -ForegroundColor Green
} else {
    Write-Host "No Claude API key found in .env file." -ForegroundColor Yellow
}

# Check if Gemini API key exists in .env and comment it out
if ($envContent -match "EXPO_PUBLIC_GEMINI_API_KEY=") {
    Write-Host "Backing up Gemini API key in .env file..." -ForegroundColor Yellow
    $updatedContent = $envContent -replace "(EXPO_PUBLIC_GEMINI_API_KEY=.+)", "# $1 (kept as backup)"
    Set-Content -Path ".env" -Value $updatedContent
    Write-Host "Gemini API key commented out in .env file." -ForegroundColor Green
} else {
    Write-Host "No Gemini API key found in .env file." -ForegroundColor Yellow
}

Write-Host "`nCleaning up claude-api-setup.md..." -ForegroundColor Cyan
if (Test-Path "docs/claude-api-setup.md") {
    # Rename the claude docs to keep as reference
    Rename-Item -Path "docs/claude-api-setup.md" -NewName "claude-api-setup.md.bak" -Force
    Write-Host "claude-api-setup.md renamed to claude-api-setup.md.bak" -ForegroundColor Green
} else {
    Write-Host "claude-api-setup.md not found." -ForegroundColor Yellow
}

Write-Host "`nCleanup completed!" -ForegroundColor Cyan
