import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import * as Updates from 'expo-updates';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch JavaScript errors anywhere in child component tree
 * and display a fallback UI instead of crashing the whole app.
 * This is especially useful for Expo Go to prevent full app crashes.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Unhandled error in component:', error, info);
    
    // You could also log to a remote error monitoring service here
    // like Sentry, LogRocket, etc.
  }
  handleReload = async () => {
    try {
      // Reset the error state first
      this.setState({ hasError: false, error: null });
      
      if (!__DEV__) {
        try {
          // In production, we can use Updates.reloadAsync
          await Updates.reloadAsync();
        } catch (updateErr) {
          console.log('Could not reload with Updates API:', updateErr);
          // Fall back to resetting component state
          this.setState({ hasError: false, error: null });
        }
      } else {
        // In Expo Go/dev mode, just reset the state
        console.log('Dev mode: resetting error state');
      }
    } catch (err) {
      console.error('Failed to reload app:', err);
      Alert.alert(
        'Reload Failed',
        'Please try closing and reopening the app.',
        [{ text: 'OK' }]
      );
    }
  };
  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={64} color={Colors.light.palette.error} />
          <ThemedText style={styles.title}>Oops, Something Went Wrong</ThemedText>
          <ThemedText style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </ThemedText>
          <TouchableOpacity style={styles.button} onPress={this.handleReload}>
            <ThemedText style={styles.buttonText}>Reload App</ThemedText>
          </TouchableOpacity>
          {__DEV__ && this.state.error && (
            <View style={styles.developmentError}>
              <ThemedText style={styles.developmentErrorTitle}>Developer Details:</ThemedText>
              <ThemedText style={styles.developmentErrorText}>
                {this.state.error.toString()}
              </ThemedText>
              {this.state.error.stack && (
                <ThemedText style={styles.developmentErrorText}>
                  {this.state.error.stack}
                </ThemedText>
              )}
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: Colors.light.palette.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  developmentError: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    width: '100%',
    maxHeight: 250,
  },
  developmentErrorTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.light.palette.error.main,
  },
  developmentErrorText: {
    fontSize: 12,
    color: '#777',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default ErrorBoundary;
