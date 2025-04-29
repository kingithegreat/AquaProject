import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from './useAuth';
import { ThemedText } from '@/components/ThemedText';

// This component is used to wrap pages that require authentication
export function withProtectedRoute<T extends JSX.IntrinsicAttributes>(
  Component: React.ComponentType<T>
) {
  return function ProtectedRoute(props: T) {
    const { user, loading } = useAuth();

    useEffect(() => {
      // If not loading and no user is found, redirect to login
      if (!loading && !user) {
        router.replace('/login');
      }
    }, [user, loading]);

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#21655A" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      );
    }

    // Only render the protected component if we have a user
    return user ? <Component {...props} /> : null;
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#52D6E2',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#21655A',
  },
});