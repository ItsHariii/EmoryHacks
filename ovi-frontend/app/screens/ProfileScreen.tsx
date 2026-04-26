// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SimpleDatePicker } from '../components/ui/SimpleDatePicker';
import { Toast } from '../components/ui/Toast';
import { ProfileSkeleton } from '../components/skeletons';
import { theme } from '../theme';
import { calculatePregnancyWeek } from '../utils/pregnancyCalculations';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  due_date?: string;
  trimester?: number;
  babies?: number;
}

const NavBar: React.FC<{ title: string; onBack: () => void; insetsTop: number }> = ({ title, onBack, insetsTop }) => (
  <View style={[styles.navBar, { paddingTop: Math.max(insetsTop, 12) + 4 }]}>
    <TouchableOpacity onPress={onBack} style={styles.navIconBtn} accessibilityLabel="Go back">
      <MaterialCommunityIcons name="chevron-left" size={20} color="#2B221B" />
    </TouchableOpacity>
    <Text style={styles.navTitle}>{title}</Text>
    <View style={{ width: 40, height: 40 }} />
  </View>
);

interface SettingRowProps {
  label: string;
  sub?: string | null;
  divider?: boolean;
  noChevron?: boolean;
  onPress?: () => void;
}
const SettingRow: React.FC<SettingRowProps> = ({ label, sub, divider = true, noChevron = false, onPress }) => (
  <Pressable
    style={({ pressed }) => [styles.row, divider && styles.rowDivider, pressed && { opacity: 0.7 }]}
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
    </View>
    {!noChevron && (
      <MaterialCommunityIcons name="chevron-right" size={16} color="#D9CEBF" />
    )}
  </Pressable>
);

export const ProfileScreen: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date());

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

  const pregnancyInfo = userProfile?.due_date
    ? calculatePregnancyWeek(userProfile.due_date)
    : null;

  const fetchUserProfile = async () => {
    try {
      const profile = await userAPI.getCurrentUser();
      setUserProfile(profile);
    } catch (error: any) {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUserProfile(); }, []);

  const handleRefresh = () => { setRefreshing(true); fetchUserProfile(); };

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setToastVisible(true);
  };

  const handleEditPress = () => {
    if (userProfile) {
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      if (userProfile.due_date) setDueDate(new Date(userProfile.due_date));
      setEditModalVisible(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      if (!firstName.trim() || !lastName.trim()) {
        showToast('Please enter your first and last name', 'error');
        return;
      }
      const dueDateString = dueDate.toISOString().split('T')[0];
      await userAPI.updateCurrentUser({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        due_date: dueDateString,
      });
      await fetchUserProfile();
      await refreshUser();
      setEditModalVisible(false);
      showToast('Profile updated', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
        <NavBar title="Settings" onBack={() => navigation.goBack()} insetsTop={insets.top} />
        <ProfileSkeleton />
      </ScreenWrapper>
    );
  }

  const fullName = `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || 'Set your name';
  const firstNameOnly = userProfile?.first_name || 'Set';
  const initial = (userProfile?.first_name || 'U').charAt(0).toUpperCase();

  const dueDateLabel = userProfile?.due_date
    ? `Week ${pregnancyInfo?.week || 0} · due ${new Date(userProfile.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'Add due date';

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
      <NavBar title="Settings" onBack={() => navigation.goBack()} insetsTop={insets.top} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#B84C3F" />
        }
      >
        {/* Profile header card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeInitial}>{initial}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.profileName}>
              {firstNameOnly} <Text style={styles.profileNameItalic}>{userProfile?.last_name || ''}</Text>
            </Text>
            <Text style={styles.profileEmail}>{userProfile?.email}</Text>
          </View>
          <TouchableOpacity onPress={handleEditPress} style={styles.editChip} accessibilityLabel="Edit profile">
            <Text style={styles.editChipText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <SettingRow label="Profile" sub={fullName} onPress={handleEditPress} />
          <SettingRow label="Pregnancy details" sub={dueDateLabel} onPress={handleEditPress} />
          <SettingRow label="Health connect" sub="Apple Health · connected" divider={false} />
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <SettingRow label="Nutrition targets" sub="2,200 kcal · custom macros" />
          <SettingRow label="Units" sub="Imperial · oz, lb" />
          <SettingRow label="Appearance" sub="Light · system" />
          <SettingRow label="Language" sub="English (US)" divider={false} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <SettingRow
            label="Daily reminders"
            sub="Manage reminder schedule"
            onPress={() => (navigation as any).navigate('NotificationSettings')}
          />
          <SettingRow label="Weekly insights" sub="Sunday mornings" divider={false} />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <SettingRow label="Privacy" />
          <SettingRow label="Terms" />
          <SettingRow label="Help & support" />
          <SettingRow label="Version" sub="2.4.1" noChevron divider={false} />
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.signOut} accessibilityLabel="Sign out">
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              Edit <Text style={styles.modalTitleItalic}>profile</Text>
            </Text>
            <ScrollView style={styles.modalForm}>
              <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="First name" autoCapitalize="words" />
              <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Last name" autoCapitalize="words" />
              <View style={styles.datePickerWrap}>
                <Text style={styles.datePickerLabel}>Due date</Text>
                <SimpleDatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  minimumDate={new Date()}
                  maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                />
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} variant="outline" style={{ flex: 1 }} disabled={saving} />
              <Button title="Save" onPress={handleSaveProfile} variant="primary" style={{ flex: 1 }} loading={saving} disabled={saving} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  navBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    color: '#2B221B',
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4E4DF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeInitial: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    fontSize: 24,
    color: '#8F3A31',
  },
  profileName: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    color: '#2B221B',
    letterSpacing: -0.3,
  },
  profileNameItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  profileEmail: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#6A5D52',
    marginTop: 2,
  },
  editChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: '#EFE7DC',
  },
  editChipText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#2B221B',
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0E8DC',
  },
  rowLabel: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 14,
    color: '#2B221B',
  },
  rowSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#6A5D52',
    marginTop: 2,
  },
  signOut: {
    marginTop: 8,
    padding: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#B84C3F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43,34,27,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    color: '#2B221B',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  modalTitleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  modalForm: {
    maxHeight: 400,
  },
  datePickerWrap: {
    marginTop: 4,
  },
  datePickerLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
});
