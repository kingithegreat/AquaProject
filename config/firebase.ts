// Add global polyfills for URL and crypto
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, addDoc, getDocs, query, where, enableIndexedDbPersistence } from 'firebase/firestore';
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
        processOfflineQueue();
      }
    });
    
    networkMonitoringSetup = true;
  } catch (error) {
    console.warn('Error setting up network monitoring:', error);
  }
};

// Set up network monitoring immediately
setupNetworkMonitoring();

// Process the offline queue
const processOfflineQueue = async () => {
  if (offlineOperationsQueue.length === 0) return;

  console.log(`Processing ${offlineOperationsQueue.length} offline operations`);
  
  // Create a copy and clear the original to avoid double-processing
  const operations = [...offlineOperationsQueue];
  offlineOperationsQueue = [];
  
  // Process operations in sequential order with delay to avoid errors
  for (const operation of operations) {
    try {
      // Wait between operations
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (operation.type === 'booking') {
        await processOfflineBooking(operation.data);
      }
    } catch (error) {
      console.error('Error processing operation:', error);
      // Re-add to queue for later retry
      offlineOperationsQueue.push(operation);
    }
  }
  
  console.log(`Queue processing completed. ${offlineOperationsQueue.length} items remaining.`);
};

// Process an offline booking with error handling
const processOfflineBooking = async (bookingData) => {
  try {
    // Check if the booking already exists in Firestore
    const existingBookings = await getDocs(
      query(collection(db, 'bookings'), where('reference', '==', bookingData.reference))
    );
    
    if (!existingBookings.empty) {
      console.log(`Booking ${bookingData.reference} already exists in Firestore`);
      // Only remove from AsyncStorage if we're certain it exists in Firestore
      await AsyncStorage.removeItem(`booking_${bookingData.reference}`);
      return;
    }
    
    // Try to save with timeout
    const savePromise = new Promise(async (resolve, reject) => {
      try {
        const docRef = await addDoc(collection(db, 'bookings'), bookingData);
        resolve(docRef);
      } catch (error) {
        reject(error);
      }
    });
    
    // Set timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
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
          // Only remove from AsyncStorage if verification succeeds
          await AsyncStorage.removeItem(`booking_${bookingData.reference}`);
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

// Enhanced exports
export { app, auth, db };

// Helper functions
export const checkOnlineStatus = () => isConnected;

export const addToOfflineQueue = (operation) => {
  offlineOperationsQueue.push(operation);
  console.log(`Operation added to offline queue. Queue size: ${offlineOperationsQueue.length}`);
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