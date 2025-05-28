/**
 * THEMED VIEW COMPONENT - Aqua 360°
 * =================================
 * 
 * A wrapper around React Native's View component that provides a consistent
 * interface for containers throughout the app. While currently a simple wrapper,
 * this component provides extensibility for future theme-aware styling.
 * 
 * FEATURES:
 * ✅ Full React Native View component compatibility
 * ✅ TypeScript support with proper prop typing
 * ✅ Extensible design for future theme integration
 * ✅ Consistent container interface across the app
 * 
 * DESIGN PATTERN:
 * This follows the "wrapper component" pattern, allowing us to add theme-aware
 * background colors, borders, and other styling in the future without changing
 * the API across the entire app.
 * 
 * USAGE:
 * - <ThemedView>Content goes here</ThemedView>
 * - <ThemedView style={styles.container}>Styled container</ThemedView>
 */

import React from 'react';
import { View, type ViewProps } from 'react-native';

// Interface extending React Native's ViewProps for future extensibility
export interface ThemedViewProps extends ViewProps {
  // Additional props specific to ThemedView can be added here
  // Example: lightBackgroundColor?: string;
  //          darkBackgroundColor?: string;
}

/**
 * ThemedView Component
 * 
 * A wrapper component that provides a consistent container interface.
 * Currently acts as a pass-through to React Native's View, but designed
 * for future extensibility with theme-aware styling.
 * 
 * @param children - React children to render inside the view
 * @param style - React Native style prop
 * @param props - All other React Native View props
 */
export function ThemedView({ children, style, ...props }: ThemedViewProps) {
  // Future enhancement: Add theme-aware background colors here
  // const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return (
    <View style={[style]} {...props}>
      {children}
    </View>
  );
}
