// Add global polyfills for URL and crypto - critical for Firebase in Expo Go
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

// Root layout for Aqua 360° App - handles navigation and app-wide configuration
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import 'react-native-reanimated';
import { View, ActivityIndicator, StyleSheet, LogBox, Alert, Platform, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import NetInfo from '@react-native-community/netinfo';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/hooks/useAuth';
import { isRunningInExpoGo } from '@/config/firebase';
import ErrorBoundary from '@/components/ErrorBoundary';

// Ignore specific warnings that might cause issues
LogBox.ignoreLogs([
  'Require cycle:', // Ignore require cycles
  'AsyncStorage has been extracted from react-native core', // Common AsyncStorage warning
  'Warning: componentWill', // Ignore legacy lifecycle methods warnings
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * RootLayout component - the main entry point for the app's UI.
 * It handles font loading, splash screen management, and update checking.
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Load custom fonts
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  // State to manage loading status
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  
  // State to capture any loading errors
  const [loadError, setLoadError] = useState<Error | null>(null);  
  
  /**
   * checkForUpdates function - checks and handles app updates.
   * It is called during the initial app preparation in a non-development environment.
   */
  const checkForUpdates = useCallback(async () => {
    try {
      // Only check for updates if not in development mode
      if (!__DEV__ && Updates.channel !== 'development') {
        console.log('Checking for updates...');
        
        // Check if an update is available
        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          // If an update is available, fetch it
          await Updates.fetchUpdateAsync();
          
          // Notify the user about the available update
          Alert.alert(
            "Update Available", 
            "A new update is available. Restart the app to apply it.",
            [
              { text: "Later", style: "cancel" },
              { text: "Restart Now", onPress: async () => await Updates.reloadAsync() }
            ]
          );
        }
      } else {
        console.log('Update checking skipped in development mode');
      }
    } catch (error) {
      // Safely catch and log errors to prevent app crashes
      console.log('Error checking for updates (can be ignored in Expo Go):', error);
    }
  }, []);

  // Handle network status for Expo Go environment
  useEffect(() => {
    const handleConnectivityChange = (state: any) => {
      if (!state.isConnected && isRunningInExpoGo()) {
        console.log('Network disconnected in Expo Go environment');
      }
    };

    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function prepare() {
      try {
        // Check for updates
        await checkForUpdates();
        
        // Pre-load fonts and prepare app resources
        if (loaded && !error) {
          // If everything loaded properly, we can hide the splash screen
          await SplashScreen.hideAsync();
          setLoadingComplete(true);
        } else if (error) {
          console.error("Error loading fonts:", error);
          setLoadError(error);
          await SplashScreen.hideAsync();
          setLoadingComplete(true); // Continue anyway, but with error state
        }
      } catch (e) {
        console.warn('Error preparing app:', e);
        setLoadError(e as Error);
        await SplashScreen.hideAsync();
        setLoadingComplete(true); // Continue anyway, but with error state
      }
    }

    prepare();
  }, [loaded, error]);  

  // While the app is loading (fonts, etc.), show a splash screen with the logo
  if (!isLoadingComplete) {
    return (
      <View style={styles.container}>
        <Image 
          source={require('../assets/images/aqua-360-logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#21655A" style={styles.loader} />
        <ThemedText style={styles.loadingText}>Loading Aqua 360°...</ThemedText>
      </View>
    );
  }

  // If there was an error during loading, log it and continue rendering the app
  if (loadError) {
    console.log('Continuing despite load error:', loadError);
    // We'll continue rendering the app despite the error
  }
  
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: '#000000',
            headerTitleStyle: { fontWeight: 'bold' },
          }}>
            {/* Main screens */}
            <Stack.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
            <Stack.Screen name="explore" options={{ title: 'Explore' }} />
            <Stack.Screen name="about-us" options={{ title: "About Us" }} />
            <Stack.Screen name="ai-assist" options={{ title: "AI Assistant" }} />
            <Stack.Screen name="aqua-lounge" options={{ title: "Aqua Lounge" }} />
            <Stack.Screen name="booking" options={{ title: "Booking" }} />
            <Stack.Screen name="customize" options={{ title: "Customize" }} />
            <Stack.Screen name="login" options={{ title: "Login" }} />
            <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
            <Stack.Screen name="account" options={{ title: "My Account" }} />
            <Stack.Screen name="waiver" options={{ title: "Waiver" }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 15,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#21655A'
  }
});
