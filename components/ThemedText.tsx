/**
 * THEMED TEXT COMPONENT - Aqua 360°
 * =================================
 * 
 * A customizable text component that automatically adapts to light/dark themes
 * and provides predefined typography styles for consistent design across the app.
 * 
 * FEATURES:
 * ✅ Automatic theme color adaptation (light/dark mode support)
 * ✅ Predefined typography styles (heading1, heading2, body, caption, etc.)
 * ✅ Custom color override capability
 * ✅ Full React Native Text component compatibility
 * ✅ TypeScript support for type safety
 * 
 * USAGE EXAMPLES:
 * - <ThemedText>Default body text</ThemedText>
 * - <ThemedText type="heading1">Main Heading</ThemedText>
 * - <ThemedText lightColor="#000" darkColor="#fff">Custom themed text</ThemedText>
 * - <ThemedText style={{ color: '#red' }}>Override with custom color</ThemedText>
 */

import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

// Define the props interface for ThemedText component
// Extends React Native's TextProps with theme-specific properties
export type ThemedTextProps = TextProps & {
  lightColor?: string;    // Custom color for light theme
  darkColor?: string;     // Custom color for dark theme
  type?: 'body' | 'bodyBold' | 'heading1' | 'heading2' | 'heading3' | 'caption' | 'link' | 'button';
};

/**
 * ThemedText Component
 * 
 * Main text component that handles theme-aware styling and typography variants
 * 
 * @param style - React Native style prop (can be array or object)
 * @param lightColor - Override color for light theme
 * @param darkColor - Override color for dark theme  
 * @param type - Typography variant (body, heading1, heading2, etc.)
 * @param rest - All other React Native Text props
 */
export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'body',
  ...rest
}: ThemedTextProps) {
  // Get the appropriate color based on current theme (light/dark)
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // Smart color resolution: style prop color takes precedence over theme color
  // This allows for component-specific color overrides while maintaining theme support
  let finalColor = color;
  if (style) {
    const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style;
    if (flatStyle && flatStyle.color) {
      finalColor = flatStyle.color;
    }
  }

  return (
    <Text
      allowFontScaling={true}
      style={[
        { 
          color: finalColor as string, 
          textAlignVertical: 'center',
          // Add these properties to ensure proper text rendering across platforms
          includeFontPadding: true,
          padding: 0, 
          margin: 0
        },
        styles[type],
        style,
        // Remove the 'link' color override here so explicit color always wins
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    fontFamily: 'System', 
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: 0,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    letterSpacing: 0.15,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
    opacity: 0.7,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
