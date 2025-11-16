import React, { useRef } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { IconSize } from './IconWrapper';

interface IconBadgeProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: IconSize;
  backgroundColor?: string;
  iconColor?: string;
  shape?: 'circular' | 'rounded-square';
  onPress?: () => void;
  withGradientRing?: boolean;
  containerStyle?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// Icon size mappings
const ICON_SIZES: Record<IconSize, number> = {
  small: 16,
  medium: 22,
  large: 32,
};

// Container size includes padding
const CONTAINER_SIZES: Record<IconSize, number> = {
  small: 32,   // 16 + 8*2
  medium: 46,  // 22 + 12*2
  large: 64,   // 32 + 16*2
};

export const IconBadge: React.FC<IconBadgeProps> = ({
  name,
  size = 'medium',
  backgroundColor = theme.colors.primaryLight,
  iconColor = theme.colors.text.primary,
  shape = 'circular',
  onPress,
  withGradientRing = false,
  containerStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const iconSize = ICON_SIZES[size];
  const containerSize = CONTAINER_SIZES[size];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  const borderRadius = shape === 'circular' ? containerSize / 2 : theme.borderRadius.lg;

  const iconContainerStyle: ViewStyle[] = [
    styles.iconContainer,
    {
      width: containerSize,
      height: containerSize,
      backgroundColor,
      borderRadius,
    },
    containerStyle,
  ];

  const gradientRingStyle: ViewStyle = {
    width: containerSize + 8,
    height: containerSize + 8,
    borderRadius: shape === 'circular' ? (containerSize + 8) / 2 : theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
    opacity: 0.3,
  };

  const content = (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {withGradientRing && (
        <View style={[styles.gradientRing, gradientRingStyle]} />
      )}
      <View style={iconContainerStyle}>
        <MaterialCommunityIcons
          name={name}
          size={iconSize}
          color={iconColor}
        />
      </View>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientRing: {
    position: 'absolute',
    top: -4,
    left: -4,
  },
});
