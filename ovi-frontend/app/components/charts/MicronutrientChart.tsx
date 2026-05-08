// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { MicronutrientData } from '../../types';
import { MICRONUTRIENT_ICONS, ICON_COLORS, ICON_BACKGROUNDS } from '../icons/iconConstants';
import { createFadeInSlideUpAnimation, ANIMATION_CONFIG, createProgressFillAnimation } from '../../utils/animations';
import { Card } from '../ui/Card';

interface MicronutrientChartProps {
  nutrients: MicronutrientData[];
  onNutrientPress?: (nutrient: MicronutrientData) => void;
}

const getProgressColor = (percent: number) =>
  percent >= 80 ? '#6F8C6F' : percent >= 50 ? '#C69348' : '#B84C3F';

// Nutrient-specific bar colors per design spec
const NUTRIENT_BAR_COLORS: Record<string, string> = {
  folate: '#8A9A7B',     // sage
  iron: '#D19B4E',       // ochre
  calcium: '#B84C3F',    // terracotta
  'vit d': '#C4A882',    // warm tan
  'vitamin d': '#C4A882',
};

const getNutrientBarColor = (name: string): string => {
  const key = name.toLowerCase().trim();
  return NUTRIENT_BAR_COLORS[key] || '#C4A882';
};

const getIconName = (name: string) => {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return MICRONUTRIENT_ICONS[key] || 'nutrition';
};

export const MicronutrientChart: React.FC<MicronutrientChartProps> = ({
  nutrients,
  onNutrientPress
}) => {
  const [selectedNutrient, setSelectedNutrient] = useState<MicronutrientData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleNutrientPress = (nutrient: MicronutrientData) => {
    setSelectedNutrient(nutrient);
    setModalVisible(true);
    onNutrientPress?.(nutrient);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setSelectedNutrient(null), 300);
  };

  const lowNutrients = nutrients.filter(n => n.percentOfTarget < 70);

  // 2x2 grid prioritizes the design's canonical four nutrients
  const PRIORITY = ['folate', 'iron', 'calcium', 'vitamin d', 'vit d'];
  const byKey = (n: { name: string }) => n.name.toLowerCase();
  const priorityNutrients = PRIORITY
    .map((p) => nutrients.find((n) => byKey(n).startsWith(p)))
    .filter((n): n is MicronutrientData => !!n);
  const remaining = nutrients.filter((n) => !priorityNutrients.includes(n));
  const gridNutrients = [...priorityNutrients, ...remaining].slice(0, 4);

  return (
    <View style={styles.container}>
      <View style={styles.gridCard}>
        <View style={styles.grid}>
          {gridNutrients.map((nutrient) => (
            <NutrientCard
              key={nutrient.name}
              nutrient={nutrient}
              onPress={() => handleNutrientPress(nutrient)}
            />
          ))}
        </View>
      </View>

      {lowNutrients.length > 0 && (
        <LowNutrientSuggestions nutrients={lowNutrients} />
      )}

      <NutrientDetailModal
        visible={modalVisible}
        nutrient={selectedNutrient}
        onClose={handleCloseModal}
      />
    </View>
  );
};

/**
 * Compact nutrient card with icon, progress bar, and tap-to-expand
 */
const NutrientCard: React.FC<{
  nutrient: MicronutrientData;
  onPress: () => void;
}> = ({ nutrient, onPress }) => {
  const percent = Math.min(nutrient.percentOfTarget, 100);
  const barColor = getNutrientBarColor(nutrient.name);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    createProgressFillAnimation(progressAnim, percent).start();
  }, [percent]);

  // Round to int when value is whole-ish, else 1 decimal
  const fmt = (n: number) => (Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n).toString() : n.toFixed(1));

  return (
    <TouchableOpacity
      style={styles.nutrientCell}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={`${nutrient.name}: ${Math.round(percent)}% of target`}
      accessibilityRole="button"
    >
      <View style={styles.nutrientCellHeader}>
        <Text style={styles.nutrientName} numberOfLines={1}>{nutrient.name}</Text>
        <Text style={styles.percentText}>{Math.round(percent)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
      <Text style={styles.currentTarget}>
        {fmt(nutrient.current)} / {fmt(nutrient.target)} {nutrient.unit}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Low nutrient suggestions component
 */
interface LowNutrientSuggestionsProps {
  nutrients: MicronutrientData[];
}

const LowNutrientSuggestions: React.FC<LowNutrientSuggestionsProps> = ({ nutrients }) => {
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;

  useEffect(() => {
    createFadeInSlideUpAnimation(
      opacityValue,
      translateYValue,
      ANIMATION_CONFIG.normal,
      400 // Delay after bars
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.suggestionsContainer,
        {
          opacity: opacityValue,
          transform: [{ translateY: translateYValue }],
        },
      ]}
    >
      <Card style={styles.suggestionCard}>
        <View style={styles.suggestionHeader}>
          <MaterialCommunityIcons
            name="lightbulb-outline"
            size={20}
            color={ICON_COLORS.accent}
          />
          <Text style={styles.suggestionTitle}>Suggestions</Text>
        </View>
        <Text style={styles.suggestionSubtitle}>
          Boost your intake with these foods:
        </Text>
        {nutrients.slice(0, 2).map((nutrient, index) => (
          <View key={nutrient.name} style={styles.suggestionItem}>
            <Text style={styles.suggestionNutrientName}>{nutrient.name}:</Text>
            <Text style={styles.suggestionFoods}>
              {nutrient.foodSources.slice(0, 3).join(', ')}
            </Text>
          </View>
        ))}
      </Card>
    </Animated.View>
  );
};

/**
 * Nutrient detail modal component
 */
interface NutrientDetailModalProps {
  visible: boolean;
  nutrient: MicronutrientData | null;
  onClose: () => void;
}

const NutrientDetailModal: React.FC<NutrientDetailModalProps> = ({
  visible,
  nutrient,
  onClose
}) => {
  const slideValue = useRef(new Animated.Value(300)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: ANIMATION_CONFIG.normal,
          useNativeDriver: true,
        }),
        Animated.spring(slideValue, {
          toValue: 0,
          useNativeDriver: true,
          speed: 50,
          bounciness: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: ANIMATION_CONFIG.fast,
          useNativeDriver: true,
        }),
        Animated.timing(slideValue, {
          toValue: 300,
          duration: ANIMATION_CONFIG.fast,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!nutrient) return null;

  const getBarColor = (_percent: number): string => theme.colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityValue,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ translateY: slideValue }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with Icon */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalIconContainer}>
                    <MaterialCommunityIcons
                      name={getIconName(nutrient.name)}
                      size={32}
                      color={ICON_COLORS.accent}
                    />
                  </View>
                  <Text style={styles.modalTitle}>{nutrient.name}</Text>
                </View>

                {/* Stats */}
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Current</Text>
                    <Text style={styles.modalStatValue}>
                      {nutrient.current.toFixed(1)} {nutrient.unit}
                    </Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Target</Text>
                    <Text style={styles.modalStatValue}>
                      {nutrient.target.toFixed(1)} {nutrient.unit}
                    </Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Progress</Text>
                    <Text
                      style={[
                        styles.modalStatValue,
                        { color: getBarColor(nutrient.percentOfTarget) },
                      ]}
                    >
                      {Math.round(nutrient.percentOfTarget)}%
                    </Text>
                  </View>
                </View>

                {/* Importance Section */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Why It's Important</Text>
                  <Text style={styles.modalSectionText}>{nutrient.importance}</Text>
                </View>

                {/* Food Sources Section */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Food Sources</Text>
                  <View style={styles.foodSourcesContainer}>
                    {nutrient.foodSources.map((food, index) => (
                      <View key={index} style={styles.foodSourceItem}>
                        <MaterialCommunityIcons
                          name="circle-small"
                          size={20}
                          color={ICON_COLORS.accent}
                        />
                        <Text style={styles.foodSourceText}>{food}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel="Close details"
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gridCard: {
    backgroundColor: '#FDFAF6',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 16,
  },
  nutrientCell: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  nutrientCellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutrientName: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#2B221B',
    flex: 1,
    minWidth: 0,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#EDE6DC',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  percentText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 12,
    color: '#B84C3F',
    textAlign: 'right',
  },
  currentTarget: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#8C7E70',
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  // Suggestions styles
  suggestionsContainer: {
    marginTop: theme.spacing.md,
  },
  suggestionCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 0.5,
    borderColor: theme.colors.border,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  suggestionTitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  suggestionSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  suggestionItem: {
    marginBottom: theme.spacing.sm,
  },
  suggestionNutrientName: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  suggestionFoods: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F6F1EA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: ICON_BACKGROUNDS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
  modalStatLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  modalStatValue: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
  },
  modalSectionTitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalSectionText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  foodSourcesContainer: {
    gap: theme.spacing.xs,
  },
  foodSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodSourceText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  modalCloseButton: {
    backgroundColor: '#2B221B',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseButtonText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
