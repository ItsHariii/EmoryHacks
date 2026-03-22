// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { FetusDevelopmentAnimation } from './FetusDevelopmentAnimation';
import { theme } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BabyThisWeekCardProps {
    week: number;
    sizeComparison: string;
    milestones: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const BabyThisWeekCard: React.FC<BabyThisWeekCardProps> = ({
    week,
    sizeComparison,
    milestones,
}) => {
    const navigation = useNavigation();

    // Animation values
    const glowPulseAnim = useRef(new Animated.Value(1)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Glow pulse animation
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulseAnim, {
                    toValue: 1.1,
                    duration: 3000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(glowPulseAnim, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );

        // Floating animation for fetus
        const floatAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -5,
                    duration: 3500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.quad),
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.quad),
                }),
            ])
        );

        pulseAnimation.start();
        floatAnimation.start();
    }, []);

    const handlePress = () => {
        (navigation as any).navigate('Baby');
    };

    return (
        <TouchableOpacity
            activeOpacity={0.95}
            onPress={handlePress}
            accessible={true}
            accessibilityLabel={`View baby development for week ${week}`}
        >
            <View style={styles.cardContainer}>
                {/* Base Gradient */}
                <LinearGradient
                    colors={theme.gradients.babyCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.header}>
                    <Text style={styles.title}>Your Baby This Week</Text>
                    <View style={styles.weekBadge}>
                        <Text style={styles.weekText}>Week {week}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    {/* Fetus Animation */}
                    <Animated.View
                        style={[
                            styles.animationContainer,
                            { transform: [{ translateY: floatAnim }] }
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.glowEffect,
                                { transform: [{ scale: glowPulseAnim }] }
                            ]}
                        />
                        <FetusDevelopmentAnimation week={week} size="medium" />
                    </Animated.View>

                    {/* Info Section */}
                    <View style={styles.infoContainer}>
                        <View style={styles.sizeComparisonChip}>
                            <MaterialCommunityIcons
                                name="food-apple" // Changed to apple as per image example
                                size={16}
                                color={theme.colors.error}
                            />
                            <Text style={styles.sizeComparison}>
                                Like an {sizeComparison}
                            </Text>
                        </View>

                        <View style={styles.milestonesContainer}>
                            {milestones.slice(0, 2).map((milestone, index) => (
                                <View key={index} style={styles.milestoneItem}>
                                    <MaterialCommunityIcons
                                        name={index === 0 ? "heart-pulse" : "foot-print"}
                                        size={14}
                                        color={theme.colors.primaryDark}
                                    />
                                    <Text style={styles.milestoneText} numberOfLines={1}>
                                        {milestone}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        padding: theme.layout.cardPadding,
        borderRadius: theme.borderRadius.card,
        ...theme.shadows.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        overflow: 'hidden',
        minHeight: 180,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        ...theme.typography.presets.sectionTitle,
        color: theme.colors.text.primary,
    },
    weekBadge: {
        ...theme.glass.warm.style,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.md,
    },
    weekText: {
        ...theme.typography.presets.captionBold,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.primary,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xl,
    },
    animationContainer: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowEffect: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        ...theme.shadows.glow,
    },
    infoContainer: {
        flex: 1,
        gap: theme.spacing.md,
    },
    sizeComparisonChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        ...theme.glass.warm.style,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.lg,
        alignSelf: 'flex-start',
    },
    sizeComparison: {
        ...theme.typography.presets.captionBold,
        color: theme.colors.text.primary,
    },
    milestonesContainer: {
        gap: theme.spacing.sm,
    },
    milestoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    milestoneText: {
        ...theme.typography.presets.caption,
        color: theme.colors.text.secondary,
        flex: 1,
    },
});
