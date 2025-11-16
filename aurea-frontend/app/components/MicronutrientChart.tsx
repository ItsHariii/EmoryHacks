import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { MicronutrientData } from '../types';
import { MICRONUTRIENT_ICONS, ICON_COLORS, ICON_BACKGROUNDS } from './icons/iconConstants';
import { createScaleAnimation, createFadeInSlideUpAnimation, createPulseAnimation, ANIMATION_CONFIG } from '../utils/animations';
import { Card } from './Card';

interface MicronutrientChartProps {
  nutrients: MicronutrientData[];
  onNutrientPress?: (nutrient: MicronutrientData) => void;
}

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

  // Get low nutrients (below 70% of target)
  const lowNutrients = nutrients.filter(n => n.percentOfTarget < 70);

  return (
    <View style={styles.container}>
      {/* Nutrient Bars */}
      <View style={styles.barsContainer}>
        {nutrients.map((nutrient, index) => (
          <NutrientBar
            key={nutrient.name}
            nutrient={nutrient}
            index={index}
            onPress={() => handleNutrientPress(nutrient)}
          />
        ))}
      </View>

      {/* Low Nutrient Suggestions */}
      {lowNutrients.length > 0 && (
        <LowNutrientSuggestions nutrients={lowNutrients} />
      )}

      {/* Nutrient Detail Modal */}
      <NutrientDetailModal
        visible={modalVisible}
        nutrient={selectedNutrient}
        onClose={handleCloseModal}
      />
    </View>
  );
};

/**
 * Individual nutrient bar component with animation
 */
interface NutrientBarProps {
  nutrient: MicronutrientData;
  index: number;
  onPress: () => void;
}

const NutrientBar: React.FC<NutrientBarProps> = ({ nutrient, index, onPress }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;
  const translateYValue = useRef(new Animated.Value(ANIMATION_CONFIG.slideDistance)).current;
  const progressValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Fade in and slide up on mount with stagger
    createFadeInSlideUpAnimation(
      opacityValue,
      translateYValue,
      ANIMATION_CONFIG.normal,
      index * 50 // Stagger delay
    ).start();

    // Animate progress bar fill
    Animated.timing(progressValue, {
      toValue: Math.min(nutrient.percentOfTarget, 100),
      duration: ANIMATION_CONFIG.slow,
      delay: index * 50,
      useNativeDriver: false,
    }).start(() => {
      // Start subtle pulse when animation completes
      if (nutrient.percentOfTarget >= 90) {
        createPulseAnimation(pulseValue, 0.98, 1.02, 2000).start();
      }
    });
  }, [nutrient.percentOfTarget, index]);

  const handlePressIn = () => {
    createScaleAnimation(scaleValue, ANIMATION_CONFIG.scaleDown).start();
  };

  const handlePressOut = () => {
    createScaleAnimation(scaleValue, ANIMATION_CONFIG.scaleNormal).start();
  };

  // Get icon for nutrient
  const getIconName = (name: string) => {
    const key = name.toLowerCase().replace(/\s+/g, '_');
    return MICRONUTRIENT_ICONS[key] || 'nutrition';
  };

  // Get color based on percentage
  const getBarColor = (percent: number): string => {
    if (percent >= 90) return theme.colors.success; // Green
    if (percent >= 70) return theme.colors.warning; // Yellow
    return theme.colors.error; // Red
  };

  const barColor = getBarColor(nutrient.percentOfTarget);
  const iconName = getIconName(nutrient.name);

  return (
    <Animated.View
      style={[
        styles.nutrientBarContainer,
        {
          opacity: opacityValue,
          transform: [
            { translateY: translateYValue },
            { scale: scaleValue },
          ],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${nutrient.name}: ${nutrient.current.toFixed(1)} of ${nutrient.target.toFixed(1)} ${nutrient.unit}`}
        accessibilityHint="Tap to view details and food sources"
      >
        <View style={styles.nutrientBarContent}>
          {/* Icon and Name */}
          <View style={styles.nutrientInfo}>
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: pulseValue }] },
              ]}
            >
              <MaterialCommunityIcons
                name={iconName}
                size={15}
                color={ICON_COLORS.primary}
              />
            </Animated.View>
            <Text style={styles.nutrientName}>{nutrient.name}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: barColor,
                    width: progressValue.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.percentageText}>
              {Math.round(nutrient.percentOfTarget)}%
            </Text>
          </View>

          {/* Values */}
          <View style={styles.valuesContainer}>
            <Text style={styles.valueText}>
              {nutrient.current.toFixed(1)} / {nutrient.target.toFixed(1)} {nutrient.unit}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
          <Text style={styles.suggestionTitle}>Try adding these foods</Text>
        </View>
        <Text style={styles.suggestionSubtitle}>
          Boost your {nutrients.map(n => n.name).join(', ')} intake with:
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

  const getBarColor = (percent: number): string => {
    if (percent >= 90) return theme.colors.success;
    if (percent >= 70) return theme.colors.warning;
    return theme.colors.error;
  };

  const getIconName = (name: string) => {
    const key = name.toLowerCase().replace(/\s+/g, '_');
    return MICRONUTRIENT_ICONS[key] || 'nutrition';
  };

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
  barsContainer: {
    gap: theme.spacing.sm,
  },
  nutrientBarContainer: {
    marginBottom: theme.spacing.xs,
  },
  nutrientBarContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.sm,
  },
  nutrientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.md,
    backgroundColor: ICON_BACKGROUNDS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  nutrientName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginRight: theme.spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
  percentageText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  valuesContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  valueText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  // Suggestions styles
  suggestionsContainer: {
    marginTop: theme.spacing.md,
  },
  suggestionCard: {
    backgroundColor: theme.colors.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
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
