// filepath: services/huggingfaceService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, doc, getDoc, getDocs, query, setDoc, where, deleteDoc, getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import NetInfo from '@react-native-community/netinfo';

// Initialize Firebase (copied from firebase.ts)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDhrik544tBzrcVBgeQU3GMuNaDDB6Bxmw",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "year2project-fa35b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "year2project-fa35b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "year2project-fa35b",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "651046894087",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:651046894087:web:da388903018665a45108a2",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SPM59SGPKE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Constants
const CHAT_HISTORY_STORAGE_KEY = 'aqua360_chat_history';

// Using Hugging Face's Inference Providers API (this is different from the regular Inference API)
// For details see: https://huggingface.co/docs/inference-providers/index
const HF_API_URL = 'https://router.huggingface.co/novita/v3/openai/chat/completions';
// Using a model compatible with Novita AI provider
const HF_MODEL = 'deepseek/deepseek-v3-0324';

// Suggested topics for the AI Assistant (reusing existing topics)
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

// System prompt to provide context about Aqua360
const systemPrompt: string = `You are an AI Assistant for Aqua360, a family-owned water sports and jet ski rental company located in Mount Maunganui & Tauranga, Bay of Plenty, New Zealand.
Provide helpful information about jet ski rentals, water activities, and our services.
Be concise, friendly, and accurate. If you don't know an answer, suggest contacting our staff.

SERVICES & OFFERINGS:
- Jet ski rentals using brand-new luxurious Sea-Doo GTI 130 models
- Guided jet ski tours exploring Tauranga's hidden gems
- Jet ski fishing adventures
- Watersports accessories: wakeboard, water skis, 2-4 person biscuit rides
- Corporate and family event packages with beach dome & BBQ setup
- Aqua Lounge for families and friends
- Gift vouchers and holiday Gift Cards available

OPERATING HOURS:
- April to August: Bookings only
- September to December: Tuesday to Friday (Bookings only), Saturday and Sunday (Open on-site at Pilot Bay Beach)
- January to March: Tuesday to Thursday (Bookings only), Friday to Sunday (Open on-site at Pilot Bay Beach)
- Christmas Period (December 19th to January 29th): Open every day on-site at Pilot Bay Beach, 10am till late

LOCATION:
- Pilot Bay (Mount End) Beach, Mount Maunganui

CONTACT:
- Phone: 021 2782 360
- Email: admin@aqua360.co.nz
- Website: aqua360.co.nz
- Social Media: Facebook @aqua360jetskihire, Instagram @aqua360.jetski

SAFETY:
We prioritize safety and provide full safety instructions and equipment to all customers.

PAYMENT OPTIONS:
Afterpay available for purchases

COMPANY MOTTO:
"We guarantee that every experience with us will be a memorable one"

Be friendly, enthusiastic, and emphasize the fun experiences we offer at Aqua360.`;

// Initialize Hugging Face API with token from environment variables
export function initializeHuggingFaceApi(): any {
  try {
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.error('No Hugging Face API key available');
      return null;
    }
    
    console.log('Hugging Face API initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Hugging Face API:', error);
    return null;
  }
}

// Backward compatibility functions for Claude and Gemini
export function initializeClaudeClient(): any {
  return initializeHuggingFaceApi();
}

export function initializeGeminiModel(): any {
  return initializeHuggingFaceApi();
}

// Validate if the Hugging Face API key is valid
export async function isHuggingFaceApiKeyValid(): Promise<boolean> {
  try {
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      console.error('No Hugging Face API key available for validation');
      return false;
    }
      // Use the Inference Providers API instead of direct model inference
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'Hello, I am testing the Hugging Face API connection for Aqua360.'
          }
        ],
        model: HF_MODEL,
        max_tokens: 50,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      console.error(`API validation failed: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('API validation successful, sample response:', data);
    return true;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}

// Backward compatibility functions
export async function isClaudeApiKeyValid(): Promise<boolean> {
  return isHuggingFaceApiKeyValid();
}

export async function isGeminiApiKeyValid(): Promise<boolean> {
  return isHuggingFaceApiKeyValid();
}

// Format conversation history for the Chat Completions API format
function formatConversationForChatAPI(messages: ChatMessage[]): Array<{role: string, content: string}> {
  // Add system message first
  const formattedMessages = [
    { 
      role: 'system', 
      content: systemPrompt 
    }
  ];
  
  // Add recent messages (limit to avoid token issues)
  const recentMessages = messages.slice(-8);
  for (const msg of recentMessages) {
    formattedMessages.push({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.message
    });
  }
  
  return formattedMessages;
}

// Send message to Hugging Face Inference Providers API
export async function sendMessageToHuggingFace(userMessage: string, userId: string | null = null): Promise<string> {
  try {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }
    
    console.log(`Sending message to Hugging Face: "${userMessage.substring(0, 30)}..."`);
    
    // Save user message to history
    await saveChatMessage(userId, 'user', userMessage);
    
    // Get API key
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('Hugging Face API key not found');
    }
    
    // Get chat history for context
    const chatHistory = await loadChatHistory(userId);
    const chatMessages = chatHistory ? chatHistory.messages : [];
    
    // Format the messages for the Chat Completions API
    const messages = formatConversationForChatAPI(chatMessages);
    
    // Add the current user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    // Make the API request to Hugging Face Inference Providers API
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: HF_MODEL,
        temperature: 0.7,
        max_tokens: 500,
        stream: false
      })
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    let responseText = "";
    
    // Extract the response text from the Chat Completions API format
    if (data && data.choices && data.choices.length > 0 && data.choices[0].message) {
      responseText = data.choices[0].message.content;
    } else {
      responseText = "I'm sorry, I couldn't generate a proper response. Please contact Aqua360 staff directly for assistance.";
    }
    
    // If we got an empty or very short response, use a fallback
    if (!responseText || responseText.length < 10) {
      responseText = "I'm sorry, I couldn't generate a proper response. Please contact Aqua360 staff directly for assistance.";
    }
    
    // Add Aqua360 context if needed
    if (!responseText.toLowerCase().includes('aqua') && 
        !responseText.toLowerCase().includes('jet ski') && 
        !responseText.toLowerCase().includes('water')) {
      responseText += "\n\nFor more information about our jet ski rentals and water activities at Aqua360, please visit our location or check our website.";
    }
    
    console.log(`Received response: "${responseText.substring(0, 30)}..."`);
    
    // Save AI response to chat history
    await saveChatMessage(userId, 'ai', responseText);
    
    return responseText;
  } catch (error) {
    console.error('Error sending message to Hugging Face:', error);
    throw new Error('Unable to get response from AI. Please try again later.');
  }
}

// Backward compatibility functions
export async function sendMessageToClaude(userMessage: string, userId: string | null = null): Promise<string> {
  return sendMessageToHuggingFace(userMessage, userId);
}

export async function sendMessageToGemini(userMessage: string, userId: string | null = null): Promise<string> {
  return sendMessageToHuggingFace(userMessage, userId);
}

// Reset chat session (This isn't needed for Hugging Face but kept for compatibility)
export function resetChatSession(): void {
  console.log('Chat session reset');
}

// Get chat session (compatibility function - Hugging Face doesn't need persistent sessions)
export async function getChatSession(userId: string | null = null): Promise<any> {
  return {
    async sendMessage(message: string) {
      const responseText = await sendMessageToHuggingFace(message, userId);
      return {
        response: {
          text: () => responseText
        }
      };
    }
  };
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
