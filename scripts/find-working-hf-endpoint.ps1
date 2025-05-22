#!/usr/bin/env pwsh
# Script to test multiple Hugging Face API endpoints to find one that works

Write-Host "Testing multiple Hugging Face API endpoints..." -ForegroundColor Cyan

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

Write-Host "API token found: $apiKey" -ForegroundColor Green

# Define a function to test an endpoint
function Test-Endpoint {
    param (
        [string]$EndpointName,
        [string]$Url,
        [string]$ModelName,
        [PSObject]$RequestBody
    )
    
    Write-Host "`nTesting $EndpointName..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type" = "application/json"
        }
        
        $bodyJson = $RequestBody | ConvertTo-Json -Depth 5 -Compress
        
        Write-Host "URL: $Url" -ForegroundColor Gray
        Write-Host "Request: $bodyJson" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri $Url -Method POST -Headers $headers -Body $bodyJson -ErrorAction Stop
        
        Write-Host "✅ SUCCESS: $EndpointName is working!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Cyan
        
        return $true
    }
    catch {
        Write-Host "❌ ERROR: $EndpointName failed with error: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "   Status code: $statusCode" -ForegroundColor Red
            
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                Write-Host "   Response body: $responseBody" -ForegroundColor Red
            }
            catch {
                # Could not read response body
            }
        }
        
        return $false
    }
}

# Test endpoints
$workingEndpoints = @()

# Test 1: Direct model inference with gpt2
$endpoint1 = @{
    Name = "Direct GPT-2 Inference"
    Url = "https://api-inference.huggingface.co/models/gpt2"
    Model = "gpt2"
    Body = @{
        inputs = "Hello, how are you?"
        parameters = @{
            max_length = 50
            temperature = 0.7
        }
    }
}
$test1Result = Test-Endpoint -EndpointName $endpoint1.Name -Url $endpoint1.Url -ModelName $endpoint1.Model -RequestBody $endpoint1.Body
if ($test1Result) { $workingEndpoints += $endpoint1 }

# Test 2: Direct model inference with smaller model t5-small
$endpoint2 = @{
    Name = "T5-Small Inference"
    Url = "https://api-inference.huggingface.co/models/t5-small"
    Model = "t5-small"
    Body = @{
        inputs = "translate English to French: Hello, how are you?"
    }
}
$test2Result = Test-Endpoint -EndpointName $endpoint2.Name -Url $endpoint2.Url -ModelName $endpoint2.Model -RequestBody $endpoint2.Body
if ($test2Result) { $workingEndpoints += $endpoint2 }

# Test 3: Simple text generation inference
$endpoint3 = @{
    Name = "Text Generation Inference"
    Url = "https://api-inference.huggingface.co/models/facebook/opt-350m"
    Model = "facebook/opt-350m"
    Body = @{
        inputs = "Hello, my name is"
        parameters = @{
            max_new_tokens = 20
        }
    }
}
$test3Result = Test-Endpoint -EndpointName $endpoint3.Name -Url $endpoint3.Url -ModelName $endpoint3.Model -RequestBody $endpoint3.Body
if ($test3Result) { $workingEndpoints += $endpoint3 }

# Test 4: Direct API using text2text-generation
$endpoint4 = @{
    Name = "Text2Text Generation"
    Url = "https://api-inference.huggingface.co/models/google/flan-t5-small"
    Model = "google/flan-t5-small"
    Body = @{
        inputs = "What is a jet ski?"
        parameters = @{
            max_length = 50
        }
    }
}
$test4Result = Test-Endpoint -EndpointName $endpoint4.Name -Url $endpoint4.Url -ModelName $endpoint4.Model -RequestBody $endpoint4.Body
if ($test4Result) { $workingEndpoints += $endpoint4 }

# Test 5: Sentiment analysis (simple task)
$endpoint5 = @{
    Name = "Sentiment Analysis"
    Url = "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english"
    Model = "distilbert-base-uncased-finetuned-sst-2-english"
    Body = @{
        inputs = "I love jet skiing!"
    }
}
$test5Result = Test-Endpoint -EndpointName $endpoint5.Name -Url $endpoint5.Url -ModelName $endpoint5.Model -RequestBody $endpoint5.Body
if ($test5Result) { $workingEndpoints += $endpoint5 }

# Summary
Write-Host "`n=== SUMMARY OF RESULTS ===" -ForegroundColor Cyan

if ($workingEndpoints.Count -gt 0) {
    Write-Host "Found $($workingEndpoints.Count) working endpoints:" -ForegroundColor Green
    
    foreach ($endpoint in $workingEndpoints) {
        Write-Host "- $($endpoint.Name) ($($endpoint.Model))" -ForegroundColor Green
    }
    
    # Choose the best endpoint for chat
    $bestEndpoint = $workingEndpoints[0] # Default to first working endpoint
    
    # Prefer text generation models if available
    foreach ($endpoint in $workingEndpoints) {
        if ($endpoint.Name -like "*Text Generation*" -or $endpoint.Name -like "*GPT*") {
            $bestEndpoint = $endpoint
            break
        }
    }
    
    Write-Host "`nRecommended endpoint: $($bestEndpoint.Name) ($($bestEndpoint.Model))" -ForegroundColor Yellow
    
    # Update the huggingfaceService.ts file
    $servicePath = "services/huggingfaceService.ts"
    if (Test-Path $servicePath) {
        Write-Host "`nUpdating huggingfaceService.ts to use the working endpoint..." -ForegroundColor Yellow
        
        $serviceContent = Get-Content $servicePath -Raw
        
        # Update the model and URL
        $updatedContent = $serviceContent -replace "const HF_MODEL = '.*?';", "const HF_MODEL = '$($bestEndpoint.Model)'; // Updated with working model"
        $updatedContent = $updatedContent -replace "const HF_API_URL = '.*?';", "const HF_API_URL = '$($bestEndpoint.Url)'; // Updated with working endpoint"
        
        # Also update the sendMessageToHuggingFace function to match the working endpoint format
        # This is a simple adaptation - more specific updates would need manual editing
        Set-Content -Path $servicePath -Value $updatedContent
        
        Write-Host "Updated huggingfaceService.ts to use $($bestEndpoint.Model) at $($bestEndpoint.Url)" -ForegroundColor Green
        
        # Create a doc file with the details of how to use this endpoint
        $docPath = "docs/huggingface-token-fix.md"
        $docContent = @"
# Hugging Face API Fix Documentation

This document contains information about the Hugging Face API endpoint that works with your token.

## Working Endpoint Details

- **Model Name**: $($bestEndpoint.Model)
- **API URL**: $($bestEndpoint.Url)
- **Request Format**:
```json
$($bestEndpoint.Body | ConvertTo-Json -Depth 5)
```

## How to Use This Endpoint

The huggingfaceService.ts file has been updated to use this endpoint. If you need to make further adjustments, refer to the request format above.

### Example API Call:

```javascript
const response = await fetch('$($bestEndpoint.Url)', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer \${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify($($bestEndpoint.Body | ConvertTo-Json -Depth 5))
});

const data = await response.json();
// Process data here
```

## Other Working Endpoints

$($workingEndpoints | ForEach-Object { "- $($_.Name) ($($_.Model)): $($_.Url)" } | Out-String)

"@
        
        Set-Content -Path $docPath -Value $docContent
        Write-Host "Created documentation at $docPath" -ForegroundColor Green
    }
    else {
        Write-Host "Could not find $servicePath to update." -ForegroundColor Red
    }
}
else {
    Write-Host "No working endpoints found." -ForegroundColor Red
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure your token has at least 'read' access for inference" -ForegroundColor Yellow
    Write-Host "2. Create a new token at https://huggingface.co/settings/tokens" -ForegroundColor Yellow
    Write-Host "3. Check your internet connection" -ForegroundColor Yellow
    Write-Host "4. Try a different Hugging Face account" -ForegroundColor Yellow
    Write-Host "5. Consider using a different AI provider (e.g., OpenAI)" -ForegroundColor Yellow
}
