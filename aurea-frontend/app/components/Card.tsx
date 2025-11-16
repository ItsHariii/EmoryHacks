import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, AccessibilityRole, Animated } from 'react-native';
import { theme } from '../theme';
import { scaleDownAnimation, scaleUpAnimation } from '../utils/animations';

type ShadowLevel = 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  padding?: keyof typeof theme.spacing;
  margin?: keyof typeof theme.spacing;
  borderRadius?: keyof typeof theme.borderRadius;
  shadow?: ShadowLevel;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  margin,
  borderRadius = 'lg',
  shadow = 'md',
  onPress,
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (onPress) {
      scaleDownAnimation(scaleValue).start();
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scaleUpAnimation(scaleValue).start();
    }
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing[padding],
    borderRadius: theme.borderRadius[borderRadius],
    ...theme.shadows[shadow],
    ...(margin && { margin: theme.spacing[margin] }),
    ...style,
  };

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <TouchableOpacity
          style={cardStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          accessible={true}
          accessibilityRole={accessibilityRole || 'button'}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View
      style={cardStyle}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};
