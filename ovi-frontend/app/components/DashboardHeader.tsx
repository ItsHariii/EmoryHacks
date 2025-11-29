import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useUserStore } from '../store/useUserStore';
import { useNotifications } from '../hooks/useNotifications';

export const DashboardHeader = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { profile } = useUserStore();
    const { scheduledCount } = useNotifications();

    const getUserInitials = () => {
        const firstName = profile?.first_name || '';
        const lastName = profile?.last_name || '';
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <View style={[styles.headerContainer, { paddingTop: insets.top + theme.spacing.md }]}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('../../assets/Ovi_icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity
                    onPress={() => (navigation as any).navigate('NotificationSettings')}
                    style={styles.iconButton}
                    accessibilityLabel="Notifications"
                >
                    <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.primary} />
                    {scheduledCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{scheduledCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => (navigation as any).navigate('Profile')}
                    style={styles.avatarButton}
                    accessibilityLabel="Profile"
                >
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getUserInitials()}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
        backgroundColor: theme.colors.primary,
        borderBottomLeftRadius: theme.borderRadius.xxl,
        borderBottomRightRadius: theme.borderRadius.xxl,
        ...theme.shadows.lg, // Increased shadow for depth
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        // Removed background and padding
    },
    logo: {
        width: 60, // Increased size as requested
        height: 60,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    iconButton: {
        padding: theme.spacing.xs,
        position: 'relative',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.full,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.sm,
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: theme.colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.surface,
    },
    badgeText: {
        color: theme.colors.text.inverse,
        fontSize: 10,
        fontWeight: theme.fontWeight.bold,
    },
    avatarButton: {
        padding: 2,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.full,
        ...theme.shadows.sm,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: theme.colors.text.inverse,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },
});
