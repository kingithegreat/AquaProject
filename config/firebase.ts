// Add global polyfills for URL and crypto
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  enableIndexedDbPersistence,
  writeBatch,
  doc,
  setDoc
} from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhrik544tBzrcVBgeQU3GMuNaDDB6Bxmw",
  authDomain: "year2project-fa35b.firebaseapp.com",
  projectId: "year2project-fa35b",
  storageBucket: "year2project-fa35b",
  messagingSenderId: "651046894087",
  appId: "1:651046894087:web:da388903018665a45108a2",
  measurementId: "G-SPM59SGPKE"
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw new Error("Firebase could not be initialized");
}

// Initialize Auth with persistent storage for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with simpler configuration for Expo Go
const db = getFirestore(app);

// Set up network monitoring
let isConnected = true;
let networkMonitoringSetup = false;
let offlineOperationsQueue = [];

// Maximum number of operations to process in a single batch (per Firestore batch limits)
const BATCH_SIZE = 200;
// Maximum retry attempts
const MAX_RETRY_ATTEMPTS = 5;

// Set up network monitoring
const setupNetworkMonitoring = () => {
  if (networkMonitoringSetup) return;
  
  try {
    NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      isConnected = !!state.isConnected;
      console.log('Connection status:', isConnected ? 'online' : 'offline');
      
      // If transitioning from offline to online, process queue
      if (!wasConnected && isConnected && offlineOperationsQueue.length > 0) {
        console.log(`Network reconnected. Processing ${offlineOperationsQueue.length} queued operations.`);
        // Add a small delay to ensure the connection is stable
        setTimeout(() => {
          processOfflineQueue();
        }, 2000);
      }
    });
    
    networkMonitoringSetup = true;
  } catch (error) {
    console.warn('Error setting up network monitoring:', error);
  }
};

// Set up network monitoring immediately
setupNetworkMonitoring();

// Process the offline queue with batched writes and retry logic
const processOfflineQueue = async (retryAttempt = 0) => {
  if (offlineOperationsQueue.length === 0) return;

  console.log(`Processing ${offlineOperationsQueue.length} offline operations, attempt #${retryAttempt + 1}`);
  
  // Create a copy of the queue for processing
  const operations = [...offlineOperationsQueue];
  
  // Process operations in batches to maximize efficiency
  const batches = [];
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    batches.push(operations.slice(i, i + BATCH_SIZE));
  }
  
  let successfulOps = [];
  
  try {
    for (const batch of batches) {
      // Group operations by type
      const bookingOperations = batch.filter(op => op.type === 'booking');
      
      if (bookingOperations.length > 0) {
        const result = await processBookingBatch(bookingOperations);
        successfulOps = [...successfulOps, ...result];
      }
      
      // Add handling for other operation types as needed
    }
    
    // Remove successful operations from the queue
    offlineOperationsQueue = offlineOperationsQueue.filter(
      op => !successfulOps.some(successOp => 
        successOp.type === op.type && 
        (op.type === 'booking' ? successOp.data.reference === op.data.reference : false)
      )
    );
    
    console.log(`Queue processing completed. ${offlineOperationsQueue.length} items remaining.`);
    
    // If there are still items in the queue, schedule another attempt with exponential backoff
    if (offlineOperationsQueue.length > 0 && retryAttempt < MAX_RETRY_ATTEMPTS) {
      const backoffTime = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
      console.log(`Scheduling retry #${retryAttempt + 2} in ${backoffTime}ms`);
      setTimeout(() => processOfflineQueue(retryAttempt + 1), backoffTime);
    }
  } catch (error) {
    console.error('Error processing offline queue:', error);
    
    // Implement exponential backoff for retries
    if (retryAttempt < MAX_RETRY_ATTEMPTS) {
      const backoffTime = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
      console.log(`Error occurred. Retrying in ${backoffTime}ms`);
      setTimeout(() => processOfflineQueue(retryAttempt + 1), backoffTime);
    } else {
      console.error(`Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Some operations may not have been processed.`);
    }
  }
};

// Process bookings in batches when possible
const processBookingBatch = async (bookingOperations) => {
  const successfulOps = [];
  
  try {
    // First check which bookings already exist to avoid duplicates
    const referencesToCheck = bookingOperations.map(op => op.data.reference);
    const existingBookingsQuery = query(
      collection(db, 'bookings'), 
      where('reference', 'in', referencesToCheck)
    );
    
    let existingReferences = [];
    try {
      const existingBookingsSnapshot = await getDocs(existingBookingsQuery);
      existingReferences = existingBookingsSnapshot.docs.map(doc => doc.data().reference);
      console.log(`Found ${existingReferences.length} bookings already in Firestore`);
    } catch (error) {
      // If the "in" query fails (e.g., too many items), fall back to individual checks
      console.warn('Batch existence check failed, falling back to individual checks:', error);
    }

    // Process in smaller batches to avoid limitations
    for (let i = 0; i < bookingOperations.length; i += 20) {
      const currentBatch = bookingOperations.slice(i, i + 20);
      const batch = writeBatch(db);
      let batchOperations = [];

      for (const op of currentBatch) {
        // Skip if already in Firestore
        if (existingReferences.includes(op.data.reference)) {
          console.log(`Booking ${op.data.reference} already exists, skipping`);
          successfulOps.push(op);
          // Clean up AsyncStorage
          await AsyncStorage.removeItem(`booking_${op.data.reference}`);
          continue;
        }
        
        const docRef = doc(collection(db, 'bookings'));
        batch.set(docRef, {
          ...op.data,
          firestoreId: docRef.id, // Add the document ID to the data
        });
        
        batchOperations.push(op);
      }
      
      // Only commit if there are operations to perform
      if (batchOperations.length > 0) {
        try {
          await batch.commit();
          console.log(`Batch of ${batchOperations.length} bookings committed successfully`);
          
          // After successful batch commit, clean up AsyncStorage
          for (const op of batchOperations) {
            await AsyncStorage.removeItem(`booking_${op.data.reference}`);
            successfulOps.push(op);
          }
        } catch (error) {
          console.error(`Error committing batch of ${batchOperations.length} bookings:`, error);
          // Individual operations will remain in the queue for retry
        }
      }
    }
  } catch (error) {
    console.error('Error in batch processing:', error);
  }
  
  return successfulOps;
};

// Enhanced exports
export { app, auth, db };

// Helper functions
export const checkOnlineStatus = () => isConnected;

export const addToOfflineQueue = (operation) => {
  offlineOperationsQueue.push(operation);
  console.log(`Operation added to offline queue. Queue size: ${offlineOperationsQueue.length}`);
};

// Execute a Firestore operation with timeout and fallback
export const checkConnectionWithTimeout = async (timeoutMs = 5000) => {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection check timed out')), timeoutMs);
    });
    
    // Try a simple document read as a connection test
    const testPromise = getDocs(query(collection(db, 'system_status'), where('online', '==', true)))
      .then(() => true)
      .catch(() => false);
    
    return await Promise.race([testPromise, timeoutPromise]);
  } catch (error) {
    console.warn('Connection check failed:', error);
    return false;
  }
};

// Explicitly export the syncOfflineData function
export const syncOfflineData = () => {
  if (isConnected && offlineOperationsQueue.length > 0) {
    processOfflineQueue();
    return true;
  }
  return false;
};

// For backward compatibility with existing code
export const getFirebaseAuth = async () => auth;
export const getFirebaseFirestore = async () => db;

// Try to enable offline persistence for better offline support
try {
  // Enable offline persistence with Firestore
  if (Platform.OS !== 'web') {
    enableIndexedDbPersistence(db)
      .then(() => console.log('Offline persistence enabled successfully'))
      .catch((err) => {
        console.warn('Error enabling offline persistence:', err.code, err.message);
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support all features required for Firestore offline persistence.');
        }
      });
  }
} catch (err) {
  console.warn('Error setting up offline persistence:', err);
}