// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { useNotifications } from '../hooks/useNotifications';
import { SimpleTimePicker } from '../components/ui/SimpleTimePicker';

const NavBar: React.FC<{ title: string; onBack: () => void; insetsTop: number }> = ({ title, onBack, insetsTop }) => (
  <View style={[styles.navBar, { paddingTop: Math.max(insetsTop, 12) + 4 }]}>
    <TouchableOpacity onPress={onBack} style={styles.navIconBtn} accessibilityLabel="Go back">
      <MaterialCommunityIcons name="chevron-left" size={20} color="#2B221B" />
    </TouchableOpacity>
    <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
    <View style={{ width: 40, height: 40 }} />
  </View>
);

const Toggle: React.FC<{ on: boolean; onPress: () => void }> = ({ on, onPress }) => (
  <Switch
    value={on}
    onValueChange={onPress}
    trackColor={{ false: '#D9CEBF', true: '#B84C3F' }}
    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : '#FFFFFF'}
    ios_backgroundColor="#D9CEBF"
  />
);

interface ReminderRowProps {
  label: string;
  sub: string;
  on: boolean;
  time?: string;
  onToggle: () => void;
  divider?: boolean;
}
const ReminderRow: React.FC<ReminderRowProps> = ({ label, sub, on, time, onToggle, divider = true }) => (
  <View style={[styles.row, divider && styles.rowDivider]}>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowSub}>{sub}</Text>
    </View>
    {time ? <Text style={[styles.timeLabel, on && styles.timeLabelActive]}>{time}</Text> : null}
    <Toggle on={on} onPress={onToggle} />
  </View>
);

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    settings,
    loading,
    updateSettings,
    scheduleAllNotifications,
    cancelAllNotifications,
  } = useNotifications();

  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [showMealTime, setShowMealTime] = useState(false);
  const [showSupplementTime, setShowSupplementTime] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = async (key: keyof typeof localSettings) => {
    const next = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(next);
    try {
      setSaving(true);
      await updateSettings(next);
      if (next.enabled) {
        await scheduleAllNotifications();
      } else if (key === 'enabled') {
        await cancelAllNotifications();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not save changes');
      setLocalSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = async (key: keyof typeof localSettings, time: Date) => {
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const next = { ...localSettings, [key]: `${hours}:${minutes}` };
    setLocalSettings(next);
    try {
      await updateSettings(next);
      if (next.enabled) await scheduleAllNotifications();
    } catch (error) {
      Alert.alert('Error', 'Could not save time');
    }
  };

  const parseTime = (timeString: string) => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '—';
    const [h, m] = timeString.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  if (loading) {
    return (
      <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
        <NavBar title="Notifications" onBack={() => navigation.goBack()} insetsTop={insets.top} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B84C3F" />
        </View>
      </ScreenWrapper>
    );
  }

  const remindersActive = [
    localSettings.meal_reminders,
    localSettings.hydration_reminders,
    localSettings.supplement_reminders,
  ].filter(Boolean).length;

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
      <NavBar title="Notifications" onBack={() => navigation.goBack()} insetsTop={insets.top} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Master toggle */}
        <View style={styles.masterCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.masterTitle}>
              Gentle <Text style={styles.masterTitleItalic}>reminders</Text>
            </Text>
            <Text style={styles.masterSub}>
              We'll only nudge when it's truly helpful. Quiet by default.
            </Text>
          </View>
          <Toggle on={!!localSettings.enabled} onPress={() => handleToggle('enabled')} />
        </View>

        {localSettings.enabled && (
          <>
            <View style={styles.sectionLabelWrap}>
              <Text style={styles.sectionLabel}>Daily reminders</Text>
              <Text style={styles.sectionMeta}>{remindersActive} active</Text>
            </View>

            <View style={styles.card}>
              <ReminderRow
                label="Meal logging"
                sub="A gentle prompt to log meals"
                on={!!localSettings.meal_reminders}
                time={formatTime(localSettings.meal_reminder_time || '12:00')}
                onToggle={() => handleToggle('meal_reminders')}
              />
              {localSettings.meal_reminders && showMealTime && (
                <View style={styles.timePickerWrap}>
                  <SimpleTimePicker
                    value={parseTime(localSettings.meal_reminder_time || '12:00')}
                    onChange={(date) => handleTimeChange('meal_reminder_time', date)}
                  />
                </View>
              )}
              <ReminderRow
                label="Hydration"
                sub="Hourly nudge during waking hours"
                on={!!localSettings.hydration_reminders}
                time={localSettings.hydration_reminders ? 'Hourly' : '—'}
                onToggle={() => handleToggle('hydration_reminders')}
              />
              <ReminderRow
                label="Supplements"
                sub="Prenatal vitamins"
                on={!!localSettings.supplement_reminders}
                time={formatTime(localSettings.supplement_reminder_time || '09:00')}
                onToggle={() => handleToggle('supplement_reminders')}
                divider={false}
              />
              {localSettings.supplement_reminders && showSupplementTime && (
                <View style={styles.timePickerWrap}>
                  <SimpleTimePicker
                    value={parseTime(localSettings.supplement_reminder_time || '09:00')}
                    onChange={(date) => handleTimeChange('supplement_reminder_time', date)}
                  />
                </View>
              )}
            </View>

            <View style={styles.sectionLabelWrap}>
              <Text style={styles.sectionLabel}>Weekly insights</Text>
            </View>
            <View style={styles.card}>
              <ReminderRow
                label="Pregnancy progress"
                sub="Weekly updates about baby's growth"
                on={!!localSettings.weekly_progress_updates}
                time="Sun · 9 AM"
                onToggle={() => handleToggle('weekly_progress_updates')}
                divider={false}
              />
            </View>

            <View style={styles.sectionLabelWrap}>
              <Text style={styles.sectionLabel}>Quiet hours</Text>
            </View>
            <View style={[styles.card, styles.quietCard]}>
              <View style={styles.quietRow}>
                <MaterialCommunityIcons name="weather-night" size={18} color="#6A5D52" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>Do not disturb</Text>
                  <Text style={styles.rowSub}>10:00 PM — 7:00 AM</Text>
                </View>
                <Toggle on={!!localSettings.quiet_hours_enabled} onPress={() => handleToggle('quiet_hours_enabled')} />
              </View>
            </View>
          </>
        )}

        {saving && (
          <View style={{ paddingVertical: 8, alignItems: 'center' }}>
            <Text style={styles.savingText}>Saving…</Text>
          </View>
        )}
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  masterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  masterTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    color: '#2B221B',
    letterSpacing: -0.2,
  },
  masterTitleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  masterSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#6A5D52',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionLabelWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#9C8E80',
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
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#2B221B',
    lineHeight: 18,
  },
  rowSub: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#6A5D52',
    marginTop: 2,
  },
  timeLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    minWidth: 64,
    textAlign: 'right',
  },
  timeLabelActive: {
    color: '#2B221B',
  },
  timePickerWrap: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0E8DC',
  },
  quietCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  quietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#9C8E80',
  },
});
