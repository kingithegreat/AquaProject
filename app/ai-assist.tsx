/**
 * AQUA 360° - AI ASSISTANT SCREEN
 * ===============================
 * 
 * PRESENTATION HIGHLIGHTS:
 * - Advanced AI chatbot integration using Hugging Face API
 * - Real-time customer support for jet ski rental inquiries
 * - Persistent chat history with Firebase integration
 * - Intelligent suggested topics for common questions
 * - Cross-platform compatibility (iOS/Android)
 * - Modern glass morphism UI design
 * 
 * KEY FEATURES DEMONSTRATED:
 * ✅ AI-powered customer service automation
 * ✅ Real-time chat interface with smooth animations
 * ✅ Error handling and network resilience
 * ✅ User authentication integration
 * ✅ Responsive mobile-first design
 * ✅ Professional business application
 */

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, SafeAreaView, TouchableOpacity, Platform, TextInput, ActivityIndicator, KeyboardAvoidingView, StatusBar, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/hooks/useAuth';
import { 
  sendMessageToHuggingFace, 
  loadChatHistory, 
  clearChatHistory,
  isHuggingFaceApiKeyValid,
  ChatMessage,
  suggestedTopics
} from '@/services/huggingfaceService';

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
  // Get the current user from auth
  const { user } = useAuth();
    // State for handling the chat functionality
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [networkError, setNetworkError] = useState(false);
  const [apiKeyValid, setApiKeyValid] = useState(true);
    // Ref for flat list to automatically scroll to bottom
  const flatListRef = useRef<FlatList>(null);
    // Load chat history when component mounts and check API key
  useEffect(() => {
    const initialize = async () => {
      try {
        setInitializing(true);
          // Check if the Hugging Face API key is valid
        const isValid = await isHuggingFaceApiKeyValid();
        setApiKeyValid(isValid);
        
        // Load chat history
        const history = await loadChatHistory(user?.uid || null);
        if (history && history.messages.length > 0) {
          setChatHistory(history.messages);
        }
      } catch (error) {
        console.error('Error initializing AI Assistant:', error);
      } finally {
        setInitializing(false);
      }
    };

    initialize();
  }, [user]);// Function to handle AI response using Hugging Face
  const handleAskAI = async () => {
    if (!userPrompt.trim() || !apiKeyValid) return;
    
    setNetworkError(false); // Reset network error state
    
    // Add user message to chat history immediately for responsiveness
    const newUserMessage: ChatMessage = { 
      type: 'user', 
      message: userPrompt,
      timestamp: Date.now() 
    };
    
    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    
    setIsLoading(true);
      try {      // Get response from Hugging Face API
      const response = await sendMessageToHuggingFace(userPrompt, user?.uid || null);
      
      // We don't need to add the AI response to the chat history here
      // as it's already being added by the sendMessageToHuggingFace function
      // But we need to update our local state
      const newAiMessage: ChatMessage = {
        type: 'ai',
        message: response,
        timestamp: Date.now()
      };
      
      setChatHistory([...updatedHistory, newAiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setNetworkError(true);
      
      // Add an error message to the chat
      const errorMessage: ChatMessage = {
        type: 'ai',
        message: 'Sorry, I encountered an error processing your request. Please check your internet connection and try again.',
        timestamp: Date.now()
      };
      
      setChatHistory([...updatedHistory, errorMessage]);
    } finally {
      setIsLoading(false);
      setUserPrompt(''); // Clear input after sending
    }
  };

  // Handle selecting a suggested topic
  const handleSelectTopic = (topic: string) => {
    setUserPrompt(topic);
  };

  // Handle clearing chat history
  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear your chat history? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearChatHistory(user?.uid || null);
              setChatHistory([]);
            } catch (error) {
              console.error('Error clearing chat history:', error);
              Alert.alert('Error', 'Failed to clear chat history. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Function to navigate to booking page
  const navigateToBooking = () => {
    router.push('/booking');
  };  // Render suggested topics
  const renderSuggestedTopics = () => {
    // Default topics in case suggestedTopics is undefined
    const defaultTopics = [
      "What jet ski models do you offer?",
      "What's the minimum age to rent?",
      "How much does a jet ski rental cost?",
      "Do I need a license to ride?",
      "What safety equipment is provided?",
      "Do you offer group discounts?"
    ];
    
    // Use suggestedTopics if defined, otherwise use default topics
    const topics = Array.isArray(suggestedTopics) ? suggestedTopics : defaultTopics;
    
    return (
      <View style={styles.suggestedTopicsContainer}>
        <ThemedText style={styles.suggestedTopicsTitle}>Suggested topics:</ThemedText>
        <View style={styles.topicsRow}>
          {topics.slice(0, 2).map((topic: string, index: number) => (
            <TouchableOpacity
              key={index}
              style={styles.topicButton}
              onPress={() => handleSelectTopic(topic)}
            >
              <ThemedText style={styles.topicText}>{topic}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.topicsRow}>
          {topics.slice(2, 4).map((topic: string, index: number) => (
            <TouchableOpacity
              key={index + 2}
              style={styles.topicButton}
              onPress={() => handleSelectTopic(topic)}
            >
              <ThemedText style={styles.topicText}>{topic}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.topicsRow}>
          {topics.slice(4, 6).map((topic: string, index: number) => (
            <TouchableOpacity
              key={index + 4}
              style={styles.topicButton}
              onPress={() => handleSelectTopic(topic)}
            >
              <ThemedText style={styles.topicText}>{topic}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#21655A"
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          {/* Header with Title and Clear Button */}
          <View style={styles.header}>
            <GlassBackground style={styles.titleContainer}>
              <ThemedText style={styles.title}>AI Assistant</ThemedText>
            </GlassBackground>
            
            {chatHistory.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearChat}
              >
                <Ionicons name="trash-outline" size={24} color="#21655A" />
              </TouchableOpacity>
            )}
          </View>

          {/* Chat History Display */}
          {initializing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#21655A" />
              <ThemedText style={styles.loadingText}>Loading chat history...</ThemedText>
            </View>
          ) : (            <View style={styles.chatHistoryContainer}>              {!apiKeyValid ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="key-outline" size={36} color="#ff3b30" />
                  <ThemedText style={styles.errorText}>
                    Hugging Face API key is missing or invalid. Please add a valid API key to the .env file.
                  </ThemedText>
                  <TouchableOpacity 
                    style={styles.setupButton}
                    onPress={() => Alert.alert(
                      'API Key Required',
                      'To use the AI Assistant, you need to provide a valid Hugging Face API key in your .env file as EXPO_PUBLIC_HUGGINGFACE_API_KEY.'
                    )}
                  >
                    <ThemedText style={styles.setupButtonText}>How to Set Up</ThemedText>
                  </TouchableOpacity>
                </View>
              ) : chatHistory.length === 0 ? (
                <View style={styles.emptyResponseContainer}>
                  <ThemedText style={styles.emptyResponseText}>
                    Ask me anything about jet ski rentals, water activities, or booking information.
                  </ThemedText>
                  {renderSuggestedTopics()}
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={chatHistory}
                  keyExtractor={(item, index) => index.toString()}
                  contentContainerStyle={styles.chatContentContainer}
                  onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                  onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                  renderItem={({ item }) => (
                    <View 
                      style={[
                        styles.messageBubble,
                        item.type === 'user' ? styles.userMessage : styles.aiMessage
                      ]}
                    >
                      <ThemedText style={[
                        styles.messageText,
                        item.type === 'user' ? styles.userMessageText : styles.aiMessageText
                      ]}>{item.message}</ThemedText>
                    </View>
                  )}
                />
              )}
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#0078d4" />
                  <ThemedText style={styles.loadingText}>AI is thinking...</ThemedText>
                </View>
              )}
              {networkError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={24} color="#ff3b30" />
                  <ThemedText style={styles.errorText}>Network error. Please check your connection.</ThemedText>
                </View>
              )}
            </View>
          )}
            {/* User Prompt Input */}
          <View style={[
            styles.promptInputContainer,
            !apiKeyValid ? styles.disabledContainer : null
          ]}>
            <TextInput
              style={styles.promptInput}
              placeholder={apiKeyValid ? "Type your question here..." : "AI Assistant unavailable - API key required"}
              value={userPrompt}
              onChangeText={setUserPrompt}
              multiline
              numberOfLines={2}
              editable={apiKeyValid}
            />
            <TouchableOpacity 
              style={[
                styles.sendButton,
                (!userPrompt.trim() || !apiKeyValid) ? styles.sendButtonDisabled : null
              ]}
              onPress={handleAskAI}
              disabled={!userPrompt.trim() || isLoading || !apiKeyValid}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    minHeight: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 30,
    width: 50,
    height: 50,
    marginLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: '#005662',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    lineHeight: 34,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chatHistoryContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 16,
  },
  chatContentContainer: {
    paddingBottom: 10,
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
    marginBottom: 20,
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
    alignSelf: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(230, 230, 230, 0.7)',
    margin: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 220, 220, 0.7)',
    marginTop: 10,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: '500',
  },  promptInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 8,
    marginBottom: 20,
    borderColor: '#DDD',
    borderWidth: 1,
  },
  disabledContainer: {
    backgroundColor: '#f5f5f5',
    borderColor: '#DDD',
    opacity: 0.7,
  },
  setupButton: {
    backgroundColor: '#21655A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  setupButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  promptInput: {
    flex: 1,
    fontSize: 17,
    padding: 12,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#21655A',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#93beab',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#21655A',
    borderRadius: 25,
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
  // Suggested topics styles
  suggestedTopicsContainer: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  suggestedTopicsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  topicsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  topicButton: {
    backgroundColor: 'rgba(33, 101, 90, 0.1)',
    borderColor: '#21655A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  topicText: {
    color: '#21655A',
    fontSize: 14,
    textAlign: 'center',
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