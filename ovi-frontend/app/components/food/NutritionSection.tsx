// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
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

    // Calorie Progress
    const caloriePercentage = Math.min((summary.total_calories / targets.calories) * 100, 100);
    const size = 150;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (caloriePercentage / 100) * circumference;

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
                {/* Left Side: Calorie Ring */}
                <View style={styles.ringContainer}>
                    {/* Svg temporarily commented out to isolate error */}
                    {/* 
                    <Svg width={size} height={size}>
                        <Defs>
                            <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                                <Stop offset="0" stopColor="#FFD6C9" />
                                <Stop offset="1" stopColor="#DCD6FF" />
                            </LinearGradient>
                        </Defs>
                        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="#F5F5F5"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                            />
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke="url(#ringGradient)"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                            />
                        </G>
                    </Svg>
                    */}
                    <View style={styles.ringTextContainer}>
                        <Text style={styles.calorieValue}>{Math.round(summary.total_calories)}</Text>
                        <Text style={styles.calorieLabel}>kcal eaten</Text>
                    </View>
                    <Text style={styles.dailyGoal}>Daily Goal: {targets.calories} kcal</Text>
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
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
        marginBottom: 16,
        marginLeft: 4,
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
        justifyContent: 'center',
        paddingRight: 20,
        borderRightWidth: 1,
        borderRightColor: '#F0F0F0',
    },
    ringTextContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 24, // Adjust for daily goal text space
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
