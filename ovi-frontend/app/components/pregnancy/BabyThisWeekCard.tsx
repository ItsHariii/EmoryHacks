// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FetusDevelopmentAnimation } from './FetusDevelopmentAnimation';
import { theme } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BabyThisWeekCardProps {
    week: number;
    sizeComparison: string;
    milestones: string[];
}

export const BabyThisWeekCard: React.FC<BabyThisWeekCardProps> = ({
    week,
    sizeComparison,
    milestones,
}) => {
    const navigation = useNavigation();
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const float = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -4,
                    duration: 3500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.quad),
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 3500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.quad),
                }),
            ])
        );
        float.start();
        return () => float.stop();
    }, []);

    // Derive trimester from week
    const trimester = week <= 13 ? 'First Trimester' : week <= 27 ? 'Second Trimester' : 'Third Trimester';

    return (
        <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => (navigation as any).navigate('Baby')}
            accessible={true}
            accessibilityLabel={`View baby development for week ${week}`}
        >
            <View style={styles.card}>
                {/* Horizontal layout: image well | copy */}
                <View style={styles.row}>
                    {/* Image well — fixed width, contained, no overflow */}
                    <View style={styles.imageWell}>
                        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                            <FetusDevelopmentAnimation week={week} size="small" />
                        </Animated.View>
                    </View>

                    {/* Divider */}
                    <View style={styles.wellDivider} />

                    {/* Copy */}
                    <View style={styles.textColumn}>
                        <Text style={styles.metaLabel} numberOfLines={1}>
                            Week {week} · {trimester}
                        </Text>
                        <Text style={styles.headline}>
                            Your baby is{'\n'}
                            <Text style={styles.headlineItalic}>
                                the size of a {sizeComparison}
                            </Text>
                        </Text>
                        <View style={styles.statsRow}>
                            {milestones.slice(0, 1).map((m, i) => (
                                <View key={i} style={styles.statItem}>
                                    <MaterialCommunityIcons
                                        name="heart-outline"
                                        size={12}
                                        color={theme.colors.text.muted}
                                    />
                                    <Text style={styles.statText} numberOfLines={2}>
                                        {m}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.card,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        ...theme.shadows.card,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    imageWell: {
        width: 128,
        flexShrink: 0,
        backgroundColor: theme.colors.backgroundDark,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    wellDivider: {
        width: 0.5,
        backgroundColor: theme.colors.border,
    },
    textColumn: {
        flex: 1,
        padding: 18,
        gap: 6,
        minWidth: 0,
    },
    metaLabel: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: 10,
        color: theme.colors.text.muted,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    headline: {
        fontFamily: theme.typography.fontFamily.display,
        fontSize: 20,
        fontWeight: '400',
        color: theme.colors.text.primary,
        letterSpacing: -0.4,
        lineHeight: 24,
    },
    headlineItalic: {
        fontFamily: theme.typography.fontFamily.displayItalic,
        fontStyle: 'italic',
    },
    statsRow: {
        marginTop: 4,
        gap: 4,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 5,
    },
    statText: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 11,
        color: theme.colors.text.secondary,
        flex: 1,
        lineHeight: 16,
    },
});
