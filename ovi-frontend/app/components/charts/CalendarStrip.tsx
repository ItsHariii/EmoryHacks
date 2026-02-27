// @ts-nocheck
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface CalendarStripProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    daysBack?: number;
    /** After this many ms with a non-today date selected, auto-snap back to today (0 = disabled). Default 4000. */
    snapBackToTodayAfterMs?: number;
}

const DATE_ITEM_WIDTH = 55;
const DATE_ITEM_MARGIN = 8;
const FULL_ITEM_WIDTH = DATE_ITEM_WIDTH + DATE_ITEM_MARGIN;

const isSameDay = (d1: Date, d2: Date) => {
    return (
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear()
    );
};

const getTodayAtMidnight = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
};

export const CalendarStrip: React.FC<CalendarStripProps> = ({
    selectedDate,
    onDateSelect,
    daysBack = 14,
    snapBackToTodayAfterMs = 4000,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const screenWidth = Dimensions.get('window').width;
    const snapBackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Generate dates
    const dates = React.useMemo(() => {
        const result = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Show 2 weeks back and 1 week forward
        for (let i = -7; i <= daysBack; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            result.unshift(date);
        }
        return result.reverse(); // Show past to future left to right
    }, [daysBack]);

    // Scroll to selected date on mount or update
    useEffect(() => {
        const index = dates.findIndex(d => isSameDay(d, selectedDate));
        if (index !== -1 && scrollViewRef.current) {
            // Center the selected item
            const x = (index * FULL_ITEM_WIDTH) - (screenWidth / 2) + (FULL_ITEM_WIDTH / 2);
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ x: Math.max(0, x), animated: true });
            }, 100);
        }
    }, [selectedDate, dates, screenWidth]);

    // Auto snap back to today after delay when a non-today date is selected
    useEffect(() => {
        const today = getTodayAtMidnight();
        const selectedIsToday = isSameDay(selectedDate, today);

        if (snapBackToTodayAfterMs <= 0 || selectedIsToday) {
            if (snapBackTimeoutRef.current) {
                clearTimeout(snapBackTimeoutRef.current);
                snapBackTimeoutRef.current = null;
            }
            return;
        }

        snapBackTimeoutRef.current = setTimeout(() => {
            snapBackTimeoutRef.current = null;
            onDateSelect(getTodayAtMidnight());
        }, snapBackToTodayAfterMs);

        return () => {
            if (snapBackTimeoutRef.current) {
                clearTimeout(snapBackTimeoutRef.current);
                snapBackTimeoutRef.current = null;
            }
        };
    }, [selectedDate, snapBackToTodayAfterMs, onDateSelect]);

    const handleDatePress = (date: Date) => {
        Haptics.selectionAsync();
        onDateSelect(date);
    };

    const formatDate = (date: Date) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return {
            dayName: days[date.getDay()],
            dayNumber: date.getDate(),
        };
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                decelerationRate="fast"
                snapToInterval={FULL_ITEM_WIDTH}
                snapToAlignment="center"
            >
                {dates.map((date, index) => {
                    const { dayName, dayNumber } = formatDate(date);
                    const isSelected = isSameDay(date, selectedDate);

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.touchable}
                            onPress={() => handleDatePress(date)}
                            activeOpacity={0.8}
                        >
                            {isSelected ? (
                                <LinearGradient
                                    colors={theme.gradients.magicalGlow}
                                    style={[styles.dateItem, styles.selectedDateItem]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={[styles.dayName, styles.selectedText]}>{dayName}</Text>
                                    <Text style={[styles.dayNumber, styles.selectedText]}>{dayNumber}</Text>
                                    <View style={styles.oviBadge}>
                                        <Text style={styles.oviText}>OVI</Text>
                                    </View>
                                </LinearGradient>
                            ) : (
                                <View style={styles.dateItem}>
                                    <Text style={styles.dayName}>{dayName}</Text>
                                    <Text style={styles.dayNumber}>{dayNumber}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 100,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        paddingHorizontal: (Dimensions.get('window').width - FULL_ITEM_WIDTH) / 2,
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },
    touchable: {
        marginRight: DATE_ITEM_MARGIN,
        ...theme.shadows.sm,
    },
    dateItem: {
        width: DATE_ITEM_WIDTH,
        height: 85,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    selectedDateItem: {
        // Gradient background handles color
        transform: [{ scale: 1.1 }],
        ...theme.shadows.glowLavender,
    },
    dayName: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginBottom: 4,
        fontWeight: theme.typography.fontWeight.medium,
    },
    dayNumber: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    selectedText: {
        color: theme.colors.primary,
    },
    oviBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    oviText: {
        fontSize: 8,
        fontWeight: '800',
        color: theme.colors.primary,
    },
});
