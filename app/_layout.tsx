// Root layout for Aqua 360° App - handles navigation and app-wide configuration
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { View, Text, ActivityIndicator, StyleSheet, LogBox } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/hooks/useAuth';

// Ignore specific warnings that might cause issues
LogBox.ignoreLogs([
  'Require cycle:', // Ignore require cycles
  'AsyncStorage has been extracted from react-native core', // Common AsyncStorage warning
  'Warning: componentWill', // Ignore legacy lifecycle methods warnings
]);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isLoadingComplete, setLoadingComplete] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
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
        setLoadError(e);
        await SplashScreen.hideAsync();
        setLoadingComplete(true); // Continue anyway, but with error state
      }
    }

    prepare();
  }, [loaded, error]);

  if (!isLoadingComplete) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#21655A" />
        <Text style={styles.loadingText}>Loading Aqua 360°...</Text>
      </View>
    );
  }

  if (loadError) {
    console.log('Continuing despite load error:', loadError);
    // We'll continue rendering the app despite the error
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#21655A'
  }
});
