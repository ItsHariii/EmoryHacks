/**
 * Example component demonstrating the icon system usage
 * This file can be used as a reference or removed in production
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { IconWrapper } from './IconWrapper';
import { IconBadge } from './IconBadge';
import {
  TRIMESTER_ICONS,
  MACRONUTRIENT_ICONS,
  MICRONUTRIENT_ICONS,
  SAFETY_STATUS_ICONS,
  MOOD_ICONS,
  ICON_COLORS,
  ICON_BACKGROUNDS,
} from './iconConstants';
import { theme } from '../../theme';

export const IconSystemExample: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<number>(3);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Icon System Examples</Text>

      {/* Trimester Icons */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Trimester Icons</Text>
        <View style={styles.row}>
          {[1, 2, 3].map((trimester) => (
            <View key={trimester} style={styles.iconItem}>
              <IconBadge
                name={TRIMESTER_ICONS[trimester]}
                size="large"
                backgroundColor={ICON_BACKGROUNDS.cream}
                iconColor={ICON_COLORS.primary}
                withGradientRing={true}
              />
              <Text style={styles.label}>T{trimester}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Macronutrient Icons */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Macronutrient Icons</Text>
        <View style={styles.row}>
          {Object.entries(MACRONUTRIENT_ICONS).map(([key, iconName]) => (
            <View key={key} style={styles.iconItem}>
              <IconWrapper
                name={iconName}
                size="medium"
                context="card"
                backgroundColor={ICON_BACKGROUNDS.paleRose}
                iconColor={ICON_COLORS.primary}
                shape="circular"
              />
              <Text style={styles.label}>{key}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Safety Status Icons */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Safety Status Icons</Text>
        <View style={styles.row}>
          {Object.entries(SAFETY_STATUS_ICONS).map(([status, iconName]) => (
            <View key={status} style={styles.iconItem}>
              <IconBadge
                name={iconName}
                size="small"
                backgroundColor={
                  status === 'safe'
                    ? ICON_BACKGROUNDS.lightBlue
                    : status === 'limited'
                    ? ICON_BACKGROUNDS.cream
                    : ICON_BACKGROUNDS.paleRose
                }
                iconColor={
                  status === 'safe'
                    ? ICON_COLORS.success
                    : status === 'limited'
                    ? ICON_COLORS.warning
                    : ICON_COLORS.error
                }
                onPress={() => console.log(`${status} pressed`)}
              />
              <Text style={styles.label}>{status}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Mood Selector */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Mood Selector (Interactive)</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((mood) => (
            <IconBadge
              key={mood}
              name={MOOD_ICONS[mood]}
              size="medium"
              backgroundColor={
                selectedMood === mood
                  ? ICON_BACKGROUNDS.paleRose
                  : ICON_BACKGROUNDS.white
              }
              iconColor={
                selectedMood === mood ? ICON_COLORS.accent : ICON_COLORS.primary
              }
              onPress={() => setSelectedMood(mood)}
              accessibilityLabel={`Mood level ${mood}`}
            />
          ))}
        </View>
        <Text style={styles.selectedText}>Selected Mood: {selectedMood}</Text>
      </View>

      {/* Micronutrient Icons Sample */}
      <View style={styles.section}>
        <Text style={styles.subtitle}>Micronutrient Icons (Sample)</Text>
        <View style={styles.row}>
          {['vitamin_d', 'dha', 'folate', 'iron'].map((nutrient) => (
            <View key={nutrient} style={styles.iconItem}>
              <IconWrapper
                name={MICRONUTRIENT_ICONS[nutrient]}
                size="small"
                backgroundColor={ICON_BACKGROUNDS.lightBlue}
                iconColor={ICON_COLORS.secondary}
                shape="rounded-square"
              />
              <Text style={styles.label}>{nutrient}</Text>
            </View>
          ))}
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
  iconItem: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  selectedText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
});
