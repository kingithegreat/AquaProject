// Route protection - blocks access to certain screens unless user is logged in
// Automatically redirects users to login screen if they try to access protected content

import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, usePathname } from 'expo-router';

import { useAuth } from './useAuth';
import { ThemedText } from '@/components/ThemedText';

// This component wraps screens that require login (like booking, account, etc.)
export function withProtectedRoute<T extends JSX.IntrinsicAttributes>(
  Component: React.ComponentType<T>,
  options?: { redirectOnlyForBooking?: boolean }
) {
  return function ProtectedRoute(props: T) {
    const { user, loading } = useAuth(); // Check if someone is logged in
    const currentPath = usePathname(); // What page are we on?
    const isBookingPath = currentPath === '/booking';

    useEffect(() => {
      // If we're done checking and no one is logged in, send them to login
      if (!loading && !user) {        // Only redirect for certain pages or if this is a booking page
        if (!options?.redirectOnlyForBooking || isBookingPath) {
          // Remember where they were trying to go so we can send them back after login
          if (currentPath) {
            router.replace({
              pathname: '/login',
              params: { redirect: currentPath } // Tell login where to go back to
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