import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme';
import { HeaderBar } from '../components/HeaderBar';
import { MacronutrientCard } from '../components/MacronutrientCard';
import { PregnancyWeekDisplay } from '../components/PregnancyWeekDisplay';
import { MicronutrientChart } from '../components/MicronutrientChart';
import { WeekTransitionModal } from '../components/WeekTransitionAnimation';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Toast } from '../components/Toast';
import { EmptyState } from '../components/EmptyState';
import { DashboardSkeleton } from '../components/skeletons';
import { SkeletonPregnancyWeek, SkeletonMacroCard, SkeletonMicronutrientChart } from '../components/SkeletonLoader';
import { journalAPI, userAPI } from '../services/api';
import { FEATURE_ICONS } from '../components/icons/iconConstants';
import { JournalEntry } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { useNutritionData } from '../hooks/useNutritionData';
import { usePregnancyProgress } from '../hooks/usePregnancyProgress';
import { useMicronutrientCalculator } from '../hooks/useMicronutrientCalculator';
import { useCelebrations } from '../hooks/useCelebrations';
import { createFadeInSlideUpAnimation, ANIMATION_CONFIG } from '../utils/animations';
import CelebrationModal from '../components/CelebrationModal';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { preferences, scheduledCount, permissionsGranted, checkPermissions } = useNotifications();
  
  // Celebrations hook
  const { 
    celebrate, 
    dismissCelebration, 
    currentCelebration, 
    showCelebration 
  } = useCelebrations();
  
  // Use custom hooks for data fetching
  const { 
    pregnancyInfo, 
    weekChanged, 
    dismissWeekChange, 
    loading: pregnancyLoading,
    error: pregnancyError 
  } = usePregnancyProgress();
  
  const { 
    summary: nutritionSummary, 
    targets: nutritionTargets, 
    loading: nutritionLoading,
    error: nutritionError,
    refresh: refreshNutrition 
  } = useNutritionData();
  
  // Calculate micronutrients from nutrition summary
  const micronutrients = useMicronutrientCalculator(nutritionSummary, nutritionTargets);
  
  // Local state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [todayJournalEntry, setTodayJournalEntry] = useState<JournalEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  // Animation values for fade-in and slide-up
  const pregnancyOpacity = useRef(new Animated.Value(0)).current;
  const pregnancyTranslateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;
  
  const macroOpacity = useRef(new Animated.Value(0)).current;
  const macroTranslateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;
  
  const microOpacity = useRef(new Animated.Value(0)).current;
  const microTranslateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;
  
  const journalOpacity = useRef(new Animated.Value(0)).current;
  const journalTranslateY = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;

  // Scroll position for header animation
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const profile = await userAPI.getCurrentUser();
      setUserProfile(profile);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    }
  };

  // Fetch today's journal entry
  const fetchTodayJournal = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const entries = await journalAPI.getJournalEntries(today, today);
      if (entries && entries.length > 0) {
        setTodayJournalEntry(entries[0]);
      } else {
        setTodayJournalEntry(null);
      }
    } catch (err: any) {
      console.error('Error fetching journal entry:', err);
      // Don't show error for missing journal entry
      setTodayJournalEntry(null);
    }
  };

  // Load all data on mount
  const loadAllData = async () => {
    await Promise.all([
      fetchUserProfile(),
      fetchTodayJournal(),
    ]);
  };

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await Promise.all([
        refreshNutrition(),
        fetchUserProfile(),
        fetchTodayJournal(),
      ]);
      
      // Show success toast
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

  // Load data on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAllData();
      checkPermissions();
    }, [])
  );

  // Progressive loading states
  const isInitialLoading = pregnancyLoading && nutritionLoading && !pregnancyInfo && !nutritionSummary;
  const isPregnancyLoaded = !pregnancyLoading && pregnancyInfo;
  const isNutritionLoaded = !nutritionLoading && nutritionSummary;

  // Trigger staggered animations when data is loaded
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

  // Check for 100% daily calories celebration
  useEffect(() => {
    if (nutritionSummary && nutritionTargets) {
      const caloriePercentage = (nutritionSummary.total_calories / nutritionTargets.calories) * 100;
      if (caloriePercentage >= 100) {
        celebrate('daily_calories_100_percent');
      }
    }
  }, [nutritionSummary, nutritionTargets, celebrate]);
  
  // Show skeleton screen on initial load
  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <HeaderBar
          title="Hello!"
          subtitle="Loading your dashboard..."
          showAvatar={false}
          scrollY={scrollY}
        />
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  // Show error message if critical data failed to load
  if ((pregnancyError || nutritionError) && !pregnancyInfo && !nutritionSummary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Dashboard</Text>
          <Text style={styles.errorMessage}>
            {pregnancyError || nutritionError || 'Please check your connection and try again.'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={onRefresh}
            accessible={true}
            accessibilityLabel="Retry loading data"
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    const firstName = userProfile?.first_name || user?.firstName || '';
    const lastName = userProfile?.last_name || user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <HeaderBar
        title={`Hello, ${userProfile?.first_name || user?.firstName || 'there'}!`}
        subtitle="How are you feeling today?"
        showAvatar={true}
        avatarInitials={getUserInitials()}
        notificationCount={scheduledCount}
        onAvatarPress={() => (navigation as any).navigate('Profile')}
        onNotificationPress={() => (navigation as any).navigate('NotificationSettings')}
        scrollY={scrollY}
      />
      <ScrollView 
        style={styles.scrollView}
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
            <PregnancyWeekDisplay 
              week={pregnancyInfo.week}
              trimester={pregnancyInfo.trimester}
              daysUntilDue={pregnancyInfo.daysUntilDue}
              dueDate={userProfile?.due_date}
            />
          </Animated.View>
        ) : null}

        {/* Macronutrients Section */}
        {nutritionLoading && !nutritionSummary ? (
          <View style={styles.macroSection}>
            <View style={styles.macroGrid}>
              <SkeletonMacroCard />
              <SkeletonMacroCard />
            </View>
            <View style={styles.macroGrid}>
              <SkeletonMacroCard />
              <SkeletonMacroCard />
            </View>
          </View>
        ) : nutritionSummary && nutritionTargets ? (
          <Animated.View 
            style={[
              styles.macroSection,
              {
                opacity: macroOpacity,
                transform: [{ translateY: macroTranslateY }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Today's Macronutrients</Text>
            <View style={styles.macroGrid}>
              <MacronutrientCard
                name="calories"
                current={nutritionSummary.total_calories || 0}
                target={nutritionTargets.calories}
                unit="kcal"
                color={theme.colors.primary}
              />
              <MacronutrientCard
                name="protein"
                current={nutritionSummary.protein_g || 0}
                target={nutritionTargets.macros.protein_g}
                unit="g"
                color={theme.colors.accent}
              />
            </View>
            <View style={styles.macroGrid}>
              <MacronutrientCard
                name="carbs"
                current={nutritionSummary.carbs_g || 0}
                target={nutritionTargets.macros.carbs_g}
                unit="g"
                color={theme.colors.success}
              />
              <MacronutrientCard
                name="fat"
                current={nutritionSummary.fat_g || 0}
                target={nutritionTargets.macros.fat_g}
                unit="g"
                color={theme.colors.warning}
              />
            </View>
          </Animated.View>
        ) : null}

        {/* Micronutrients Chart */}
        {nutritionLoading && !nutritionSummary ? (
          <View style={styles.section}>
            <SkeletonMicronutrientChart />
          </View>
        ) : micronutrients.length > 0 ? (
          <Animated.View 
            style={[
              styles.section,
              {
                opacity: microOpacity,
                transform: [{ translateY: microTranslateY }],
              },
            ]}
          >
            <Text style={styles.sectionTitle}>Key Pregnancy Nutrients</Text>
            <Text style={styles.sectionSubtitle}>
              Tap any nutrient to learn more about its importance
            </Text>
            <MicronutrientChart nutrients={micronutrients} />
          </Animated.View>
        ) : nutritionSummary && nutritionSummary.total_calories === 0 ? (
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
              onAction={() => (navigation as any).navigate('FoodLogging')}
            />
          </Animated.View>
        ) : null}

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
            <Text style={styles.sectionTitle}>Today's Journal</Text>
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
          </Animated.View>
        )}
      </ScrollView>

      {/* Week Transition Animation */}
      {pregnancyInfo && weekChanged && (
        <WeekTransitionModal
          visible={weekChanged}
          week={pregnancyInfo.week}
          onDismiss={dismissWeekChange}
        />
      )}

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastVisible(false)}
      />

      {/* Celebration Modal */}
      {currentCelebration && (
        <CelebrationModal
          visible={showCelebration}
          title={currentCelebration.title}
          message={currentCelebration.message}
          onDismiss={dismissCelebration}
        />
      )}
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
  pregnancySection: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  macroSection: {
    padding: theme.spacing.lg,
    paddingTop: 0,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  retryButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
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
  sectionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
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
