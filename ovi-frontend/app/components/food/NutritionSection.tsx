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

export const NutritionSection: React.FC<NutritionSectionProps> = ({ opacity, translateY }) => {
    const { summary, targets, loading } = useNutritionStore();

    if (loading && !summary) {
        return (
            <View style={styles.container}>
                <SkeletonMacroCard />
            </View>
        );
    }

    if (!summary || !targets) return null;

    // Progress percentages (capped at 100)
    const caloriePct = Math.min((summary.total_calories / targets.calories) * 100, 100);
    const proteinPct = Math.min(((summary.protein_g || 0) / targets.macros.protein_g) * 100, 100);
    const carbsPct = Math.min(((summary.carbs_g || 0) / targets.macros.carbs_g) * 100, 100);
    const fatPct = Math.min(((summary.fat_g || 0) / targets.macros.fat_g) * 100, 100);

    const size = 160;
    const center = size / 2;
    const strokeWidth = 5;
    const gap = 3;
    // 4 concentric rings from outer to inner
    const radii = [72, 64, 56, 48];
    const ringColors = [
      theme.colors.primary,           // Calories - red/coral
      '#FF9E80',                      // Protein - peach
      '#BCAAA4',                      // Carbs - beige
      theme.colors.secondaryLavender, // Fat - lavender
    ];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>

            <View style={styles.cardContent}>
                {/* Left Side: 4 concentric rings (Apple Fitness style) */}
                <View style={styles.ringContainer}>
                    <View style={[styles.ringWrapper, { width: size, height: size }]}>
                        <Svg width={size} height={size}>
                            <G rotation="-90" origin={`${center}, ${center}`}>
                                {radii.map((r, i) => {
                                  const circumference = r * 2 * Math.PI;
                                  const pcts = [caloriePct, proteinPct, carbsPct, fatPct];
                                  const offset = circumference - (pcts[i] / 100) * circumference;
                                  return (
                                    <React.Fragment key={i}>
                                      <Circle
                                        cx={center}
                                        cy={center}
                                        r={r}
                                        stroke={theme.colors.borderLight}
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                      />
                                      <Circle
                                        cx={center}
                                        cy={center}
                                        r={r}
                                        stroke={ringColors[i]}
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                      />
                                    </React.Fragment>
                                  );
                                })}
                            </G>
                        </Svg>
                        <View style={styles.ringTextContainer} pointerEvents="none">
                            <Text style={styles.calorieValue}>{Math.round(summary.total_calories)}</Text>
                            <Text style={styles.calorieLabel}>kcal</Text>
                        </View>
                    </View>
                    <Text style={styles.dailyGoal}>Goal: {targets.calories} kcal</Text>
                </View>

                {/* Right Side: Macros */}
                <View style={styles.macrosContainer}>
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
        ...theme.typography.presets.sectionTitle,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
        marginLeft: theme.spacing.xs,
    },
    cardContent: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 24,
        ...theme.shadows.card,
        alignItems: 'center',
    },
    ringContainer: {
        flex: 1.2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingRight: 20,
        borderRightWidth: 1,
        borderRightColor: '#F0F0F0',
        minHeight: 160,
    },
    ringWrapper: {
        position: 'relative',
    },
    ringTextContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calorieValue: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    calorieLabel: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        fontWeight: '600',
        marginTop: -4,
    },
    dailyGoal: {
        marginTop: 16,
        fontSize: 12,
        color: theme.colors.text.secondary,
        fontWeight: '600',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    macrosContainer: {
        flex: 1,
        paddingLeft: 20,
        gap: 6,
        justifyContent: 'center',
    },
});
