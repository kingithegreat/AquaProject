import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { ThemedText } from '@/components/ThemedText';
import { auth } from '@/config/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const handleLogin = async () => {
    // Reset error state
    setError('');
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Firebase authentication
    try {
      setLoading(true);
      console.log('Attempting to sign in with:', email);
      
      await signInWithEmailAndPassword(auth, email, password);
      // Successfully logged in, navigate to the redirect path or home
      console.log('Login successful');
      
      if (redirect) {
        router.replace(redirect as string);
      } else {
        router.replace('/account'); // Navigate to new account page by default
      }
    } catch (error: any) { // Proper typing for error
      console.error('Firebase login error DETAILS:', {
        code: error.code,
        message: error.message
      });
      
      // More comprehensive error handling for Firebase auth errors
      switch(error.code) {
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/invalid-credential':
          setError('Invalid login credentials');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your internet connection.');
          break;
        case 'auth/internal-error':
          setError('Authentication service error. Please try again later.');
          break;
        default:
          setError(`Login failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    // Pass along the redirect parameter to signup as well
    if (redirect) {
      router.push({
        pathname: '/signup',
        params: { redirect }
      });
    } else {
      router.push('/signup');
    }
  };

  const handleForgotPassword = () => {
    // Handle forgot password (this would typically navigate to a password reset page)
    setError('Password reset functionality would be implemented here');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Image 
              source={require('../assets/images/aqua.webp')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText style={styles.title}>Aqua 360°</ThemedText>
            <ThemedText style={styles.subtitle}>Login to your account</ThemedText>
          </View>
          
          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
            
            {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
            
            <TouchableOpacity 
              style={[styles.forgotPasswordButton]} 
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <ThemedText style={styles.forgotPasswordText}>Forgot password?</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <ThemedText style={styles.loginButtonText}>Login</ThemedText>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <ThemedText style={styles.signupText}>Don't have an account?</ThemedText>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <ThemedText style={styles.signupLink}>Sign Up</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#52D6E2',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#21655A',
    marginTop: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#21655A',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#21655A',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 10,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#1D9A96',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#21655A',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#93beab', // Lighter color when disabled
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  signupText: {
    color: '#333',
    fontSize: 15,
  },
  signupLink: {
    color: '#21655A',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 5,
    textDecorationLine: 'underline',
  },
});