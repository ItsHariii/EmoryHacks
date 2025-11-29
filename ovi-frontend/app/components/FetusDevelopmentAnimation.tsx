import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Animated, AccessibilityInfo } from 'react-native';
import { getAnimationPath, getWeekData, getAnimationKeyframe } from '../constants/fetusDevelopment';

interface FetusDevelopmentAnimationProps {
    week: number;
    size?: 'small' | 'medium' | 'large';
    autoPlay?: boolean;
    loop?: boolean;
    onAnimationFinish?: () => void;
}

const SIZE_CONFIG = {
    small: { width: 120, height: 120 },
    medium: { width: 200, height: 200 },
    large: { width: 300, height: 300 },
};

// Placeholder images mapping - will be replaced with actual Lottie animations
const FETUS_IMAGES: Record<string, any> = {
    week_04: require('../../assets/animations/fetus/week_04.png'),
    week_08: require('../../assets/animations/fetus/week_08.png'),
    week_12: require('../../assets/animations/fetus/week_12.png'),
    week_16: require('../../assets/animations/fetus/week_16.png'),
    week_20: require('../../assets/animations/fetus/week_20.png'),
    week_24: require('../../assets/animations/fetus/week_24.png'),
    week_28: require('../../assets/animations/fetus/week_28.png'),
    // Fallback for weeks without specific images
    week_32: require('../../assets/animations/fetus/week_28.png'),
    week_36: require('../../assets/animations/fetus/week_28.png'),
    week_40: require('../../assets/animations/fetus/week_28.png'),
};

/**
 * Fetus Development Animation Component
 * 
 * Displays week-specific fetus illustrations with gentle animations.
 * Respects accessibility settings for reduced motion.
 * 
 * @param week - Current pregnancy week (4-40)
 * @param size - Size variant: small, medium, or large
 * @param autoPlay - Whether to auto-play animation
 * @param loop - Whether to loop animation
 */
export const FetusDevelopmentAnimation: React.FC<FetusDevelopmentAnimationProps> = ({
    week,
    size = 'medium',
    autoPlay = true,
    loop = true,
    onAnimationFinish,
}) => {
    const [reduceMotion, setReduceMotion] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    const weekData = getWeekData(week);
    const animationKey = getAnimationPath(week);
    const dimensions = SIZE_CONFIG[size];

    // Calculate growth factor based on distance from keyframe
    // If we are at week 13 and keyframe is 12, we grow by 3%
    // If we are at week 15 and keyframe is 16, we shrink by 3% (interpolate towards it)
    const baseWeek = getAnimationKeyframe(week);
    const weeksDifference = week - baseWeek;
    const growthFactor = 1 + (weeksDifference * 0.03);

    // Check accessibility settings
    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
            setReduceMotion(enabled);
        });
    }, []);

    // Fade in animation on mount
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, [week]);

    // Gentle floating animation (only if motion not reduced)
    useEffect(() => {
        if (!reduceMotion && autoPlay && loop) {
            const floatAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(floatAnim, {
                        toValue: -8,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(floatAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            );

            const breatheAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 1800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 0.95,
                        duration: 1800,
                        useNativeDriver: true,
                    }),
                ])
            );

            floatAnimation.start();
            breatheAnimation.start();

            return () => {
                floatAnimation.stop();
                breatheAnimation.stop();
            };
        }
    }, [reduceMotion, autoPlay, loop, week]);

    const accessibilityLabel = weekData
        ? `Baby at week ${week}, approximately the size of ${weekData.sizeComparison}`
        : `Baby at week ${week}`;

    return (
        <View
            style={[styles.container, { width: dimensions.width, height: dimensions.height }]}
            accessible={true}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
        >
            <Animated.View
                style={[
                    styles.animationContainer,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: reduceMotion ? 0 : floatAnim },
                            { scale: growthFactor },
                            { scale: reduceMotion ? 1 : scaleAnim },
                        ],
                    },
                ]}
            >
                <Image
                    source={FETUS_IMAGES[animationKey] || FETUS_IMAGES.week_20}
                    style={[styles.image, { width: dimensions.width, height: dimensions.height }]}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Subtle shimmer overlay */}
            {!reduceMotion && (
                <View style={styles.shimmerOverlay} pointerEvents="none" />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    animationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        borderRadius: 12,
    },
    shimmerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
    },
});
