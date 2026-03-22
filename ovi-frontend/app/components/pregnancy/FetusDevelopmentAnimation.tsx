// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Image, Animated, AccessibilityInfo } from 'react-native';
import { getOviStage, getWeekData } from '../../constants/fetusDevelopment';

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

// Ovi stages: 24 development images mapped evenly across pregnancy weeks 4-40
const OVI_STAGES: Record<number, any> = {
    1: require('../../../assets/Ovi_stages/1.png'),
    2: require('../../../assets/Ovi_stages/2.png'),
    3: require('../../../assets/Ovi_stages/3.png'),
    4: require('../../../assets/Ovi_stages/4.png'),
    5: require('../../../assets/Ovi_stages/5.png'),
    6: require('../../../assets/Ovi_stages/6.png'),
    7: require('../../../assets/Ovi_stages/7.png'),
    8: require('../../../assets/Ovi_stages/8.png'),
    9: require('../../../assets/Ovi_stages/9.png'),
    10: require('../../../assets/Ovi_stages/10.png'),
    11: require('../../../assets/Ovi_stages/11.png'),
    12: require('../../../assets/Ovi_stages/12.png'),
    13: require('../../../assets/Ovi_stages/13.png'),
    14: require('../../../assets/Ovi_stages/14.png'),
    15: require('../../../assets/Ovi_stages/15.png'),
    16: require('../../../assets/Ovi_stages/16.png'),
    17: require('../../../assets/Ovi_stages/17.png'),
    18: require('../../../assets/Ovi_stages/18.png'),
    19: require('../../../assets/Ovi_stages/19.png'),
    20: require('../../../assets/Ovi_stages/20.png'),
    21: require('../../../assets/Ovi_stages/21.png'),
    22: require('../../../assets/Ovi_stages/22.png'),
    23: require('../../../assets/Ovi_stages/23.png'),
    24: require('../../../assets/Ovi_stages/24.png'),
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
    const oviStage = getOviStage(week);
    const dimensions = SIZE_CONFIG[size];
    const imageSource = OVI_STAGES[oviStage] ?? OVI_STAGES[12];

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
                            { scale: reduceMotion ? 1 : scaleAnim },
                        ],
                    },
                ]}
            >
                <Image
                    source={imageSource}
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
