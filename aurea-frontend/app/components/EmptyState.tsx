import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';
import { IconBadge } from './icons/IconBadge';
import { Button } from './Button';
import { ANIMATION_CONFIG, createFadeInSlideUpAnimation } from '../utils/animations';
import { IconName } from './icons/iconConstants';

interface EmptyStateProps {
  icon: IconName;
  headline: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

/**
 * EmptyState Component
 * 
 * A reusable empty state component with supportive messaging and optional action button.
 * Features:
 * - Large icon in soft circular container
 * - Friendly headline and descriptive text
 * - Optional primary action button
 * - Fade-in and slide-up entrance animation
 * - Encouraging, warm language
 * 
 * Usage:
 * <EmptyState
 *   icon="food-apple-outline"
 *   headline="No meals logged today"
 *   description="Ready to add your first meal? Track your nutrition to see your progress."
 *   actionLabel="Log Your First Meal"
 *   onAction={() => navigation.navigate('FoodLogging')}
 * />
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  headline,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;

  useEffect(() => {
    // Animate entrance with fade-in and slide-up
    createFadeInSlideUpAnimation(
      opacity,
      translateY,
      ANIMATION_CONFIG.normal,
      100 // Small delay for better visual effect
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {/* Icon in soft circular container (large size) */}
      <View style={styles.iconContainer}>
        <IconBadge
          name={icon}
          size="large"
          backgroundColor={theme.colors.primaryLight}
          iconColor={theme.colors.primary}
          shape="circular"
        />
      </View>

      {/* Friendly headline */}
      <Text style={styles.headline}>{headline}</Text>

      {/* Descriptive text */}
      <Text style={styles.description}>{description}</Text>

      {/* Optional action button */}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            accessibilityLabel={actionLabel}
            accessibilityHint={`Tap to ${actionLabel.toLowerCase()}`}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
  },
  iconContainer: {
    marginBottom: theme.spacing.lg,
  },
  headline: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    lineHeight: theme.typography.fontSize.xl * theme.typography.lineHeight.tight,
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.xl,
    maxWidth: 320,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 280,
  },
});
