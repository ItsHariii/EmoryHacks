import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useUserStore } from '../../store/useUserStore';
import { getGreeting, getGreetingEmoji } from '../../utils/greeting';

export const DashboardHeader: React.FC = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { profile } = useUserStore();

    // Animation values
    const slideAnim = useRef(new Animated.Value(-20)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    paddingTop: Math.max(insets.top, 20),
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.content}>
                <View style={styles.greetingSection}>
                    <View style={styles.titleRow}>
                        <Text style={styles.greeting} testID="dashboard-greeting">
                            {getGreeting()}, {profile?.first_name || 'Megan'}
                        </Text>
                        <Text style={styles.emoji}>{getGreetingEmoji()}</Text>
                    </View>
                    <Text style={styles.subtitle}>Ready for a healthy day?</Text>
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => (navigation as any).navigate('Notifications')}
                    >
                        <MaterialCommunityIcons name="bell" size={20} color={theme.colors.primary} />
                        <View style={styles.badge} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.profileButton]}
                        onPress={() => (navigation as any).navigate('Profile')}
                    >
                        <MaterialCommunityIcons name="account" size={20} color={theme.colors.text.inverse} />
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.layout.screenPadding,
        paddingBottom: theme.spacing.md,
        backgroundColor: 'transparent', // Let parent gradient show through
        zIndex: 100,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingSection: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    greeting: {
        fontFamily: theme.typography.fontFamily.bold,
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        letterSpacing: theme.typography.letterSpacing.tight,
    },
    emoji: {
        fontSize: theme.typography.fontSize.xl,
    },
    subtitle: {
        fontFamily: theme.typography.fontFamily.medium,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        minWidth: theme.layout.minTouchTarget,
        minHeight: theme.layout.minTouchTarget,
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    profileButton: {
        backgroundColor: theme.colors.primary,
        ...theme.shadows.sm,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.primary,
    },
});
