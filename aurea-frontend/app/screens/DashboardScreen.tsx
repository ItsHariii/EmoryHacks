import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { nutritionAPI, journalAPI } from '../services/api';
import { NutritionSummary, DailyGoals, JournalEntry } from '../types';
import { useNotifications } from '../hooks/useNotifications';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { preferences, scheduledCount, permissionsGranted } = useNotifications();
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
  const [todayJournalEntry, setTodayJournalEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock daily goals - in real app, this would come from user preferences/backend
  const dailyGoals: DailyGoals = {
    calories: 2200,
    protein: 80,
    carbs: 275,
    fat: 73,
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const summary = await nutritionAPI.getDailySummary();
      setNutritionSummary(summary);
      
      // Load today's journal entry
      const today = new Date().toISOString().split('T')[0];
      const entries = await journalAPI.getJournalEntries(today, today);
      if (entries && entries.length > 0) {
        setTodayJournalEntry(entries[0]);
      } else {
        setTodayJournalEntry(null);
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
      // Use mock data for demo purposes
      setNutritionSummary({
        calories: 1850,
        protein: 65,
        carbs: 220,
        fat: 58,
        fiber: 25,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.firstName}!</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>

        {nutritionSummary && (
          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>Today's Nutrition</Text>
            <View style={styles.progressContainer}>
              <ProgressBar
                current={nutritionSummary.calories}
                target={dailyGoals.calories}
                label="Calories"
                color={theme.colors.primary}
              />
              <ProgressBar
                current={nutritionSummary.protein}
                target={dailyGoals.protein}
                label="Protein (g)"
                color={theme.colors.accent}
              />
              <ProgressBar
                current={nutritionSummary.carbs}
                target={dailyGoals.carbs}
                label="Carbs (g)"
                color={theme.colors.success}
              />
              <ProgressBar
                current={nutritionSummary.fat}
                target={dailyGoals.fat}
                label="Fat (g)"
                color={theme.colors.warning}
              />
            </View>
          </View>
        )}

        <View style={styles.quickStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {nutritionSummary ? Math.round(nutritionSummary.calories) : '0'}
            </Text>
            <Text style={styles.statLabel}>Calories Today</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {nutritionSummary ? Math.round(nutritionSummary.protein) : '0'}g
            </Text>
            <Text style={styles.statLabel}>Protein</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Goals</Text>
          <View style={styles.goalItem}>
            <Text style={styles.goalText}>Drink 8 glasses of water</Text>
            <Text style={styles.goalProgress}>6/8</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalText}>Take prenatal vitamin</Text>
            <Text style={styles.goalComplete}>✓</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalText}>Log 3 meals</Text>
            <Text style={styles.goalProgress}>2/3</Text>
          </View>
        </View>

        {/* Today's Journal Summary */}
        {todayJournalEntry && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Journal</Text>
            <TouchableOpacity 
              style={styles.journalSummary}
              onPress={() => (navigation as any).navigate('Journal', {
                screen: 'JournalEntry',
                params: { entry: todayJournalEntry }
              })}
            >
              <View style={styles.journalHeader}>
                {todayJournalEntry.mood && (
                  <Text style={styles.journalMood}>
                    {['', '😢', '😟', '😐', '🙂', '😊'][todayJournalEntry.mood]}
                  </Text>
                )}
                <Text style={styles.journalTitle}>View Entry</Text>
              </View>
              {todayJournalEntry.symptoms && todayJournalEntry.symptoms.length > 0 && (
                <Text style={styles.journalSymptoms}>
                  {todayJournalEntry.symptoms.slice(0, 2).join(', ')}
                  {todayJournalEntry.symptoms.length > 2 && ` +${todayJournalEntry.symptoms.length - 2} more`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Notification Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <TouchableOpacity 
            style={styles.notificationStatus}
            onPress={() => (navigation as any).navigate('NotificationSettings')}
          >
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>
                {preferences.enabled ? '🔔 Notifications Active' : '🔕 Notifications Off'}
              </Text>
              {preferences.enabled && (
                <Text style={styles.notificationSubtitle}>
                  {scheduledCount} reminder{scheduledCount !== 1 ? 's' : ''} scheduled
                </Text>
              )}
              {!permissionsGranted && (
                <Text style={styles.notificationWarning}>
                  ⚠️ Permissions not granted
                </Text>
              )}
            </View>
            <Text style={styles.notificationArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('FoodLogging')}
          >
            <Text style={styles.actionText}>Log Food</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.scanActionButton]}
            onPress={() => (navigation as any).navigate('FoodLogging', { 
              screen: 'BarcodeScanner',
              params: { mealType: 'snack' }
            })}
          >
            <Text style={styles.actionText}>📷 Scan Barcode</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('Journal', {
              screen: todayJournalEntry ? 'JournalEntry' : 'JournalEntry',
              params: todayJournalEntry ? { entry: todayJournalEntry } : undefined
            })}
          >
            <Text style={styles.actionText}>
              {todayJournalEntry ? '📝 Update Journal' : '📝 Create Journal Entry'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('Journal')}
          >
            <Text style={styles.actionText}>View Journal History</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  nutritionSection: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  progressContainer: {
    marginTop: theme.spacing.md,
  },
  quickStats: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  section: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.lg,
    marginTop: 0,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  goalText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  goalProgress: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
  goalComplete: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.bold,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  scanActionButton: {
    backgroundColor: theme.colors.accent,
  },
  actionText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  journalSummary: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  journalMood: {
    fontSize: 24,
  },
  journalTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.primary,
  },
  journalSymptoms: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  notificationStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  notificationSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  notificationWarning: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.warning,
    marginTop: theme.spacing.xs,
  },
  notificationArrow: {
    fontSize: 24,
    color: theme.colors.text.muted,
    marginLeft: theme.spacing.sm,
  },
});
