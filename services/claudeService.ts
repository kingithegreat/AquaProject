import Anthropic from '@anthropic-ai/sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, getDocs, query, setDoc, where, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import NetInfo from '@react-native-community/netinfo';

// Constants
const CHAT_HISTORY_STORAGE_KEY = 'aqua360_chat_history';
const DEFAULT_MODEL = 'claude-3-sonnet-20240229';

// Suggested topics for the AI Assistant
export const suggestedTopics = [
  "What jet ski models do you offer?",
  "What's the minimum age to rent?",
  "How much does a jet ski rental cost?",
  "Do I need a license to ride?",
  "What safety equipment is provided?",
  "Do you offer group discounts?"
];

// Types
export interface ChatMessage {
  type: 'user' | 'ai';
  message: string;
  timestamp?: number;
}

export interface ChatHistory {
  userId: string | null;
  messages: ChatMessage[];
}

// Store Claude client and session in memory to avoid re-initializing
let claudeClient: Anthropic | null = null;
let systemPrompt: string = `You are an AI Assistant for Aqua360, a water sports and jet ski rental company.
Provide helpful information about jet ski rentals, water activities, and our services.
Be concise, friendly, and accurate. If you don't know an answer, suggest contacting our staff.
Our company offers:
- Jet ski rentals (Yamaha and Sea-Doo models, hourly or daily rates)
- Guided tours
- Water equipment rental (tubes, wakeboards, etc.)
- Lounge area with food and drinks
- Group discounts for 5+ people
Our operating hours are 9:00 AM - 5:00 PM daily, weather permitting.`;
let messageHistory: any[] = [];
let lastUserId: string | null = null;

// Initialize Claude client with API key
export function initializeClaudeClient(): any {
  try {
    const claudeApiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
      console.error('No Claude API key available');
      return null;
    }
    
    claudeClient = new Anthropic({
      apiKey: claudeApiKey
    });
    
    console.log('Claude client initialized successfully');
    return claudeClient;
  } catch (error) {
    console.error('Error initializing Claude client:', error);
    return null;
  }
}

// For backward compatibility with existing code
export function initializeGeminiModel(): any {
  return initializeClaudeClient();
}

// Validate if the Claude API key is valid
export async function isClaudeApiKeyValid(): Promise<boolean> {  try {
    if (!claudeClient) {
      claudeClient = initializeClaudeClient();
    }
    
    if (!claudeClient) {
      console.error('No Claude client available for validation');
      return false;
    }    // Simple test message to check if the API key is valid
    const response = await claudeClient.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello"'
        }
      ],
      system: "Reply with a single word greeting."
    });
    
    // Safely extract the response text
    let responseText = "No response text";
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text;
    }
    console.log('API validation response:', responseText.substring(0, 20) + "...");
    return true;  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}

// For backward compatibility with existing code
export async function isGeminiApiKeyValid(): Promise<boolean> {
  return isClaudeApiKeyValid();
}

// Reset chat session
export function resetChatSession(): void {
  messageHistory = [];
  lastUserId = null;
  console.log('Chat session reset');
}

// Get or initialize chat session for a user
export async function getChatSession(userId: string | null = null): Promise<any> {
  try {
    // If we already have message history for this user, return it
    if (messageHistory.length > 0 && lastUserId === userId) {
      return { messageHistory };
    }
    
    console.log('Creating new chat session...');
      // Initialize client if needed
    if (!claudeClient) {
      console.log('Initializing Claude client for chat session...');
      claudeClient = initializeClaudeClient();
    }
    
    if (!claudeClient) {
      console.error('Failed to initialize Claude client for chat session');
      throw new Error('Claude client not initialized');
    }
    
    // Create a basic chat handler that tracks conversation history
    const chatHandler = {
      async sendMessage(message: string) {
        try {
          // Prepare conversation history
          const messages = [...messageHistory];
          messages.push({ role: 'user', content: message });
          
          // Send message to Claude API
          const response = await claudeClient!.messages.create({
            model: DEFAULT_MODEL,
            max_tokens: 1000,
            temperature: 0.7,
            messages: messages.map(msg => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            })),
            system: systemPrompt
          });          // Get the response text - safely handle different content block types
          let responseText = 'No text response';
          if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
            responseText = response.content[0].text;
          }
          
          // Add the response to message history
          messageHistory.push({ role: 'user', content: message });
          messageHistory.push({ role: 'assistant', content: responseText });
          
          // Format the response to match Gemini's interface
          return {
            response: {
              text: () => responseText
            }
          };
        } catch (error) {
          console.error('Error sending message to Claude:', error);
          throw error;
        }
      }
    };
    
    lastUserId = userId;
    return chatHandler;
  } catch (error) {
    console.error('Error getting chat session:', error);
    throw error;
  }
}

// Send message to Claude AI and get response
export async function sendMessageToClaude(userMessage: string, userId: string | null = null): Promise<string> {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }
    
    console.log(`Sending message: "${userMessage.substring(0, 30)}..."`);
    
    // Save user message
    await saveChatMessage(userId, 'user', userMessage);
    
    // Try with standard approach
    try {
      // Get or initialize chat session
      const session = await getChatSession(userId);
      
      // Send message and get response
      console.log('Awaiting response...');
      const result = await session.sendMessage(userMessage);
      const responseText = result.response.text();
      
      console.log(`Received response: "${responseText.substring(0, 30)}..."`);
      
      // Save AI response
      await saveChatMessage(userId, 'ai', responseText);
      
      return responseText;
    } catch (chatError) {
      console.error('Chat approach failed, trying direct API call:', chatError);
        // Try direct API call as fallback
      if (!claudeClient) {
        claudeClient = initializeClaudeClient();
      }
      
      const fullPrompt = `${systemPrompt}\n\nUser query: ${userMessage}`;
        const response = await claudeClient!.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: userMessage }],
        system: systemPrompt
      });
        let responseText = 'No text response';
      if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
        responseText = response.content[0].text;
      }
      
      // Save AI response
      await saveChatMessage(userId, 'ai', responseText);
      
      return responseText;
    }  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Unable to get response from AI. Please try again later.');
  }
}

// For backward compatibility with existing code
export async function sendMessageToGemini(userMessage: string, userId: string | null = null): Promise<string> {
  return sendMessageToClaude(userMessage, userId);
}

// Save chat message to Firebase (if authenticated) and AsyncStorage
export async function saveChatMessage(userId: string | null, type: 'user' | 'ai', message: string): Promise<void> {
  try {
    // Create chat message
    const chatMessage: ChatMessage = {
      type,
      message,
      timestamp: Date.now()
    };
    
    // Load existing chat history
    const chatHistory = await loadChatHistory(userId);
    const messages = chatHistory ? [...chatHistory.messages, chatMessage] : [chatMessage];
    
    // Save to AsyncStorage (for all users)
    const newChatHistory: ChatHistory = {
      userId: userId || null,
      messages
    };
    
    await AsyncStorage.setItem(
      userId ? `${CHAT_HISTORY_STORAGE_KEY}_${userId}` : CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify(newChatHistory)
    );
    
    // If user is authenticated, also save to Firebase
    if (userId) {
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          await setDoc(doc(firestore, `users/${userId}/chatHistory/messages`), {
            messages: messages
          });
        }
      } catch (firebaseError) {
        console.error('Error saving to Firebase:', firebaseError);
        // Continue even if Firebase save fails - we have local backup in AsyncStorage
      }
    }
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

// Load chat history from Firebase (if authenticated) or AsyncStorage
export async function loadChatHistory(userId: string | null): Promise<ChatHistory | null> {
  try {
    // Try to load from Firebase first if user is authenticated and online
    if (userId) {
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          const docRef = doc(firestore, `users/${userId}/chatHistory/messages`);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            return {
              userId,
              messages: data.messages || []
            };
          }
        }
      } catch (firebaseError) {
        console.error('Error loading from Firebase:', firebaseError);
        // Fall back to AsyncStorage
      }
    }
    
    // Load from AsyncStorage
    const storageKey = userId ? `${CHAT_HISTORY_STORAGE_KEY}_${userId}` : CHAT_HISTORY_STORAGE_KEY;
    const storedData = await AsyncStorage.getItem(storageKey);
    
    if (storedData) {
      return JSON.parse(storedData) as ChatHistory;
    }
    
    // Return empty history if nothing found
    return {
      userId: userId || null,
      messages: []
    };
  } catch (error) {
    console.error('Error loading chat history:', error);
    // Return empty history on error
    return {
      userId: userId || null,
      messages: []
    };
  }
}

// Clear chat history from Firebase (if authenticated) and AsyncStorage
export async function clearChatHistory(userId: string | null): Promise<void> {
  try {
    // Clear from AsyncStorage
    const storageKey = userId ? `${CHAT_HISTORY_STORAGE_KEY}_${userId}` : CHAT_HISTORY_STORAGE_KEY;
    await AsyncStorage.removeItem(storageKey);
    
    // Also clear from Firebase if authenticated and online
    if (userId) {
      try {
        const netInfo = await NetInfo.fetch();
        if (netInfo.isConnected) {
          await deleteDoc(doc(firestore, `users/${userId}/chatHistory/messages`));
        }
      } catch (firebaseError) {
        console.error('Error clearing from Firebase:', firebaseError);
        // Continue even if Firebase delete fails
      }
    }
    
    // Reset chat session
    resetChatSession();
  } catch (error) {
    console.error('Error clearing chat history:', error);
  }
}
