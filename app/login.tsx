import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import { ThemedText } from '@/components/ThemedText';
import { auth, checkConnectionWithTimeout } from '@/config/firebase';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const logoAnimation = new Animated.Value(0);
  
  // Check for saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('aqua360_saved_email');
        const rememberMeStatus = await AsyncStorage.getItem('aqua360_remember_me');
        
        if (savedEmail && rememberMeStatus === 'true') {
          setEmail(savedEmail);
          setRememberMe(true);
        }
        
        // Animate the logo
        Animated.sequence([
          Animated.timing(logoAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true
          }),
          Animated.spring(logoAnimation, {
            toValue: 1.1,
            friction: 8,
            tension: 40,
            useNativeDriver: true
          }),
          Animated.spring(logoAnimation, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true
          })
        ]).start();
        
        // Check network connectivity
        checkConnectionStatus();
      } catch (e) {
        console.error("Error loading saved credentials:", e);
      }
    };
    
    loadSavedCredentials();
  }, []);
  
  // Check connection status
  const checkConnectionStatus = async () => {
    const connected = await checkConnectionWithTimeout();
    setIsOnline(connected);
  };
  const handleLogin = async () => {
    // Reset error state
    setError('');
    
    // Check online status first
    if (!isOnline) {
      setError('You appear to be offline. Please check your internet connection and try again.');
      return;
    }
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Save email if "Remember Me" is checked
    if (rememberMe) {
      try {
        await AsyncStorage.setItem('aqua360_saved_email', email);
        await AsyncStorage.setItem('aqua360_remember_me', 'true');
      } catch (e) {
        console.error("Error saving credentials:", e);
      }
    } else {
      // Clear saved credentials if "Remember Me" is unchecked
      try {
        await AsyncStorage.removeItem('aqua360_saved_email');
        await AsyncStorage.setItem('aqua360_remember_me', 'false');
      } catch (e) {
        console.error("Error clearing credentials:", e);
      }
    }
    
    // Firebase authentication
    try {
      setLoading(true);
      console.log('Attempting to sign in with:', email);
      
      await signInWithEmailAndPassword(auth, email, password);
      // Successfully logged in, navigate to the redirect path or home
      console.log('Login successful');
      
      if (redirect) {
        router.replace(redirect as any);
      } else {
        router.replace('/account');
      }
    } catch (error: any) { // Proper typing for error
      console.error('Firebase login error DETAILS:', {
        code: error.code,
        message: error.message
      });
      
      // Check connection again if there's an error (might be a network issue)
      const connected = await checkConnectionWithTimeout();
      setIsOnline(connected);
      
      if (!connected) {
        setError('Network error. Please check your internet connection and try again.');
        return;
      }
      
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
          setError('Network error. Please check your internet connection and try again.');
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
  };  const handleForgotPassword = () => {
    // Check if we have a valid email first
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address to reset your password');
      return;
    }
    
    // In a real implementation, we would use Firebase's sendPasswordResetEmail
    // For now, just display a message
    setError(`If an account exists for ${email}, a password reset link will be sent. Please check your email.`);
  };
  
  // Toggle remember me state
  const toggleRememberMe = () => {
    setRememberMe(prev => !prev);
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
          {/* Header */}          <View style={styles.header}>
            <Image 
              source={require('../assets/images/aqua.webp')}
              style={styles.logo}
              resizeMode="contain"
            />
            {/* Added height to ensure proper text rendering */}
            <View style={{ minHeight: 40, justifyContent: 'center' }}>
              <ThemedText style={styles.title}>Aqua 360°</ThemedText>
            </View>
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
              {error ? (
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            ) : (
              <ThemedText style={styles.offlineText}>
                {!isOnline ? 'You are currently offline. Please check your connection.' : ''}
              </ThemedText>
            )}
              {/* Remember me checkbox and forgot password */}
            <View style={styles.rememberMeContainer}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <TouchableOpacity 
                  style={[styles.checkbox, rememberMe && styles.checkboxSelected]} 
                  onPress={toggleRememberMe}
                  activeOpacity={0.6}
                >
                  {rememberMe && (
                    <ThemedText style={styles.checkmark}>✓</ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleRememberMe} activeOpacity={0.6}>
                  <ThemedText style={styles.rememberMeText}>Remember me</ThemedText>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={[styles.forgotPasswordButton]} 
                onPress={handleForgotPassword}
                disabled={loading}
              >
                <ThemedText style={styles.forgotPasswordText}>Forgot password?</ThemedText>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.loginButtonDisabled, !isOnline && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={loading || !isOnline}
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
  },  header: {
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
    lineHeight: 34, // Add lineHeight to fix text squashing
    paddingVertical: 4, // Add vertical padding to ensure text has room
    includeFontPadding: true, // Ensure font padding is included
    textAlignVertical: 'center', // Vertical alignment
  },
  subtitle: {
    fontSize: 16,
    color: '#21655A',
    marginTop: 5,
    lineHeight: 22, // Add appropriate line height
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
  offlineText: {
    color: '#f39c12',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#21655A',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxSelected: {
    backgroundColor: '#21655A',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    color: '#21655A',
    fontSize: 14,
    flex: 1,
  },
  forgotPasswordButton: {
    justifyContent: 'flex-end',
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