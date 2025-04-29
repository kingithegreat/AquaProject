import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps } from 'firebase/app';

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

// Initialize Firebase
let app;
let auth;

// Check if Firebase has been initialized
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  
  // Set up authentication with AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}

// Initialize Firestore
export const db = getFirestore(app);
export { auth };
export default app;