import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { IconBadge } from './icons/IconBadge';
import { MOOD_ICONS, ICON_COLORS, ICON_BACKGROUNDS } from './icons/iconConstants';

interface JournalMoodSelectorProps {
  value: number | null;
  onChange: (mood: number) => void;
  label?: string;
}

// Mood level definitions with outline and filled icon variants
const MOOD_LEVELS = [
  { value: 1, outlineIcon: 'emoticon-sad-outline', filledIcon: 'emoticon-sad', label: 'Very Sad' },
  { value: 2, outlineIcon: 'emoticon-frown-outline', filledIcon: 'emoticon-frown', label: 'Sad' },
  { value: 3, outlineIcon: 'emoticon-neutral-outline', filledIcon: 'emoticon-neutral', label: 'Neutral' },
  { value: 4, outlineIcon: 'emoticon-happy-outline', filledIcon: 'emoticon-happy', label: 'Happy' },
  { value: 5, outlineIcon: 'emoticon-excited-outline', filledIcon: 'emoticon-excited', label: 'Very Happy' },
];

export const JournalMoodSelector: React.FC<JournalMoodSelectorProps> = ({
  value,
  onChange,
  label = 'How are you feeling?',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.moodContainer}>
        {MOOD_LEVELS.map((mood) => {
          const isSelected = value === mood.value;
          const iconName = isSelected ? mood.filledIcon : mood.outlineIcon;
          const backgroundColor = isSelected ? ICON_BACKGROUNDS.paleRose : ICON_BACKGROUNDS.cream;
          const iconColor = isSelected ? ICON_COLORS.accent : ICON_COLORS.primary;

          return (
            <MoodIconButton
              key={mood.value}
              iconName={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
              isSelected={isSelected}
              backgroundColor={backgroundColor}
              iconColor={iconColor}
              onPress={() => onChange(mood.value)}
              accessibilityLabel={`Mood: ${mood.label}`}
              accessibilityHint={`Select ${mood.label} mood level`}
            />
          );
        })}
      </View>
    </View>
  );
};

interface MoodIconButtonProps {
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  isSelected: boolean;
  backgroundColor: string;
  iconColor: string;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint: string;
}

const MoodIconButton: React.FC<MoodIconButtonProps> = ({
  iconName,
  isSelected,
  backgroundColor,
  iconColor,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: isSelected }}
      style={styles.iconButtonContainer}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <IconBadge
          name={iconName}
          size="medium"
          backgroundColor={backgroundColor}
          iconColor={iconColor}
          shape="circular"
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Accessibility: minimum touch target
    minWidth: 44,  // Accessibility: minimum touch target
  },
});
