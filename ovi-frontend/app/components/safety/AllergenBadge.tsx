// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { AllergenHit } from '../../types';

interface AllergenBadgeProps {
  hits: AllergenHit[];
}

const ALLERGEN_LABELS: Record<string, string> = {
  milk: 'Milk',
  egg: 'Eggs',
  fish: 'Fish',
  shellfish: 'Shellfish',
  tree_nuts: 'Tree nuts',
  peanut: 'Peanuts',
  wheat: 'Wheat',
  soy: 'Soy',
  sesame: 'Sesame',
};

const labelFor = (key: string) => ALLERGEN_LABELS[key] || key;

export const AllergenBadge: React.FC<AllergenBadgeProps> = ({ hits }) => {
  if (!hits || hits.length === 0) return null;

  const hasBlock = hits.some((h) => h.severity === 'block');
  const stripeColor = hasBlock ? theme.colors.error : theme.colors.warning || theme.colors.limited;
  const headlineLabel = hits.length === 1 ? labelFor(hits[0].allergen) : `${hits.length} allergens`;

  return (
    <View
      style={[styles.row, { borderLeftColor: stripeColor }]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`Allergen warning: ${hits.map((h) => labelFor(h.allergen)).join(', ')}`}
    >
      <MaterialCommunityIcons
        name="alert-octagon-outline"
        size={18}
        color={stripeColor}
        style={styles.icon}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.headline, { color: stripeColor }]}>
          Allergen warning: {headlineLabel}
        </Text>
        <Text style={styles.detail}>
          {hits.map((h) => labelFor(h.allergen)).join(', ')} matched your saved allergies.
          {hasBlock ? ' Confirm before logging.' : ' Verify ingredients on the label.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
    borderLeftWidth: 3,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  icon: {
    marginRight: theme.spacing.sm,
    marginTop: 1,
  },
  headline: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 2,
  },
  detail: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
  },
});
