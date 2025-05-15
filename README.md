# Aqua 360° 🌊

Welcome to **Aqua 360°**, a water sports and recreation booking app built with React Native and Expo.

![Aqua 360° Logo](assets/images/icon.png)

## Features

- **User Authentication**: Sign up, login, and account management
- **Service Booking**: Book jet skis, tours, and the aqua lounge
- **Offline Support**: Book services even without an internet connection
- **Reviews System**: Leave and read reviews from other users
- **Add-ons**: Customize your bookings with additional services

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/client) app on your iOS or Android device

### Installation

1. Install dependencies

   ```powershell
   npm install
   # or if you prefer yarn
   yarn install
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
