import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { Button } from './Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORAGE_KEY = 'last_seen_pregnancy_week';

interface WeekTransitionModalProps {
  visible: boolean;
  week: number;
  onDismiss: () => void;
}

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
  icon: string;
}

/**
 * Get developmental milestone for a specific week
 */
const getDevelopmentalMilestone = (week: number): string => {
  const milestones: { [key: number]: string } = {
    4: "Your baby's heart begins to beat! The neural tube is forming.",
    5: "Baby is the size of a sesame seed. Major organs are starting to develop.",
    6: "Baby's facial features are beginning to form, including eyes and ears.",
    7: "Baby's brain is growing rapidly. Arms and legs are developing.",
    8: "Baby is now the size of a raspberry. Fingers and toes are forming!",
    9: "Baby's heart has divided into four chambers. Tiny muscles are developing.",
    10: "Baby can now bend their elbows. Vital organs are functioning.",
    11: "Baby's bones are beginning to harden. Hair follicles are forming.",
    12: "Baby's reflexes are developing. They can open and close their fists!",
    13: "Welcome to the second trimester! Baby's vocal cords are forming.",
    14: "Baby can now squint, frown, and grimace. Kidneys are producing urine.",
    15: "Baby is the size of an apple. They're developing a sense of taste!",
    16: "Baby's nervous system is functioning. You might feel movements soon!",
    17: "Baby can hear sounds from outside the womb now.",
    18: "Baby is developing a sleep-wake cycle. Yawning has been observed!",
    19: "Baby's senses are developing rapidly. They can hear your voice!",
    20: "Halfway there! Baby is covered in protective vernix and lanugo.",
    21: "Baby can now distinguish between sweet and bitter tastes.",
    22: "Baby's eyebrows and eyelashes are visible. They look more like a newborn!",
    23: "Baby's lungs are developing rapidly, preparing for breathing.",
    24: "Baby's brain is growing quickly. They respond to sounds and touch.",
    25: "Baby's hair is growing and getting color. They're gaining weight!",
    26: "Baby's eyes are beginning to open. They can see light through the womb.",
    27: "Welcome to the third trimester! Baby's lungs are maturing.",
    28: "Baby can blink their eyes and has developed eyelashes.",
    29: "Baby's bones are fully developed but still soft and flexible.",
    30: "Baby's brain is developing billions of neurons. They're very active!",
    31: "Baby is processing information and tracking light.",
    32: "Baby is practicing breathing movements and developing immune system.",
    33: "Baby's bones are hardening, except for the skull which stays soft.",
    34: "Baby's central nervous system is maturing. They're gaining weight rapidly!",
    35: "Baby's kidneys are fully developed. Most physical development is complete.",
    36: "Baby is shedding the lanugo. They're getting ready for birth!",
    37: "Baby is full term! They're practicing breathing and sucking.",
    38: "Baby's organs are ready for life outside the womb.",
    39: "Baby's brain is still developing and will continue after birth.",
    40: "Your due date is here! Baby is ready to meet you!",
  };

  // Find the closest week with a milestone
  const availableWeeks = Object.keys(milestones).map(Number).sort((a, b) => a - b);
  const closestWeek = availableWeeks.reduce((prev, curr) =>
    Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev
  );

  return milestones[closestWeek] || "Every week brings exciting new developments for your baby!";
};

/**
 * WeekTransitionModal - Celebrates new pregnancy week with animation
 * Displays week number, developmental milestone, and confetti animation
 */
export const WeekTransitionModal: React.FC<WeekTransitionModalProps> = ({
  visible,
  week,
  onDismiss,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Create particles for confetti animation
      const newParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: new Animated.Value(SCREEN_WIDTH / 2),
        y: new Animated.Value(SCREEN_HEIGHT / 3),
        opacity: new Animated.Value(1),
        rotation: new Animated.Value(0),
        icon: ['star', 'heart', 'sparkles', 'star-four-points'][i % 4],
      }));
      setParticles(newParticles);

      // Animate entrance
      Animated.sequence([
        // Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale in week number
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 10,
        }),
      ]).start();

      // Fade in content after week number
      setTimeout(() => {
        Animated.timing(contentFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 400);

      // Animate particles
      newParticles.forEach((particle, index) => {
        const angle = (index / newParticles.length) * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const targetX = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
        const targetY = SCREEN_HEIGHT / 3 + Math.sin(angle) * distance;

        Animated.parallel([
          Animated.timing(particle.x, {
            toValue: targetX,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.y, {
            toValue: targetY,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      contentFadeAnim.setValue(0);
      setParticles([]);
    }
  }, [visible, week]);

  const handleDismiss = async () => {
    try {
      // Store the dismissed week in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEY, week.toString());
    } catch (error) {
      console.error('Failed to store dismissed week:', error);
    }
    onDismiss();
  };

  if (!visible) return null;

  const milestone = getDevelopmentalMilestone(week);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Particles/Confetti */}
        {particles.map((particle) => {
          const rotation = particle.rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={particle.id}
              style={[
                styles.particle,
                {
                  transform: [
                    { translateX: particle.x },
                    { translateY: particle.y },
                    { rotate: rotation },
                  ],
                  opacity: particle.opacity,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={particle.icon as any}
                size={20}
                color={theme.colors.primary}
              />
            </Animated.View>
          );
        })}

        {/* Content */}
        <View style={styles.content}>
          {/* Week Number */}
          <Animated.View
            style={[
              styles.weekContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.weekCircle}>
              <Text style={styles.weekLabel}>Week</Text>
              <Text style={styles.weekNumber}>{week}</Text>
            </View>
          </Animated.View>

          {/* Milestone Text */}
          <Animated.View
            style={[
              styles.milestoneContainer,
              {
                opacity: contentFadeAnim,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="baby-face-outline"
              size={32}
              color={theme.colors.primary}
              style={styles.milestoneIcon}
            />
            <Text style={styles.milestoneTitle}>What's New This Week</Text>
            <Text style={styles.milestoneText}>{milestone}</Text>
          </Animated.View>

          {/* Continue Button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: contentFadeAnim,
              },
            ]}
          >
            <Button
              title="Continue"
              onPress={handleDismiss}
              variant="primary"
              accessibilityLabel="Continue to dashboard"
              accessibilityHint="Dismisses the week transition celebration"
            />
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
};

/**
 * Check if week transition should be shown
 * @param currentWeek - Current pregnancy week
 * @returns Promise<boolean> - True if should show transition
 */
export const shouldShowWeekTransition = async (currentWeek: number): Promise<boolean> => {
  try {
    const lastSeenWeek = await AsyncStorage.getItem(STORAGE_KEY);
    if (!lastSeenWeek) {
      return true; // First time, show transition
    }
    const lastWeek = parseInt(lastSeenWeek, 10);
    return currentWeek > lastWeek;
  } catch (error) {
    console.error('Failed to check last seen week:', error);
    return false;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
    left: -10,
    top: -10,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
  },
  weekContainer: {
    marginBottom: theme.spacing.xl,
  },
  weekCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  weekLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  weekNumber: {
    fontSize: 64,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  milestoneContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.md,
    alignItems: 'center',
  },
  milestoneIcon: {
    marginBottom: theme.spacing.md,
  },
  milestoneTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  milestoneText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
});
