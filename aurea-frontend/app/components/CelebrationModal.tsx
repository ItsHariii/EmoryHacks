import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { ANIMATION_CONFIG } from '../utils/animations';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiParticle {
  id: number;
  x: number;
  y: Animated.Value;
  rotation: Animated.Value;
  color: string;
  size: number;
  delay: number;
}

interface CelebrationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
}

/**
 * CelebrationModal Component
 * 
 * Full-screen celebration modal with confetti animation
 * Shows when user reaches nutrition goals or milestones
 * 
 * Features:
 * - Confetti particle animation with physics
 * - Scale and fade entrance animation
 * - Encouraging achievement message
 * - Continue button to dismiss
 * 
 * Requirements: 4.4, 4.5
 */
const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  title,
  message,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiParticles = useRef<ConfettiParticle[]>([]);

  // Generate confetti particles
  useEffect(() => {
    if (visible && confettiParticles.current.length === 0) {
      const particles: ConfettiParticle[] = [];
      const colors = [
        theme.colors.primary,
        theme.colors.secondary,
        theme.colors.accent,
        theme.colors.success,
        theme.colors.primaryLight,
        theme.colors.secondaryLight,
      ];

      // Create 30 confetti particles
      for (let i = 0; i < 30; i++) {
        particles.push({
          id: i,
          x: Math.random() * SCREEN_WIDTH,
          y: new Animated.Value(-50),
          rotation: new Animated.Value(0),
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 6, // 6-14px
          delay: Math.random() * 500,
        });
      }

      confettiParticles.current = particles;
    }
  }, [visible]);

  // Animate entrance and confetti
  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: ANIMATION_CONFIG.spring.speed,
          bounciness: ANIMATION_CONFIG.spring.bounciness,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_CONFIG.normal,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate confetti particles
      confettiParticles.current.forEach((particle) => {
        const fallDistance = SCREEN_HEIGHT + 100;
        const fallDuration = 3000 + Math.random() * 2000; // 3-5 seconds
        const rotations = 3 + Math.random() * 3; // 3-6 rotations

        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: fallDistance,
            duration: fallDuration,
            delay: particle.delay,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotation, {
            toValue: rotations,
            duration: fallDuration,
            delay: particle.delay,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      confettiParticles.current.forEach((particle) => {
        particle.y.setValue(-50);
        particle.rotation.setValue(0);
      });
    }
  }, [visible, scaleAnim, fadeAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* Semi-transparent background */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        />

        {/* Confetti particles */}
        {confettiParticles.current.map((particle) => {
          const rotation = particle.rotation.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={particle.id}
              style={[
                styles.confetti,
                {
                  left: particle.x,
                  width: particle.size,
                  height: particle.size,
                  backgroundColor: particle.color,
                  transform: [
                    { translateY: particle.y },
                    { rotate: rotation },
                  ],
                },
              ]}
            />
          );
        })}

        {/* Content card */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="trophy-outline"
              size={64}
              color={theme.colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Continue button */}
          <TouchableOpacity
            style={styles.button}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confetti: {
    position: 'absolute',
    borderRadius: theme.borderRadius.sm,
  },
  content: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.lg,
    maxWidth: 400,
    width: '85%',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    minWidth: 200,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.inverse,
  },
});

export default CelebrationModal;
