// Add global polyfills for URL and crypto
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
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

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistent storage for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with settings for offline persistence
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// Enable offline data persistence
try {
  // This will enable the app to work offline and sync when back online
  console.log('Enabling Firestore offline persistence...');
  
  if (Platform.OS === 'web') {
    // Web platforms can use multi-tab persistence
    enableMultiTabIndexedDbPersistence(db)
      .then(() => {
        console.log('Multi-tab IndexedDB persistence enabled');
      })
      .catch((error) => {
        console.warn('Error enabling multi-tab persistence:', error);
        console.log('Falling back to memory-only persistence');
      });
  } else {
    // Mobile devices use single-instance persistence
    enableIndexedDbPersistence(db)
      .then(() => {
        console.log('IndexedDB persistence enabled');
      })
      .catch((error) => {
        if (error.code === 'failed-precondition') {
          console.warn(
            'Firestore persistence failed to initialize. ' +
            'Multiple tabs open, persistence can only be enabled in one tab at a time.'
          );
        } else if (error.code === 'unimplemented') {
          console.warn(
            'The current browser/environment does not support offline persistence.'
          );
        } else {
          console.error('Error enabling persistence:', error);
        }
      });
  }
} catch (error) {
  console.warn('Could not enable persistence:', error);
}

// Export the initialized services
export { app, auth, db };

// For backward compatibility with existing code
export const getFirebaseAuth = async () => auth;
export const getFirebaseFirestore = async () => db;