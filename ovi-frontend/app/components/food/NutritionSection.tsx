// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '../../theme';
import { MacronutrientCard } from './MacronutrientCard';
import { SkeletonMacroCard } from '../skeletons/SkeletonLoader';
import { useNutritionStore } from '../../store/useNutritionStore';

interface NutritionSectionProps {
    opacity: Animated.Value;
    translateY: Animated.Value;
}

const NutritionSectionComponent: React.FC<NutritionSectionProps> = ({ opacity, translateY }) => {
    const { summary, targets, loading, error } = useNutritionStore();

    if (loading && !summary) {
        return (
            <View style={styles.container}>
                <SkeletonMacroCard />
            </View>
        );
    }

    if (error && !summary) {
        return (
            <View style={styles.container}>
                <Text style={styles.sectionTitle}>Today's Nutrition</Text>
                <View style={styles.errorCard}>
                    <Text style={styles.errorText}>Could not load nutrition data. Pull down to retry.</Text>
                </View>
            </View>
        );
    }

    if (!summary || !targets) return null;

    const caloriePct = targets.calories > 0
        ? Math.min((summary.total_calories / targets.calories) * 100, 100)
        : 0;

    // Single calorie ring geometry
    const SIZE = 140;
    const CENTER = SIZE / 2;
    const STROKE = 12;
    const RADIUS = (SIZE - STROKE) / 2;
    const CIRCUMFERENCE = RADIUS * 2 * Math.PI;
    const offset = CIRCUMFERENCE - (caloriePct / 100) * CIRCUMFERENCE;

    return (
        <Animated.View
            style={[
                styles.container,
                { opacity, transform: [{ translateY }] },
            ]}
        >
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>

            <View style={styles.card}>
                {/* Calorie ring */}
                <View style={styles.ringColumn}>
                    <View style={{ width: SIZE, height: SIZE }}>
                        <Svg width={SIZE} height={SIZE}>
                            <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
                                {/* Track */}
                                <Circle
                                    cx={CENTER}
                                    cy={CENTER}
                                    r={RADIUS}
                                    stroke={theme.colors.borderLight}
                                    strokeWidth={STROKE}
                                    fill="transparent"
                                />
                                {/* Fill */}
                                <Circle
                                    cx={CENTER}
                                    cy={CENTER}
                                    r={RADIUS}
                                    stroke={theme.colors.primary}
                                    strokeWidth={STROKE}
                                    fill="transparent"
                                    strokeDasharray={CIRCUMFERENCE}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                />
                            </G>
                        </Svg>
                        <View style={styles.ringCenter} pointerEvents="none">
                            <Text style={styles.calorieValue}>
                                {Math.round(summary.total_calories)}
                            </Text>
                            <Text style={styles.calorieUnit}>kcal</Text>
                        </View>
                    </View>

                    <View style={styles.goalPill}>
                        <Text style={styles.goalText}>Goal: {targets.calories}</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Macro rows */}
                <View style={styles.macrosColumn}>
                    <MacronutrientCard
                        name="protein"
                        current={summary.protein_g || 0}
                        target={targets.macros.protein_g}
                        unit="g"
                    />
                    <MacronutrientCard
                        name="carbs"
                        current={summary.carbs_g || 0}
                        target={targets.macros.carbs_g}
                        unit="g"
                    />
                    <MacronutrientCard
                        name="fat"
                        current={summary.fat_g || 0}
                        target={targets.macros.fat_g}
                        unit="g"
                    />
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.layout.screenPadding,
        marginBottom: theme.spacing.xxl,
    },
    sectionTitle: {
        fontFamily: theme.typography.fontFamily.display,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: '400',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
        marginLeft: theme.spacing.xs,
        letterSpacing: -0.3,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.card,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        padding: theme.spacing.xl,
        ...theme.shadows.card,
        alignItems: 'center',
        gap: theme.spacing.xl,
    },
    ringColumn: {
        alignItems: 'center',
        gap: theme.spacing.sm,
        flexShrink: 0,
    },
    ringCenter: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calorieValue: {
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: 28,
        color: theme.colors.text.primary,
        lineHeight: 32,
    },
    calorieUnit: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: -2,
    },
    goalPill: {
        backgroundColor: theme.colors.backgroundDark,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs,
        borderRadius: theme.borderRadius.pill,
    },
    goalText: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    divider: {
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: theme.colors.borderLight,
    },
    macrosColumn: {
        flex: 1,
        gap: theme.spacing.xs,
        justifyContent: 'center',
    },
    errorCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.card,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    errorText: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
});

export const NutritionSection = React.memo(NutritionSectionComponent);
