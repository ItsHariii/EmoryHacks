import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface ProgressBarProps {
  current: number;
  target: number;
  label: string;
  color?: string;
  showNumbers?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  label,
  color = theme.colors.primary,
  showNumbers = true,
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isOverTarget = current > target;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showNumbers && (
          <Text style={[styles.numbers, isOverTarget && styles.overTarget]}>
            {Math.round(current)} / {Math.round(target)}
          </Text>
        )}
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: isOverTarget ? theme.colors.warning : color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  numbers: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  overTarget: {
    color: theme.colors.warning,
  },
  progressTrack: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.borderRadius.sm,
  },
});
