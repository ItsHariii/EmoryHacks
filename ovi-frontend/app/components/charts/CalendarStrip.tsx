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
import { theme } from '../../theme';

interface CalendarStripProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    daysBack?: number;
    snapBackToTodayAfterMs?: number;
}

const DATE_ITEM_WIDTH = 56;
const DATE_ITEM_MARGIN = 10;
const FULL_ITEM_WIDTH = DATE_ITEM_WIDTH + DATE_ITEM_MARGIN;

const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

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

    const dates = React.useMemo(() => {
        const result = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        for (let i = -7; i <= daysBack; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            result.unshift(date);
        }
        return result.reverse();
    }, [daysBack]);

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

    useEffect(() => {
        const today = getTodayAtMidnight();
        const selectedIsToday = isSameDay(selectedDate, today);
        if (snapBackToTodayAfterMs <= 0 || selectedIsToday) {
            if (snapBackTimeoutRef.current) clearTimeout(snapBackTimeoutRef.current);
            return;
        }
        snapBackTimeoutRef.current = setTimeout(() => {
            userTappedDateRef.current = false;
            onDateSelect(getTodayAtMidnight());
        }, snapBackToTodayAfterMs);
        return () => {
            if (snapBackTimeoutRef.current) clearTimeout(snapBackTimeoutRef.current);
        };
    }, [selectedDate, snapBackToTodayAfterMs, onDateSelect]);

    useEffect(() => () => {
        if (scrollInactivityTimeoutRef.current) clearTimeout(scrollInactivityTimeoutRef.current);
    }, []);

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (snapBackToTodayAfterMs <= 0 || userTappedDateRef.current) return;
        const scrollX = e.nativeEvent.contentOffset.x;
        const centeredIndex = Math.max(0, Math.min(getCenteredIndexFromScrollX(scrollX, screenWidth), dates.length - 1));
        const centeredDate = dates[centeredIndex];
        const today = getTodayAtMidnight();
        if (scrollInactivityTimeoutRef.current) clearTimeout(scrollInactivityTimeoutRef.current);
        if (isSameDay(centeredDate, today)) return;
        scrollInactivityTimeoutRef.current = setTimeout(() => {
            const todayIndex = dates.findIndex(d => isSameDay(d, today));
            if (todayIndex !== -1) scrollToDateIndex(todayIndex);
        }, snapBackToTodayAfterMs);
    }, [dates, screenWidth, snapBackToTodayAfterMs, scrollToDateIndex]);

    const handleDatePress = (date: Date) => {
        Haptics.selectionAsync();
        userTappedDateRef.current = true;
        if (scrollInactivityTimeoutRef.current) clearTimeout(scrollInactivityTimeoutRef.current);
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
        return { dayName: days[date.getDay()], dayNumber: date.getDate() };
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
                    const isOtherSelected = isSelected && !isToday;

                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.touchable}
                            onPress={() => handleDatePress(date)}
                            activeOpacity={0.8}
                            accessibilityLabel={`${dayName} ${dayNumber}${isToday ? ', today' : ''}${isSelected ? ', selected' : ''}`}
                            accessibilityRole="button"
                        >
                            <View style={[
                                styles.dateItem,
                                isTodaySelected && styles.dateItemTodaySelected,
                                isOtherSelected && styles.dateItemOtherSelected,
                                isToday && !isSelected && styles.dateItemTodayUnselected,
                            ]}>
                                <Text style={[
                                    styles.dayName,
                                    isTodaySelected && styles.dayNameOnPrimary,
                                    isOtherSelected && styles.textSelectedAccent,
                                ]}>
                                    {dayName.charAt(0)}
                                </Text>
                                <Text style={[
                                    styles.dayNumber,
                                    isTodaySelected && styles.textOnPrimary,
                                    isOtherSelected && styles.textSelectedAccent,
                                ]}>
                                    {dayNumber}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {!isSameDay(selectedDate, getTodayAtMidnight()) && (
                    <TouchableOpacity
                        style={styles.todayButton}
                        onPress={handleTodayPress}
                        activeOpacity={0.8}
                        accessibilityLabel="Go to today"
                        accessibilityRole="button"
                    >
                        <MaterialCommunityIcons name="calendar-today" size={18} color={theme.colors.text.secondary} />
                        <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 78,
        backgroundColor: '#F6F1EA',
    },
    contentContainer: {
        paddingHorizontal: (Dimensions.get('window').width - FULL_ITEM_WIDTH) / 2,
        alignItems: 'center',
        paddingVertical: 6,
    },
    touchable: {
        marginRight: DATE_ITEM_MARGIN,
    },
    dateItem: {
        width: DATE_ITEM_WIDTH,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: 'transparent',
        gap: 2,
    },
    dateItemTodaySelected: {
        backgroundColor: '#2B221B',
    },
    dateItemOtherSelected: {
        backgroundColor: 'rgba(43, 34, 27, 0.08)',
    },
    dateItemTodayUnselected: {
        backgroundColor: 'transparent',
    },
    dayName: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: 10,
        color: '#9C8E80',
        letterSpacing: 0.5,
    },
    dayNumber: {
        fontFamily: theme.typography.fontFamily.display,
        fontSize: 18,
        color: '#2B221B',
        marginTop: 2,
    },
    textOnPrimary: {
        color: '#FFFFFF',
    },
    dayNameOnPrimary: {
        color: 'rgba(255,255,255,0.6)',
    },
    textSelectedAccent: {
        color: '#2B221B',
    },
    todayButton: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: 'rgba(43, 34, 27, 0.06)',
        marginLeft: DATE_ITEM_MARGIN,
        gap: 4,
    },
    todayButtonText: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: 10,
        color: '#6A5D52',
        letterSpacing: 0.5,
    },
});
