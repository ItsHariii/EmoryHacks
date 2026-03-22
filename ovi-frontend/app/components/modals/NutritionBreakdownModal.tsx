// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { NutritionSummary, NutritionTargets, MealType } from '../../types';
import { foodAPI } from '../../services/api';
import { ProgressBar } from '../charts/ProgressBar';

interface NutritionBreakdownModalProps {
  visible: boolean;
  onClose: () => void;
  date: Date;
  summary: NutritionSummary | null;
  targets: NutritionTargets | null;
  onOpenInfoGuide?: () => void;
}

type NormalizedEntry = {
  foodName: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  meal_type: MealType;
  servingInfo?: string;
};

const getEntryDisplay = (entry: any): NormalizedEntry => {
  const food = entry.food;
  const name = food?.name ?? entry.food_name ?? entry.name ?? 'Unknown';
  const nutrients = entry.nutrients_logged || {};
  let servingInfo: string | undefined;
  if (entry.quantity != null && entry.serving_size != null && entry.serving_unit != null) {
    servingInfo = `${entry.quantity} ${entry.serving_size} ${entry.serving_unit}`;
  } else if (entry.total_amount != null && entry.total_unit != null) {
    servingInfo = `${entry.total_amount} ${entry.total_unit}`;
  }
  return {
    foodName: typeof name === 'string' ? name : 'Unknown',
    protein: nutrients.protein ?? entry.protein_logged ?? 0,
    carbs: nutrients.carbs ?? entry.carbs_logged ?? 0,
    fat: nutrients.fat ?? entry.fat_logged ?? 0,
    calories: entry.calories_logged ?? 0,
    meal_type: entry.meal_type ?? 'snack',
    servingInfo,
  };
};

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

function formatDateLabel(d: Date): string {
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return "Today's Nutrition";
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  return `${d.toLocaleDateString(undefined, options)} Nutrition`;
}

export const NutritionBreakdownModal: React.FC<NutritionBreakdownModalProps> = ({
  visible,
  onClose,
  date,
  summary,
  targets,
  onOpenInfoGuide,
}) => {
  const [foodEntries, setFoodEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!visible) return;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    setLoading(true);
    try {
      const entries = await foodAPI.getFoodEntries(dateStr);
      setFoodEntries(entries ?? []);
    } catch {
      setFoodEntries([]);
    } finally {
      setLoading(false);
    }
  }, [visible, date]);

  useEffect(() => {
    if (visible) {
      loadEntries();
    }
  }, [visible, loadEntries]);

  const normalizedEntries = foodEntries.map(getEntryDisplay);

  const groupByMeal = () => {
    const grouped: Record<MealType, NormalizedEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    normalizedEntries.forEach((e) => {
      grouped[e.meal_type].push(e);
    });
    return grouped;
  };

  const grouped = groupByMeal();

  // Macro sources: for each macro, list foods with amounts
  const proteinSources = normalizedEntries
    .filter((e) => e.protein > 0)
    .sort((a, b) => b.protein - a.protein);
  const carbsSources = normalizedEntries
    .filter((e) => e.carbs > 0)
    .sort((a, b) => b.carbs - a.carbs);
  const fatSources = normalizedEntries
    .filter((e) => e.fat > 0)
    .sort((a, b) => b.fat - a.fat);

  const hasData = summary && targets;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{formatDateLabel(date)}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {!hasData ? (
              <Text style={styles.emptyText}>No nutrition data available.</Text>
            ) : (
              <>
                {/* Summary header - no circle, compact stats */}
                <View style={styles.summaryHeader}>
                  <View style={styles.summaryMain}>
                    <Text style={styles.summaryCalorieValue}>{Math.round(summary!.total_calories)}</Text>
                    <Text style={styles.summaryCalorieLabel}>kcal</Text>
                  </View>
                  <Text style={styles.summaryTarget}>of {Math.round(targets!.calories)} goal</Text>
                </View>

                {/* Targets */}
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>Progress vs Targets</Text>
                  <ProgressBar
                    current={summary!.total_calories}
                    target={targets!.calories}
                    label="Calories"
                    color={theme.colors.primary}
                    showNumbers={true}
                  />
                  <ProgressBar
                    current={summary!.protein_g || 0}
                    target={targets!.macros.protein_g}
                    label="Protein"
                    color={theme.colors.macroProtein}
                    showNumbers={true}
                  />
                  <ProgressBar
                    current={summary!.carbs_g || 0}
                    target={targets!.macros.carbs_g}
                    label="Carbs"
                    color={theme.colors.macroCarbs}
                    showNumbers={true}
                  />
                  <ProgressBar
                    current={summary!.fat_g || 0}
                    target={targets!.macros.fat_g}
                    label="Fat"
                    color={theme.colors.macroFats}
                    showNumbers={true}
                  />
                </View>

                {/* What you've eaten */}
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>What You've Eaten</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
                  ) : normalizedEntries.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <MaterialCommunityIcons name="food-off" size={32} color={theme.colors.text.muted} />
                      <Text style={styles.emptyCardText}>No meals logged for this day</Text>
                      <Text style={styles.emptyCardSubtext}>Log meals to see your breakdown</Text>
                    </View>
                  ) : (
                    MEAL_ORDER.map((mealType) => {
                      const entries = grouped[mealType];
                      if (!entries || entries.length === 0) return null;
                      return (
                        <View key={mealType} style={styles.mealGroup}>
                          <Text style={styles.mealLabel}>{MEAL_LABELS[mealType]}</Text>
                          {entries.map((entry, idx) => (
                            <View key={idx} style={styles.foodRow}>
                              <View style={styles.foodInfo}>
                                <Text style={styles.foodName}>{entry.foodName}</Text>
                                <Text style={styles.foodMacros}>
                                  {entry.servingInfo && `${entry.servingInfo} • `}
                                  {entry.calories > 0 && `${Math.round(entry.calories)} cal`}
                                  {(entry.protein > 0 || entry.carbs > 0 || entry.fat > 0) && ' • '}
                                  {entry.protein > 0 && `P ${Math.round(entry.protein)}g`}
                                  {entry.carbs > 0 && ` C ${Math.round(entry.carbs)}g`}
                                  {entry.fat > 0 && ` F ${Math.round(entry.fat)}g`}
                                </Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })
                  )}
                </View>

                {/* Where macros come from */}
                {normalizedEntries.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Where Your Macros Come From</Text>
                    <MacroSourceList
                      label="Protein"
                      color={theme.colors.macroProtein}
                      sources={proteinSources}
                      keyName="protein"
                    />
                    <MacroSourceList
                      label="Carbs"
                      color={theme.colors.macroCarbs}
                      sources={carbsSources}
                      keyName="carbs"
                    />
                    <MacroSourceList
                      label="Fat"
                      color={theme.colors.macroFats}
                      sources={fatSources}
                      keyName="fat"
                    />
                  </View>
                )}

                {/* Info link */}
                {onOpenInfoGuide && (
                  <TouchableOpacity
                    style={styles.infoLink}
                    onPress={onOpenInfoGuide}
                    accessibilityLabel="View nutrition guidelines"
                  >
                    <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.infoLinkText}>View nutrition guidelines</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

interface MacroSourceListProps {
  label: string;
  color: string;
  sources: NormalizedEntry[];
  keyName: 'protein' | 'carbs' | 'fat';
}

const MacroSourceList: React.FC<MacroSourceListProps> = ({ label, color, sources, keyName }) => {
  if (sources.length === 0) return null;
  return (
    <View style={styles.macroSourceCard}>
      <View style={[styles.macroSourceHeader, { borderLeftColor: color }]}>
        <Text style={styles.macroSourceLabel}>{label}</Text>
      </View>
      <View style={styles.macroSourceItems}>
        {sources.map((s, idx) => (
          <Text key={idx} style={styles.macroSourceItem}>
            {s.foodName} {Math.round(s[keyName])}g
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '90%',
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  summaryMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: theme.spacing.sm,
  },
  summaryCalorieValue: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  summaryCalorieLabel: {
    fontSize: 18,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginLeft: 6,
  },
  summaryTarget: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  loader: {
    marginVertical: theme.spacing.lg,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyCardSubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  mealGroup: {
    marginBottom: theme.spacing.lg,
  },
  mealLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  foodRow: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  foodMacros: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  macroSourceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  macroSourceHeader: {
    borderLeftWidth: 4,
    paddingLeft: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  macroSourceLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  macroSourceItems: {
    gap: 4,
  },
  macroSourceItem: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  infoLinkText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
  },
});
