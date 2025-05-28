// Theme color hook - automatically picks the right colors for light/dark mode
// When user switches between light and dark theme, this gives the right colors

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * useThemeColor Hook
 * 
 * Returns the appropriate color value based on the current theme (light/dark).
 * Provides override capability for component-specific color customization.
 * 
 * @param props - Object containing optional light and dark color overrides
 * @param props.light - Custom color to use in light theme
 * @param props.dark - Custom color to use in dark theme
 * @param colorName - The name of the color from the Colors constant (e.g., 'text', 'background', 'tint')
 * @returns The appropriate color string for the current theme
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Get current theme (light/dark) from system or user preference
  const theme = useColorScheme() ?? 'light';
  
  // Check if component provided a custom color for current theme
  const colorFromProps = props[theme];

  // Priority: component override > default theme color
  if (colorFromProps) {
    return colorFromProps;  // Use component-specific override
  } else {
    return Colors[theme][colorName];  // Use default theme color
  }
}
