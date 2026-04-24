// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { NutritionSection } from '../components/food/NutritionSection';
import { BabyThisWeekCard } from '../components/pregnancy/BabyThisWeekCard';
import { MicronutrientChart } from '../components/charts/MicronutrientChart';
import { WeekTransitionModal } from '../components/pregnancy/WeekTransitionAnimation';
import { NutritionDetailsModal, NutritionBreakdownModal } from '../components/modals';
import { Toast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import { DashboardSkeleton } from '../components/skeletons';
import { SkeletonPregnancyWeek, SkeletonMicronutrientChart } from '../components/skeletons/SkeletonLoader';
import { CalendarStrip } from '../components/charts/CalendarStrip';
import { journalAPI } from '../services/api';
import { FEATURE_ICONS } from '../components/icons/iconConstants';
import { JournalEntry } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { usePregnancyProgress } from '../hooks/usePregnancyProgress';
import { useMicronutrientCalculator } from '../hooks/useMicronutrientCalculator';
import { WeightTracker } from '../components/charts/WeightTracker';
import { useCelebrations } from '../hooks/useCelebrations';
import { createFadeInSlideUpAnimation, ANIMATION_CONFIG } from '../utils/animations';
import CelebrationModal from '../components/modals/CelebrationModal';
import { useUserStore } from '../store/useUserStore';
import { useNutritionStore } from '../store/useNutritionStore';
import { getSizeComparison, getWeekMilestones } from '../utils/pregnancyCalculations';

// Helper functions for time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const getGreetingEmoji = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '☀️';
  if (hour < 17) return '🌤️';
  return '🌙';
};

const TAB_BAR_HEIGHT = 70;
const TAB_BAR_BOTTOM_MARGIN = 20;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { bottom: safeBottom } = useSafeAreaInsets();
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
  const [showNutritionBreakdownModal, setShowNutritionBreakdownModal] = useState(false);

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

  // Fetch journal entry for selected date (never throws so refresh still succeeds)
  const fetchJournalForDate = async (date: Date): Promise<void> => {
    try {
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      const dateString = localDate.toISOString().split('T')[0];

      const entries = await journalAPI.getJournalEntries(dateString, dateString);
      setTodayJournalEntry(entries?.length > 0 ? entries[0] : null);
    } catch (err: any) {
      // Silently ignore journal fetch failures in UI; they’re usually auth/connection blips.
      // In development you can temporarily re-enable this log if you’re debugging the API:
      // if (__DEV__) console.warn('Error fetching journal entry:', err);
      setTodayJournalEntry(null);
    }
  };

  // Load all data (journal failure does not fail the whole load)
  const loadAllData = useCallback(async (date: Date = selectedDate) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    const dateString = localDate.toISOString().split('T')[0];

    const results = await Promise.allSettled([
      fetchProfile(),
      fetchDailySummary(dateString),
      fetchTargets(),
      fetchJournalForDate(date),
    ]);
    const rejected = results.filter((r) => r.status === 'rejected');
    if (rejected.length > 0 && rejected.length === results.length) {
      throw new Error('Failed to load dashboard data');
    }
    if (rejected.length > 0) {
      rejected.forEach((r) => r.status === 'rejected' && console.warn('Dashboard load item failed:', r.reason));
    }
  }, [selectedDate]);

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
    }, [loadAllData, selectedDate])
  );

  // Handle date selection with fade animation
  const handleDateSelect = useCallback((date: Date) => {
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
  }, [loadAllData, contentOpacity]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleNavigateToFood = useCallback(() => {
    (navigation as any).navigate('FoodLogging', { date: selectedDate.toISOString() });
  }, [navigation, selectedDate]);

  const handleNavigateToJournal = useCallback((entry: any) => {
    (navigation as any).navigate('Journal', { screen: 'JournalEntry', params: { entry } });
  }, [navigation]);

  const handleWeightUpdate = useCallback(() => fetchProfile(), []);

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
      <ScreenWrapper edges={['bottom']} backgroundColor={theme.colors.background}>
        <DashboardHeader />
        <DashboardSkeleton />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper edges={['bottom']} useSafeArea={false} backgroundColor={theme.colors.background}>
      <DashboardHeader />

      {/* Compact Calendar Section */}
      <View style={styles.calendarContainer}>
        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          snapBackToTodayAfterMs={5000}
        />
      </View>

      {/* Main Content with Fade Transition */}
      {/* @ts-ignore: Animated.ScrollView types are tricky with children in React 19 */}
      <Animated.ScrollView
        style={[styles.scrollView, { opacity: contentOpacity }]}
        contentContainerStyle={[
          styles.scrollViewContent,
          { paddingBottom: TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + safeBottom + theme.spacing.lg },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* Today in week X – first scan anchor */}
        {pregnancyInfo?.week != null && (
          <View style={styles.todayInWeekRow}>
            <Text style={styles.todayInWeekText}>
              Today in week {pregnancyInfo.week}
            </Text>
          </View>
        )}

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
              sizeComparison={getSizeComparison(pregnancyInfo?.week || 0)}
              milestones={getWeekMilestones(pregnancyInfo?.week || 0)}
            />
          </Animated.View>
        ) : null}


        {/* Macronutrients Section - Clickable for breakdown */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowNutritionBreakdownModal(true)}
          accessible={true}
          accessibilityLabel="View nutrition breakdown"
          accessibilityHint="Double tap to see food breakdown and macro sources"
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
              onAction={handleNavigateToFood}
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
            onWeightUpdate={handleWeightUpdate}
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
              onPress={() => handleNavigateToJournal(todayJournalEntry)}
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

      {/* Nutrition Details Modal (info/guidelines) */}
      <NutritionDetailsModal
        visible={showNutritionModal}
        onClose={() => setShowNutritionModal(false)}
        targets={targets}
      />

      {/* Nutrition Breakdown Modal (calories/macros expansion) */}
      <NutritionBreakdownModal
        visible={showNutritionBreakdownModal}
        onClose={() => setShowNutritionBreakdownModal(false)}
        date={selectedDate}
        summary={summary}
        targets={targets}
        onOpenInfoGuide={() => {
          setShowNutritionBreakdownModal(false);
          setShowNutritionModal(true);
        }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    zIndex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollViewContent: {
    paddingTop: theme.spacing.sectionSpacing,
    paddingHorizontal: 0,
  },
  todayInWeekRow: {
    paddingHorizontal: theme.layout.screenPadding,
    marginBottom: theme.spacing.sm,
  },
  todayInWeekText: {
    ...theme.typography.presets.sectionTitle,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.semibold,
  },
  pregnancySection: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sectionSpacing,
  },
  section: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.layout.screenPadding,
    marginTop: theme.spacing.sectionTitleTop,
    marginBottom: theme.spacing.sectionSpacing,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.card,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  sectionTitle: {
    ...theme.typography.presets.sectionTitle,
    color: theme.colors.text.primary,
    marginTop: 0,
    marginBottom: theme.spacing.sectionTitleBottom,
  },
  sectionSubtitle: {
    ...theme.typography.presets.sectionSubtitle,
    color: theme.colors.text.secondary,
    marginBottom: 0,
  },
  journalSummary: {
    backgroundColor: theme.colors.surface,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  journalMood: {
    fontSize: theme.typography.fontSize.xxxl,
  },
  journalTitle: {
    ...theme.typography.presets.body,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.primary,
  },
  journalSymptoms: {
    ...theme.typography.presets.caption,
    color: theme.colors.text.secondary,
  },
});
