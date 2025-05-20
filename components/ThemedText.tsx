import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'body' | 'bodyBold' | 'heading1' | 'heading2' | 'heading3' | 'caption' | 'link' | 'button';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'body',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const tintColor = useThemeColor({}, 'tint');

  // If a color is provided in the style prop, use it. Otherwise, use the theme color.
  // Flatten the style prop to check for color.
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
    fontFamily: 'System', // Consider using a custom font like Inter or SF Pro
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
