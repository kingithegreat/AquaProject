import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps } from 'firebase/app';
import { Platform } from 'react-native';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhrik544tBzrcVBgeQU3GMuNaDDB6Bxmw",
  authDomain: "year2project-fa35b.firebaseapp.com",
  projectId: "year2project-fa35b",
  storageBucket: "year2project-fa35b.appspot.com",
  messagingSenderId: "651046894087",
  appId: "1:651046894087:web:da388903018665a45108a2",
  measurementId: "G-SPM59SGPKE"
};

// Create a module-level variable to hold the initialization promise
let initializationPromise: Promise<void> | null = null;

// Lazy initialization function
const initializeFirebaseAsync = async () => {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise<void>((resolve) => {
    try {
      if (getApps().length === 0) {
        const app = initializeApp(firebaseConfig);
        
        // Different initialization for web vs native
        if (Platform.OS === 'web') {
          // Simple auth for web
          getAuth(app);
        } else {
          // Set up authentication with AsyncStorage persistence for native
          try {
            initializeAuth(app, {
              persistence: getReactNativePersistence(AsyncStorage)
            });
          } catch (error) {
            // Fallback in case persistence fails
            console.log('Auth persistence failed, using standard auth:', error);
            getAuth(app);
          }
        }
      }
      resolve();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      resolve(); // Resolve even if there's an error to prevent blocking
    }
  });

  return initializationPromise;
};

// Initialize Firebase when the module is imported
initializeFirebaseAsync().catch(error => {
  console.warn('Background Firebase initialization failed:', error);
});

// Export helper functions that ensure Firebase is initialized before use
export const getFirebaseApp = () => {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
};

export const getFirebaseAuth = async () => {
  await initializeFirebaseAsync();
  return getAuth(getFirebaseApp());
};

export const getFirebaseFirestore = async () => {
  await initializeFirebaseAsync();
  return getFirestore(getFirebaseApp());
};

// For backward compatibility, still export these variables,
// but they'll be initialized on first access
export const db = getFirestore(getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));
export const auth = getAuth(getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));
export default getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);