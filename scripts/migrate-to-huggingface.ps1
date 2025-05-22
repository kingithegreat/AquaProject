#!/usr/bin/env pwsh
# Script to safely comment out Claude API key and move to Hugging Face
# This preserves the Claude key as a backup but disables it to avoid confusion

Write-Host "Updating .env file to comment out Claude API key..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found." -ForegroundColor Red
    exit 1
}

# Read .env file
$envContents = Get-Content ".env" -ErrorAction SilentlyContinue

# Look for Claude API key
$claudeKeyFound = $false
$updatedContents = @()

foreach ($line in $envContents) {
    if ($line -match "^EXPO_PUBLIC_CLAUDE_API_KEY=") {
        # Comment out the Claude API key
        $updatedContents += "# COMMENTED OUT: Migration from Claude to Hugging Face"
        $updatedContents += "# $line"
        $claudeKeyFound = $true
    }
    elseif ($line -match "^EXPO_PUBLIC_GEMINI_API_KEY=") {
        # Comment out the Gemini API key if present
        $updatedContents += "# COMMENTED OUT: Migration from Gemini to Hugging Face"
        $updatedContents += "# $line"
    }
    else {
        # Keep other lines as they are
        $updatedContents += $line
    }
}

if ($claudeKeyFound) {
    # Write the updated contents back to the .env file
    $updatedContents | Set-Content ".env"
    Write-Host "✅ Claude API key has been commented out in .env file." -ForegroundColor Green
    Write-Host "The key is preserved as a comment in case you need to revert to Claude." -ForegroundColor Green
} else {
    Write-Host "ℹ️ No Claude API key found in .env file. No changes needed." -ForegroundColor Yellow
}

# Check if Hugging Face API key exists
$hasHuggingFaceKey = $envContents -match "EXPO_PUBLIC_HUGGINGFACE_API_KEY="

if (-not $hasHuggingFaceKey) {
    Write-Host "⚠️ No Hugging Face API key found in .env file." -ForegroundColor Yellow
    Write-Host "Please add a Hugging Face API key to use the AI assistant feature." -ForegroundColor Yellow
    Write-Host "You can run 'npm run setup-ai' to set up the Hugging Face API key." -ForegroundColor Yellow
} else {
    Write-Host "✅ Hugging Face API key found in .env file." -ForegroundColor Green
}

Write-Host "`nMigration from Claude/Anthropic to Hugging Face is complete!" -ForegroundColor Cyan
Write-Host "Run 'npm run test-dialogpt' to verify the AI assistant is working." -ForegroundColor Cyan
