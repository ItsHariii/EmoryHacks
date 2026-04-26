// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { MicronutrientData } from '../types';
import { MICRONUTRIENT_ICONS, ICON_COLORS, ICON_BACKGROUNDS } from '../icons/iconConstants';
import { createFadeInSlideUpAnimation, ANIMATION_CONFIG, createProgressFillAnimation } from '../../utils/animations';
import { Card } from '../ui/Card';

interface MicronutrientChartProps {
  nutrients: MicronutrientData[];
  onNutrientPress?: (nutrient: MicronutrientData) => void;
}

const getProgressColor = (_percent: number) => theme.colors.primary;

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

  const handleNutrientPress = (nutrient: MicronutrientData) => {
    setSelectedNutrient(nutrient);
    setModalVisible(true);
    onNutrientPress?.(nutrient);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedNutrient(null), 300);
  };

  const lowNutrients = nutrients.filter(n => n.percentOfTarget < 70);

  return (
    <View style={styles.container}>
      {/* Grid of nutrient cards */}
      <View style={styles.grid}>
        {nutrients.map((nutrient, index) => (
          <NutrientCard
            key={nutrient.name}
            nutrient={nutrient}
            onPress={() => handleNutrientPress(nutrient)}
          />
        ))}
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
  const barColor = getProgressColor(percent);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    createProgressFillAnimation(progressAnim, percent).start();
  }, [percent]);

  return (
    <TouchableOpacity
      style={styles.nutrientCard}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityLabel={`${nutrient.name}: ${Math.round(percent)}% of target`}
      accessibilityRole="button"
    >
      <View style={styles.nutrientCardHeader}>
        <View style={[styles.iconWrapper, { backgroundColor: ICON_BACKGROUNDS.cream }]}>
          <MaterialCommunityIcons
            name={getIconName(nutrient.name) as any}
            size={18}
            color={ICON_COLORS.accent}
          />
        </View>
        <Text style={styles.nutrientName} numberOfLines={1}>{nutrient.name}</Text>
      </View>
      <View style={styles.progressRow}>
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
        <Text style={[styles.percentText, { color: barColor }]}>
          {Math.round(percent)}%
        </Text>
      </View>
      <Text style={styles.currentTarget}>
        {nutrient.current.toFixed(1)} / {nutrient.target.toFixed(1)} {nutrient.unit}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  nutrientCard: {
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.sm,
  },
  nutrientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutrientName: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 4,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    minWidth: 36,
    textAlign: 'right',
  },
  currentTarget: {
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  sectionTitle: {
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
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  suggestionSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  suggestionItem: {
    marginBottom: theme.spacing.sm,
  },
  suggestionNutrientName: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  suggestionFoods: {
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
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    maxHeight: '80%',
    ...theme.shadows.lg,
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
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  modalStatValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  modalSection: {
    marginBottom: theme.spacing.lg,
  },
  modalSectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalSectionText: {
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
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  modalCloseButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
