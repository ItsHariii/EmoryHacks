// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    Animated,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { theme } from '../theme';
import { FetusDevelopmentAnimation } from '../components/pregnancy/FetusDevelopmentAnimation';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { usePregnancyProgress } from '../hooks/usePregnancyProgress';
import { getSizeComparison, getWeekMilestones } from '../utils/pregnancyCalculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const TrimesterTrackerScreen: React.FC = () => {
    const { pregnancyInfo } = usePregnancyProgress();
    const currentWeek = pregnancyInfo?.week || 20;

    const [selectedWeek, setSelectedWeek] = useState(currentWeek);
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Auto-snap to current week on mount
    useEffect(() => {
        setSelectedWeek(currentWeek);
    }, [currentWeek]);

    const sizeComparison = getSizeComparison(selectedWeek);
    const milestones = getWeekMilestones(selectedWeek);

    const handleWeekChange = (week: number) => {
        const roundedWeek = Math.round(week);
        if (roundedWeek !== selectedWeek) {
            // Haptic feedback on week change
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Subtle animation on week change
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0.7,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 0.95,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 150,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start();

            setSelectedWeek(roundedWeek);
        }
    };

    const getTrimesterInfo = (week: number) => {
        if (week <= 13) return { name: 'First Trimester', color: theme.colors.accentGreenLight, weeks: '1-13' };
        if (week <= 27) return { name: 'Second Trimester', color: theme.colors.info, weeks: '14-27' };
        return { name: 'Third Trimester', color: theme.colors.secondaryLavender, weeks: '28-40' };
    };

    const trimesterInfo = getTrimesterInfo(selectedWeek);

    return (
        <ScreenWrapper edges={['bottom']}>
            <DashboardHeader />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Trimester Badge */}
                <View style={[styles.trimesterBadge, { backgroundColor: trimesterInfo.color }]}>
                    <Text style={styles.trimesterText}>
                        {trimesterInfo.name} • Weeks {trimesterInfo.weeks}
                    </Text>
                </View>

                {/* Week Display */}
                <View style={styles.weekDisplay}>
                    <Text style={styles.weekNumber}>Week {selectedWeek}</Text>
                    {selectedWeek === currentWeek && (
                        <View style={styles.currentWeekBadge}>
                            <Text style={styles.currentWeekText}>Current Week</Text>
                        </View>
                    )}
                </View>

                {/* Fetus Animation */}
                <Animated.View
                    style={[
                        styles.animationContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <FetusDevelopmentAnimation week={selectedWeek} size="large" />
                </Animated.View>

                {/* Week Slider */}
                <View style={styles.sliderContainer}>
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>Week 4</Text>
                        <Text style={styles.sliderLabel}>Week 40</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={4}
                        maximumValue={40}
                        step={1}
                        value={selectedWeek}
                        onValueChange={handleWeekChange}
                        minimumTrackTintColor={theme.colors.primary}
                        maximumTrackTintColor={theme.colors.border}
                        thumbTintColor={theme.colors.primary}
                    />
                    <View style={styles.sliderMarkers}>
                        {[4, 13, 27, 40].map((week) => (
                            <View key={week} style={styles.marker}>
                                <View style={styles.markerLine} />
                                <Text style={styles.markerText}>{week}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Size Comparison */}
                <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <MaterialCommunityIcons name="ruler" size={24} color={theme.colors.primary} />
                        <Text style={styles.infoTitle}>Size This Week</Text>
                    </View>
                    <Text style={styles.sizeText}>
                        About the size of {sizeComparison}
                    </Text>
                </View>

                {/* Milestones */}
                {milestones.length > 0 && (
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <MaterialCommunityIcons name="star-outline" size={24} color={theme.colors.primary} />
                            <Text style={styles.infoTitle}>Key Developments</Text>
                        </View>
                        <View style={styles.milestonesList}>
                            {milestones.map((milestone, index) => (
                                <View key={index} style={styles.milestoneItem}>
                                    <View style={styles.milestoneBullet} />
                                    <Text style={styles.milestoneText}>{milestone}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Medical Disclaimer */}
                <View style={styles.disclaimer}>
                    <MaterialCommunityIcons name="information-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.disclaimerText}>
                        These visualizations are approximate artistic representations, not exact medical illustrations.
                    </Text>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    // Container styles removed as ScreenWrapper handles them
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xxxl,
    },
    trimesterBadge: {
        marginHorizontal: theme.layout.screenPadding,
        marginTop: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.full,
        alignSelf: 'center',
        ...theme.shadows.sm,
    },
    trimesterText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        letterSpacing: 0.5,
    },
    weekDisplay: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    weekNumber: {
        fontSize: theme.typography.fontSize.display,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        letterSpacing: theme.typography.letterSpacing.tighter,
    },
    currentWeekBadge: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        marginTop: theme.spacing.xs,
    },
    currentWeekText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.inverse,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    animationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: theme.spacing.xl,
        minHeight: 320,
    },
    sliderContainer: {
        marginHorizontal: theme.layout.screenPadding,
        marginBottom: theme.spacing.xxl,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.card,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    sliderLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.secondary,
        fontWeight: theme.fontWeight.bold,
        textTransform: 'uppercase',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderMarkers: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
        paddingHorizontal: 10,
    },
    marker: {
        alignItems: 'center',
    },
    markerLine: {
        width: 2,
        height: 8,
        backgroundColor: theme.colors.border,
        marginBottom: 4,
        borderRadius: 1,
    },
    markerText: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        fontWeight: theme.fontWeight.medium,
    },
    infoCard: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.layout.screenPadding,
        marginBottom: theme.spacing.lg,
        padding: theme.layout.cardPadding,
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.card,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        paddingBottom: theme.spacing.md,
        paddingTop: theme.spacing.xs,
    },
    infoTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    sizeText: {
        fontSize: theme.fontSize.lg,
        color: theme.colors.text.primary,
        fontWeight: theme.fontWeight.medium,
        lineHeight: 28,
    },
    milestonesList: {
        gap: theme.spacing.md,
    },
    milestoneItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
    },
    milestoneBullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        marginTop: 8,
    },
    milestoneText: {
        flex: 1,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
        marginHorizontal: theme.layout.screenPadding,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.surfaceHighlight,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    disclaimerText: {
        flex: 1,
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
});
