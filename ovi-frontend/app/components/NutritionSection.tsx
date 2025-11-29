import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '../theme';
import { MacronutrientCard } from './MacronutrientCard';
import { SkeletonMacroCard } from './SkeletonLoader';
import { useNutritionStore } from '../store/useNutritionStore';

interface NutritionSectionProps {
    opacity: Animated.Value;
    translateY: Animated.Value;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const NutritionSection: React.FC<NutritionSectionProps> = ({ opacity, translateY }) => {
    const { summary, targets, loading } = useNutritionStore();

    if (loading && !summary) {
        return (
            <View style={styles.macroSection}>
                <View style={styles.macroGrid}>
                    <SkeletonMacroCard />
                    <SkeletonMacroCard />
                </View>
                <View style={styles.macroGrid}>
                    <SkeletonMacroCard />
                    <SkeletonMacroCard />
                </View>
            </View>
        );
    }

    if (!summary || !targets) return null;

    // Calorie Progress
    const caloriePercentage = Math.min((summary.total_calories / targets.calories) * 100, 100);
    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (caloriePercentage / 100) * circumference;

    return (
        <Animated.View
            style={[
                styles.macroSection,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.sectionTitle}>Nutrition Summary</Text>
                    <Text style={styles.sectionSubtitle}>Daily Progress</Text>
                </View>

                {/* Calorie Ring */}
                <View style={styles.calorieRingContainer}>
                    <Svg width={size} height={size}>
                        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={theme.colors.border}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={theme.colors.primary}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </G>
                    </Svg>
                    <View style={styles.calorieTextContainer}>
                        <Text style={styles.calorieValue}>{Math.round(summary.total_calories)}</Text>
                        <Text style={styles.calorieLabel}>kcal</Text>
                    </View>
                </View>
            </View>

            <View style={styles.macroGrid}>
                <MacronutrientCard
                    name="protein"
                    current={summary.protein_g || 0}
                    target={targets.macros.protein_g}
                    unit="g"
                    color={theme.colors.accent}
                />
                <MacronutrientCard
                    name="carbs"
                    current={summary.carbs_g || 0}
                    target={targets.macros.carbs_g}
                    unit="g"
                    color={theme.colors.success}
                />
                <MacronutrientCard
                    name="fat"
                    current={summary.fat_g || 0}
                    target={targets.macros.fat_g}
                    unit="g"
                    color={theme.colors.warning}
                />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    macroSection: {
        padding: theme.spacing.lg,
        paddingTop: 0,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.sm,
    },
    sectionTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    calorieRingContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calorieTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calorieValue: {
        fontSize: 20,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    calorieLabel: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    macroGrid: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        justifyContent: 'space-between',
    },
});
