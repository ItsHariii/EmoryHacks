import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
  Text as RNText,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { ANIMATION_CONFIG } from '../utils/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;
const HORIZONTAL_MARGIN = 16;
const BOTTOM_MARGIN = 16;

interface TabIconProps {
  name: string;
  focused: boolean;
  badgeCount?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, focused, badgeCount }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.6)).current;
  const badgeScaleAnim = useRef(new Animated.Value(badgeCount ? 1 : 0)).current;
  const badgeFadeAnim = useRef(new Animated.Value(badgeCount ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0.9,
        useNativeDriver: true,
        speed: ANIMATION_CONFIG.spring.speed,
        bounciness: ANIMATION_CONFIG.spring.bounciness,
      }),
      Animated.timing(opacityAnim, {
        toValue: focused ? 1 : 0.6,
        duration: ANIMATION_CONFIG.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  useEffect(() => {
    if (badgeCount && badgeCount > 0) {
      Animated.parallel([
        Animated.spring(badgeScaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: ANIMATION_CONFIG.spring.speed,
          bounciness: 12,
        }),
        Animated.timing(badgeFadeAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.normal,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(badgeScaleAnim, {
          toValue: 0,
          duration: ANIMATION_CONFIG.fast,
          useNativeDriver: true,
        }),
        Animated.timing(badgeFadeAnim, {
          toValue: 0,
          duration: ANIMATION_CONFIG.fast,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [badgeCount]);

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {focused && (
        <View style={styles.gradientRing}>
          <View style={styles.gradientRingInner} />
        </View>
      )}
      <MaterialCommunityIcons
        name={name as any}
        size={28}
        color={focused ? theme.colors.primary : theme.colors.text.muted}
      />
      {badgeCount && badgeCount > 0 && (
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [{ scale: badgeScaleAnim }],
              opacity: badgeFadeAnim,
            },
          ]}
        >
          <RNText style={styles.badgeText}>
            {badgeCount > 99 ? '99+' : badgeCount}
          </RNText>
        </Animated.View>
      )}
    </Animated.View>
  );
};

interface TabLabelProps {
  label: string;
  focused: boolean;
}

const TabLabel: React.FC<TabLabelProps> = ({ label, focused }) => {
  const fadeAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const translateYAnim = useRef(new Animated.Value(focused ? 0 : 5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: focused ? 1 : 0,
        duration: ANIMATION_CONFIG.normal,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: focused ? 0 : 5,
        duration: ANIMATION_CONFIG.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <Animated.View
      style={[
        styles.labelContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
      pointerEvents="none"
    >
      {focused && <RNText style={styles.label}>{label}</RNText>}
    </Animated.View>
  );
};

interface CustomTabBarProps extends BottomTabBarProps {
  badgeCounts?: Record<string, number>;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  badgeCounts = {},
}) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const cameraScaleAnim = useRef(new Animated.Value(1)).current;

  const handleTabPress = (route: any, index: number, isFocused: boolean) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 0,
        useNativeDriver: true,
        speed: ANIMATION_CONFIG.spring.speed,
        bounciness: ANIMATION_CONFIG.spring.bounciness,
      }),
    ]).start();

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleCameraPress = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Scale animation
    Animated.sequence([
      Animated.timing(cameraScaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(cameraScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: ANIMATION_CONFIG.spring.speed,
        bounciness: ANIMATION_CONFIG.spring.bounciness,
      }),
    ]).start();

    // Navigate to FoodLogging tab, then to BarcodeScanner screen
    navigation.navigate('FoodLogging' as never, {
      screen: 'BarcodeScanner',
    } as never);
  };

  const getIconName = (routeName: string): string => {
    const iconMap: Record<string, string> = {
      Dashboard: 'home-heart',
      FoodLogging: 'food-apple',
      Journal: 'book-open-variant',
      Profile: 'account-circle',
    };
    return iconMap[routeName] || 'help-circle';
  };

  const getLabel = (routeName: string): string => {
    const labelMap: Record<string, string> = {
      Dashboard: 'Home',
      FoodLogging: 'Food',
      Journal: 'Journal',
      Profile: 'Profile',
    };
    return labelMap[routeName] || routeName;
  };

  // Split routes into left and right for center camera button
  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: bounceAnim }],
        },
      ]}
    >
      <View style={[styles.tabBar, Platform.OS === 'android' && styles.androidTabBar]}>
        {/* Left tabs */}
        {leftRoutes.map((route, index) => {
          const isFocused = state.index === index;
          const iconName = getIconName(route.name);
          const label = getLabel(route.name);
          const badgeCount = badgeCounts[route.name];

          return Platform.OS === 'android' ? (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onPress={() => handleTabPress(route, index, isFocused)}
              style={styles.tab}
              android_ripple={{
                color: theme.colors.primaryLight,
                borderless: false,
                radius: 40,
              }}
            >
              <TabIcon name={iconName} focused={isFocused} badgeCount={badgeCount} />
            </Pressable>
          ) : (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onPress={() => handleTabPress(route, index, isFocused)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <TabIcon name={iconName} focused={isFocused} badgeCount={badgeCount} />
            </TouchableOpacity>
          );
        })}

        {/* Center Camera Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Scan food with camera"
          onPress={handleCameraPress}
          style={styles.cameraButtonContainer}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.cameraButton,
              {
                transform: [{ scale: cameraScaleAnim }],
              },
            ]}
          >
            <MaterialCommunityIcons name="camera" size={28} color={theme.colors.surface} />
          </Animated.View>
        </TouchableOpacity>

        {/* Right tabs */}
        {rightRoutes.map((route, index) => {
          const actualIndex = index + 2;
          const isFocused = state.index === actualIndex;
          const iconName = getIconName(route.name);
          const label = getLabel(route.name);
          const badgeCount = badgeCounts[route.name];

          return Platform.OS === 'android' ? (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onPress={() => handleTabPress(route, actualIndex, isFocused)}
              style={styles.tab}
              android_ripple={{
                color: theme.colors.primaryLight,
                borderless: false,
                radius: 40,
              }}
            >
              <TabIcon name={iconName} focused={isFocused} badgeCount={badgeCount} />
            </Pressable>
          ) : (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onPress={() => handleTabPress(route, actualIndex, isFocused)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <TabIcon name={iconName} focused={isFocused} badgeCount={badgeCount} />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: BOTTOM_MARGIN,
    left: HORIZONTAL_MARGIN,
    right: HORIZONTAL_MARGIN,
    height: TAB_BAR_HEIGHT,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white
  },
  androidTabBar: {
    backgroundColor: theme.colors.surface,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  gradientRing: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.primaryLight,
    opacity: 0.3,
  },
  gradientRingInner: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: theme.colors.accentLight,
    opacity: 0.5,
  },
  labelContainer: {
    marginTop: 2,
    height: 14,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    color: theme.colors.text.inverse,
    fontSize: 10,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  cameraButtonContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end', // Align to bottom
    width: 60,
    height: 60,
    marginTop: -15, // Elevate above tab bar
    paddingBottom: 5, // Push camera icon down slightly
  },
  cameraButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
});
