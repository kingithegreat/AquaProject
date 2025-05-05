import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Platform, TextInput, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Glass effect component
interface GlassBackgroundProps {
  style?: any;
  intensity?: number;
  children: React.ReactNode;
  noRadius?: boolean;
}

function GlassBackground({ style, intensity = 50, children, noRadius = false }: GlassBackgroundProps) {
  const isIOS = Platform.OS === 'ios';
  
  if (isIOS) {
    return (
      <BlurView 
        intensity={intensity} 
        tint="light" 
        style={[
          styles.glassEffect, 
          noRadius ? styles.noRadius : null,
          style
        ]}
      >
        {children}
      </BlurView>
    );
  } else {
    // Fallback for Android (no blur, just semi-transparent bg)
    return (
      <View 
        style={[
          styles.glassEffectAndroid, 
          noRadius ? styles.noRadius : null,
          style
        ]}
      >
        {children}
      </View>
    );
  }
}

export default function AIAssistScreen() {
  // State for handling the chat functionality
  const [userPrompt, setUserPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', message: string}>>([]);

  // Function to handle AI response
  const handleAskAI = () => {
    if (!userPrompt.trim()) return;
    
    // Add user message to chat history
    const newUserMessage = { type: 'user' as const, message: userPrompt };
    setChatHistory(prevHistory => [...prevHistory, newUserMessage]);
    
    setIsLoading(true);
    
    // Simulate AI response delay
    setTimeout(() => {
      const aiResponseText = `Thank you for your question about "${userPrompt}". I'm here to help with any information about our water activities, bookings, or recommendations for your experience.`;
      setAiResponse(aiResponseText);
      
      // Add AI response to chat history
      const newAiMessage = { type: 'ai' as const, message: aiResponseText };
      setChatHistory(prevHistory => [...prevHistory, newAiMessage]);
      
      setIsLoading(false);
      setUserPrompt(''); // Clear input after sending
    }, 1500);
  };

  // Function to navigate to booking page
  const navigateToBooking = () => {
    router.push('/booking');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Title Section */}
          <GlassBackground style={styles.titleContainer}>
            <ThemedText style={styles.title}>AI Assistant</ThemedText>
          </GlassBackground>

          {/* Chat History Display */}
          <View style={styles.chatHistoryContainer}>
            {chatHistory.length === 0 ? (
              <View style={styles.emptyResponseContainer}>
                <ThemedText style={styles.emptyResponseText}>
                  Ask me anything about jet ski rentals, water activities, or booking information.
                </ThemedText>
              </View>
            ) : (
              chatHistory.map((message, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.messageBubble,
                    message.type === 'user' ? styles.userMessage : styles.aiMessage
                  ]}
                >
                  <ThemedText style={[
                    styles.messageText,
                    message.type === 'user' ? styles.userMessageText : styles.aiMessageText
                  ]}>{message.message}</ThemedText>
                </View>
              ))
            )}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0078d4" />
                <ThemedText style={styles.loadingText}>AI is thinking...</ThemedText>
              </View>
            )}
          </View>
          
          {/* User Prompt Input */}
          <View style={styles.promptInputContainer}>
            <TextInput
              style={styles.promptInput}
              placeholder="Type your question here..."
              value={userPrompt}
              onChangeText={setUserPrompt}
              multiline
              numberOfLines={2}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                !userPrompt.trim() ? styles.sendButtonDisabled : null
              ]}
              onPress={handleAskAI}
              disabled={!userPrompt.trim() || isLoading}
            >
              <ThemedText style={styles.sendButtonText}>Send</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Confirm Button to navigate to booking */}
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={navigateToBooking}
          >
            <ThemedText style={styles.confirmButtonText}>Proceed to Booking</ThemedText>
          </TouchableOpacity>
        </View>
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
    padding: 16,
    backgroundColor: '#52D6E2',
  },
  titleContainer: {
    marginBottom: 20,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    minHeight: 65, // Added minimum height
    justifyContent: 'center', // Center text vertically
    alignItems: 'center', // Center text horizontally
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#005662',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 34, // Added line height
    includeFontPadding: false, // Prevents Android from cutting off top of text
    textAlignVertical: 'center', // Ensures text is centered vertically (Android)
  },
  chatHistoryContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
  },
  emptyResponseContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyResponseText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
  messageBubble: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 16,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  userMessage: {
    backgroundColor: '#0064BD',
    alignSelf: 'flex-end',
  },
  aiMessage: {
    backgroundColor: '#F5F5F7',
    alignSelf: 'flex-start',
    borderColor: '#E0E0E5',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 17,
    lineHeight: 24,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#222222',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(230, 230, 230, 0.7)',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  promptInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 8,
    marginBottom: 20,
    borderColor: '#DDD',
    borderWidth: 1,
  },
  promptInput: {
    flex: 1,
    fontSize: 17,
    padding: 12,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#21655A', // Changed from #007AFF to match app's green theme
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#93beab', // Lighter version of the green for disabled state
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#21655A', // Changed from #00A86B to match app's green theme
    borderRadius: 25, // Changed to match other buttons in the app
    paddingVertical: 14,
    marginVertical: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Glass effect styles
  glassEffect: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    borderRadius: 15,
  },
  glassEffectAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
  },
  noRadius: {
    borderRadius: 0,
  },
});