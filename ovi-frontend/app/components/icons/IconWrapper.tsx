import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';

export type IconSize = 'small' | 'medium' | 'large';
export type IconContext = 'card' | 'badge' | 'button';

interface IconWrapperProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: IconSize;
  context?: IconContext;
  backgroundColor?: string;
  iconColor?: string;
  containerStyle?: ViewStyle;
  shape?: 'circular' | 'rounded-square';
}

// Icon size mappings (actual icon size)
const ICON_SIZES: Record<IconSize, number> = {
  small: 16,
  medium: 22,
  large: 32,
};

// Padding based on context
const CONTEXT_PADDING: Record<IconContext, number> = {
  card: 14,    // 12-16px for card icons
  badge: 8,    // 6-8px for badges
  button: 12,  // 10-12px for buttons
};

export const IconWrapper: React.FC<IconWrapperProps> = ({
  name,
  size = 'medium',
  context = 'card',
  backgroundColor = theme.colors.primaryLight, // Default to pale rose
  iconColor = theme.colors.text.primary,
  containerStyle,
  shape = 'circular',
}) => {
  const iconSize = ICON_SIZES[size];
  const padding = CONTEXT_PADDING[context];
  const containerSize = iconSize + (padding * 2);

  const containerStyles: ViewStyle[] = [
    styles.container,
    {
      width: containerSize,
      height: containerSize,
      backgroundColor,
      borderRadius: shape === 'circular' ? containerSize / 2 : theme.borderRadius.lg,
    },
    containerStyle,
  ];

  return (
    <View style={containerStyles}>
      <MaterialCommunityIcons
        name={name}
        size={iconSize}
        color={iconColor}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
