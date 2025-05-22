#!/usr/bin/env pwsh
# Script to help complete the migration from Claude to Hugging Face

Write-Host "Finalizing migration from Claude to Hugging Face..." -ForegroundColor Cyan

# Test the Hugging Face implementation first
Write-Host "Testing Hugging Face model configuration..." -ForegroundColor Yellow
$testResult = $false

try {
    & "./scripts/test-hf-models.ps1"
    if ($LASTEXITCODE -eq 0) {
        $testResult = $true
    }
} catch {
    Write-Host "Error running test script: $_" -ForegroundColor Red
}

if (-not $testResult) {
    $continue = Read-Host "Testing encountered issues. Continue with migration anyway? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Migration aborted. Please fix the issues with Hugging Face configuration first." -ForegroundColor Red
        exit 1
    }
}

# Comment out the Claude API key in .env (keeping it as a backup)
Write-Host "`nBacking up Claude API key..." -ForegroundColor Yellow
$envPath = ".env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $updatedContent = @()
    
    foreach ($line in $envContent) {
        if ($line -match "^EXPO_PUBLIC_CLAUDE_API_KEY=") {
            $updatedContent += "# BACKUP: $line # Migrated to Hugging Face"
        } else {
            $updatedContent += $line
        }
    }
    
    Set-Content -Path $envPath -Value $updatedContent
    Write-Host "Claude API key backed up in .env file." -ForegroundColor Green
} else {
    Write-Host "Could not find .env file." -ForegroundColor Red
}

# Update the README.md to mention Hugging Face instead of Claude
Write-Host "`nUpdating README.md references..." -ForegroundColor Yellow
$readmePath = "README.md"

if (Test-Path $readmePath) {
    $readmeContent = Get-Content $readmePath -Raw
    
    # Replace Claude references with Hugging Face
    $updatedReadme = $readmeContent -replace "Claude AI", "Hugging Face AI" `
                                    -replace "Anthropic Claude", "Hugging Face" `
                                    -replace "claude", "huggingface" `
                                    -replace "CLAUDE", "HUGGINGFACE"
    
    Set-Content -Path $readmePath -Value $updatedReadme
    Write-Host "README.md updated to reference Hugging Face instead of Claude." -ForegroundColor Green
} else {
    Write-Host "Could not find README.md file." -ForegroundColor Red
}

# Remind about cleaning up dependencies
Write-Host "`nMigration completed! You may want to consider removing Claude dependencies:" -ForegroundColor Green
Write-Host "1. Run 'npm uninstall @anthropic-ai/sdk' if you no longer need Claude" -ForegroundColor Yellow
Write-Host "2. Remove Claude-related files if no longer needed" -ForegroundColor Yellow
Write-Host "   - services/claudeService.ts" -ForegroundColor Yellow
Write-Host "   - types/claudeService.d.ts" -ForegroundColor Yellow
Write-Host "   - docs/claude-api-setup.md" -ForegroundColor Yellow

Write-Host "`nTo test the current configuration, run:" -ForegroundColor Cyan
Write-Host "npm run test-hf-models" -ForegroundColor Cyan
