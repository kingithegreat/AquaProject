# Creating a Hugging Face API Token

This guide will walk you through creating a proper Hugging Face API token for the Aqua360 app.

## Step 1: Create a Hugging Face Account

1. Visit [Hugging Face](https://huggingface.co/) and sign up for an account if you don't already have one.
2. Verify your email address.

## Step 2: Generate an API Token

1. Log in to your Hugging Face account.
2. Go to your profile settings by clicking on your profile picture in the top-right corner and selecting "Settings".
3. Click on "Access Tokens" in the sidebar.
4. Click the "New token" button.
5. In the form that appears:
   - Give your token a name (e.g., "Aqua360 App")
   - Set the Role to at least "Read" (for inference API access)
   - Select an expiration date or leave it as "No expiration"

![Hugging Face Token Creation](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/hub/new-token.png)

6. Click "Generate token"
7. Copy the generated token - it will look something like `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

## Step 3: Add the Token to Your App

1. Open the `.env` file in your Aqua360 app project.
2. Update the Hugging Face API key:
   ```
   EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_token_here
   ```
3. Save the file.

## Troubleshooting Token Issues

If you encounter "Not Found" errors when testing:

1. **Verify token permissions**: Make sure your token has at least "Read" access.
2. **Create a new token**: If you're still having issues, try creating a new token.
3. **Check model availability**: Some models may not be available with the free tier. The app is configured to use models that work with the free tier.

## Testing Your Token

Run the test script to verify your token is working:

```
npm run test-huggingface-token
```

This script will test your token against several models and recommend a working one for your app.
