/**
 * Example component demonstrating the FoodSafetyBadge usage
 * This file can be used as a reference or removed in production
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FoodSafetyBadge } from './FoodSafetyBadge';
import { theme } from '../theme';

export const FoodSafetyBadgeExample: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>FoodSafetyBadge Examples</Text>

      {/* Safe Status */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Safe Status</Text>
        <FoodSafetyBadge 
          status="safe" 
          notes="This food is safe to consume during pregnancy. It provides essential nutrients without any known risks."
        />
      </View>

      {/* Limited Status */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Limited Status</Text>
        <FoodSafetyBadge 
          status="limited" 
          notes="Consume in moderation. High mercury content may be harmful in large quantities. Limit to 2-3 servings per week."
        />
      </View>

      {/* Avoid Status */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Avoid Status</Text>
        <FoodSafetyBadge 
          status="avoid" 
          notes="Raw or undercooked eggs may contain salmonella bacteria which can cause food poisoning. Always cook eggs thoroughly during pregnancy."
        />
      </View>

      {/* Without Notes (Non-interactive) */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Without Notes (Non-interactive)</Text>
        <View style={styles.row}>
          <FoodSafetyBadge status="safe" />
          <FoodSafetyBadge status="limited" />
          <FoodSafetyBadge status="avoid" />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
});
