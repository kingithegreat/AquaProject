/**
 * Modern color system with extended palette while maintaining original theme colors.
 * The palette includes primary colors, semantic colors, and specific UI element colors.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Extended color palette
const palette = {
  // Primary brand colors
  primary: {
    main: '#0a7ea4',
    light: '#52D6E2',
    dark: '#086a8a',
    contrast: '#ffffff',
  },
  // Secondary colors
  secondary: {
    main: '#21655a',
    light: '#1d9a96',
    dark: '#19504a',
    contrast: '#ffffff',
  },
  // Neutral colors for text, backgrounds, etc
  neutral: {
    100: '#ffffff',
    200: '#f8f9fa',
    300: '#e9ecef',
    400: '#dee2e6',
    500: '#adb5bd',
    600: '#6c757d',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
  },
  // Semantic colors
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // New modern additions
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    outline: '#dee2e6',
    elevation: {
      level1: 'rgba(149, 157, 165, 0.1)',
      level2: 'rgba(149, 157, 165, 0.15)',
      level3: 'rgba(149, 157, 165, 0.2)',
    },
    // Glass effects
    glass: {
      background: 'rgba(255, 255, 255, 0.65)',
      border: 'rgba(255, 255, 255, 0.8)',
    },
    // Extended palette access
    palette,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // New modern additions
    surface: '#1e1e1e',
    surfaceVariant: '#2d2d2d',
    outline: '#444444',
    elevation: {
      level1: 'rgba(0, 0, 0, 0.1)',
      level2: 'rgba(0, 0, 0, 0.15)',
      level3: 'rgba(0, 0, 0, 0.2)',
    },
    // Glass effects
    glass: {
      background: 'rgba(30, 30, 30, 0.75)',
      border: 'rgba(70, 70, 70, 0.8)',
    },
    // Extended palette access
    palette,
  },
};
