import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card } from './Card';
import { FetusDevelopmentAnimation } from './FetusDevelopmentAnimation';
import { theme } from '../theme';
import { getSizeComparison, getWeekMilestones } from '../utils/pregnancyCalculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BabyThisWeekCardProps {
    week: number;
}

/**
 * Baby This Week Card Component
 * 
 * Displays the current week's fetus animation with size comparison
 * and key milestones. Tappable to navigate to the Baby tab.
 */
export const BabyThisWeekCard: React.FC<BabyThisWeekCardProps> = ({ week }) => {
    const navigation = useNavigation();
    const sizeComparison = getSizeComparison(week);
    const milestones = getWeekMilestones(week);

    const handlePress = () => {
        // Navigate to Baby tab
        (navigation as any).navigate('Baby');
    };

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePress}
            accessible={true}
            accessibilityLabel={`View baby development for week ${week}`}
            accessibilityRole="button"
            accessibilityHint="Opens the baby development timeline"
        >
            <Card
                shadow="lg"
                padding="lg"
                borderRadius="xl"
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Your Baby This Week</Text>
                        <Text style={styles.subtitle}>Week {week}</Text>
                    </View>
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={theme.colors.text.secondary}
                    />
                </View>

                <View style={styles.content}>
                    {/* Fetus Animation */}
                    <View style={styles.animationContainer}>
                        <FetusDevelopmentAnimation week={week} size="medium" />
                    </View>

                    {/* Size Comparison and Milestones */}
                    <View style={styles.infoContainer}>
                        <View style={styles.sizeComparisonContainer}>
                            <MaterialCommunityIcons
                                name="ruler"
                                size={16}
                                color={theme.colors.primary}
                            />
                            <Text style={styles.sizeComparison}>
                                About the size of {sizeComparison}
                            </Text>
                        </View>

                        {milestones.length > 0 && (
                            <View style={styles.milestonesContainer}>
                                <Text style={styles.milestonesTitle}>Key Developments:</Text>
                                {milestones.slice(0, 2).map((milestone, index) => (
                                    <View key={index} style={styles.milestoneItem}>
                                        <Text style={styles.bulletPoint}>•</Text>
                                        <Text style={styles.milestoneText}>{milestone}</Text>
                                    </View>
                                ))}
                                {milestones.length > 2 && (
                                    <Text style={styles.moreLink}>
                                        +{milestones.length - 2} more in Baby tab →
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    content: {
        flexDirection: 'row',
        gap: theme.spacing.lg,
    },
    animationContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    sizeComparisonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.background,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
    },
    sizeComparison: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.primary,
        fontWeight: theme.fontWeight.semibold,
    },
    milestonesContainer: {
        gap: theme.spacing.xs,
    },
    milestonesTitle: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    milestoneItem: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        alignItems: 'flex-start',
    },
    bulletPoint: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.bold,
    },
    milestoneText: {
        flex: 1,
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    moreLink: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.semibold,
        marginTop: theme.spacing.xs,
    },
});
