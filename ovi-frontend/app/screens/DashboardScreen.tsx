import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { DashboardHeader } from '../components/DashboardHeader';
import { NutritionSection } from '../components/NutritionSection';
import { BabyThisWeekCard } from '../components/BabyThisWeekCard';
import { MicronutrientChart } from '../components/MicronutrientChart';
import { WeekTransitionModal } from '../components/WeekTransitionAnimation';
import { NutritionDetailsModal } from '../components/NutritionDetailsModal';
import { Toast } from '../components/Toast';
import { EmptyState } from '../components/EmptyState';
import { DashboardSkeleton } from '../components/skeletons';
import { SkeletonPregnancyWeek, SkeletonMicronutrientChart } from '../components/SkeletonLoader';
import { CalendarStrip } from '../components/CalendarStrip';
import { journalAPI } from '../services/api';
import { FEATURE_ICONS } from '../components/icons/iconConstants';
import { JournalEntry } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { usePregnancyProgress } from '../hooks/usePregnancyProgress';
import { useMicronutrientCalculator } from '../hooks/useMicronutrientCalculator';
import { WeightTracker } from '../components/WeightTracker';
import { useCelebrations } from '../hooks/useCelebrations';
import { createFadeInSlideUpAnimation, ANIMATION_CONFIG } from '../utils/animations';
import CelebrationModal from '../components/CelebrationModal';
import { useUserStore } from '../store/useUserStore';
import { useNutritionStore } from '../store/useNutritionStore';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { checkPermissions } = useNotifications();

  // Zustand Stores
  const { profile, fetchProfile, loading: userLoading } = useUserStore();
  const { summary, targets, loading: nutritionLoading, fetchDailySummary, fetchTargets } = useNutritionStore();

  // Celebrations hook
  const {
    celebrate,
    dismissCelebration,
    currentCelebration,
    showCelebration
  } = useCelebrations();

  // Custom hooks
  const {
    pregnancyInfo,
    weekChanged,
    dismissWeekChange,
    loading: pregnancyLoading,
    error: pregnancyError
  } = usePregnancyProgress();

  // Calculate micronutrients
  const micronutrients = useMicronutrientCalculator(summary, targets);

  // Local state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [todayJournalEntry, setTodayJournalEntry] = useState<JournalEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Modal state
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  // Animation values
  const pregnancyOpacity = useRef(new Animated.Value(0)).current;
  const pregnancyTranslateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;

  const macroOpacity = useRef(new Animated.Value(0)).current;
  const macroTranslateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;

  const microOpacity = useRef(new Animated.Value(0)).current;
  const microTranslateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;

  const journalOpacity = useRef(new Animated.Value(0)).current;
  const journalTranslateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;

  // Content fade animation for date switching
  const contentOpacity = useRef(new Animated.Value(1)).current;

  // Scroll position for header animation
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch journal entry for selected date
  const fetchJournalForDate = async (date: Date) => {
    try {
      // Adjust for timezone offset to ensure we get the correct local date string
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      const dateString = localDate.toISOString().split('T')[0];

      const entries = await journalAPI.getJournalEntries(dateString, dateString);
      if (entries && entries.length > 0) {
        setTodayJournalEntry(entries[0]);
      } else {
        setTodayJournalEntry(null);
      }
    } catch (err: any) {
      console.error('Error fetching journal entry:', err);
      setTodayJournalEntry(null);
    }
  };

  // Load all data
  const loadAllData = async (date: Date = selectedDate) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    const dateString = localDate.toISOString().split('T')[0];

    await Promise.all([
      fetchProfile(),
      fetchDailySummary(dateString),
      fetchTargets(),
      fetchJournalForDate(date),
    ]);
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);

    try {
      await loadAllData();

      setToastMessage('Data refreshed successfully');
      setToastVariant('success');
      setToastVisible(true);
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
      setToastMessage('Failed to refresh data');
      setToastVariant('error');
      setToastVisible(true);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAllData(selectedDate);
      checkPermissions();
    }, [selectedDate])
  );

  // Handle date selection
  // Handle date selection with fade animation
  const handleDateSelect = (date: Date) => {
    // Fade out
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedDate(date);
      loadAllData(date).then(() => {
        // Fade in
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Progressive loading states
  const isInitialLoading = (userLoading || pregnancyLoading || nutritionLoading) && !profile && !summary;
  const isPregnancyLoaded = !pregnancyLoading && pregnancyInfo;
  const isNutritionLoaded = !nutritionLoading && summary;

  // Animations
  useEffect(() => {
    if (isPregnancyLoaded) {
      createFadeInSlideUpAnimation(pregnancyOpacity, pregnancyTranslateY, ANIMATION_CONFIG.normal, 0).start();
    }
  }, [isPregnancyLoaded]);

  useEffect(() => {
    if (isNutritionLoaded) {
      createFadeInSlideUpAnimation(macroOpacity, macroTranslateY, ANIMATION_CONFIG.normal, 0).start();
      createFadeInSlideUpAnimation(microOpacity, microTranslateY, ANIMATION_CONFIG.normal, 100).start();
    }
  }, [isNutritionLoaded]);

  useEffect(() => {
    if (todayJournalEntry) {
      createFadeInSlideUpAnimation(journalOpacity, journalTranslateY, ANIMATION_CONFIG.normal, 0).start();
    }
  }, [todayJournalEntry]);

  // Celebration check
  useEffect(() => {
    if (summary && targets) {
      const caloriePercentage = (summary.total_calories / targets.calories) * 100;
      if (caloriePercentage >= 100) {
        celebrate('daily_calories_100_percent');
      }
    }
  }, [summary, targets, celebrate]);

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <DashboardHeader />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DashboardHeader />

      <View style={styles.greetingSection}>
        <Text style={styles.greetingText}>
          {isToday(selectedDate)
            ? `Hello, ${profile?.first_name || 'there'}!`
            : selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
        <Text style={styles.greetingSubtext}>
          {isToday(selectedDate)
            ? 'How are you doing today?'
            : 'Here is your summary for this day'}
        </Text>
      </View>

      <CalendarStrip
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />



      {/* Main Content with Fade Transition */}
      <Animated.ScrollView
        style={[styles.scrollView, { opacity: contentOpacity }]}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Pregnancy Week Display */}
        {pregnancyLoading && !pregnancyInfo ? (
          <View style={styles.pregnancySection}>
            <SkeletonPregnancyWeek />
          </View>
        ) : pregnancyInfo ? (
          <Animated.View
            style={[
              styles.pregnancySection,
              {
                opacity: pregnancyOpacity,
                transform: [{ translateY: pregnancyTranslateY }],
              },
            ]}
          >
            <BabyThisWeekCard
              week={pregnancyInfo?.week || 0}
            />
          </Animated.View>
        ) : null}


        {/* Macronutrients Section - Clickable for details */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowNutritionModal(true)}
          accessible={true}
          accessibilityLabel="View nutrition details"
          accessibilityHint="Double tap to see detailed nutrition guidelines"
        >
          <NutritionSection opacity={macroOpacity} translateY={macroTranslateY} />
        </TouchableOpacity>

        {/* Micronutrients Chart - Clickable for details */}
        {nutritionLoading && !summary ? (
          <View style={styles.section}>
            <SkeletonMicronutrientChart />
          </View>
        ) : micronutrients.length > 0 ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowNutritionModal(true)}
          >
            <Animated.View
              style={[
                styles.section,
                {
                  opacity: microOpacity,
                  transform: [{ translateY: microTranslateY }],
                },
              ]}
            >
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Key Pregnancy Nutrients</Text>
                  <Text style={styles.sectionSubtitle}>
                    Tap for detailed guidelines
                  </Text>
                </View>
                <MaterialCommunityIcons name="information-outline" size={24} color={theme.colors.primary} />
              </View>
              <MicronutrientChart nutrients={micronutrients} />
            </Animated.View>
          </TouchableOpacity>
        ) : summary && summary.total_calories === 0 ? (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: microOpacity,
                transform: [{ translateY: microTranslateY }],
              },
            ]}
          >
            <EmptyState
              icon={FEATURE_ICONS.food}
              headline="Log some meals to see your nutrient breakdown"
              description="Once you start tracking your meals, you'll see detailed insights about your vitamin and mineral intake."
              actionLabel="Log a Meal"
              onAction={() => (navigation as any).navigate('FoodLogging', { date: selectedDate.toISOString() })}
            />
          </Animated.View>
        ) : null}

        {/* Weight Tracker */}
        <Animated.View
          style={{
            opacity: macroOpacity, // Reuse macro animation for simplicity
            transform: [{ translateY: macroTranslateY }],
          }}
        >
          <WeightTracker
            currentWeight={profile?.current_weight}
            onWeightUpdate={() => fetchProfile()}
          />
        </Animated.View>

        {/* Today's Journal Summary */}
        {todayJournalEntry && (
          <Animated.View
            style={[
              styles.section,
              {
                opacity: journalOpacity,
                transform: [{ translateY: journalTranslateY }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>
              {isToday(selectedDate) ? "Today's Journal" : "Journal Entry"}
            </Text>
            <TouchableOpacity
              style={styles.journalSummary}
              onPress={() => (navigation as any).navigate('Journal', {
                screen: 'JournalEntry',
                params: { entry: todayJournalEntry }
              })}
              accessible={true}
              accessibilityLabel="View today's journal entry"
              accessibilityRole="button"
              accessibilityHint="Opens your journal entry for today"
            >
              <View style={styles.journalHeader}>
                {todayJournalEntry.mood && (
                  <Text style={styles.journalMood}>
                    {['', '😢', '😟', '😐', '🙂', '😊'][todayJournalEntry?.mood || 0]}
                  </Text>
                )}
                <Text style={styles.journalTitle}>View Entry</Text>
              </View>
              {todayJournalEntry.symptoms && todayJournalEntry.symptoms.length > 0 && (
                <Text style={styles.journalSymptoms}>
                  {todayJournalEntry?.symptoms?.slice(0, 2).join(', ')}
                  {(todayJournalEntry?.symptoms?.length || 0) > 2 && ` + ${(todayJournalEntry?.symptoms?.length || 0) - 2} more`}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.ScrollView>

      {/* Week Transition Animation */}
      {
        pregnancyInfo && weekChanged && (
          <WeekTransitionModal
            visible={weekChanged}
            week={pregnancyInfo?.week || 0}
            onDismiss={dismissWeekChange}
          />
        )
      }

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Celebration Modal */}
      {
        currentCelebration && (
          <CelebrationModal
            visible={showCelebration}
            title={currentCelebration?.title || ''}
            message={currentCelebration?.message || ''}
            onDismiss={dismissCelebration}
          />
        )
      }

      {/* Nutrition Details Modal */}
      <NutritionDetailsModal
        visible={showNutritionModal}
        onClose={() => setShowNutritionModal(false)}
        targets={targets}
      />
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  greetingSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  greetingSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  pregnancySection: {
    padding: theme.spacing.lg,
    paddingTop: 0,
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
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
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
  guideCard: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm,
  },
  guideContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  guideTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.inverse,
    marginBottom: 4,
  },
  guideSubtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  guideIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
