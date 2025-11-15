import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account</Text>
        </View>

        <View style={styles.profileInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pregnancy Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={styles.infoValue}>March 15, 2024</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Current Week</Text>
            <Text style={styles.infoValue}>Week 24</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Privacy Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.surface,
  },
  profileInfo: {
    padding: theme.spacing.lg,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  infoItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fontWeight.medium,
  },
  settingItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  settingText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  logoutButton: {
    backgroundColor: theme.colors.error,
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  logoutText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
