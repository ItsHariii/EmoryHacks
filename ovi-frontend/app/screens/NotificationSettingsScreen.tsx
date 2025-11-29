import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { theme } from '../theme';
import { useNotifications } from '../hooks/useNotifications';

interface NotificationSettingsScreenProps {
  navigation: any;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  navigation,
}) => {
  const {
    preferences,
    loading,
    permissionsGranted,
    scheduledCount,
    updatePreferences,
    enableNotifications,
    disableNotifications,
    checkPermissions,
    testNotification,
  } = useNotifications();

  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Notification Settings',
    });
  }, []);

  // Re-check permissions when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkPermissions();
    });
    return unsubscribe;
  }, [navigation]);

  const handleToggleNotifications = async (value: boolean) => {
    try {
      if (value) {
        if (!permissionsGranted) {
          const granted = await checkPermissions();
          if (!granted) {
            Alert.alert(
              'Permissions Required',
              'Please enable notifications in your device settings to use this feature.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Settings',
                  onPress: () => {
                    if (Platform.OS === 'ios') {
                      Linking.openURL('app-settings:');
                    } else {
                      Linking.openSettings();
                    }
                  },
                },
              ]
            );
            return;
          }
        }
        await enableNotifications();
      } else {
        await disableNotifications();
      }
      setLocalPrefs({ ...localPrefs, enabled: value });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update notification settings');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences(localPrefs);
      Alert.alert('Success', 'Notification settings saved successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async (type: 'hydration' | 'supplement' | 'meal') => {
    setTestingNotification(true);
    try {
      await testNotification(type);
      Alert.alert('Test Sent', 'Check your notifications!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send test notification');
    } finally {
      setTestingNotification(false);
    }
  };

  const parseTime = (timeString: string): { hour: number; minute: number } => {
    const [hour, minute] = timeString.split(':').map(Number);
    return { hour, minute };
  };

  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (
    field: 'supplements' | 'breakfast' | 'lunch' | 'dinner',
    value: string
  ) => {
    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (!timeRegex.test(value) && value !== '') {
      return;
    }

    if (field === 'supplements') {
      setLocalPrefs({
        ...localPrefs,
        supplements: { ...localPrefs.supplements, time: value },
      });
    } else {
      setLocalPrefs({
        ...localPrefs,
        meals: { ...localPrefs.meals, [field]: value },
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Permissions Status */}
        {!permissionsGranted && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ Notification permissions not granted. Enable in settings to use notifications.
            </Text>
            <TouchableOpacity
              style={styles.warningButton}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }}
            >
              <Text style={styles.warningButtonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Master Toggle */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Turn on reminders for hydration, supplements, and meals
              </Text>
            </View>
            <Switch
              value={localPrefs.enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              thumbColor={localPrefs.enabled ? theme.colors.primary : theme.colors.text.muted}
              ios_backgroundColor={theme.colors.border}
            />
          </View>
        </View>

        {/* Scheduled Count */}
        {localPrefs.enabled && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📅 {scheduledCount} notification{scheduledCount !== 1 ? 's' : ''} scheduled
            </Text>
          </View>
        )}

        {/* Hydration Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💧 Hydration Reminders</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Hydration Reminders</Text>
              <Text style={styles.settingDescription}>
                Regular reminders to drink water throughout the day
              </Text>
            </View>
            <Switch
              value={localPrefs.hydration.enabled}
              onValueChange={(value) =>
                setLocalPrefs({
                  ...localPrefs,
                  hydration: { ...localPrefs.hydration, enabled: value },
                })
              }
              disabled={!localPrefs.enabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              thumbColor={
                localPrefs.hydration.enabled ? theme.colors.primary : theme.colors.text.muted
              }
              ios_backgroundColor={theme.colors.border}
            />
          </View>

          {localPrefs.hydration.enabled && (
            <View style={styles.subSetting}>
              <Text style={styles.subSettingLabel}>Reminder Interval</Text>
              <View style={styles.intervalContainer}>
                {[1, 2, 3, 4].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.intervalButton,
                      localPrefs.hydration.intervalHours === hours &&
                        styles.intervalButtonSelected,
                    ]}
                    onPress={() =>
                      setLocalPrefs({
                        ...localPrefs,
                        hydration: { ...localPrefs.hydration, intervalHours: hours },
                      })
                    }
                    disabled={!localPrefs.enabled}
                  >
                    <Text
                      style={[
                        styles.intervalButtonText,
                        localPrefs.hydration.intervalHours === hours &&
                          styles.intervalButtonTextSelected,
                      ]}
                    >
                      {hours}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Supplement Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Supplement Reminders</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Supplement Reminders</Text>
              <Text style={styles.settingDescription}>
                Daily reminder to take your prenatal vitamins
              </Text>
            </View>
            <Switch
              value={localPrefs.supplements.enabled}
              onValueChange={(value) =>
                setLocalPrefs({
                  ...localPrefs,
                  supplements: { ...localPrefs.supplements, enabled: value },
                })
              }
              disabled={!localPrefs.enabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              thumbColor={
                localPrefs.supplements.enabled ? theme.colors.primary : theme.colors.text.muted
              }
              ios_backgroundColor={theme.colors.border}
            />
          </View>

          {localPrefs.supplements.enabled && (
            <>
              <View style={styles.subSetting}>
                <Text style={styles.subSettingLabel}>Supplement Name</Text>
                <TextInput
                  style={styles.input}
                  value={localPrefs.supplements.name}
                  onChangeText={(value) =>
                    setLocalPrefs({
                      ...localPrefs,
                      supplements: { ...localPrefs.supplements, name: value },
                    })
                  }
                  placeholder="e.g., Prenatal Vitamin"
                  placeholderTextColor={theme.colors.text.muted}
                  editable={localPrefs.enabled}
                />
              </View>
              <View style={styles.subSetting}>
                <Text style={styles.subSettingLabel}>Reminder Time (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={localPrefs.supplements.time}
                  onChangeText={(value) => handleTimeChange('supplements', value)}
                  placeholder="08:00"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={localPrefs.enabled}
                />
              </View>
            </>
          )}
        </View>

        {/* Meal Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ Meal Logging Reminders</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Meal Reminders</Text>
              <Text style={styles.settingDescription}>
                Reminders to log your meals throughout the day
              </Text>
            </View>
            <Switch
              value={localPrefs.meals.enabled}
              onValueChange={(value) =>
                setLocalPrefs({
                  ...localPrefs,
                  meals: { ...localPrefs.meals, enabled: value },
                })
              }
              disabled={!localPrefs.enabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
              thumbColor={
                localPrefs.meals.enabled ? theme.colors.primary : theme.colors.text.muted
              }
              ios_backgroundColor={theme.colors.border}
            />
          </View>

          {localPrefs.meals.enabled && (
            <>
              <View style={styles.subSetting}>
                <Text style={styles.subSettingLabel}>Breakfast Time (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={localPrefs.meals.breakfast}
                  onChangeText={(value) => handleTimeChange('breakfast', value)}
                  placeholder="08:00"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={localPrefs.enabled}
                />
              </View>
              <View style={styles.subSetting}>
                <Text style={styles.subSettingLabel}>Lunch Time (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={localPrefs.meals.lunch}
                  onChangeText={(value) => handleTimeChange('lunch', value)}
                  placeholder="12:00"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={localPrefs.enabled}
                />
              </View>
              <View style={styles.subSetting}>
                <Text style={styles.subSettingLabel}>Dinner Time (HH:mm)</Text>
                <TextInput
                  style={styles.input}
                  value={localPrefs.meals.dinner}
                  onChangeText={(value) => handleTimeChange('dinner', value)}
                  placeholder="18:00"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={localPrefs.enabled}
                />
              </View>
            </>
          )}
        </View>

        {/* Test Notifications */}
        {localPrefs.enabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Test Notifications</Text>
            <Text style={styles.sectionDescription}>
              Send a test notification to see how they'll appear
            </Text>
            <View style={styles.testButtonContainer}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestNotification('hydration')}
                disabled={testingNotification}
              >
                <Text style={styles.testButtonText}>💧 Hydration</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestNotification('supplement')}
                disabled={testingNotification}
              >
                <Text style={styles.testButtonText}>💊 Supplement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => handleTestNotification('meal')}
                disabled={testingNotification}
              >
                <Text style={styles.testButtonText}>🍽️ Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving || !localPrefs.enabled}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.text.light} />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  warningBanner: {
    backgroundColor: '#FFF3CD',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningText: {
    fontSize: theme.fontSize.sm,
    color: '#856404',
    marginBottom: theme.spacing.sm,
  },
  warningButton: {
    backgroundColor: '#856404',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  sectionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  subSetting: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  subSettingLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    minHeight: 44,
  },
  intervalContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  intervalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  intervalButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  intervalButtonText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.semibold,
  },
  intervalButtonTextSelected: {
    color: theme.colors.text.light,
  },
  testButtonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  testButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  testButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.light,
    fontWeight: theme.fontWeight.semibold,
  },
  buttonContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.md,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
