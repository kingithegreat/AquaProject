#!/usr/bin/env pwsh
# Script to test the DialoGPT model with Hugging Face API

Write-Host "Testing DialoGPT model for Aqua360 AI Assistant..." -ForegroundColor Cyan

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

# Define the DialoGPT model endpoint
$model = "microsoft/DialoGPT-small"
$endpoint = "https://api-inference.huggingface.co/models/$model"

Write-Host "Testing DialoGPT model: $model" -ForegroundColor Cyan

# Test message related to Aqua360
$testMessage = "What jet ski models do you offer at Aqua360?"

Write-Host "Sending test message: $testMessage" -ForegroundColor Yellow

# System prompt for context
$systemPrompt = @"
You are an AI Assistant for Aqua360, a water sports and jet ski rental company.
Provide helpful information about jet ski rentals, water activities, and our services.
Be concise, friendly, and accurate. If you don't know an answer, suggest contacting our staff.
Our company offers:
- Jet ski rentals (Yamaha and Sea-Doo models, hourly or daily rates)
- Guided tours
- Water equipment rental (tubes, wakeboards, etc.)
- Lounge area with food and drinks
- Group discounts for 5+ people
Our operating hours are 9:00 AM - 5:00 PM daily, weather permitting.
"@

# Format the input for DialoGPT
$conversation = "$systemPrompt`n`nUser: $testMessage`nAssistant:"

try {
    # Make API request
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        "inputs" = $conversation
        "parameters" = @{
            "max_new_tokens" = 150
            "temperature" = 0.7
            "top_p" = 0.9
            "return_full_text" = $false
        }
    } | ConvertTo-Json
    
    Write-Host "Sending request to Hugging Face API..." -ForegroundColor Yellow
    
    $response = Invoke-RestMethod -Uri $endpoint -Method POST -Headers $headers -Body $body -ContentType "application/json"
    
    Write-Host "`nResponse received!" -ForegroundColor Green
    
    # Parse and display the response
    $responseText = ""
    
    if ($response -is [array] -and $response.Count -gt 0) {
        if ($response[0].generated_text) {
            $responseText = $response[0].generated_text.Trim()
        } else {
            $responseText = $response[0].Trim()
        }
    } 
    elseif ($response -is [PSCustomObject]) {
        if ($response.generated_text) {
            $responseText = $response.generated_text.Trim()
        } elseif ($response.answer) {
            $responseText = $response.answer.Trim()
        } elseif ($response.responses -and $response.responses.Count -gt 0) {
            $responseText = $response.responses[0].Trim()
        }
    }
    else {
        $responseText = $response.Trim()
    }
    
    if ([string]::IsNullOrWhiteSpace($responseText)) {
        $responseText = "Could not extract a proper response from the API"
    }
    
    Write-Host "`nDialoGPT Response:" -ForegroundColor Cyan
    Write-Host "----------------" -ForegroundColor Cyan
    Write-Host $responseText -ForegroundColor White
    
    # Success message
    Write-Host "`n✅ DialoGPT model test completed successfully!" -ForegroundColor Green
    Write-Host "The model is working and can be used in the Aqua360 app." -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error testing DialoGPT model:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Red
        }
    }
    
    Write-Host "`nTroubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check if your API token is valid and has the correct permissions" -ForegroundColor Yellow
    Write-Host "2. Make sure you have a stable internet connection" -ForegroundColor Yellow
    Write-Host "3. Try running the test-huggingface-token.ps1 script to find alternative models" -ForegroundColor Yellow
    Write-Host "4. Visit https://huggingface.co/docs/api-inference/en/index for more information" -ForegroundColor Yellow
}
