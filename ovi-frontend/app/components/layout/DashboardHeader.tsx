// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useUserStore } from '../../store/useUserStore';
import { getGreeting } from '../../utils/greeting';

export const DashboardHeader: React.FC = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { profile } = useUserStore();

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

    const firstName = profile?.first_name || 'there';
    const initial = firstName.charAt(0).toUpperCase();

    const today = new Date();
    const dateKicker = today.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    }).replace(',', ' ·').toUpperCase();

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    paddingTop: Math.max(insets.top, 8),
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <View style={styles.content}>
                <View style={styles.greetingSection}>
                    <Text style={styles.dateKicker}>
                        {dateKicker.split(' · ')[0]} <Text style={styles.dateKickerAccent}>·</Text> {dateKicker.split(' · ')[1] || ''}
                    </Text>
                    <Text style={styles.greetingLine} testID="dashboard-greeting" numberOfLines={1}>
                        Hello,&nbsp;<Text style={styles.greetingName}>{firstName}</Text>
                        <Text style={styles.greetingDot}>.</Text>
                    </Text>
                </View>

                <View style={styles.actions}>
                    {/* Bell — rounded icon button */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => (navigation as any).navigate('NotificationSettings')}
                        accessibilityLabel="Notifications"
                        accessibilityRole="button"
                    >
                        <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.text.primary} />
                        <View style={styles.badge} />
                    </TouchableOpacity>

                    {/* Monogram avatar */}
                    <TouchableOpacity
                        style={styles.avatar}
                        onPress={() => (navigation as any).navigate('Profile')}
                        accessibilityLabel="Open profile"
                        accessibilityRole="button"
                    >
                        <Text style={styles.avatarInitial}>{initial}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.layout.screenPadding,
        paddingBottom: theme.spacing.xs,
        backgroundColor: 'transparent',
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
    dateKicker: {
        fontFamily: theme.typography.fontFamily.semibold,
        fontSize: 11,
        color: '#8C7E70',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    dateKickerAccent: {
        color: '#B84C3F',
    },
    greetingLine: {
        marginTop: 3,
        fontFamily: theme.typography.fontFamily.display,
        fontSize: 28,
        fontWeight: '400',
        color: '#2B221B',
        letterSpacing: -0.7,
        lineHeight: 30,
    },
    greetingName: {
        fontFamily: theme.typography.fontFamily.displayItalic,
        color: '#2B221B',
    },
    greetingDot: {
        color: '#B84C3F',
        fontFamily: theme.typography.fontFamily.displayItalic,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        alignItems: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: theme.colors.primary,
        borderWidth: 1.5,
        borderColor: theme.colors.background,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.backgroundDark,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontFamily: theme.typography.fontFamily.displayItalic,
        fontSize: 17,
        fontWeight: '500',
        color: theme.colors.text.primary,
        letterSpacing: -0.3,
    },
});
