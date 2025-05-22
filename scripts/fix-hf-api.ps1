#!/usr/bin/env pwsh
# Script to fix Hugging Face API integration for Aqua360

Write-Host "Fixing Hugging Face API integration for Aqua360..." -ForegroundColor Cyan

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

# Check the current huggingfaceService.ts file
$servicePath = "services/huggingfaceService.ts"
if (-not (Test-Path $servicePath)) {
    Write-Host "ERROR: $servicePath not found." -ForegroundColor Red
    exit 1
}

Write-Host "Found huggingfaceService.ts, updating to use a simpler, more compatible model..." -ForegroundColor Yellow

# Read the content of the huggingfaceService.ts file
$serviceContent = Get-Content $servicePath -Raw

# Update to use a text generation specific endpoint for API that works with free tokens
$updatedContent = $serviceContent -replace "const HF_MODEL = '.*?';", "const HF_MODEL = 'gpt2'; // Updated to a simpler, more compatible model"
$updatedContent = $updatedContent -replace "const HF_API_URL = `"https://api-inference.huggingface.co/models/.*?`";", "const HF_API_URL = `"https://api-inference.huggingface.co/models/gpt2`";"

# Replace the API validation function with a simpler one
$validationFunctionPattern = "export async function isHuggingFaceApiKeyValid\(\): Promise<boolean> \{[\s\S]*?return false;\s*\}[\s\S]*?\}"
$newValidationFunction = @"
export async function isHuggingFaceApiKeyValid(): Promise<boolean> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.error('No Hugging Face API key available for validation');
      return false;
    }
    
    // Simple test using text generation with GPT-2 (which should work with any token)
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer \${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'Hello, I am testing the',
        parameters: {
          max_length: 20,
          temperature: 0.7
        }
      })
    });
    
    if (!response.ok) {
      console.error(`API validation failed: \${response.status} \${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('API validation successful, sample response:', data);
    return true;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}
"@

$updatedContent = $updatedContent -replace $validationFunctionPattern, $newValidationFunction

# Also update the sendMessageToHuggingFace function to use a simpler approach
$sendMessagePattern = "export async function sendMessageToHuggingFace\(userMessage: string, userId: string \| null = null\): Promise<string> \{[\s\S]*?return responseText;\s*\}[\s\S]*?\}"
$newSendMessageFunction = @"
export async function sendMessageToHuggingFace(userMessage: string, userId: string | null = null): Promise<string> {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }
    
    console.log(`Sending message to Hugging Face: "\${userMessage.substring(0, 30)}..."`);
    
    // Save user message to history
    await saveChatMessage(userId, 'user', userMessage);
    
    // Get API key
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('Hugging Face API key not found');
    }
    
    // For better results, include the system prompt and recent history
    const chatHistory = await loadChatHistory(userId);
    const recentMessages = chatHistory ? chatHistory.messages.slice(-5) : [];
    
    // Format the system prompt and user message for better context
    let prompt = systemPrompt + "\n\n";
    
    // Add recent messages for context
    for (const msg of recentMessages) {
      if (msg.type === 'user') {
        prompt += `User: \${msg.message}\n`;
      } else {
        prompt += `Assistant: \${msg.message}\n`;
      }
    }
    
    // Add the current user message
    prompt += `User: \${userMessage}\nAssistant:`;
    
    // Make the API request to GPT-2
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer \${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 150,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: \${response.status} \${response.statusText}`);
    }
    
    const data = await response.json();
    let responseText = "";
    
    // Extract the generated text based on the response format
    if (data && typeof data === 'object') {
      if (Array.isArray(data) && data.length > 0) {
        responseText = data[0].generated_text || data[0];
      } else if (data.generated_text) {
        responseText = data.generated_text;
      } else {
        responseText = JSON.stringify(data);
      }
      
      // Clean up the response by extracting just the assistant's reply
      const assistantPrefix = "Assistant:";
      const userPrefix = "User:";
      
      if (responseText.includes(assistantPrefix)) {
        responseText = responseText.split(assistantPrefix)[1];
        
        // Remove anything after the next "User:" if it exists
        if (responseText.includes(userPrefix)) {
          responseText = responseText.split(userPrefix)[0];
        }
      }
      
      // Clean up the text
      responseText = responseText.trim();
    }
    
    // If we got an empty or very short response, use a fallback
    if (!responseText || responseText.length < 10) {
      responseText = "I'm sorry, I couldn't generate a proper response. Please contact Aqua360 staff directly for assistance.";
    }
    
    // Add Aqua360 context if needed
    if (!responseText.toLowerCase().includes('aqua') && 
        !responseText.toLowerCase().includes('jet ski') && 
        !responseText.toLowerCase().includes('water')) {
      responseText += "\n\nFor more information about our jet ski rentals and water activities at Aqua360, please visit our location or check our website.";
    }
    
    console.log(`Received response: "\${responseText.substring(0, 30)}..."`);
    
    // Save AI response to chat history
    await saveChatMessage(userId, 'ai', responseText);
    
    return responseText;
  } catch (error) {
    console.error('Error sending message to Hugging Face:', error);
    throw new Error('Unable to get response from AI. Please try again later.');
  }
}
"@

$updatedContent = $updatedContent -replace $sendMessagePattern, $newSendMessageFunction

# Save the updated content to the file
Set-Content -Path $servicePath -Value $updatedContent

# Verification test to see if the token actually works with GPT-2
Write-Host "`nTesting token with GPT-2 model (should work with free tokens)..." -ForegroundColor Yellow
try {
    $body = @{
        inputs = "Hello, I am"
        parameters = @{
            max_length = 20
            temperature = 0.7
        }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "https://api-inference.huggingface.co/models/gpt2" -Method POST -Headers @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    } -Body $body -ErrorAction Stop
    
    Write-Host "Success! GPT-2 model responded:" -ForegroundColor Green
    Write-Host $response -ForegroundColor Cyan
    
    Write-Host "`nHugging Face integration fixed successfully! The app should now work with the new API." -ForegroundColor Green
    Write-Host "Try running the app with 'npm start' and test the AI assistant." -ForegroundColor Green
} catch {
    Write-Host "Error testing GPT-2 model: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPossible solutions:" -ForegroundColor Yellow
    Write-Host "1. Make sure your token has at least 'read' access" -ForegroundColor Yellow
    Write-Host "2. Create a new token at https://huggingface.co/settings/tokens" -ForegroundColor Yellow
    Write-Host "3. Check your internet connection" -ForegroundColor Yellow
    Write-Host "4. Try again in a few minutes (there might be rate limiting)" -ForegroundColor Yellow
}
