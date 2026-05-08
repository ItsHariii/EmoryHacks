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
  onTimePress?: () => void;
  divider?: boolean;
}
const ReminderRow: React.FC<ReminderRowProps> = ({ label, sub, on, time, onToggle, onTimePress, divider = true }) => (
  <View style={[styles.row, divider && styles.rowDivider]}>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowSub}>{sub}</Text>
    </View>
    {time ? (
      <TouchableOpacity onPress={onTimePress} disabled={!onTimePress} accessibilityRole={onTimePress ? 'button' : undefined}>
        <Text style={[styles.timeLabel, on && styles.timeLabelActive]}>{time}</Text>
      </TouchableOpacity>
    ) : null}
    <Toggle on={on} onPress={onToggle} />
  </View>
);

const parseHHmm = (timeString: string): Date => {
  const date = new Date();
  if (!timeString) return date;
  const [h, m] = timeString.split(':').map(Number);
  date.setHours(isNaN(h) ? 0 : h);
  date.setMinutes(isNaN(m) ? 0 : m);
  date.setSeconds(0);
  return date;
};

const formatHHmm = (timeString: string): string => {
  if (!timeString) return '—';
  const [h, m] = timeString.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '—';
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
};

const dateToHHmm = (d: Date): string => {
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    preferences,
    loading,
    permissionsGranted,
    updatePreferences,
    enableNotifications,
    disableNotifications,
  } = useNotifications();

  const [saving, setSaving] = useState(false);
  const [showMealTime, setShowMealTime] = useState(false);
  const [showSupplementTime, setShowSupplementTime] = useState(false);

  const handleToggleMaster = async () => {
    try {
      setSaving(true);
      if (preferences.enabled) {
        await disableNotifications();
      } else {
        await enableNotifications();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSection = async (section: 'meals' | 'hydration' | 'supplements') => {
    try {
      setSaving(true);
      const next = {
        ...preferences,
        [section]: { ...preferences[section], enabled: !preferences[section].enabled },
      };
      await updatePreferences(next);
    } catch (error) {
      Alert.alert('Error', 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleMealTimeChange = async (date: Date) => {
    try {
      setSaving(true);
      const time = dateToHHmm(date);
      await updatePreferences({
        meals: {
          ...preferences.meals,
          breakfast: time,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Could not save time');
    } finally {
      setSaving(false);
    }
  };

  const handleSupplementTimeChange = async (date: Date) => {
    try {
      setSaving(true);
      const time = dateToHHmm(date);
      await updatePreferences({
        supplements: { ...preferences.supplements, time },
      });
    } catch (error) {
      Alert.alert('Error', 'Could not save time');
    } finally {
      setSaving(false);
    }
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
    preferences.meals.enabled,
    preferences.hydration.enabled,
    preferences.supplements.enabled,
  ].filter(Boolean).length;

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
      <NavBar title="Notifications" onBack={() => navigation.goBack()} insetsTop={insets.top} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.masterCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.masterTitle}>
              Gentle <Text style={styles.masterTitleItalic}>reminders</Text>
            </Text>
            <Text style={styles.masterSub}>
              We'll only nudge when it's truly helpful. Quiet by default.
            </Text>
            {!permissionsGranted && preferences.enabled && (
              <Text style={styles.permissionWarn}>
                System notification permission not granted. Enable in Settings.
              </Text>
            )}
          </View>
          <Toggle on={!!preferences.enabled} onPress={handleToggleMaster} />
        </View>

        {preferences.enabled && (
          <>
            <View style={styles.sectionLabelWrap}>
              <Text style={styles.sectionLabel}>Daily reminders</Text>
              <Text style={styles.sectionMeta}>{remindersActive} active</Text>
            </View>

            <View style={styles.card}>
              <ReminderRow
                label="Meal logging"
                sub="Breakfast, lunch & dinner prompts"
                on={!!preferences.meals.enabled}
                time={formatHHmm(preferences.meals.breakfast)}
                onToggle={() => handleToggleSection('meals')}
                onTimePress={preferences.meals.enabled ? () => setShowMealTime(v => !v) : undefined}
              />
              {preferences.meals.enabled && showMealTime && (
                <View style={styles.timePickerWrap}>
                  <SimpleTimePicker
                    value={parseHHmm(preferences.meals.breakfast || '08:00')}
                    onChange={handleMealTimeChange}
                  />
                </View>
              )}
              <ReminderRow
                label="Hydration"
                sub={`Every ${preferences.hydration.intervalHours}h during waking hours`}
                on={!!preferences.hydration.enabled}
                time={preferences.hydration.enabled ? `${preferences.hydration.intervalHours}h` : '—'}
                onToggle={() => handleToggleSection('hydration')}
              />
              <ReminderRow
                label="Supplements"
                sub={preferences.supplements.name || 'Prenatal Vitamin'}
                on={!!preferences.supplements.enabled}
                time={formatHHmm(preferences.supplements.time)}
                onToggle={() => handleToggleSection('supplements')}
                onTimePress={preferences.supplements.enabled ? () => setShowSupplementTime(v => !v) : undefined}
                divider={false}
              />
              {preferences.supplements.enabled && showSupplementTime && (
                <View style={styles.timePickerWrap}>
                  <SimpleTimePicker
                    value={parseHHmm(preferences.supplements.time || '09:00')}
                    onChange={handleSupplementTimeChange}
                  />
                </View>
              )}
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
    color: '#5A4D42',
    marginTop: 4,
    lineHeight: 18,
  },
  permissionWarn: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#B84C3F',
    marginTop: 6,
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
    color: '#8C7E70',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionMeta: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#8C7E70',
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
    color: '#5A4D42',
    marginTop: 2,
  },
  timeLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
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
  savingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#8C7E70',
  },
});
