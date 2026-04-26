// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { theme } from '../theme';
import { FetusDevelopmentAnimation } from '../components/pregnancy/FetusDevelopmentAnimation';
import { usePregnancyProgress } from '../hooks/usePregnancyProgress';
import { getSizeComparison, getWeekMilestones } from '../utils/pregnancyCalculations';

const TOTAL_WEEKS = 40;

export const TrimesterTrackerScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { pregnancyInfo } = usePregnancyProgress();
  const currentWeek = pregnancyInfo?.week || 20;

  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setSelectedWeek(currentWeek);
  }, [currentWeek]);

  const sizeComparison = getSizeComparison(selectedWeek);
  const milestones = getWeekMilestones(selectedWeek);

  const handleWeekChange = (week: number) => {
    const roundedWeek = Math.round(week);
    if (roundedWeek !== selectedWeek) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
      ]).start();
      setSelectedWeek(roundedWeek);
    }
  };

  const trimester = selectedWeek <= 13 ? 'First Trimester' : selectedWeek <= 27 ? 'Second Trimester' : 'Third Trimester';
  const isHalfway = selectedWeek === 20;
  const weekPct = selectedWeek / TOTAL_WEEKS;

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <Text style={styles.kicker}>Baby · {trimester}</Text>
        <TouchableOpacity style={styles.iconBtn} accessibilityLabel="Info">
          <MaterialCommunityIcons name="information-outline" size={18} color="#2B221B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>you are at</Text>
          <View>
            <Text style={styles.heroWeekText}>
              week <Text style={styles.heroWeekItalic}>{selectedWeek}</Text>
            </Text>
            {isHalfway && <View style={styles.honeyUnderline} />}
          </View>
          {isHalfway && (
            <View style={styles.halfwayPill}>
              <View style={styles.honeyDot} />
              <Text style={styles.halfwayText}>halfway there</Text>
              <View style={styles.honeyDot} />
            </View>
          )}
          <Text style={styles.heroSubtitle}>
            {selectedWeek} weeks behind you,{'\n'}
            {TOTAL_WEEKS - selectedWeek} weeks to <Text style={styles.heroSubtitleAccent}>meet</Text>.
          </Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationOuterRing} />
          <View style={styles.illustrationInner}>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <FetusDevelopmentAnimation week={selectedWeek} size="large" />
            </Animated.View>
          </View>
          <View style={styles.honeyOrbDot} />
          <View style={styles.accentOrbDot} />
        </View>

        {/* Week slider card */}
        <View style={styles.sliderCard}>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelMuted}>WEEK 4</Text>
            <Text style={styles.sliderLabelInk}>WEEK {selectedWeek} · {selectedWeek === currentWeek ? 'TODAY' : 'PREVIEW'}</Text>
            <Text style={styles.sliderLabelMuted}>WEEK 40</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={4}
            maximumValue={40}
            step={1}
            value={selectedWeek}
            onValueChange={handleWeekChange}
            minimumTrackTintColor="#2B221B"
            maximumTrackTintColor="#E8E0D5"
            thumbTintColor="#2B221B"
          />
          <View style={styles.trimRow}>
            <Text style={styles.trimText}>Trimester 1</Text>
            <Text style={styles.trimText}>Trimester 2</Text>
            <Text style={styles.trimText}>Trimester 3</Text>
          </View>
        </View>

        {/* Length / Weight cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Length</Text>
            <Text style={styles.statValue}>
              {getLengthInches(selectedWeek)}
              <Text style={styles.statUnit}> in</Text>
            </Text>
            <Text style={styles.statSub}>like a {sizeComparison}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>
              {getWeightOz(selectedWeek)}
              <Text style={styles.statUnit}> oz</Text>
            </Text>
            <Text style={styles.statSub}>about {Math.round(getWeightOz(selectedWeek) * 28.35)}g</Text>
          </View>
        </View>

        {/* Milestones */}
        {milestones.length > 0 && (
          <>
            <View style={styles.sectionLabelWrap}>
              <Text style={styles.sectionLabel}>This Week's Developments</Text>
            </View>
            <View style={styles.milestonesCard}>
              {milestones.slice(0, 3).map((milestone, i, arr) => (
                <View
                  key={i}
                  style={[
                    styles.milestoneItem,
                    i > 0 && { paddingTop: 14 },
                    i < arr.length - 1 && { paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: '#F0E8DC' },
                  ]}
                >
                  <Text style={styles.milestoneNum}>0{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.milestoneTitle}>{milestone}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#9C8E80" />
          <Text style={styles.disclaimerText}>
            These visualizations are approximate, not exact medical illustrations.
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

// Approximate length/weight by week (rough averages)
function getLengthInches(week: number): string {
  const lengthMap: Record<number, number> = {
    4: 0.04, 8: 0.6, 12: 2.1, 16: 4.6, 20: 6.5, 24: 11.8, 28: 14.8, 32: 16.7, 36: 18.7, 40: 20.2,
  };
  const known = Object.keys(lengthMap).map(Number).sort((a, b) => a - b);
  let last = known[0];
  for (const w of known) if (w <= week) last = w;
  return lengthMap[last]?.toFixed(1) ?? '6.5';
}

function getWeightOz(week: number): number {
  const map: Record<number, number> = {
    4: 0.01, 8: 0.04, 12: 0.49, 16: 3.5, 20: 10.6, 24: 21, 28: 35, 32: 60, 36: 90, 40: 110,
  };
  const known = Object.keys(map).map(Number).sort((a, b) => a - b);
  let last = known[0];
  for (const w of known) if (w <= week) last = w;
  return map[last] ?? 10.6;
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
  },
  heroKicker: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: '#6A5D52',
    letterSpacing: 0.2,
  },
  heroWeekText: {
    fontFamily: theme.typography.fontFamily.displayLight,
    fontSize: 92,
    color: '#2B221B',
    letterSpacing: -3.5,
    lineHeight: 92,
    marginTop: 4,
  },
  heroWeekItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  honeyUnderline: {
    alignSelf: 'center',
    marginTop: 4,
    width: 56,
    height: 2,
    backgroundColor: '#D9A862',
    borderRadius: 1,
  },
  halfwayPill: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F8EFD9',
    borderRadius: 100,
  },
  honeyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9A862',
  },
  halfwayText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#7A5A1F',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: '#6A5D52',
    marginTop: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  heroSubtitleAccent: {
    color: '#B84C3F',
  },
  illustrationWrap: {
    marginTop: 14,
    marginBottom: 18,
    width: 240,
    height: 240,
    alignSelf: 'center',
    position: 'relative',
  },
  illustrationOuterRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 120,
    borderWidth: 0.5,
    borderColor: '#D9CEBF',
    borderStyle: 'dashed',
  },
  illustrationInner: {
    position: 'absolute',
    top: 14, left: 14, right: 14, bottom: 14,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  honeyOrbDot: {
    position: 'absolute',
    top: 6, right: 28,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#D9A862',
    borderWidth: 2, borderColor: '#F6F1EA',
  },
  accentOrbDot: {
    position: 'absolute',
    bottom: 16, left: 8,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#B84C3F',
    opacity: 0.5,
  },
  sliderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 18,
    marginBottom: 14,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderLabelMuted: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#9C8E80',
    letterSpacing: 1,
  },
  sliderLabelInk: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#2B221B',
    letterSpacing: 1,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  trimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trimText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 10,
    color: '#9C8E80',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 16,
  },
  statLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: '#9C8E80',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 28,
    color: '#2B221B',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  statUnit: {
    fontSize: 13,
    color: '#9C8E80',
    fontFamily: theme.typography.fontFamily.regular,
  },
  statSub: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    fontSize: 11,
    color: '#6A5D52',
    marginTop: 2,
  },
  sectionLabelWrap: {
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  milestonesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    padding: 18,
    marginBottom: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    gap: 14,
  },
  milestoneNum: {
    width: 24,
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    fontSize: 14,
    color: '#B84C3F',
    paddingTop: 2,
  },
  milestoneTitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: '#2B221B',
    lineHeight: 20,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#9C8E80',
    lineHeight: 16,
  },
});
