/**
 * AQUA 360° COLOR SYSTEM
 * ======================
 * 
 * A comprehensive color palette system that provides consistent theming
 * across the entire application. Supports both light and dark modes with
 * carefully chosen colors that reflect the aquatic/water sports theme.
 * 
 * DESIGN PHILOSOPHY:
 * ✅ Aquatic theme with blues and teals representing water
 * ✅ High contrast ratios for accessibility compliance
 * ✅ Semantic color naming for clear usage context
 * ✅ Scalable palette system for future design expansion
 * ✅ Platform-consistent color choices
 * 
 * COLOR PSYCHOLOGY:
 * - Blues: Trust, professionalism, water association
 * - Teals: Energy, refreshing, modern water sports feel
 * - Greens: Success, nature, environmental consciousness
 * 
 * USAGE EXAMPLES:
 * - Primary colors: Main brand elements, CTAs, navigation
 * - Secondary colors: Accents, hover states, secondary actions
 * - Neutral colors: Text, backgrounds, borders, cards
 * - Semantic colors: Success/error states, warnings, information
 */

/**
 * Modern color system with extended palette while maintaining original theme colors.
 * The palette includes primary colors, semantic colors, and specific UI element colors.
 */

// Define tint colors for light and dark themes
const tintColorLight = '#0a7ea4';  // Professional blue for light theme
const tintColorDark = '#fff';      // White for dark theme contrast

// Extended color palette organized by usage context
const palette = {
  // Primary brand colors - main Aqua 360° brand identity
  primary: {
    main: '#0a7ea4',      // Main brand blue - professional and trustworthy
    light: '#52D6E2',     // Light aqua - energetic and refreshing
    dark: '#086a8a',      // Dark blue - depth and stability
    contrast: '#ffffff',  // High contrast white for accessibility
  },
  // Secondary colors - complementary accents and highlights
  secondary: {
    main: '#21655a',      // Deep teal - sophisticated water theme
    light: '#1d9a96',     // Bright teal - dynamic and modern
    dark: '#19504a',      // Dark green-teal - natural and grounded
    contrast: '#ffffff',  // White text for readability
  },
  // Neutral colors for text, backgrounds, surfaces, and UI elements
  neutral: {
    100: '#ffffff',       // Pure white - cleanest backgrounds
    200: '#f8f9fa',       // Off-white - subtle contrast
    300: '#e9ecef',       // Light gray - gentle borders
    400: '#dee2e6',       // Medium-light gray - disabled states
    500: '#adb5bd',       // Medium gray - secondary text
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
