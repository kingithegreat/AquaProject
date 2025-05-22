#!/usr/bin/env pwsh
# Script to fix syntax issues in huggingfaceService.ts

Write-Host "Fixing syntax issues in huggingfaceService.ts..." -ForegroundColor Cyan

$servicePath = "services/huggingfaceService.ts"

if (-not (Test-Path $servicePath)) {
    Write-Host "ERROR: $servicePath not found." -ForegroundColor Red
    exit 1
}

Write-Host "Found $servicePath, fixing syntax issues..." -ForegroundColor Yellow

# Read the content of the huggingfaceService.ts file
$serviceContent = Get-Content $servicePath -Raw

# Fix all instances of \Bearer \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\
$serviceContent = $serviceContent -replace "\\Bearer \\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\\", "`"Bearer `${apiKey}`""

# Fix all instances of \API request failed: \ \\
$serviceContent = $serviceContent -replace "\\API request failed: \\ \\\\", "`"API request failed: `${response.status} `${response.statusText}`""

# Fix all instances of \API validation failed: \ \\
$serviceContent = $serviceContent -replace "\\API validation failed: \\ \\\\", "`"API validation failed: `${response.status} `${response.statusText}`""

# Fix all instances of \Sending message to Hugging Face: "\..."\ 
$serviceContent = $serviceContent -replace "\\Sending message to Hugging Face: \"\\\\.\\.\.\"\\\\", "`"Sending message to Hugging Face: `${userMessage.substring(0, 30)}...`""

# Fix all instances of \Received response: "\..."\ 
$serviceContent = $serviceContent -replace "\\Received response: \"\\\\.\\.\.\"\\\\", "`"Received response: `${responseText.substring(0, 30)}...`""

# Fix all instances of "\\n\\n"
$serviceContent = $serviceContent -replace "\"\\\\n\\\\n", "`"\n\n"

# Fix all storageKey instances
$serviceContent = $serviceContent -replace "userId \? \\\\_\\\\ : CHAT_HISTORY_STORAGE_KEY", "userId ? `${CHAT_HISTORY_STORAGE_KEY}_`${userId}` : CHAT_HISTORY_STORAGE_KEY"

# Fix all Firebase doc path instances
$serviceContent = $serviceContent -replace "\\users\\/\\\\/chatHistory\\/messages\\", "`"users/`${userId}/chatHistory/messages`""

# Fix system prompt escaping
$serviceContent = $serviceContent -replace "const systemPrompt: string = \\", "const systemPrompt: string = `"

# Fix system prompt end escaping
$serviceContent = $serviceContent -replace "weather permitting.\\;", "weather permitting.`";"

# Save the updated content to the file
Set-Content -Path $servicePath -Value $serviceContent

Write-Host "Syntax issues in $servicePath fixed!" -ForegroundColor Green
Write-Host "Try running the app with 'npm start' and test the AI assistant." -ForegroundColor Green
