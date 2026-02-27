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
import { theme } from '../theme';
import { HeaderBar } from '../components/layout/HeaderBar';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNotifications } from '../hooks/useNotifications';
import { SimpleTimePicker } from '../components/ui/SimpleTimePicker';

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    settings,
    loading,
    updateSettings,
    scheduleAllNotifications,
    cancelAllNotifications
  } = useNotifications();

  const [saving, setSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleToggle = (key: keyof typeof localSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleTimeChange = (key: keyof typeof localSettings, time: Date) => {
    // Format time as HH:MM string
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    setLocalSettings(prev => ({
      ...prev,
      [key]: timeString,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(localSettings);

      // If notifications are enabled, reschedule them
      if (localSettings.enabled) {
        await scheduleAllNotifications();
      } else {
        await cancelAllNotifications();
      }

      Alert.alert('Success', 'Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <ScreenWrapper edges={['bottom']}>
        <HeaderBar title="Notifications" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={['bottom']}>
      <HeaderBar
        title="Notifications"
        showBack
        rightActions={[
          {
            icon: 'check',
            onPress: handleSave,
            accessibilityLabel: 'Save settings'
          }
        ]}
      />

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.label}>Enable Notifications</Text>
                <Text style={styles.description}>
                  Allow Ovi to send you reminders and updates
                </Text>
              </View>
              <Switch
                value={localSettings.enabled}
                onValueChange={() => handleToggle('enabled')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : theme.colors.surface}
              />
            </View>
          </Card>
        </View>

        {localSettings.enabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminders</Text>
              <Card style={styles.card}>
                {/* Meal Reminders */}
                <View style={styles.settingGroup}>
                  <View style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.label}>Meal Logging</Text>
                      <Text style={styles.description}>
                        Remind me to log my meals
                      </Text>
                    </View>
                    <Switch
                      value={localSettings.meal_reminders}
                      onValueChange={() => handleToggle('meal_reminders')}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                  </View>

                  {localSettings.meal_reminders && (
                    <View style={styles.timePickerContainer}>
                      <Text style={styles.timeLabel}>Reminder Time</Text>
                      <SimpleTimePicker
                        value={parseTime(localSettings.meal_reminder_time || '12:00')}
                        onChange={(date) => handleTimeChange('meal_reminder_time', date)}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Hydration Reminders */}
                <View style={styles.settingGroup}>
                  <View style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.label}>Hydration</Text>
                      <Text style={styles.description}>
                        Remind me to drink water
                      </Text>
                    </View>
                    <Switch
                      value={localSettings.hydration_reminders}
                      onValueChange={() => handleToggle('hydration_reminders')}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                  </View>

                  {localSettings.hydration_reminders && (
                    <View style={styles.timePickerContainer}>
                      <Text style={styles.timeLabel}>Interval</Text>
                      <Text style={styles.valueText}>Every 2 hours</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Supplement Reminders */}
                <View style={styles.settingGroup}>
                  <View style={styles.row}>
                    <View style={styles.rowText}>
                      <Text style={styles.label}>Supplements</Text>
                      <Text style={styles.description}>
                        Remind me to take prenatal vitamins
                      </Text>
                    </View>
                    <Switch
                      value={localSettings.supplement_reminders}
                      onValueChange={() => handleToggle('supplement_reminders')}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    />
                  </View>

                  {localSettings.supplement_reminders && (
                    <View style={styles.timePickerContainer}>
                      <Text style={styles.timeLabel}>Reminder Time</Text>
                      <SimpleTimePicker
                        value={parseTime(localSettings.supplement_reminder_time || '09:00')}
                        onChange={(date) => handleTimeChange('supplement_reminder_time', date)}
                      />
                    </View>
                  )}
                </View>
              </Card>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Updates</Text>
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.rowText}>
                    <Text style={styles.label}>Pregnancy Progress</Text>
                    <Text style={styles.description}>
                      Weekly updates about your baby's growth
                    </Text>
                  </View>
                  <Switch
                    value={localSettings.weekly_progress_updates}
                    onValueChange={() => handleToggle('weekly_progress_updates')}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  />
                </View>
              </Card>
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Button
            title={saving ? "Saving..." : "Save Settings"}
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            variant="primary"
          />
          <Button
            title="Test Notification"
            onPress={async () => {
              await scheduleAllNotifications();
              Alert.alert('Test', 'Scheduled test notifications');
            }}
            variant="outline"
            style={styles.testButton}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  card: {
    padding: 0, // Reset padding for custom internal layout
  },
  settingGroup: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  rowText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  description: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  timeLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  valueText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
  footer: {
    marginBottom: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  testButton: {
    borderColor: theme.colors.border,
  },
});
