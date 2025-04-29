import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { useAuth } from './useAuth';
import { ThemedText } from '@/components/ThemedText';

// This component is used to wrap pages that require authentication
export function withProtectedRoute<T extends JSX.IntrinsicAttributes>(
  Component: React.ComponentType<T>,
  options?: { redirectOnlyForBooking?: boolean }
) {
  return function ProtectedRoute(props: T) {
    const { user, loading } = useAuth();
    const currentPath = usePathname();
    const isBookingPath = currentPath === '/booking';

    useEffect(() => {
      // If not loading and no user is found, redirect to login
      if (!loading && !user) {
        // Only redirect if this is a booking page or the options don't specify redirectOnlyForBooking
        if (!options?.redirectOnlyForBooking || isBookingPath) {
          // Store the path the user was trying to access for redirect after login
          if (currentPath) {
            router.replace({
              pathname: '/login',
              params: { redirect: currentPath }
            });
          } else {
            router.replace('/login');
          }
        }
      }
    }, [user, loading, currentPath, isBookingPath]);

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#21655A" />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      );
    }

    // If redirectOnlyForBooking is true and it's not a booking page, allow access without a user
    if (options?.redirectOnlyForBooking && !isBookingPath) {
      return <Component {...props} />;
    }

    // For other protected routes, only render if we have a user
    return user ? <Component {...props} /> : null;
  };
}

// Add default export to fix the import issue
export default withProtectedRoute;

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