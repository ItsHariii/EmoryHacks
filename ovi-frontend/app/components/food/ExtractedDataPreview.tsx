// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme';

interface ExtractedData {
  mood?: number;
  symptoms?: string[];
  notes?: string;
  cravings?: string;
  sleep_quality?: number;
  energy_level?: number;
}

interface ExtractedDataPreviewProps {
  data: ExtractedData;
}

const MOOD_EMOJIS = ['', '😢', '😟', '😐', '🙂', '😊'];

export const ExtractedDataPreview: React.FC<ExtractedDataPreviewProps> = ({ data }) => {
  const hasData = data.mood ||
    (data.symptoms && data.symptoms.length > 0) ||
    data.notes ||
    data.cravings ||
    data.sleep_quality ||
    data.energy_level;

  if (!hasData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What I've captured so far:</Text>

      <View style={styles.dataContainer}>
        {data.mood && (
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Mood:</Text>
            <Text style={styles.dataValue}>
              {MOOD_EMOJIS[data.mood]} ({data.mood}/5)
            </Text>
          </View>
        )}

        {data.symptoms && data.symptoms.length > 0 && (
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Symptoms:</Text>
            <View style={styles.symptomsContainer}>
              {data.symptoms.map((symptom, index) => (
                <View key={index} style={styles.symptomChip}>
                  <Text style={styles.symptomText}>{symptom}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {data.sleep_quality && (
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Sleep Quality:</Text>
            <Text style={styles.dataValue}>{data.sleep_quality}/5</Text>
          </View>
        )}

        {data.energy_level && (
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Energy Level:</Text>
            <Text style={styles.dataValue}>{data.energy_level}/5</Text>
          </View>
        )}

        {data.cravings && (
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Cravings:</Text>
            <Text style={styles.dataValue}>{data.cravings}</Text>
          </View>
        )}

        {data.notes && (
          <View style={styles.dataItem}>
            <Text style={styles.dataLabel}>Notes:</Text>
            <Text style={styles.dataValue}>{data.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  title: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  dataContainer: {
    gap: theme.spacing.sm,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  dataLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    minWidth: 80,
  },
  dataValue: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  symptomsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  symptomChip: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  symptomText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.fontWeight.medium,
  },
});
