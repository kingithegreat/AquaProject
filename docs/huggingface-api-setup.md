# Hugging Face API Setup Guide

## Overview

This project uses the Hugging Face Inference Providers API for AI assistant functionality. This is different from the standard Hugging Face Inference API and requires a specific setup.

## Getting a Hugging Face API Token

1. Create an account at [Hugging Face](https://huggingface.co/join) if you don't already have one
2. Go to [Settings > Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with at least "read" access
4. For Inference Providers access, create a fine-grained token with the scope to "Make calls to Inference Providers"

## Setting Up Your Environment

1. Add your Hugging Face API key to the .env file:
   `
   EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_token_here
   `

## Implementation Details

Our implementation uses the Hugging Face Inference Providers API with the Novita AI provider, specifically using the deepseek/deepseek-v3-0324 model, which offers good conversational abilities.

## Testing Your Setup

Run the following script to test your Hugging Face token with the Inference Providers API:

`ash
npm run test-inference-providers
`

## Troubleshooting

If you encounter a 404 error when using the API:
1. Make sure your token has the correct permissions
2. Verify you're using the Inference Providers API URL (https://router.huggingface.co/...)
3. Try creating a new token with fine-grained access specifically for Inference Providers

## Further Documentation

- [Hugging Face Inference Providers Documentation](https://huggingface.co/docs/inference-providers/index)
