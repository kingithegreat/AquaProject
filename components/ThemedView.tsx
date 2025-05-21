import React from 'react';
import { View, type ViewProps } from 'react-native';

export interface ThemedViewProps extends ViewProps {
  // Add any additional props specific to ThemedView
}

export function ThemedView({ children, style, ...props }: ThemedViewProps) {
  // Make sure children doesn't contain any direct text strings
  // This should be handled by the parent component

  return (
    <View style={[style]} {...props}>
      {children}
    </View>
  );
}
