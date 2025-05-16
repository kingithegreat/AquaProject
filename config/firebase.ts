// Add global polyfills for URL and crypto
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, enableIndexedDbPersistence } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { safeGetItem, safeSetItem, safeRemoveItem, safeMultiGet } from '../utils/asyncStorageHelper';

// Your Firebase configuration from environment variables
// This is safer for exposing code and better for different environments
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDhrik544tBzrcVBgeQU3GMuNaDDB6Bxmw",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "year2project-fa35b.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "year2project-fa35b",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "year2project-fa35b",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "651046894087",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:651046894087:web:da388903018665a45108a2",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-SPM59SGPKE"
};

// Initialize Firebase with error handling
let app;
try {
  // Check if an app instance already exists to prevent duplicate app initialization
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error: any) {
  if (error.code === 'app/duplicate-app') {
    // App already exists, get the existing instance
    console.warn("Firebase app already exists, using existing instance");
    app = initializeApp(firebaseConfig, "aqua360-app");
  } else {
    console.error("Firebase initialization error:", error);
    throw new Error("Firebase could not be initialized: " + error.message);
  }
}

// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize Firestore with better error handling for offline support
const db = getFirestore(app);

// Enable offline persistence for Firestore on web platforms
if (Platform.OS === 'web') {
  try {
    enableIndexedDbPersistence(db)
      .then(() => console.log("Offline persistence enabled for web"))
      .catch((err: any) => {
        console.warn("Failed to enable offline persistence:", err.code, err.message);
      });
  } catch (err: any) {
    console.error("Error setting up IndexedDB persistence:", err);
  }
}

// Set up network monitoring
let isConnected = true;
let networkMonitoringSetup = false;
let offlineOperationsQueue: Array<{type: string; data: any; retryCount?: number}> = [];

// Store network state in AsyncStorage for persistence across app restarts
const saveNetworkState = async (connected: boolean) => {
  try {
    await safeSetItem('network_state', JSON.stringify({ isConnected: connected }));
  } catch (error) {
    console.error('Error saving network state:', error);
  }
};

// Load network state from AsyncStorage on app start
const loadNetworkState = async () => {
  try {
    const storedState = await safeGetItem('network_state');
    if (storedState) {
      const { isConnected: storedIsConnected } = JSON.parse(storedState);
      isConnected = storedIsConnected;
      console.log('Loaded network state from storage:', isConnected ? 'online' : 'offline');
    }
  } catch (error) {
    console.error('Error loading network state:', error);
  }
};

// Set up network monitoring with better error handling and Expo Go compatibility
const setupNetworkMonitoring = () => {
  if (networkMonitoringSetup) return;
  
  try {
    // Load previously saved network state
    loadNetworkState();
    
    // Start monitoring network changes with more robust logging for debugging
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      
      // In Expo Go, sometimes the network state can be null or undefined
      // Handle this gracefully to prevent app crashes
      if (state === null || state === undefined) {
        console.warn('Received null or undefined network state - assuming offline');
        isConnected = false;
      } else {
        isConnected = !!state.isConnected;
          // Additional logging for debugging in Expo Go
        if (__DEV__) {
          console.log('Network details:', {
            type: state.type,
            isConnected: state.isConnected,
            isInternetReachable: state.isInternetReachable,
            details: state.details // Fix: Removed unnecessary ternary operation
          });
        } else {
          console.log('Connection status changed:', isConnected ? 'online' : 'offline');
        }
      }
      
      // Save this state for future app launches
      saveNetworkState(isConnected);
      
      // If transitioning from offline to online, process queue
      if (!wasConnected && isConnected && offlineOperationsQueue.length > 0) {
        console.log(`Network reconnected. Processing ${offlineOperationsQueue.length} queued operations.`);
        // Small delay to ensure connection is stable before processing
        setTimeout(() => processOfflineQueue(), 1000);
      }
    });
    
    // Store unsubscribe function in case we need to clean up
    (global as any).netInfoUnsubscribe = unsubscribe;
    
    networkMonitoringSetup = true;
  } catch (error) {
    console.warn('Error setting up network monitoring:', error);
  }
};

// Load any saved offline operations from AsyncStorage
const loadOfflineOperations = async () => {
  try {
    const savedQueue = await safeGetItem('offline_queue');
    if (savedQueue) {
      const operations = JSON.parse(savedQueue);
      if (Array.isArray(operations) && operations.length > 0) {
        offlineOperationsQueue = operations;
        console.log(`Loaded ${operations.length} offline operations from storage`);
      }
    }
  } catch (error) {
    console.error('Error loading offline operations:', error);
  }
};

// Set up network monitoring immediately and load offline operations
setupNetworkMonitoring();
loadOfflineOperations();

// Process the offline queue with improved error handling and retries
const processOfflineQueue = async () => {
  if (offlineOperationsQueue.length === 0) return;

  console.log(`Processing ${offlineOperationsQueue.length} offline operations`);
  
  // Create a copy and clear the original to avoid double-processing
  const operations = [...offlineOperationsQueue];
  offlineOperationsQueue = [];
  
  // Track successful operations for reporting
  let successCount = 0;
  let failCount = 0;  // Process operations in sequential order with delay to avoid errors
  for (const operation of operations) {
    try {
      // Wait between operations
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (operation.type === 'booking') {
        await processOfflineBooking(operation.data);
        successCount++;
      } else {
        // Handle other operation types in the future if needed
        console.warn('Unknown operation type:', operation.type);
        failCount++;
      }
    } catch (error) {
      console.error('Error processing operation:', error);
      // Re-add to queue for later retry with backoff
      const op = operation as {type: string; data: any; retryCount?: number};
      op.retryCount = (op.retryCount || 0) + 1;
      if (op.retryCount < 3) { // Limit retries to prevent infinite loops
        offlineOperationsQueue.push(op);
      } else {
        console.error('Operation failed after multiple retries:', op);
        failCount++;
      }
    }
  }
  
  console.log(`Queue processing completed. Success: ${successCount}, Failed: ${failCount}, Remaining: ${offlineOperationsQueue.length}`);
  
  // Save queue state to AsyncStorage for persistence across app restarts
  try {
    // Skip AsyncStorage on web platform
    if (Platform.OS !== 'web') {
      await safeSetItem('offline_queue', JSON.stringify(offlineOperationsQueue));
    }
  } catch (error) {
    console.error('Error saving offline queue:', error);
  }
};

// Process an offline booking with error handling and retry mechanism
const processOfflineBooking = async (bookingData: any) => {
  if (!bookingData || !bookingData.reference) {
    console.error('Invalid booking data:', bookingData);
    return;
  }
  
  try {
    console.log(`Processing offline booking: ${bookingData.reference}`);
    
    // Check if the booking already exists in Firestore to prevent duplicates
    const existingBookings = await getDocs(
      query(collection(db, 'bookings'), where('reference', '==', bookingData.reference))
    );
    
    if (!existingBookings.empty) {
      console.log(`Booking ${bookingData.reference} already exists in Firestore, skipping upload`);
      await safeRemoveItem(`booking_${bookingData.reference}`);
      return;
    }
      // Try to save with timeout for better error handling
    const savePromise = new Promise<any>(async (resolve, reject) => {
      try {
        const docRef = await addDoc(collection(db, 'bookings'), bookingData);
        resolve(docRef);
      } catch (error) {
        reject(error);
      }
    });
    
    // Set timeout to prevent hanging
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error('Firestore operation timed out')), 10000);
    });
    
    const result = await Promise.race([savePromise, timeoutPromise]);
    console.log(`Offline booking ${bookingData.reference} synced successfully`);
    
    // Verify the booking was actually saved before removing from AsyncStorage
    const verifyPromise = new Promise(async (resolve, reject) => {
      try {
        // Double-check the booking exists in Firestore
        const verifyQuery = await getDocs(
          query(collection(db, 'bookings'), where('reference', '==', bookingData.reference))
        );
        
        if (!verifyQuery.empty) {
          await safeRemoveItem(`booking_${bookingData.reference}`);
          resolve(true);
        } else {
          // If verification fails, don't delete from AsyncStorage
          reject(new Error('Booking verification failed'));
        }
      } catch (error) {
        reject(error);
      }
    });
    
    // Use a separate timeout for verification
    const verifyTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Verification timed out')), 5000);
    });
    
    try {
      // Only attempt verification if we're online
      if (isConnected) {
        await Promise.race([verifyPromise, verifyTimeoutPromise]);
      }
    } catch (verifyError) {
      console.warn(`Couldn't verify booking ${bookingData.reference}:`, verifyError);
      // Keep the local copy if verification fails
    }
  } catch (error) {
    console.error(`Failed to sync offline booking ${bookingData.reference}:`, error);
    // Don't throw the error - this prevents the booking from being removed from the queue
    return false;
  }
  
  return true;
};

// Helper function to detect if we're running in Expo Go
export const isRunningInExpoGo = (): boolean => {
  try {
    // Several indicators that suggest we're in Expo Go:
    // 1. __DEV__ is true in Expo Go
    // 2. When using Expo Go, certain native modules behave differently
    return __DEV__ && !process.env.EXPO_PUBLIC_APP_ENV?.includes('production');
  } catch (e) {
    console.warn('Error checking Expo Go environment:', e);
    return false; 
  }
};

// Enhanced exports
export { app, auth, db };

// Helper functions
export const checkOnlineStatus = () => isConnected;

// More reliable connection check with timeout
export const checkConnectionWithTimeout = async (timeoutMs: number = 5000): Promise<boolean> => {
  return new Promise(async (resolve) => {
    // Set up timeout that will resolve with false
    const timeout = setTimeout(() => {
      console.log('Connection check timed out');
      resolve(false);
    }, timeoutMs);
    
    try {
      // Get current connection state
      const state = await NetInfo.fetch();
      
      // If we're definitely offline, no need to wait
      if (!state.isConnected) {
        clearTimeout(timeout);
        resolve(false);
        return;
      }
      
      // Try to actually make a network request to verify connectivity
      // This helps detect cases where the device thinks it's online but can't reach the server
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeoutMs - 500);
          // Use a lightweight fetch to Firebase or Google to check connectivity
        // Wrapped in try-catch to handle any unforeseen errors with the fetch operation
        const response = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=' + 
          firebaseConfig.apiKey, { 
            method: 'GET',
            signal: controller.signal
          });
        
        clearTimeout(id);
        clearTimeout(timeout);
        resolve(response.ok);
      } catch (error) {
        console.log('Fetch check failed:', error);
        clearTimeout(timeout);
        resolve(false);
      }
    } catch (error) {
      console.log('NetInfo fetch failed:', error);
      clearTimeout(timeout);
      resolve(false);
    }
  });
};

export const addToOfflineQueue = async (operation: {type: string; data: any}) => {
  offlineOperationsQueue.push(operation);
  console.log(`Operation added to offline queue. Queue size: ${offlineOperationsQueue.length}`);
  
  // Save updated queue to AsyncStorage for persistence
  try {
    await safeSetItem('offline_queue', JSON.stringify(offlineOperationsQueue));
    console.log('Offline queue saved to storage');
  } catch (error) {
    console.error('Error saving offline queue to storage:', error);
  }
};

// Explicitly export the syncOfflineData function with proper typing and better logging
export const syncOfflineData = async (): Promise<boolean> => {
  // First load any saved operations that might have been added while the app was closed
  try {
    const savedQueue = await safeGetItem('offline_queue');
    if (savedQueue) {
      const operations = JSON.parse(savedQueue);
      if (Array.isArray(operations)) {
        // Add any operations that aren't already in the queue
        for (const op of operations) {
          const exists = offlineOperationsQueue.some(
            existingOp => existingOp.type === op.type && 
            existingOp.data?.reference === op.data?.reference
          );
          
          if (!exists) {
            offlineOperationsQueue.push(op);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading saved offline operations:', error);
  }
  
  if (isConnected && offlineOperationsQueue.length > 0) {
    console.log(`Syncing ${offlineOperationsQueue.length} offline operations`);
    processOfflineQueue();
    return true;
  }
  
  return false;
};

// For backward compatibility with existing code
export const getFirebaseAuth = async () => auth;
export const getFirebaseFirestore = async () => db;

// In development mode on emulators, offline persistence can cause issues
// Only enable it for production or when not running in Expo Go
try {
  // For Expo Go compatibility, we need to be more careful with offline persistence
  // We'll disable offline persistence in development mode to be safe
  if (Platform.OS !== 'web' && !__DEV__ && !isRunningInExpoGo()) {
    // We're in production mode and not in Expo Go, safe to enable persistence
    enableIndexedDbPersistence(db)
      .then(() => console.log('Offline persistence enabled successfully for production'))
      .catch((err: any) => {
        console.warn('Error enabling offline persistence:', err.code, err.message);
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support all features required for Firestore offline persistence.');
        }
      });
  } else {
    console.log('Offline persistence disabled in development mode or Expo Go for better compatibility');
  }
} catch (err) {
  console.warn('Error setting up offline persistence:', err);
}