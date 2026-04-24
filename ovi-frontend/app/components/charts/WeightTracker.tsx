// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Card } from '../ui/Card';
import { useUserStore } from '../../store/useUserStore';
import { journalAPI } from '../../services/api';

interface WeightTrackerProps {
    currentWeight?: number;
    onWeightUpdate?: (weight: number) => void;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({ currentWeight, onWeightUpdate }) => {
    const { profile } = useUserStore();
    const [weight, setWeight] = useState(currentWeight?.toString() || '');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<{ date: string; weight: number }[]>([]);
    const screenWidth = Dimensions.get('window').width;

    useEffect(() => {
        if (currentWeight) {
            setWeight(currentWeight.toString());
        }
        fetchWeightHistory();
    }, [currentWeight]);

    const fetchWeightHistory = async () => {
        // Mock history for visualization if API doesn't support it yet
        // In a real app, this would come from an API endpoint
        const mockHistory = Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
            weight: (currentWeight || 150) + (Math.random() * 2 - 1),
        }));
        setHistory(mockHistory);
    };

    const handleSave = async () => {
        if (!weight || isNaN(Number(weight))) return;

        setLoading(true);
        try {
            const weightNum = parseFloat(weight);
            await journalAPI.logWeight(weightNum, new Date().toISOString().split('T')[0]);

            onWeightUpdate?.(weightNum);
            setIsEditing(false);
            fetchWeightHistory();
        } catch (error) {
            Alert.alert('Save Failed', 'Could not save your weight. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Prepare data for LineChart
    const chartData = history.map(item => ({
        value: item.weight,
        label: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
        dataPointText: item.weight.toFixed(1),
    }));

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Weight Track</Text>
                </View>
                <TouchableOpacity
                    style={[styles.button, isEditing && styles.saveButton]}
                    onPress={isEditing ? handleSave : () => setIsEditing(true)}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.text.inverse} size="small" />
                    ) : (
                        <Text style={[styles.buttonText, isEditing && styles.saveButtonText]}>
                            {isEditing ? 'Save' : 'Log Weight'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.weightDisplay}>
                    {isEditing ? (
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="decimal-pad"
                                placeholder="0.0"
                                autoFocus
                            />
                            <Text style={styles.unit}>lbs</Text>
                        </View>
                    ) : (
                        <View style={styles.valueContainer}>
                            <Text style={styles.value}>
                                {currentWeight ? currentWeight.toFixed(1) : '--'}
                            </Text>
                            <Text style={styles.unit}>lbs</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Line Chart */}
            {history.length > 1 && (
                <View style={styles.chartContainer}>
                    <LineChart
                        data={chartData}
                        color={theme.colors.primary}
                        thickness={4}
                        dataPointsColor={theme.colors.primary}
                        textColor={theme.colors.text.secondary}
                        curved
                        isAnimated
                        animationDuration={1200}
                        startFillColor={theme.colors.primary}
                        endFillColor={theme.colors.primary}
                        startOpacity={0.15}
                        endOpacity={0.02}
                        areaChart
                        hideRules
                        hideYAxisText
                        hideDataPoints
                        yAxisThickness={0}
                        xAxisThickness={0}
                        width={screenWidth - 80} // Adjust width based on padding
                        height={140}
                        spacing={45}
                        initialSpacing={10}
                        hideAxesAndRules
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.card,
        ...theme.shadows.card,
        marginBottom: theme.spacing.xxl,
        marginHorizontal: theme.layout.screenPadding,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text.primary,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    weightDisplay: {
        flex: 1,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    value: {
        fontSize: 36,
        fontWeight: '800',
        color: theme.colors.text.primary,
    },
    unit: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    input: {
        fontSize: 36,
        fontWeight: '800',
        color: theme.colors.text.primary,
        minWidth: 90,
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
        paddingVertical: 0,
    },
    button: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.backgroundDark,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    buttonText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    saveButtonText: {
        color: theme.colors.text.inverse,
    },
    chartContainer: {
        marginTop: theme.spacing.lg,
        alignItems: 'center',
        marginLeft: -10,
        overflow: 'hidden',
    },
});
