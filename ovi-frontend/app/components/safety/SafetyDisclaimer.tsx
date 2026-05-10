// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface SafetyDisclaimerProps {
  /** When true, renders a compact one-line variant for inline use. */
  compact?: boolean;
  /** Override the default copy. */
  text?: string;
}

const DEFAULT_TEXT =
  "Guidance shown in Ovi is informational and not a substitute for medical advice. " +
  "Consult your healthcare provider before making decisions about your pregnancy diet.";

export const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({
  compact = false,
  text = DEFAULT_TEXT,
}) => {
  if (compact) {
    return (
      <Text style={styles.compact} accessibilityRole="text">
        {text}
      </Text>
    );
  }

  return (
    <View style={styles.box} accessibilityRole="text">
      <MaterialCommunityIcons
        name="information-outline"
        size={16}
        color={theme.colors.text.secondary}
        style={styles.icon}
      />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  text: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
  },
  compact: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
});
