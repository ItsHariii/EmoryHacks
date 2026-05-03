// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionPreviewProps {
  nutrition: NutritionData | null;
}

export const NutritionPreview: React.FC<NutritionPreviewProps> = ({ nutrition }) => {
  if (!nutrition) return null;

  const nutrients = [
    { name: 'Calories', value: Math.round(nutrition?.calories || 0), unit: 'kcal', color: '#B84C3F' },
    { name: 'Protein',  value: Math.round(nutrition?.protein  || 0), unit: 'g',    color: '#B84C3F' },
    { name: 'Carbs',    value: Math.round(nutrition?.carbs    || 0), unit: 'g',    color: '#D19B4E' },
    { name: 'Fat',      value: Math.round(nutrition?.fat      || 0), unit: 'g',    color: '#8A9A7B' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition facts</Text>
      <View style={styles.grid}>
        {nutrients.map((n) => (
          <View key={n.name} style={styles.card}>
            <View style={[styles.colorBar, { backgroundColor: n.color }]} />
            <Text style={styles.value}>
              {n.value}
              <Text style={styles.unit}> {n.unit}</Text>
            </Text>
            <Text style={styles.label}>{n.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FDFAF6',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 16,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F6F1EA',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 12,
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  value: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    color: '#2B221B',
    letterSpacing: -0.3,
    marginTop: 6,
  },
  unit: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#8C7E70',
  },
  label: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#8C7E70',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
