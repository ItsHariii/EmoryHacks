import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { HeaderBar } from '../components/HeaderBar';
import { PregnancyWeekDisplay } from '../components/PregnancyWeekDisplay';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SimpleDatePicker } from '../components/SimpleDatePicker';
import { Toast } from '../components/Toast';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProfileSkeleton } from '../components/skeletons';
import { theme } from '../theme';
import { calculatePregnancyWeek } from '../utils/pregnancyCalculations';
import { FEATURE_ICONS } from '../components/icons/iconConstants';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  due_date?: string;
  trimester?: number;
  babies?: number;
}

export const ProfileScreen: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

  // Pregnancy info calculated from due date
  const pregnancyInfo = userProfile?.due_date 
    ? calculatePregnancyWeek(userProfile.due_date)
    : null;

  const fetchUserProfile = async () => {
    try {
      const profile = await userAPI.getCurrentUser();
      setUserProfile(profile);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserProfile();
  };

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastVisible(true);
  };

  const handleEditPress = () => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      if (userProfile.due_date) {
        setDueDate(new Date(userProfile.due_date));
      }
      setEditModalVisible(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Validate inputs
      if (!firstName.trim() || !lastName.trim()) {
        showToast('Please enter your first and last name', 'error');
        return;
      }

      // Format due date as ISO string (YYYY-MM-DD)
      const dueDateString = dueDate.toISOString().split('T')[0];

      // Update profile via API
      await userAPI.updateCurrentUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        due_date: dueDateString,
      });

      // Refresh user data
      await fetchUserProfile();
      await refreshUser();

      setEditModalVisible(false);
      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <HeaderBar
          title="Profile"
          subtitle="Loading your information..."
        />
        <ProfileSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <HeaderBar
        title="Profile"
        subtitle="Manage your account"
        rightActions={[
          {
            icon: FEATURE_ICONS.edit,
            onPress: handleEditPress,
            accessibilityLabel: 'Edit profile',
          },
        ]}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        {/* User Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {userProfile?.first_name} {userProfile?.last_name}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{userProfile?.email}</Text>
          </View>
          
          {userProfile?.due_date && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Due Date</Text>
              <Text style={styles.infoValue}>
                {new Date(userProfile.due_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Pregnancy Information Section */}
        {pregnancyInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pregnancy Progress</Text>
            <PregnancyWeekDisplay
              week={pregnancyInfo.week}
              trimester={pregnancyInfo.trimester}
              daysUntilDue={pregnancyInfo.daysUntilDue}
              dueDate={userProfile?.due_date}
            />
          </View>
        )}

        {/* Settings Section */}
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

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <ScrollView style={styles.modalForm}>
              <Input
                label="First Name"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter your first name"
                accessibilityLabel="First name"
                autoCapitalize="words"
              />
              
              <Input
                label="Last Name"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter your last name"
                accessibilityLabel="Last name"
                autoCapitalize="words"
              />
              
              <View style={styles.datePickerContainer}>
                <Text style={styles.datePickerLabel}>Due Date</Text>
                <SimpleDatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  minimumDate={new Date()}
                  maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setEditModalVisible(false)}
                variant="outline"
                style={styles.modalButton}
                disabled={saving}
              />
              <Button
                title="Save"
                onPress={handleSaveProfile}
                variant="primary"
                style={styles.modalButton}
                loading={saving}
                disabled={saving}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />
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
  scrollViewContent: {
    paddingBottom: 100, // Extra padding for floating tab bar
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
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
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  settingItem: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  settingText: {
    fontSize: theme.typography.fontSize.md,
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
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    maxHeight: '80%',
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalForm: {
    marginBottom: theme.spacing.lg,
  },
  datePickerContainer: {
    marginBottom: theme.spacing.md,
  },
  datePickerLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
