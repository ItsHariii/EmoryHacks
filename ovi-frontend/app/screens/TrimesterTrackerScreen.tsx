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
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { FetusDevelopmentAnimation } from '../components/FetusDevelopmentAnimation';
import { DashboardHeader } from '../components/DashboardHeader';
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
        if (week <= 13) return { name: 'First Trimester', color: '#E8F5E9', weeks: '1-13' };
        if (week <= 27) return { name: 'Second Trimester', color: '#E3F2FD', weeks: '14-27' };
        return { name: 'Third Trimester', color: '#F3E5F5', weeks: '28-40' };
    };

    const trimesterInfo = getTrimesterInfo(selectedWeek);

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    trimesterBadge: {
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.full,
        alignSelf: 'flex-start',
    },
    trimesterText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    weekDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    weekNumber: {
        fontSize: 32,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    currentWeekBadge: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 4,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
    },
    currentWeekText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text.inverse,
    },
    animationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: theme.spacing.xl,
        minHeight: 320,
    },
    sliderContainer: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    sliderLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.secondary,
        fontWeight: theme.fontWeight.semibold,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderMarkers: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.xs,
        paddingHorizontal: 8,
    },
    marker: {
        alignItems: 'center',
    },
    markerLine: {
        width: 1,
        height: 8,
        backgroundColor: theme.colors.border,
        marginBottom: 4,
    },
    markerText: {
        fontSize: 10,
        color: theme.colors.text.secondary,
    },
    infoCard: {
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.sm,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    infoTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    sizeText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        fontWeight: theme.fontWeight.semibold,
    },
    milestonesList: {
        gap: theme.spacing.sm,
    },
    milestoneItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.sm,
    },
    milestoneBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
        marginTop: 6,
    },
    milestoneText: {
        flex: 1,
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.xs,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
    },
    disclaimerText: {
        flex: 1,
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
});
