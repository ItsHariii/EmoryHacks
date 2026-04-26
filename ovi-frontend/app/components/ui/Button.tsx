// @ts-nocheck
import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { scaleDownAnimation, scaleUpAnimation } from '../../utils/animations';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (loading || disabled) return;
    scaleDownAnimation(scaleValue).start();
  };

  const handlePressOut = () => {
    if (loading || disabled) return;
    scaleUpAnimation(scaleValue).start();
  };

  const handlePress = async () => {
    if (loading || disabled) return;

    // Trigger haptic feedback if available
    try {
      const Haptics = await import('expo-haptics');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available
    }

    onPress();
  };

  const getGradientColors = () => {
    if (disabled) return [theme.colors.surface, theme.colors.surface]; // Handled by opacity
    switch (variant) {
      case 'primary':
        return theme.gradients.primary;
      case 'secondary':
        return theme.gradients.secondary;
      case 'danger':
        return [theme.colors.error, theme.colors.primaryDark];
      default:
        return undefined;
    }
  };

  const gradientColors = getGradientColors();
  const isGradient = !!gradientColors && variant !== 'outline' && variant !== 'ghost';

  const containerStyles = [
    styles.container,
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const content = (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? theme.colors.primary : theme.colors.text.inverse}
          size="small"
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[
            styles.text,
            styles[`${size}Text`],
            styles[`${variant}Text`],
            disabled && styles.disabledText,
            textStyle
          ]}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  const hitSlop = size === 'sm' ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined;

  return (
    <Animated.View style={[containerStyles, { transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        hitSlop={hitSlop}
        style={styles.touchable}
      >
        {isGradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, styles[size]]}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[
            styles.solid,
            styles[size],
            styles[`${variant}Solid`]
          ]}>
            {content}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...theme.shadows.sm,
  },
  touchable: {
    borderRadius: theme.borderRadius.full,
  },
  gradient: {
    borderRadius: theme.borderRadius.full,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: {
    borderRadius: theme.borderRadius.full,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  // Sizes — sm uses hitSlop to meet 44px touch target without inflating visual size
  sm: {
    height: 36,
    paddingHorizontal: theme.spacing.md,
  },
  md: {
    height: 48,
    paddingHorizontal: theme.spacing.xl,
  },
  lg: {
    height: Math.max(56, theme.layout.minTouchTarget),
    paddingHorizontal: theme.spacing.xxl,
  },
  // Variants (Solid/Outline)
  outlineSolid: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghostSolid: {
    backgroundColor: 'transparent',
  },
  primarySolid: {
    // Fallback if gradient fails or for specific cases
    backgroundColor: theme.colors.primary,
  },
  secondarySolid: {
    backgroundColor: theme.colors.secondary,
  },
  dangerSolid: {
    backgroundColor: theme.colors.error,
  },
  // Text Styles
  text: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  smText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mdText: {
    fontSize: theme.typography.fontSize.md,
  },
  lgText: {
    fontSize: theme.typography.fontSize.lg,
  },
  primaryText: {
    color: theme.colors.text.inverse,
  },
  secondaryText: {
    color: theme.colors.text.inverse,
  },
  dangerText: {
    color: theme.colors.text.inverse,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.primary,
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledText: {
    color: theme.colors.text.muted,
  },
});
