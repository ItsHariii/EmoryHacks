// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../../theme';
import { SkeletonMacroCard } from '../skeletons/SkeletonLoader';
import { useNutritionStore } from '../../store/useNutritionStore';

interface NutritionSectionProps {
  opacity: Animated.Value;
  translateY: Animated.Value;
}

const MACROS = [
  { key: 'protein', label: 'Protein', color: '#B84C3F' },
  { key: 'carbs',   label: 'Carbs',   color: '#D19B4E' },
  { key: 'fats',    label: 'Fats',    color: '#8A9A7B' },
] as const;

const NutritionSectionComponent: React.FC<NutritionSectionProps> = ({ opacity, translateY }) => {
  const { summary, targets, loading, error } = useNutritionStore();

  if (loading && !summary) {
    return (
      <View style={styles.container}>
        <SkeletonMacroCard />
      </View>
    );
  }

  if (error && !summary) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>TODAY'S NUTRITION</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.errorText}>Could not load nutrition data. Pull down to retry.</Text>
        </View>
      </View>
    );
  }

  if (!summary || !targets) return null;

  const calsCurrent = Math.round(summary.total_calories || 0);
  const calsTarget = targets.calories || 1;
  const caloriePct = Math.min((calsCurrent / calsTarget) * 100, 100);

  // Ring geometry
  const SIZE = 88;
  const STROKE = 8;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = RADIUS * 2 * Math.PI;
  // Always render the full track; show a tiny visible arc even at 0%
  const minArcPct = caloriePct < 1 ? 1.2 : caloriePct;
  const offset = CIRCUMFERENCE - (minArcPct / 100) * CIRCUMFERENCE;

  const remaining = Math.max(0, calsTarget - calsCurrent);
  const macroValues = {
    protein: { v: Math.round(summary.protein_g || 0), t: Math.round(targets.macros?.protein_g || 0) },
    carbs:   { v: Math.round(summary.carbs_g || 0),   t: Math.round(targets.macros?.carbs_g || 0) },
    fats:    { v: Math.round(summary.fat_g || 0),     t: Math.round(targets.macros?.fat_g || 0) },
  };

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>TODAY'S NUTRITION</Text>
        <Text style={styles.calorieTotal}>
          <Text style={styles.calorieTotalNum}>{calsCurrent.toLocaleString()}</Text>
          <Text style={styles.calorieTotalRest}> / {calsTarget.toLocaleString()} </Text>
          <Text style={styles.calorieTotalUnit}>kcal</Text>
        </Text>
      </View>

      <View style={styles.card}>
        {/* Hero: ring + headline */}
        <View style={styles.heroRow}>
          <View style={{ width: SIZE, height: SIZE }}>
            <Svg width={SIZE} height={SIZE}>
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke="#EDE6DC"
                strokeWidth={STROKE}
                fill="transparent"
              />
              <Circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke="#B84C3F"
                strokeWidth={STROKE}
                fill="transparent"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={styles.ringPercent}>
                {Math.round(caloriePct)}
                <Text style={styles.ringPercentSign}>%</Text>
              </Text>
            </View>
          </View>

          <View style={styles.headlineWrap}>
            <Text style={styles.headline}>
              You're <Text style={styles.headlineItalic}>nourishing</Text> well
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {remaining > 0
                ? `${remaining.toLocaleString()} kcal to go. Maybe a small snack with protein this afternoon?`
                : `You've reached your goal. Listen to your body.`}
            </Text>
          </View>
        </View>

        {/* Macro bars */}
        <View style={styles.macroBars}>
          {MACROS.map((m) => {
            const data = macroValues[m.key];
            const pct = data.t > 0 ? Math.min((data.v / data.t) * 100, 100) : 0;
            return (
              <View key={m.key} style={styles.macroRow}>
                <View style={styles.macroHeader}>
                  <View style={styles.macroLabelGroup}>
                    <View style={[styles.macroDot, { backgroundColor: m.color }]} />
                    <Text style={styles.macroLabel}>{m.label}</Text>
                  </View>
                  <Text style={styles.macroValueText}>
                    <Text style={styles.macroValueCurrent}>{data.v}</Text>
                    <Text style={styles.macroValueTarget}> / {data.t}g</Text>
                  </Text>
                </View>
                <View style={styles.macroTrack}>
                  <View
                    style={[
                      styles.macroFill,
                      { width: `${pct}%`, backgroundColor: m.color, minWidth: 4 },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.layout.screenPadding,
    marginBottom: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  calorieTotal: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#5A4D42',
  },
  calorieTotalNum: {
    fontFamily: theme.typography.fontFamily.display,
    color: '#2B221B',
  },
  calorieTotalRest: {
    fontFamily: theme.typography.fontFamily.regular,
    color: '#5A4D42',
  },
  calorieTotalUnit: {
    color: '#8C7E70',
  },
  card: {
    backgroundColor: '#FDFAF6',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercent: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 24,
    color: '#2B221B',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  ringPercentSign: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#8C7E70',
  },
  headlineWrap: {
    flex: 1,
    minWidth: 0,
  },
  headline: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    color: '#2B221B',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  headlineItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#5A4D42',
    marginTop: 4,
    lineHeight: 17,
  },
  macroBars: {
    gap: 10,
  },
  macroRow: {
    gap: 6,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  macroLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 13,
    color: '#2B221B',
  },
  macroValueText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#5A4D42',
  },
  macroValueCurrent: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#2B221B',
  },
  macroValueTarget: {
    color: '#8C7E70',
  },
  macroTrack: {
    height: 6,
    backgroundColor: '#EDE6DC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: '#5A4D42',
    textAlign: 'center',
  },
});

export const NutritionSection = React.memo(NutritionSectionComponent);
