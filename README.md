# Aqua 360° 🌊

Welcome to **Aqua 360°**, a2. Start the Expo development server specifically optimized for Expo Go:

   ```powershell
   npm run start-expo-go
   # or
   expo start --dev-client
   ```
   
   If you have cache issues, use:
   
   ```powershell
   npm run clear-cache
   # or
   expo start --clear
   ```

## Expo Go Compatibility

This app has been specifically enhanced for compatibility with Expo Go:

### Key Compatibility Features

1. **Firebase Configuration**:
   - Uses environment variables with fallbacks
   - Modified persistence settings for Expo Go compatibility
   - Added detection for Expo Go environment
   
2. **Network Handling**:
   - Enhanced offline detection and error handling
   - Visual indicators for offline status
   - Graceful fallbacks when network is unavailable

3. **Authentication Enhancements**:
   - "Remember Me" feature for credential storage
   - Improved error handling for various authentication scenarios
   - Network-aware login process

## Troubleshooting

### Common Issues

1. **White Screen in Expo Go**
   - Clear the Expo cache: `npm run clear-cache`
   - Check your Firebase configuration
   - Make sure you've installed all dependencies: `npm install`

2. **Firebase Authentication Issues**
   - Ensure your Firebase project is properly set up with email authentication
   - Check internet connectivity (the app will warn you if offline)
   - Verify your environment variables are correctly set

3. **Network Errors**
   - The app includes offline detection, but requires internet for initial login
   - Try toggling your device's airplane mode to reset the connection
   - Some features may be limited when offline

4. **Expo Error: "Unable to resolve module..."**
   - Run `npm install` to ensure all dependencies are installed
   - Restart the Expo server with `npm start -- --clear`
   - Make sure your environment is properly set up

### Development Tips

- The app uses Expo Router for navigation
- Firebase authentication is implemented in the `config/firebase.ts` file
- Login page includes network awareness and credential storage features
- Offline detection is available app-wide through the Firebase configsports and recreation booking app built with React Native and Expo.

![Aqua 360° Logo](assets/images/icon.png)

## Features

- **User Authentication**: Sign up, login, and account management with offline credential storage
- **Service Booking**: Book jet skis, tours, and the aqua lounge
- **Offline Support**: Enhanced offline capabilities and network status monitoring
- **Reviews System**: Leave and read reviews from other users
- **Add-ons**: Customize your bookings with additional services

## Getting Started with Expo Go

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer recommended)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your iOS or Android device

### Installation

1. Install dependencies

   ```powershell
   npm install
   # or if you prefer yarn
   yarn install
   ```
   
2. Set up environment variables (copy `.env.example` to `.env` if available, or create your own)

   ```
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_STORAGE_BUCKET=your-app.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

3. Start the Expo development server specifically optimized for Expo Go:

   ```powershell
   npm run start-expo-go
   # or
   expo start --dev-client
   ```

2. Set up environment variables
   
   The `.env` file contains important configuration values for Firebase and should be properly configured.

3. Run the compatibility check script

   ```powershell
   ./scripts/check-expo-compatibility.ps1
   ```

4. Start the app with optimized settings for Expo Go

   ```powershell
   ./scripts/start-expo.ps1
   ```

### Running in Expo Go

After starting the app, you can scan the QR code with your device to open it in Expo Go:

1. Make sure you have Expo Go installed on your device 
2. Ensure your phone and computer are on the same network
3. Start the app with our optimized script:

   ```powershell
   ./scripts/start-expo-go.ps1
   ```

4. Scan the QR code with your phone camera or Expo Go app

### Troubleshooting Expo Go Issues

If you encounter issues running the app in Expo Go, try these steps:

1. **Clear cache and restart**

   ```powershell
   ./scripts/start-expo-go.ps1 --clean
   ```

2. **Verify expo-updates installation**

   ```powershell
   yarn add expo-updates
   ```

3. **Check network connectivity**
   - Make sure your phone and computer are on the same WiFi network
   - Try setting up a hotspot from your phone if WiFi has restrictions

4. **Common error: Unable to resolve module**
   - This often happens with new dependencies
   - Try restarting the Expo server with the `--clear` flag
   - Make sure all dependencies are properly installed

5. **Firebase connection issues**
   - The app is designed to work offline
   - Check your .env file for correct Firebase configuration

- On iOS: Use the Camera app to scan the QR code
- On Android: Use the Expo Go app to scan the QR code

## Troubleshooting Expo Go Issues

If you encounter issues running the app in Expo Go, try these solutions:

1. **Clear Cache and Restart**
   ```powershell
   npx expo start --clear
   ```

2. **Network Issues**
   - Ensure your development machine and mobile device are on the same network
   - Try using tunnel mode if on different networks:
     ```powershell
     npx expo start --tunnel
     ```

3. **Firebase Connection Issues**
   - The app has offline capabilities, so you can still test most features
   - Check your Firebase configuration in `.env` file

4. **Blank Screen or Crashes**
   - The app uses an ErrorBoundary to catch and display errors
   - Check the Metro bundler console for error messages

## Folder Structure

- `/app` - Contains all screens and the routing structure
- `/components` - Reusable UI components
- `/config` - Configuration files (Firebase, etc.)
- `/hooks` - Custom React hooks, including authentication
- `/assets` - Images, fonts, and other static assets
- `/constants` - App-wide constants, including colors and themes
- `/scripts` - Utility scripts for development and deployment

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
# Project2
# New-app-Aqua360
