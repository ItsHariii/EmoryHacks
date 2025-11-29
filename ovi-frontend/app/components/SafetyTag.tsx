import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface SafetyTagProps {
  status: 'safe' | 'limited' | 'avoid' | 'caution'; // 'caution' for backward compatibility
  size?: 'small' | 'medium';
}

export const SafetyTag: React.FC<SafetyTagProps> = ({ status, size = 'medium' }) => {
  const getTagStyle = () => {
    const baseStyle = [styles.tag, size === 'small' ? styles.tagSmall : styles.tagMedium];
    // Normalize 'caution' to 'limited' for backward compatibility
    const normalizedStatus = status === 'caution' ? 'limited' : status;
    
    switch (normalizedStatus) {
      case 'safe':
        return [...baseStyle, styles.tagSafe];
      case 'limited':
        return [...baseStyle, styles.tagCaution];
      case 'avoid':
        return [...baseStyle, styles.tagAvoid];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    return [styles.tagText, size === 'small' ? styles.tagTextSmall : styles.tagTextMedium];
  };

  const getTagText = () => {
    // Normalize 'caution' to 'limited' for backward compatibility
    const normalizedStatus = status === 'caution' ? 'limited' : status;
    
    switch (normalizedStatus) {
      case 'safe':
        return '✓ Safe';
      case 'limited':
        return '⚠ Limited';
      case 'avoid':
        return '✕ Avoid';
      default:
        return '';
    }
  };

  return (
    <View style={getTagStyle()}>
      <Text style={getTextStyle()}>{getTagText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
  },
  tagSmall: {
    paddingVertical: theme.spacing.xs,
  },
  tagMedium: {
    paddingVertical: theme.spacing.sm,
  },
  tagSafe: {
    backgroundColor: theme.colors.success,
  },
  tagCaution: {
    backgroundColor: theme.colors.warning,
  },
  tagAvoid: {
    backgroundColor: theme.colors.error,
  },
  tagText: {
    color: theme.colors.text.light,
    fontWeight: theme.fontWeight.medium,
  },
  tagTextSmall: {
    fontSize: theme.fontSize.xs,
  },
  tagTextMedium: {
    fontSize: theme.fontSize.sm,
  },
});
