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

    const trimester = week <= 13 ? 'First Trimester' : week <= 27 ? 'Second Trimester' : 'Third Trimester';

    return (
        <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => (navigation as any).navigate('Baby')}
            accessible={true}
            accessibilityLabel={`View baby development for week ${week}`}
        >
            <View style={styles.card}>
                {/* Honey corner accent — celebrates the milestone */}
                <View style={styles.honeyCorner} />
                <Text style={styles.weekChip}>week {week}</Text>

                <View style={styles.row}>
                    {/* Image well */}
                    <View style={styles.imageWell}>
                        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                            <FetusDevelopmentAnimation week={week} size="small" />
                        </Animated.View>
                    </View>

                    {/* Copy */}
                    <View style={styles.textColumn}>
                        <Text style={styles.metaLabel} numberOfLines={1}>
                            {trimester}
                        </Text>
                        <Text style={styles.headline}>
                            About the size of{'\n'}
                            <Text style={styles.headlineItalic}>a {sizeComparison}</Text>
                            <Text style={styles.headlineDot}>.</Text>
                        </Text>
                        {milestones.length > 0 && (
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <MaterialCommunityIcons
                                        name="heart-outline"
                                        size={12}
                                        color="#9C8E80"
                                    />
                                    <Text style={styles.statText} numberOfLines={2}>
                                        {milestones[0]}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 0.5,
        borderColor: '#E8E0D5',
        overflow: 'hidden',
        position: 'relative',
    },
    honeyCorner: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 78,
        height: 78,
        backgroundColor: '#F8EFD9',
        borderBottomLeftRadius: 78,
        zIndex: 0,
    },
    weekChip: {
        position: 'absolute',
        top: 12,
        right: 14,
        zIndex: 2,
        fontFamily: theme.typography.fontFamily.displayItalic,
        fontStyle: 'italic',
        fontSize: 11,
        color: '#8C6B2A',
        letterSpacing: 0.2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch',
        zIndex: 1,
    },
    imageWell: {
        width: 132,
        flexShrink: 0,
        backgroundColor: '#EFE7DC',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRightWidth: 0.5,
        borderRightColor: '#E8E0D5',
    },
    textColumn: {
        flex: 1,
        paddingTop: 18,
        paddingHorizontal: 18,
        paddingBottom: 16,
        gap: 6,
        minWidth: 0,
    },
    metaLabel: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: 10,
        color: '#9C8E80',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    headline: {
        fontFamily: theme.typography.fontFamily.display,
        fontSize: 22,
        color: '#2B221B',
        letterSpacing: -0.4,
        lineHeight: 24,
        marginTop: 4,
    },
    headlineItalic: {
        fontFamily: theme.typography.fontFamily.displayItalic,
        fontStyle: 'italic',
    },
    headlineDot: {
        color: '#B84C3F',
    },
    statsRow: {
        marginTop: 12,
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
        color: '#6A5D52',
        flex: 1,
        lineHeight: 16,
    },
});
