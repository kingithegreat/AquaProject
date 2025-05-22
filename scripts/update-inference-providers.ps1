#!/usr/bin/env pwsh
# Script to update Hugging Face integration to use Inference Providers API for Aqua360

Write-Host "Updating Hugging Face integration to use Inference Providers API..." -ForegroundColor Cyan

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

# Create a completely new huggingfaceService.ts file
$newServiceFile = @"
// filepath: services/huggingfaceService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, getDocs, query, setDoc, where, deleteDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import NetInfo from '@react-native-community/netinfo';

// Initialize Firebase (copied from firebase.ts)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDhrik544tBzrcVBgeQU3GMuNaDDB6Bxmw",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "year2project-fa35b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "year2project-fa35b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "year2project-fa35b",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "651046894087",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:651046894087:web:da388903018665a45108a2",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SPM59SGPKE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Constants
const CHAT_HISTORY_STORAGE_KEY = 'aqua360_chat_history';

// Using Hugging Face's Inference Providers API (this is different from the regular Inference API)
// For details see: https://huggingface.co/docs/inference-providers/index
const HF_API_URL = 'https://router.huggingface.co/novita/v3/openai/chat/completions';
// Using a model compatible with Novita AI provider
const HF_MODEL = 'deepseek/deepseek-v3-0324';

// Suggested topics for the AI Assistant (reusing existing topics)
export const suggestedTopics = [
  "What jet ski models do you offer?",
  "What's the minimum age to rent?",
  "How much does a jet ski rental cost?",
  "Do I need a license to ride?",
  "What safety equipment is provided?",
  "Do you offer group discounts?"
];

// Types
export interface ChatMessage {
  type: 'user' | 'ai';
  message: string;
  timestamp?: number;
}

export interface ChatHistory {
  userId: string | null;
  messages: ChatMessage[];
}

// System prompt to provide context about Aqua360
const systemPrompt: string = \`You are an AI Assistant for Aqua360, a water sports and jet ski rental company.
Provide helpful information about jet ski rentals, water activities, and our services.
Be concise, friendly, and accurate. If you don't know an answer, suggest contacting our staff.
Our company offers:
- Jet ski rentals (Yamaha and Sea-Doo models, hourly or daily rates)
- Guided tours
- Water equipment rental (tubes, wakeboards, etc.)
- Lounge area with food and drinks
- Group discounts for 5+ people
Our operating hours are 9:00 AM - 5:00 PM daily, weather permitting.\`;

// Initialize Hugging Face API with token from environment variables
export function initializeHuggingFaceApi(): any {
  try {
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.error('No Hugging Face API key available');
      return null;
    }
    
    console.log('Hugging Face API initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Hugging Face API:', error);
    return null;
  }
}

// Backward compatibility functions for Claude and Gemini
export function initializeClaudeClient(): any {
  return initializeHuggingFaceApi();
}

export function initializeGeminiModel(): any {
  return initializeHuggingFaceApi();
}

// Validate if the Hugging Face API key is valid
export async function isHuggingFaceApiKeyValid(): Promise<boolean> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.error('No Hugging Face API key available for validation');
      return false;
    }
    
    // Use the Inference Providers API instead of direct model inference
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello, I am testing the Hugging Face API connection for Aqua360.'
          }
        ],
        model: HF_MODEL,
        max_tokens: 50,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      console.error(\`API validation failed: \${response.status} \${response.statusText}\`);
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

// Backward compatibility functions
export async function isClaudeApiKeyValid(): Promise<boolean> {
  return isHuggingFaceApiKeyValid();
}

export async function isGeminiApiKeyValid(): Promise<boolean> {
  return isHuggingFaceApiKeyValid();
}

// Format conversation history for the Chat Completions API format
function formatConversationForChatAPI(messages: ChatMessage[]): Array<{role: string, content: string}> {
  // Add system message first
  const formattedMessages = [
    { 
      role: 'system', 
      content: systemPrompt 
    }
  ];
  
  // Add recent messages (limit to avoid token issues)
  const recentMessages = messages.slice(-8);
  for (const msg of recentMessages) {
    formattedMessages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.message
    });
  }
  
  return formattedMessages;
}

// Send message to Hugging Face Inference Providers API
export async function sendMessageToHuggingFace(userMessage: string, userId: string | null = null): Promise<string> {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }
    
    console.log(\`Sending message to Hugging Face: "\${userMessage.substring(0, 30)}..."\`);
    
    // Save user message to history
    await saveChatMessage(userId, 'user', userMessage);
    
    // Get API key
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('Hugging Face API key not found');
    }
    
    // Get chat history for context
    const chatHistory = await loadChatHistory(userId);
    const chatMessages = chatHistory ? chatHistory.messages : [];
    
    // Format the messages for the Chat Completions API
    const messages = formatConversationForChatAPI(chatMessages);
    
    // Add the current user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    // Make the API request to Hugging Face Inference Providers API
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: HF_MODEL,
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
    }
    
    const data = await response.json();
    let responseText = "";
    
    // Extract the response text from the Chat Completions API format
    if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
      responseText = data.choices[0].message.content;
    } else {
      responseText = "I'm sorry, I couldn't generate a proper response. Please contact Aqua360 staff directly for assistance.";
    }
    
    // If we got an empty or very short response, use a fallback
    if (!responseText || responseText.length < 10) {
      responseText = "I'm sorry, I couldn't generate a proper response. Please contact Aqua360 staff directly for assistance.";
    }
    
    // Add Aqua360 context if needed
    if (!responseText.toLowerCase().includes('aqua') && 
        !responseText.toLowerCase().includes('jet ski') && 
        !responseText.toLowerCase().includes('water')) {
      responseText += "\\n\\nFor more information about our jet ski rentals and water activities at Aqua360, please visit our location or check our website.";
    }
    
    console.log(\`Received response: "\${responseText.substring(0, 30)}..."\`);
    
    // Save AI response to chat history
    await saveChatMessage(userId, 'ai', responseText);
    
    return responseText;
  } catch (error) {
    console.error('Error sending message to Hugging Face:', error);
    throw new Error('Unable to get response from AI. Please try again later.');
  }
}

// Backward compatibility functions
export async function sendMessageToClaude(userMessage: string, userId: string | null = null): Promise<string> {
  return sendMessageToHuggingFace(userMessage, userId);
}

export async function sendMessageToGemini(userMessage: string, userId: string | null = null): Promise<string> {
  return sendMessageToHuggingFace(userMessage, userId);
}

// Reset chat session (This isn't needed for Hugging Face but kept for compatibility)
export function resetChatSession(): void {
  console.log('Chat session reset');
}

// Get chat session (compatibility function - Hugging Face doesn't need persistent sessions)
export async function getChatSession(userId: string | null = null): Promise<any> {
  return {
    async sendMessage(message: string) {
      const responseText = await sendMessageToHuggingFace(message, userId);
      return {
        response: {
          text: () => responseText
        }
      };
    }
  };
}

// Save chat message to Firebase (if authenticated) and AsyncStorage
export async function saveChatMessage(userId: string | null, type: 'user' | 'ai', message: string): Promise<void> {
  try {
    // Create chat message
    const chatMessage: ChatMessage = {
      type,
      message,
      timestamp: Date.now()
    };
    
    // Load existing chat history
    const chatHistory = await loadChatHistory(userId);
    const messages = chatHistory ? [...chatHistory.messages, chatMessage] : [chatMessage];
    
    // Save to AsyncStorage (for all users)
    const newChatHistory: ChatHistory = {
      userId: userId || null,
      messages
    };
    
    await AsyncStorage.setItem(
      userId ? \`\${CHAT_HISTORY_STORAGE_KEY}_\${userId}\` : CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify(newChatHistory)
    );
    
    // If user is authenticated, also save to Firebase
    if (userId) {
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          await setDoc(doc(firestore, \`users/\${userId}/chatHistory/messages\`), {
            messages: messages
          });
        }
      } catch (firebaseError) {
        console.error('Error saving to Firebase:', firebaseError);
        // Continue even if Firebase save fails - we have local backup in AsyncStorage
      }
    }
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

// Load chat history from Firebase (if authenticated) or AsyncStorage
export async function loadChatHistory(userId: string | null): Promise<ChatHistory | null> {
  try {
    // Try to load from Firebase first if user is authenticated and online
    if (userId) {
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          const docRef = doc(firestore, \`users/\${userId}/chatHistory/messages\`);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            return {
              userId,
              messages: data.messages || []
            };
          }
        }
      } catch (firebaseError) {
        console.error('Error loading from Firebase:', firebaseError);
        // Fall back to AsyncStorage
      }
    }
    
    // Load from AsyncStorage
    const storageKey = userId ? \`\${CHAT_HISTORY_STORAGE_KEY}_\${userId}\` : CHAT_HISTORY_STORAGE_KEY;
    const storedData = await AsyncStorage.getItem(storageKey);
    
    if (storedData) {
      return JSON.parse(storedData) as ChatHistory;
    }
    
    // Return empty history if nothing found
    return {
      userId: userId || null,
      messages: []
    };
  } catch (error) {
    console.error('Error loading chat history:', error);
    // Return empty history on error
    return {
      userId: userId || null,
      messages: []
    };
  }
}

// Clear chat history from Firebase (if authenticated) and AsyncStorage
export async function clearChatHistory(userId: string | null): Promise<void> {
  try {
    // Clear from AsyncStorage
    const storageKey = userId ? \`\${CHAT_HISTORY_STORAGE_KEY}_\${userId}\` : CHAT_HISTORY_STORAGE_KEY;
    await AsyncStorage.removeItem(storageKey);
    
    // Also clear from Firebase if authenticated and online
    if (userId) {
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          await deleteDoc(doc(firestore, \`users/\${userId}/chatHistory/messages\`));
        }
      } catch (firebaseError) {
        console.error('Error clearing from Firebase:', firebaseError);
        // Continue even if Firebase delete fails
      }
    }
    
    // Reset chat session
    resetChatSession();
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
}
"@

# Save the new file
Set-Content -Path $servicePath -Value $newServiceFile

Write-Host "Updated $servicePath to use the Inference Providers API" -ForegroundColor Green

# Now create an update to the documentation
$docPath = "docs/huggingface-api-setup.md"
if (Test-Path $docPath) {
    $docContent = @"
# Hugging Face API Setup Guide

## Overview

This project uses the Hugging Face Inference Providers API for AI assistant functionality. This is different from the standard Hugging Face Inference API and requires a specific setup.

## Getting a Hugging Face API Token

1. Create an account at [Hugging Face](https://huggingface.co/join) if you don't already have one
2. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with at least "read" access
4. For Inference Providers access, create a fine-grained token with the scope to "Make calls to Inference Providers"

## Setting Up Your Environment

1. Add your Hugging Face API key to the `.env` file:
   ```
   EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_token_here
   ```

## Implementation Details

Our implementation uses the Hugging Face Inference Providers API with the Novita AI provider, specifically using the `deepseek/deepseek-v3-0324` model, which offers good conversational abilities.

## Testing Your Setup

Run the following script to test your Hugging Face token with the Inference Providers API:

```bash
npm run test-inference-providers
```

## Troubleshooting

If you encounter a 404 error when using the API:
1. Make sure your token has the correct permissions
2. Verify you're using the Inference Providers API URL (https://router.huggingface.co/...)
3. Try creating a new token with fine-grained access specifically for Inference Providers

## Further Documentation

- [Hugging Face Inference Providers Documentation](https://huggingface.co/docs/inference-providers/index)
"@
    Set-Content -Path $docPath -Value $docContent
    Write-Host "Updated $docPath with new documentation" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not find $docPath to update" -ForegroundColor Yellow
}

# Create a test script for Inference Providers
$testScriptPath = "scripts/test-inference-providers.ps1"
$testScript = @"
#!/usr/bin/env pwsh
# Script to test Hugging Face Inference Providers API

Write-Host "Testing Hugging Face Inference Providers API..." -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found." -ForegroundColor Red
    exit 1
}

# Read API key from .env
`$envContent = Get-Content ".env" -ErrorAction SilentlyContinue
`$apiKeyLine = `$envContent | Where-Object { `$_ -match "EXPO_PUBLIC_HUGGINGFACE_API_KEY=" }

if (-not `$apiKeyLine) {
    Write-Host "ERROR: Hugging Face API key not found in .env file." -ForegroundColor Red
    exit 1
}

`$apiKey = (`$apiKeyLine -split "=")[1].Trim()

if (`$apiKey -eq "YOUR_HUGGINGFACE_API_TOKEN_HERE") {
    Write-Host "ERROR: You need to update the Hugging Face API key in .env file with a real token." -ForegroundColor Red
    exit 1
}

Write-Host "API token found. Testing Inference Providers API..." -ForegroundColor Green

# Test the Inference Providers API
`$url = "https://router.huggingface.co/novita/v3/openai/chat/completions"
`$model = "deepseek/deepseek-v3-0324"
`$body = @{
    messages = @(
        @{
            role = "user"
            content = "Tell me briefly about jet skiing."
        }
    )
    model = `$model
    temperature = 0.7
    max_tokens = 100
    stream = `$false
} | ConvertTo-Json

try {
    `$response = Invoke-RestMethod -Uri `$url -Method POST -Headers @{
        "Authorization" = "Bearer `$apiKey"
        "Content-Type" = "application/json"
    } -Body `$body -ErrorAction Stop
    
    Write-Host "`nSuccess! Inference Providers API responded:" -ForegroundColor Green
    if (`$response.choices -and `$response.choices.Count -gt 0) {
        Write-Host `$response.choices[0].message.content -ForegroundColor Cyan
    } else {
        Write-Host `$response -ForegroundColor Cyan
    }
    
    Write-Host "`nHugging Face Inference Providers integration working!" -ForegroundColor Green
} catch {
    Write-Host "Error testing Inference Providers API: `$(`$_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nPossible solutions:" -ForegroundColor Yellow
    Write-Host "1. Create a fine-grained token with access to 'Inference Providers'" -ForegroundColor Yellow
    Write-Host "2. Make sure you have enough credits for the provider" -ForegroundColor Yellow
    Write-Host "3. Check your internet connection" -ForegroundColor Yellow
    Write-Host "4. Try another model supported by Novita AI provider" -ForegroundColor Yellow
}
"@

Set-Content -Path $testScriptPath -Value $testScript
Write-Host "Created $testScriptPath to test Inference Providers API" -ForegroundColor Green

# Update package.json to include the new script
$packageJsonPath = "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    
    # Add the new script if it doesn't exist
    if (-not $packageJson.scripts."test-inference-providers") {
        $packageJson.scripts | Add-Member -Name "test-inference-providers" -Value "powershell -ExecutionPolicy Bypass -File ./scripts/test-inference-providers.ps1" -MemberType NoteProperty
    }
    
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
    Write-Host "Updated package.json with new test-inference-providers script" -ForegroundColor Green
} else {
    Write-Host "Warning: Could not find package.json to update" -ForegroundColor Yellow
}

Write-Host "`nSetup complete! Try running the new script:" -ForegroundColor Green
Write-Host "npm run test-inference-providers" -ForegroundColor Cyan
Write-Host "`nIf you continue to have issues, you may need to:" -ForegroundColor Yellow
Write-Host "1. Create a new fine-grained token specifically for Inference Providers access" -ForegroundColor Yellow
Write-Host "2. Update your .env file with the new token" -ForegroundColor Yellow
Write-Host "3. Consider other fallback options like the regular Hugging Face Inference API or a different provider" -ForegroundColor Yellow
