// @ts-nocheck
import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp, AccessibilityRole, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { scaleDownAnimation, scaleUpAnimation } from '../../utils/animations';

type ShadowLevel = 'sm' | 'md' | 'lg' | 'soft' | 'card' | 'none';
type CardVariant = 'default' | 'glass' | 'gradient' | 'outlined' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  padding?: keyof typeof theme.spacing;
  margin?: keyof typeof theme.spacing;
  borderRadius?: keyof typeof theme.borderRadius;
  shadow?: ShadowLevel;
  variant?: CardVariant;
  gradientColors?: readonly [string, string];
  glassIntensity?: 'default' | 'heavy' | 'light' | 'dark';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'xxl',
  margin,
  borderRadius = 'card',
  shadow = 'card',
  variant = 'default',
  gradientColors,
  glassIntensity = 'default',
  onPress,
  style,
  contentStyle,
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

  const getContainerStyle = (): StyleProp<ViewStyle> => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius[borderRadius],
      overflow: 'hidden', // Essential for BlurView and Gradient to respect border radius
      ...(margin && { margin: theme.spacing[margin] }),
    };

    // Shadow handling
    if (shadow !== 'none' && variant !== 'glass') {
      Object.assign(baseStyle, theme.shadows[shadow]);
    }

    // Variant specific base styles
    switch (variant) {
      case 'default':
      case 'elevated':
        baseStyle.backgroundColor = theme.colors.surface;
        break;
      case 'outlined':
        baseStyle.backgroundColor = theme.colors.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = theme.colors.border;
        break;
      case 'glass':
        // Background handled by BlurView
        baseStyle.backgroundColor = 'transparent';
        if (shadow !== 'none') {
          // Subtle shadow for glass
          baseStyle.shadowColor = '#000';
          baseStyle.shadowOffset = { width: 0, height: 4 };
          baseStyle.shadowOpacity = 0.1;
          baseStyle.shadowRadius = 12;
          baseStyle.elevation = 2;
        }
        break;
      case 'gradient':
        // Background handled by LinearGradient
        baseStyle.backgroundColor = 'transparent';
        break;
    }

    return [baseStyle, style];
  };

  const getContentStyle = (): ViewStyle => {
    return {
      padding: theme.spacing[padding],
      ...contentStyle,
    };
  };

  const renderContent = () => {
    const content = <View style={getContentStyle()}>{children}</View>;

    if (variant === 'glass') {
      const glassPreset = theme.glass[glassIntensity];
      return (
        <BlurView
          intensity={Platform.OS === 'ios' ? glassPreset.intensity : 100} // Android needs higher intensity or different handling
          tint={glassPreset.tint}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: glassPreset.style.backgroundColor,
              borderColor: glassPreset.style.borderColor,
              borderWidth: glassPreset.style.borderWidth,
              borderRadius: theme.borderRadius[borderRadius],
            }
          ]}
        >
          {content}
        </BlurView>
      );
    }

    if (variant === 'gradient') {
      return (
        <LinearGradient
          colors={gradientColors || theme.gradients.surface}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          {content}
        </LinearGradient>
      );
    }

    return content;
  };

  const Container = onPress ? TouchableOpacity : View;
  const AnimatedContainer = onPress ? Animated.View : View;

  return (
    <AnimatedContainer style={onPress ? { transform: [{ scale: scaleValue }] } : {}}>
      <Container
        style={getContainerStyle()}
        onPress={onPress}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        activeOpacity={onPress ? 0.9 : 1}
        accessible={!!accessibilityLabel || !!onPress}
        accessibilityRole={accessibilityRole || (onPress ? 'button' : undefined)}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {renderContent()}
      </Container>
    </AnimatedContainer>
  );
};
