// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
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
import { theme } from '../../theme';
import { ANIMATION_CONFIG } from '../../utils/animations';
import { CameraOptionsModal } from '../modals/CameraOptionsModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;
const HORIZONTAL_MARGIN = 20;
const BOTTOM_MARGIN = 20;

interface TabIconProps {
  name: string;
  label: string;
  focused: boolean;
  badgeCount?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, label, focused, badgeCount }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(focused ? 1 : 0.62)).current;
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
        toValue: focused ? 1 : 0.62,
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
      <MaterialCommunityIcons
        name={name as any}
        size={22}
        color={focused ? theme.colors.primary : theme.colors.text.secondary}
      />
      <RNText style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
        {label}
      </RNText>
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
  const [showCameraOptions, setShowCameraOptions] = useState(false);

  const handleTabPress = (route: any, index: number, isFocused: boolean) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Bounce animation
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -3,
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

    // Show camera options modal
    setShowCameraOptions(true);
  };

  const handleScanBarcode = () => {
    setShowCameraOptions(false);

    // Navigate to BarcodeScanner
    try {
      navigation.navigate('FoodLogging' as never, {
        screen: 'BarcodeScanner',
      } as never);
    } catch (error) {
      console.error('Error navigating to BarcodeScanner:', error);
    }
  };

  const handleAIEstimation = () => {
    setShowCameraOptions(false);

    // Navigate to AI Photo screen
    try {
      navigation.navigate('FoodLogging' as never, {
        screen: 'AIPhotoAnalysis',
      } as never);
    } catch (error) {
      console.error('Error navigating to AIPhotoAnalysis:', error);
    }
  };

  const getIconName = (routeName: string): string => {
    const iconMap: Record<string, string> = {
      Dashboard: 'home-variant',
      FoodLogging: 'silverware-fork-knife',
      Journal: 'notebook-heart',
      Baby: 'baby-carriage',
      Profile: 'account',
    };
    return iconMap[routeName] || 'help-circle';
  };

  const getTabLabel = (routeName: string): string => {
    const labelMap: Record<string, string> = {
      Dashboard: 'Home',
      FoodLogging: 'Food',
      Journal: 'Journal',
      Baby: 'Baby',
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
          const tabLabel = getTabLabel(route.name);
          const badgeCount = badgeCounts[route.name];

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onPress={() => handleTabPress(route, index, isFocused)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <TabIcon name={iconName} label={tabLabel} focused={isFocused} badgeCount={badgeCount} />
            </TouchableOpacity>
          );
        })}

        {/* Center Camera Button */}
        <View style={styles.cameraButtonWrapper}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Scan food with camera"
            onPress={handleCameraPress}
            style={styles.cameraButtonContainer}
            activeOpacity={0.9}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Animated.View
              style={[
                styles.cameraButton,
                {
                  transform: [{ scale: cameraScaleAnim }],
                },
              ]}
            >
              <View style={styles.cameraGradient}>
                <MaterialCommunityIcons name="camera-plus" size={26} color="#FFF" />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Right tabs */}
        {rightRoutes.map((route, index) => {
          const actualIndex = index + 2;
          const isFocused = state.index === actualIndex;
          const iconName = getIconName(route.name);
          const tabLabel = getTabLabel(route.name);
          const badgeCount = badgeCounts[route.name];

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onPress={() => handleTabPress(route, actualIndex, isFocused)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <TabIcon name={iconName} label={tabLabel} focused={isFocused} badgeCount={badgeCount} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Camera Options Modal */}
      <CameraOptionsModal
        visible={showCameraOptions}
        onClose={() => setShowCameraOptions(false)}
        onScanBarcode={handleScanBarcode}
        onAIEstimation={handleAIEstimation}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: BOTTOM_MARGIN,
    left: HORIZONTAL_MARGIN - 4,
    right: HORIZONTAL_MARGIN - 4,
    height: TAB_BAR_HEIGHT,
    borderRadius: 35,
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 35,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  androidTabBar: {
    backgroundColor: '#FFFFFF',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    paddingVertical: 4,
    gap: 3,
  },
  tabLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#9C8E80',
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    color: '#B84C3F',
    fontFamily: theme.typography.fontFamily.semibold,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  cameraButtonWrapper: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cameraButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    marginTop: -30, // Float above
  },
  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  cameraGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: '#2B221B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F6F1EA',
  },
});
