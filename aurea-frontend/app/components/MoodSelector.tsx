import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface MoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
}

const MOODS = [
  { value: 1, emoji: '😢', label: 'Very Bad' },
  { value: 2, emoji: '😟', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😊', label: 'Great' },
];

export const MoodSelector: React.FC<MoodSelectorProps> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>How are you feeling today?</Text>
      <View style={styles.moodContainer}>
        {MOODS.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            style={[
              styles.moodButton,
              value === mood.value && styles.moodButtonSelected,
            ]}
            onPress={() => onChange(mood.value)}
            accessibilityLabel={`Mood: ${mood.label}`}
            accessibilityRole="button"
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                value === mood.value && styles.moodLabelSelected,
              ]}
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    minHeight: 80,
    justifyContent: 'center',
  },
  moodButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  emoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  moodLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.semibold,
  },
});
