import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// LinearGradient removed to avoid native module issues
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { IconBadge } from './icons/IconBadge';
import { FEATURE_ICONS } from './icons/iconConstants';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  avatarInitials?: string;
  notificationCount?: number;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
  leftAction?: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
    accessibilityLabel: string;
  };
  rightActions?: Array<{
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
    accessibilityLabel: string;
  }>;
  scrollY?: Animated.Value;
  style?: ViewStyle;
  // Search bar props
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  showAvatar = false,
  avatarInitials,
  notificationCount = 0,
  onAvatarPress,
  onNotificationPress,
  leftAction,
  rightActions = [],
  scrollY,
  style,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  onSearchFocus,
  onSearchBlur,
}) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: theme.animations.duration.normal,
      useNativeDriver: true,
    }).start();
  }, []);

  // Calculate header height based on scroll position
  const headerHeight = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [subtitle ? 120 : 100, subtitle ? 90 : 70],
        extrapolate: 'clamp',
      })
    : subtitle ? 120 : 100;

  // Calculate title scale based on scroll (instead of fontSize for native driver support)
  const titleScale = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.79], // 22/28 ≈ 0.79
        extrapolate: 'clamp',
      })
    : 1;

  // Calculate subtitle opacity based on scroll
  const subtitleOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : 1;

  const containerStyle: Animated.AnimatedProps<ViewStyle> = {
    paddingTop: insets.top,
    opacity: fadeAnim,
  };

  return (
    <Animated.View style={[styles.container, containerStyle, style]}>
      <View style={[StyleSheet.absoluteFill, styles.background]} />
      
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {leftAction && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                leftAction.onPress();
              }}
              style={styles.actionButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={leftAction.accessibilityLabel}
            >
              <MaterialCommunityIcons
                name={leftAction.icon}
                size={24}
                color={theme.colors.text.inverse}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Section - Title or Search */}
        <View style={styles.centerSection}>
          {showSearch ? (
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons
                name={FEATURE_ICONS.search}
                size={20}
                color={theme.colors.text.inverse}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                value={searchValue}
                onChangeText={onSearchChange}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                placeholder={searchPlaceholder}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                returnKeyType="search"
                autoCorrect={false}
                accessible={true}
                accessibilityLabel="Search input"
              />
              {searchValue.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSearchChange?.('');
                  }}
                  style={styles.clearSearchButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <MaterialCommunityIcons
                    name={FEATURE_ICONS.close}
                    size={18}
                    color={theme.colors.text.inverse}
                  />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <Animated.Text
                style={[
                  styles.title,
                  scrollY && {
                    transform: [{ scale: titleScale }],
                  },
                ]}
                numberOfLines={1}
              >
                {title}
              </Animated.Text>
              {subtitle && (
                <Animated.Text
                  style={[
                    styles.subtitle,
                    scrollY && { opacity: subtitleOpacity },
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Animated.Text>
              )}
            </>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {/* Custom Right Actions */}
          {rightActions.map((action, index) => (
            <IconBadge
              key={index}
              name={action.icon}
              size="small"
              backgroundColor="transparent"
              iconColor={theme.colors.text.inverse}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                action.onPress();
              }}
              accessibilityLabel={action.accessibilityLabel}
              containerStyle={styles.rightActionButton}
            />
          ))}

          {/* Notification Bell */}
          {onNotificationPress && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onNotificationPress();
              }}
              style={styles.notificationButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
            >
              <MaterialCommunityIcons
                name={FEATURE_ICONS.notification}
                size={24}
                color={theme.colors.text.inverse}
              />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* User Avatar */}
          {showAvatar && onAvatarPress && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onAvatarPress();
              }}
              style={styles.avatarButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View profile"
            >
              <View style={styles.avatar}>
                {avatarInitials ? (
                  <Text style={styles.avatarText}>{avatarInitials}</Text>
                ) : (
                  <MaterialCommunityIcons
                    name={FEATURE_ICONS.profile}
                    size={20}
                    color={theme.colors.text.primary}
                  />
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...theme.shadows.md,
    zIndex: 1000,
  },
  background: {
    backgroundColor: theme.colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    minHeight: 60,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 44,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: 44,
  },
  actionButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.inverse,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  rightActionButton: {
    width: 44,
    height: 44,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
  avatarButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accentLight,
  },
  avatarText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.inverse,
    padding: 0,
  },
  clearSearchButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
});
