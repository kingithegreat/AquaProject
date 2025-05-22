# Getting a Working Hugging Face API Token for Aqua360

This step-by-step guide will help you create a new Hugging Face API token that works with the Aqua360 app.

## Step 1: Create or Log into your Hugging Face Account

1. Visit [Hugging Face](https://huggingface.co/) in your browser
2. Click "Sign Up" if you don't have an account, or "Login" if you already do
3. Complete the registration process if needed

## Step 2: Create a New API Token

1. Once logged in, click on your profile picture in the top-right corner
2. Select "Settings" from the dropdown menu
3. In the left sidebar, click on "Access Tokens"
4. Click the blue "New token" button

## Step 3: Configure the Token Correctly

This is the most important part to ensure the token works properly:

1. Give your token a name like "Aqua360 App"
2. For "Role," select **WRITE** (not just read)
3. Leave the expiration date as "No expiration" or set it far in the future
4. Click "Generate token"
5. **Copy the token immediately** - you won't be able to see it again!

![Hugging Face Token Creation](https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/hub/new-token.png)

## Step 4: Update Your .env File

1. Open the `.env` file in the root of your Aqua360 project
2. Replace the existing Hugging Face API key with your new token:
   ```
   EXPO_PUBLIC_HUGGINGFACE_API_KEY=your_new_token_here
   ```
3. Save the file

## Step 5: Test the New Token

Run the following command to test if your token is working:

```powershell
npm run test-hf-models
```

If successful, you should see at least one working model.

## Troubleshooting

If you're still having issues:

1. **Make sure you selected WRITE permissions** - this is the most common issue
2. **Check your account verification** - make sure your Hugging Face account is fully verified
3. **Try a different browser** - sometimes cache issues can affect token generation
4. **Contact Hugging Face support** - if all else fails, reach out to them directly

Remember, the free tier of Hugging Face's Inference API does have limitations, but with a properly configured token, you should be able to access the Microsoft DialoGPT model that Aqua360 is now using.
