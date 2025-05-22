# Setting Up Claude API for Aqua360 AI Assistant

This document provides instructions for setting up the Anthropic Claude API for the AI Assistant feature in the Aqua360 app.

## Getting an API Key

1. Visit [Anthropic Console](https://console.anthropic.com/) and create an account if you don't already have one.
2. Once logged in, go to the API Keys section.
3. Click "Create Key" to generate a new API key.
4. Give your key a name (e.g., "Aqua360 App") and create it.
5. Copy the API key - it will look something like `sk-ant-api03-...`.

## Adding the API Key to the App

1. Open the `.env` file in the root of the project.
2. Add or update the following line:
   ```
   EXPO_PUBLIC_CLAUDE_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with the API key you copied from the Anthropic Console.

## Managing API Usage

- Claude API has usage limits and costs associated with it. Monitor your usage in the Anthropic Console to avoid unexpected charges.
- The app uses the `claude-3-sonnet-20240229` model by default, which balances quality and cost.
- You can modify the model used in `services/claudeService.ts` by changing the `DEFAULT_MODEL` constant.

## Troubleshooting

If you encounter the error "Your credit balance is too low to access the Anthropic API", you'll need to:
1. Visit the [Anthropic Console](https://console.anthropic.com/) 
2. Navigate to Billing
3. Add credits to your account or upgrade your plan
4. Alternatively, you can create a new API key with fresh credits

## Available Claude Models

The app is configured to use `claude-3-sonnet-20240229` by default, but you can change it to one of the following models:

- `claude-3-opus-20240229` - Highest quality, most expensive
- `claude-3-sonnet-20240229` - Good balance of quality and cost
- `claude-3-haiku-20240307` - Fastest and most affordable

Adjust the `DEFAULT_MODEL` constant in `services/claudeService.ts` to use a different model.
