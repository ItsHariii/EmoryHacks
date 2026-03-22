// @ts-nocheck
import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface CalendarStripProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    daysBack?: number;
    /** After this many ms with a non-today date selected or after scroll-only inactivity, auto-snap back to today (0 = disabled). Default 5000. */
    snapBackToTodayAfterMs?: number;
}

const DATE_ITEM_WIDTH = 60;
const DATE_ITEM_MARGIN = 12;
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

const padLeft = (screenWidth: number) => (screenWidth - FULL_ITEM_WIDTH) / 2;

const getScrollXForIndex = (index: number, screenWidth: number) => {
    const pad = padLeft(screenWidth);
    return pad + index * FULL_ITEM_WIDTH + FULL_ITEM_WIDTH / 2 - screenWidth / 2;
};

const getCenteredIndexFromScrollX = (scrollX: number, screenWidth: number) => {
    const pad = padLeft(screenWidth);
    const raw = (scrollX + screenWidth / 2 - pad - FULL_ITEM_WIDTH / 2) / FULL_ITEM_WIDTH;
    return Math.round(raw);
};

export const CalendarStrip: React.FC<CalendarStripProps> = ({
    selectedDate,
    onDateSelect,
    daysBack = 14,
    snapBackToTodayAfterMs = 5000,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const screenWidth = Dimensions.get('window').width;
    const snapBackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollInactivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const userTappedDateRef = useRef(false);

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
    const scrollToDateIndex = useCallback((index: number) => {
        if (scrollViewRef.current && index >= 0 && index < dates.length) {
            const x = getScrollXForIndex(index, screenWidth);
            const maxScroll = dates.length * FULL_ITEM_WIDTH + 2 * padLeft(screenWidth) - screenWidth;
            scrollViewRef.current.scrollTo({ x: Math.max(0, Math.min(x, maxScroll)), animated: true });
        }
    }, [dates.length, screenWidth]);

    useEffect(() => {
        const index = dates.findIndex(d => isSameDay(d, selectedDate));
        if (index !== -1 && scrollViewRef.current) {
            setTimeout(() => scrollToDateIndex(index), 100);
        }
    }, [selectedDate, dates, screenWidth, scrollToDateIndex]);

    // Auto snap back to today after delay when a non-today date is selected (user tapped)
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
            userTappedDateRef.current = false;
            onDateSelect(getTodayAtMidnight());
        }, snapBackToTodayAfterMs);

        return () => {
            if (snapBackTimeoutRef.current) {
                clearTimeout(snapBackTimeoutRef.current);
                snapBackTimeoutRef.current = null;
            }
        };
    }, [selectedDate, snapBackToTodayAfterMs, onDateSelect]);

    // Cleanup scroll inactivity timeout on unmount
    useEffect(() => () => {
        if (scrollInactivityTimeoutRef.current) {
            clearTimeout(scrollInactivityTimeoutRef.current);
            scrollInactivityTimeoutRef.current = null;
        }
    }, []);

    // Scroll-based inactivity snap-back: when user scrolls without tapping, snap to today after delay
    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (snapBackToTodayAfterMs <= 0 || userTappedDateRef.current) return;

        const scrollX = e.nativeEvent.contentOffset.x;
        const centeredIndex = Math.max(0, Math.min(getCenteredIndexFromScrollX(scrollX, screenWidth), dates.length - 1));
        const centeredDate = dates[centeredIndex];
        const today = getTodayAtMidnight();

        if (scrollInactivityTimeoutRef.current) {
            clearTimeout(scrollInactivityTimeoutRef.current);
            scrollInactivityTimeoutRef.current = null;
        }

        if (isSameDay(centeredDate, today)) return;

        scrollInactivityTimeoutRef.current = setTimeout(() => {
            scrollInactivityTimeoutRef.current = null;
            const todayIndex = dates.findIndex(d => isSameDay(d, today));
            if (todayIndex !== -1) scrollToDateIndex(todayIndex);
        }, snapBackToTodayAfterMs);
    }, [dates, screenWidth, snapBackToTodayAfterMs, scrollToDateIndex]);

    const handleDatePress = (date: Date) => {
        Haptics.selectionAsync();
        userTappedDateRef.current = true;
        if (scrollInactivityTimeoutRef.current) {
            clearTimeout(scrollInactivityTimeoutRef.current);
            scrollInactivityTimeoutRef.current = null;
        }
        onDateSelect(date);
    };

    const handleTodayPress = useCallback(() => {
        Haptics.selectionAsync();
        userTappedDateRef.current = false;
        onDateSelect(getTodayAtMidnight());
        const todayIndex = dates.findIndex(d => isSameDay(d, getTodayAtMidnight()));
        if (todayIndex !== -1) scrollToDateIndex(todayIndex);
    }, [dates, onDateSelect, scrollToDateIndex]);

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
                onScroll={handleScroll}
                scrollEventThrottle={100}
            >
                {dates.map((date, index) => {
                    const { dayName, dayNumber } = formatDate(date);
                    const isToday = isSameDay(date, getTodayAtMidnight());
                    const isSelected = isSameDay(date, selectedDate);
                    const isTodaySelected = isToday && isSelected;
                    const isOtherDateSelected = isSelected && !isToday;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.touchable}
                            onPress={() => handleDatePress(date)}
                            activeOpacity={0.8}
                        >
                            {isTodaySelected ? (
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
                            ) : isOtherDateSelected ? (
                                <LinearGradient
                                    colors={theme.gradients.lavenderGlow}
                                    style={[styles.dateItem, styles.otherSelectedDateItem]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={[styles.dayName, styles.otherSelectedText]}>{dayName}</Text>
                                    <Text style={[styles.dayNumber, styles.otherSelectedText]}>{dayNumber}</Text>
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
                {!isSameDay(selectedDate, getTodayAtMidnight()) && (
                    <TouchableOpacity
                        style={styles.todayButton}
                        onPress={handleTodayPress}
                        activeOpacity={0.8}
                    >
                        <MaterialCommunityIcons name="calendar-today" size={20} color={theme.colors.primary} />
                        <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 110,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        paddingHorizontal: (Dimensions.get('window').width - FULL_ITEM_WIDTH) / 2,
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
    },
    touchable: {
        marginRight: DATE_ITEM_MARGIN,
        ...theme.shadows.sm,
    },
    dateItem: {
        width: DATE_ITEM_WIDTH,
        minHeight: 88,
        height: 88,
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
    otherSelectedDateItem: {
        transform: [{ scale: 1.05 }],
        borderWidth: 2,
        borderColor: theme.colors.accent,
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
    otherSelectedText: {
        color: theme.colors.accent,
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
    todayButton: {
        width: 56,
        minHeight: 88,
        height: 88,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.borderRadius.xl,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        marginLeft: DATE_ITEM_MARGIN,
        ...theme.shadows.sm,
    },
    todayButtonText: {
        fontSize: 10,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary,
        marginTop: 4,
    },
});
