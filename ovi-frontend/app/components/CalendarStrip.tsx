import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

interface CalendarStripProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    daysBack?: number;
}

const DATE_ITEM_WIDTH = 60;
const DATE_ITEM_MARGIN = 8;
const FULL_ITEM_WIDTH = DATE_ITEM_WIDTH + DATE_ITEM_MARGIN;

export const CalendarStrip: React.FC<CalendarStripProps> = ({
    selectedDate,
    onDateSelect,
    daysBack = 14,
}) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const screenWidth = Dimensions.get('window').width;

    // Generate dates
    const dates = React.useMemo(() => {
        const result = [];
        const today = new Date();
        // Reset time to midnight for accurate comparison
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i <= daysBack; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            result.unshift(date);
        }
        return result;
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
    }, [selectedDate, dates]);

    const isSameDay = (d1: Date, d2: Date) => {
        return (
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear()
        );
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return isSameDay(date, today);
    };

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
                    const isDateToday = isToday(date);

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dateItem,
                                isSelected && styles.selectedDateItem,
                                isDateToday && !isSelected && styles.todayItem,
                            ]}
                            onPress={() => handleDatePress(date)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.dayName,
                                    isSelected && styles.selectedText,
                                    isDateToday && !isSelected && styles.todayText,
                                ]}
                            >
                                {dayName}
                            </Text>
                            <Text
                                style={[
                                    styles.dayNumber,
                                    isSelected && styles.selectedText,
                                    isDateToday && !isSelected && styles.todayText,
                                ]}
                            >
                                {dayNumber}
                            </Text>
                            {isDateToday && (
                                <View
                                    style={[
                                        styles.indicator,
                                        isSelected ? styles.selectedIndicator : styles.todayIndicator,
                                    ]}
                                />
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
        height: 90,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        paddingHorizontal: (Dimensions.get('window').width - FULL_ITEM_WIDTH) / 2, // Center the first/last items
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    dateItem: {
        width: DATE_ITEM_WIDTH,
        height: 75,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20, // More rounded
        backgroundColor: theme.colors.surface,
        marginRight: DATE_ITEM_MARGIN,
        ...theme.shadows.sm,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedDateItem: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.lg, // Stronger shadow for selected
        transform: [{ scale: 1.05 }],
        borderColor: theme.colors.primary,
    },
    todayItem: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surface,
        borderWidth: 1.5,
    },
    dayName: {
        fontSize: 13,
        color: theme.colors.text.secondary,
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    dayNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    selectedText: {
        color: theme.colors.text.inverse,
    },
    todayText: {
        color: theme.colors.primary,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },
    selectedIndicator: {
        backgroundColor: theme.colors.text.inverse,
    },
    todayIndicator: {
        backgroundColor: theme.colors.primary,
    },
});
