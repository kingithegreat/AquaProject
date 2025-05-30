// Helper functions to safely use AsyncStorage with web platform support
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Web platform storage fallback using localStorage
const webStorage = {
  getItem: (key: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const value = localStorage.getItem(key);
      resolve(value);
    });
  },
  
  setItem: (key: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      localStorage.setItem(key, value);
      resolve();
    });
  },
  
  removeItem: (key: string): Promise<void> => {
    return new Promise((resolve) => {
      localStorage.removeItem(key);
      resolve();
    });
  },
  
  multiGet: async (keys: string[]): Promise<[string, string | null][]> => {
    return Promise.all(
      keys.map(async (key) => {
        const value = localStorage.getItem(key);
        return [key, value];
      })
    );
  }
};

// Safe AsyncStorage access functions that work across platforms
export const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      try {
        return await webStorage.getItem(key);
      } catch (webError) {
        console.warn('Web localStorage error:', webError);
        return null;
      }
    }
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`Error getting item ${key}:`, error);
    return null;
  }
};

export const safeSetItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      try {
        await webStorage.setItem(key, value);
      } catch (webError) {
        console.warn('Web localStorage error:', webError);
      }
      return;
    }
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn(`Error setting item ${key}:`, error);
  }
};

export const safeRemoveItem = async (key: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      try {
        await webStorage.removeItem(key);
      } catch (webError) {
        console.warn('Web localStorage error:', webError);
      }
      return;
    }
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn(`Error removing item ${key}:`, error);
  }
};

export const safeMultiGet = async (keys: string[]): Promise<[string, string | null][]> => {
  try {
    if (Platform.OS === 'web') {
      try {
        return await webStorage.multiGet(keys);
      } catch (webError) {
        console.warn('Web localStorage error:', webError);
        return keys.map(key => [key, null]);
      }
    }
    return await AsyncStorage.multiGet(keys);
  } catch (error) {
    console.warn('Error with multiGet:', error);
    return keys.map(key => [key, null]);
  }
};
