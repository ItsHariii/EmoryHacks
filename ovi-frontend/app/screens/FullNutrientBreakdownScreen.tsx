// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { theme } from '../theme';
import { useNutritionStore } from '../store/useNutritionStore';
import { NutritionDetailsModal } from '../components/modals';

const TERRACOTTA = '#B84C3F';
const SAGE = '#8A9A7B';
const OCHRE = '#D19B4E';
const TRACK = '#EDE6DC';
const MUTED = '#8C7E70';
const INK = '#2B221B';
const CARD_BG = '#FDFAF6';
const CARD_BORDER = '#E8E0D5';
const ROW_DIVIDER = '#F0E8DC';

interface NutrientRow {
  name: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  decimals?: number;
}

const fmt = (n: number, decimals = 0) => {
  if (decimals > 0) return n.toFixed(decimals);
  return Math.round(n).toLocaleString();
};

const Row: React.FC<{ row: NutrientRow; isLast: boolean }> = ({ row, isLast }) => {
  const pct = row.target > 0 ? (row.current / row.target) * 100 : 0;
  const clamped = Math.min(pct, 100);
  const overflow = pct > 100;
  const fillColor = overflow ? TERRACOTTA : row.color;

  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={styles.rowTopLine}>
        <Text style={styles.rowName}>{row.name}</Text>
        <Text style={styles.rowValueLine}>
          <Text style={styles.rowValueCurrent}>{fmt(row.current, row.decimals)}</Text>
          <Text style={styles.rowValueTarget}> / {fmt(row.target, row.decimals)} {row.unit}</Text>
          <Text style={styles.rowValuePct}>  {Math.round(pct)}%</Text>
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${Math.max(clamped, 0)}%`, backgroundColor: fillColor, minWidth: 4 },
          ]}
        />
        {overflow && <View style={styles.overflowDot} />}
      </View>
    </View>
  );
};

const Section: React.FC<{ label: string; rows: NutrientRow[] }> = ({ label, rows }) => {
  const tracked = rows.filter((r) => r.current > 0).length;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>{label}</Text>
        <Text style={styles.sectionCount}>{tracked} tracked</Text>
      </View>
      <View style={styles.card}>
        {rows.map((r, i) => (
          <Row key={r.name} row={r} isLast={i === rows.length - 1} />
        ))}
      </View>
    </View>
  );
};

export const FullNutrientBreakdownScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const macrosY = useRef(0);
  const [showInfoModal, setShowInfoModal] = React.useState(false);

  const { summary, targets, fetchDailySummary, fetchTargets } = useNutritionStore();

  useEffect(() => {
    if (!summary) fetchDailySummary();
    if (!targets) fetchTargets();
  }, []);

  useEffect(() => {
    if (route.params?.scrollTo === 'macros') {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: macrosY.current, animated: false });
      }, 50);
    }
  }, [route.params?.scrollTo]);

  const today = new Date();
  const dateLabel = today
    .toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
    .replace(',', ' ·')
    .toUpperCase();

  const macros: NutrientRow[] = [
    {
      name: 'Calories',
      current: summary?.total_calories || 0,
      target: targets?.calories || 0,
      unit: 'kcal',
      color: TERRACOTTA,
    },
    {
      name: 'Protein',
      current: summary?.protein_g || 0,
      target: targets?.macros?.protein_g || 0,
      unit: 'g',
      color: TERRACOTTA,
    },
    {
      name: 'Carbs',
      current: summary?.carbs_g || 0,
      target: targets?.macros?.carbs_g || 0,
      unit: 'g',
      color: TERRACOTTA,
    },
    {
      name: 'Fats',
      current: summary?.fat_g || 0,
      target: targets?.macros?.fat_g || 0,
      unit: 'g',
      color: TERRACOTTA,
    },
    {
      name: 'Fiber',
      current: summary?.fiber_g || 0,
      target: targets?.micronutrients?.fiber_g || 0,
      unit: 'g',
      color: TERRACOTTA,
    },
  ];

  const vitamins: NutrientRow[] = [
    {
      name: 'Folate',
      current: summary?.folate_mcg || 0,
      target: targets?.micronutrients?.folate_mcg || 0,
      unit: 'mcg',
      color: SAGE,
    },
    {
      name: 'Vitamin D',
      current: summary?.vitamin_d_mcg || 0,
      target: targets?.micronutrients?.vitamin_d_mcg || 0,
      unit: 'IU',
      color: TERRACOTTA,
    },
    {
      name: 'Vitamin B12',
      current: summary?.vitamin_b12_mcg || 0,
      target: targets?.micronutrients?.vitamin_b12_mcg || 0,
      unit: 'mcg',
      color: SAGE,
      decimals: 1,
    },
    {
      name: 'Vitamin C',
      current: summary?.vitamin_c_mg || 0,
      target: targets?.micronutrients?.vitamin_c_mg || 0,
      unit: 'mg',
      color: SAGE,
    },
    {
      name: 'Vitamin A',
      current: summary?.vitamin_a_mcg || 0,
      target: targets?.micronutrients?.vitamin_a_mcg || 0,
      unit: 'mcg',
      color: SAGE,
    },
    {
      name: 'Choline',
      current: summary?.choline_mg || 0,
      target: targets?.micronutrients?.choline_mg || 0,
      unit: 'mg',
      color: OCHRE,
    },
  ];

  const minerals: NutrientRow[] = [
    {
      name: 'Iron',
      current: summary?.iron_mg || 0,
      target: targets?.micronutrients?.iron_mg || 0,
      unit: 'mg',
      color: SAGE,
    },
    {
      name: 'Calcium',
      current: summary?.calcium_mg || 0,
      target: targets?.micronutrients?.calcium_mg || 0,
      unit: 'mg',
      color: SAGE,
    },
    {
      name: 'Magnesium',
      current: summary?.magnesium_mg || 0,
      target: targets?.micronutrients?.magnesium_mg || 0,
      unit: 'mg',
      color: SAGE,
    },
  ];

  return (
    <ScreenWrapper edges={['bottom']} backgroundColor="#F6F1EA" useSafeArea={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={INK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.dateKicker}>{dateLabel}</Text>
          <Text style={styles.title}>Today's nutrients</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowInfoModal(true)}
          style={styles.iconBtn}
          accessibilityLabel="Nutrition info"
        >
          <MaterialCommunityIcons name="information-outline" size={18} color={INK} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        <Text style={styles.quote}>
          "An honest look at how you're nourishing the two of you."
        </Text>

        <View
          onLayout={(e) => {
            macrosY.current = e.nativeEvent.layout.y;
          }}
        >
          <Section label="MACROS" rows={macros} />
        </View>

        <Section label="VITAMINS" rows={vitamins} />
        <Section label="MINERALS" rows={minerals} />
      </ScrollView>

      <NutritionDetailsModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        targets={targets}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateKicker: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 20,
    color: INK,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  quote: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontSize: 16,
    color: TERRACOTTA,
    lineHeight: 22,
    letterSpacing: -0.2,
    marginBottom: 26,
    marginTop: 4,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionLabel: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: MUTED,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontSize: 12,
    color: TERRACOTTA,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: CARD_BORDER,
    paddingHorizontal: 18,
  },
  row: {
    paddingVertical: 14,
  },
  rowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: ROW_DIVIDER,
  },
  rowTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  rowName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
    color: INK,
  },
  rowValueLine: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: MUTED,
  },
  rowValueCurrent: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 14,
    color: INK,
  },
  rowValueTarget: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: MUTED,
  },
  rowValuePct: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: MUTED,
  },
  barTrack: {
    height: 6,
    backgroundColor: TRACK,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  overflowDot: {
    position: 'absolute',
    right: 2,
    top: 1,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FDFAF6',
  },
});
