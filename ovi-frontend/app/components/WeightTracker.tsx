import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { Card } from './Card';
import { useUserStore } from '../store/useUserStore';
import { journalAPI } from '../services/api';

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
            await journalAPI.logWeight({
                weight_lbs: weightNum,
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });

            onWeightUpdate?.(weightNum);
            setIsEditing(false);
            fetchWeightHistory(); // Refresh history
        } catch (error) {
            console.error('Failed to save weight:', error);
        } finally {
            setLoading(false);
        }
    };

    // Sparkline Logic
    const getSparklinePath = () => {
        if (history.length < 2) return '';

        const width = 120;
        const height = 40;
        const minWeight = Math.min(...history.map(h => h.weight));
        const maxWeight = Math.max(...history.map(h => h.weight));
        const range = maxWeight - minWeight || 1;

        const points = history.map((h, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = height - ((h.weight - minWeight) / range) * height;
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    };

    return (
        <Card style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <MaterialCommunityIcons name="scale-bathroom" size={24} color={theme.colors.primary} />
                    <Text style={styles.title}>Weight Tracker</Text>
                </View>

                {/* Sparkline */}
                {history.length > 1 && (
                    <View style={styles.sparklineContainer}>
                        <Svg width="120" height="40">
                            <Defs>
                                <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0" stopColor={theme.colors.primary} stopOpacity="0.5" />
                                    <Stop offset="1" stopColor={theme.colors.primary} stopOpacity="0" />
                                </LinearGradient>
                            </Defs>
                            <Path
                                d={getSparklinePath()}
                                stroke={theme.colors.primary}
                                strokeWidth="2"
                                fill="none"
                            />
                        </Svg>
                    </View>
                )}
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
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    sparklineContainer: {
        height: 40,
        width: 120,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        fontSize: 32,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    unit: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    input: {
        fontSize: 32,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        minWidth: 80,
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
        paddingVertical: 0,
    },
    button: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    buttonText: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
    },
    saveButtonText: {
        color: theme.colors.text.inverse,
    },
});
