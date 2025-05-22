# Aqua360 AI Assistant Implementation

This document explains how to set up and use the AI Assistant feature in the Aqua360 app.

## Overview

The AI Assistant uses Hugging Face's Mistral AI model to provide helpful responses to user queries about water activities, bookings, and other information related to Aqua360 services. The chat history is stored in Firebase Firestore for authenticated users, and locally in AsyncStorage for all users.

## Quick Setup

The easiest way to configure the AI Assistant is to run our setup script:

```bash
npm run setup-ai
```

This script will:
1. Check if the Hugging Face API package is installed and install it if needed
2. Add the Hugging Face API token placeholder to your .env file
3. Allow you to enter your Hugging Face API token

## Manual Configuration

1. **Hugging Face API Token**:
   - Get a Hugging Face API token from [Hugging Face](https://huggingface.co/settings/tokens)
   - Add it to the `.env` file as `EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_token_here`

2. **Firebase Setup**:
   - The app is already configured to use Firebase for authentication and storage
   - Make sure the Firebase project has Firestore enabled
   - Deploy the updated Firestore rules using: `firebase deploy --only firestore:rules`

## Features

- Real-time AI responses using Hugging Face's Mistral AI model
- Chat history persistence (Firebase for authenticated users, AsyncStorage for all)
- Suggested topics for better user experience
- Error handling for network failures
- API key validation with user-friendly error messages
- Responsive UI with loading indicators

## Usage

The AI Assistant can be accessed from the home screen by tapping the "AI Assistant" button. Users can:

1. Type questions in the text input
2. Select from suggested topics
3. View their chat history
4. Clear their chat history
5. Proceed to booking after getting information

## Implementation Details

### Core Files

- `services/huggingfaceService.ts`: Contains the core functionality for interacting with Hugging Face API and storing/retrieving chat history
- `app/ai-assist.tsx`: The UI component for the AI Assistant
- `types/huggingfaceService.d.ts`: TypeScript declaration file for the Hugging Face service
- `scripts/setup-ai-assistant.ps1`: Setup script to help configure the AI Assistant

### Service Functions

| Function | Description |
|----------|-------------|
| `isHuggingFaceApiKeyValid()` | Validates that the API key is set and working |
| `sendMessageToHuggingFace(message, userId)` | Sends a message to the Hugging Face AI and returns the response |
| `loadChatHistory(userId)` | Loads chat history from AsyncStorage and Firebase if available |
| `clearChatHistory(userId)` | Clears chat history from both storage systems |
| `getChatSession(userId)` | Gets or initializes a chat session with the Hugging Face API |

## Updating or Modifying

When making changes to the AI Assistant:

1. Modify the Hugging Face service if changing AI behavior or chat storage
2. Update the AI Assistant component for UI changes
3. Update the Firestore rules if changing data structure or access patterns

## Troubleshooting

### API Key Issues

If you see "API key is missing or invalid":
1. Make sure you've added your Hugging Face API token to the `.env` file
2. Run `npm run setup-ai` to configure the API token
3. Verify your API token is still valid in your Hugging Face account settings

### Network Issues

If responses are failing with network errors:
1. Check your internet connection
2. Verify the Hugging Face Inference API service status
3. The app will display appropriate error messages and save chat history locally

### Firebase Issues

If chat history isn't syncing between devices:
1. Check that the user is authenticated
2. Verify Firebase permissions in firestore.rules
3. Check the Firebase console for any service outages

### Local Storage Issues

If chat history isn't persisting locally:
1. Try clearing the app cache
2. Reinstall the app if issues persist
3. Check AsyncStorage logs for any errors
