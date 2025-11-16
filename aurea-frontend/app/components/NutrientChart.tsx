import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme';

export interface NutrientData {
  name: string;
  current: number;
  target: number;
  unit: string;
  importance: string;
}

interface NutrientChartProps {
  nutrients: NutrientData[];
}

export const NutrientChart: React.FC<NutrientChartProps> = ({ nutrients }) => {
  const [selectedNutrient, setSelectedNutrient] = useState<NutrientData | null>(null);

  const getStatusColor = (current: number, target: number): string => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return theme.colors.success; // Green
    if (percentage >= 60) return theme.colors.warning; // Yellow
    return theme.colors.error; // Red
  };

  const getStatusText = (current: number, target: number): string => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'Goal Met';
    if (percentage >= 60) return 'Approaching';
    return 'Below Goal';
  };

  const renderNutrientCircle = (nutrient: NutrientData, index: number) => {
    const percentage = Math.min(100, (nutrient.current / nutrient.target) * 100);
    const color = getStatusColor(nutrient.current, nutrient.target);
    const size = 70;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    return (
      <TouchableOpacity
        key={index}
        style={styles.nutrientItem}
        onPress={() => setSelectedNutrient(nutrient)}
        accessibilityLabel={`${nutrient.name}: ${nutrient.current} of ${nutrient.target} ${nutrient.unit}`}
        accessibilityRole="button"
      >
        <View style={styles.circleContainer}>
          <Svg width={size} height={size}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.colors.border}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageText, { color }]}>
              {Math.round(percentage)}%
            </Text>
          </View>
        </View>
        <Text style={styles.nutrientName} numberOfLines={2}>
          {nutrient.name}
        </Text>
        <Text style={styles.nutrientValue}>
          {nutrient.current.toFixed(0)}/{nutrient.target.toFixed(0)} {nutrient.unit}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {nutrients.map((nutrient, index) => renderNutrientCircle(nutrient, index))}
      </View>

      {/* Nutrient Detail Modal */}
      <Modal
        visible={selectedNutrient !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNutrient(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedNutrient(null)}
        >
          <View style={styles.modalContent}>
            {selectedNutrient && (
              <ScrollView>
                <Text style={styles.modalTitle}>{selectedNutrient.name}</Text>
                
                <View style={styles.modalStats}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Current</Text>
                    <Text style={styles.modalStatValue}>
                      {selectedNutrient.current.toFixed(1)} {selectedNutrient.unit}
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Target</Text>
                    <Text style={styles.modalStatValue}>
                      {selectedNutrient.target.toFixed(1)} {selectedNutrient.unit}
                    </Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatLabel}>Status</Text>
                    <Text
                      style={[
                        styles.modalStatValue,
                        { color: getStatusColor(selectedNutrient.current, selectedNutrient.target) },
                      ]}
                    >
                      {getStatusText(selectedNutrient.current, selectedNutrient.target)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Why It's Important</Text>
                  <Text style={styles.modalSectionText}>{selectedNutrient.importance}</Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedNutrient(null)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  nutrientItem: {
    width: '22%',
    minWidth: 70,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  circleContainer: {
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
  },
  nutrientName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: theme.fontWeight.medium,
  },
  nutrientValue: {
    fontSize: 10,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  modalStatItem: {
    alignItems: 'center',
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
  modalCloseButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  modalCloseButtonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
