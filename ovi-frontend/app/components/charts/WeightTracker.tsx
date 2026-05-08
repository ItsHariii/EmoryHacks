// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useUserStore } from '../../store/useUserStore';
import { journalAPI } from '../../services/api';

interface WeightTrackerProps {
  currentWeight?: number;
  onWeightUpdate?: (weight: number) => void;
}

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });
const formatRow = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const WeightTracker: React.FC<WeightTrackerProps> = ({ currentWeight, onWeightUpdate }) => {
  const { profile } = useUserStore();
  const [weightInput, setWeightInput] = useState(currentWeight?.toString() || '');
  const [showLogModal, setShowLogModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ date: string; weight: number }[]>([]);

  useEffect(() => {
    if (currentWeight) setWeightInput(currentWeight.toString());
  }, [currentWeight]);

  const handleSave = async () => {
    if (!weightInput || isNaN(Number(weightInput))) return;
    setLoading(true);
    try {
      const weightNum = parseFloat(weightInput);
      await journalAPI.logWeight(weightNum, new Date().toISOString().split('T')[0]);
      onWeightUpdate?.(weightNum);
      setShowLogModal(false);
    } catch (error) {
      Alert.alert('Save Failed', 'Could not save your weight. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Recommended range based on pre-pregnancy weight (mock if absent)
  const baseWeight = profile?.pre_pregnancy_weight || (currentWeight ? currentWeight - 5 : 140);
  const lowEnd = (baseWeight + 11).toFixed(0);
  const highEnd = (baseWeight + 18).toFixed(0);

  // SVG line geometry
  const CHART_WIDTH = Dimensions.get('window').width - theme.layout.screenPadding * 2 - 8;
  const CHART_HEIGHT = 120;
  const PAD_X = 12;
  const PAD_Y = 14;

  let polyPoints = '';
  let coordPts: { x: number; y: number; w: number; label: string }[] = [];
  if (history.length > 1) {
    const weights = history.map((h) => h.weight);
    const min = Math.min(...weights) - 0.5;
    const max = Math.max(...weights) + 0.5;
    const range = max - min || 1;
    coordPts = history.map((h, i) => {
      const x = PAD_X + (i * (CHART_WIDTH - PAD_X * 2)) / (history.length - 1);
      const y = PAD_Y + ((max - h.weight) / range) * (CHART_HEIGHT - PAD_Y * 2);
      return { x, y, w: h.weight, label: formatDay(h.date) };
    });
    polyPoints = coordPts.map((p) => `${p.x},${p.y}`).join(' ');
  }

  // Subtle horizontal guide lines
  const yGuides = [0.25, 0.5, 0.75].map(
    (frac) => PAD_Y + frac * (CHART_HEIGHT - PAD_Y * 2)
  );

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>
        Weight <Text style={styles.pageTitleItalic}>tracker</Text>
      </Text>

      <View style={styles.heroRow}>
        <View>
          <Text style={styles.weightValue}>
            {currentWeight ? currentWeight.toFixed(1) : '--'}
            <Text style={styles.weightUnit}> lb</Text>
          </Text>
          <Text style={styles.range}>
            Recommended range: {lowEnd}–{highEnd} lb
          </Text>
        </View>
      </View>

      {/* Chart */}
      {history.length > 1 ? (
        <View style={styles.chartCard}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            {yGuides.map((y, i) => (
              <Line
                key={i}
                x1={PAD_X}
                x2={CHART_WIDTH - PAD_X}
                y1={y}
                y2={y}
                stroke="#EDE6DC"
                strokeWidth={0.5}
              />
            ))}
            <Polyline
              points={polyPoints}
              stroke="#B84C3F"
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {coordPts.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3} fill="#B84C3F" />
            ))}
          </Svg>
          <View style={styles.axisLabels}>
            {coordPts.map((p, i) => (
              <Text key={i} style={styles.axisLabel}>{p.label}</Text>
            ))}
          </View>
        </View>
      ) : null}

      {/* Recent entries */}
      {history.length > 0 && (
        <View style={styles.entries}>
          {history.slice().reverse().slice(0, 4).map((entry, i, arr) => (
            <View
              key={i}
              style={[styles.entryRow, i < arr.length - 1 && styles.entryRowDivider]}
            >
              <Text style={styles.entryDate}>{formatRow(entry.date)}</Text>
              <View style={styles.entryRight}>
                <Text style={styles.entryWeight}>
                  {entry.weight.toFixed(1)}
                  <Text style={styles.entryWeightUnit}> lb</Text>
                </Text>
                <TouchableOpacity
                  style={styles.editIcon}
                  onPress={() => setShowLogModal(true)}
                  accessibilityLabel="Edit weight entry"
                >
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#8C7E70" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Log weight CTA */}
      <TouchableOpacity
        style={styles.cta}
        onPress={() => setShowLogModal(true)}
        accessibilityRole="button"
        accessibilityLabel="Log weight"
        activeOpacity={0.9}
      >
        <Text style={styles.ctaText}>Log weight</Text>
      </TouchableOpacity>

      {/* Log modal */}
      <Modal visible={showLogModal} transparent animationType="slide" onRequestClose={() => setShowLogModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalScrim} onPress={() => setShowLogModal(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <Text style={styles.modalTitle}>
              Log <Text style={styles.modalTitleItalic}>weight</Text>
            </Text>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder="0.0"
                placeholderTextColor="#8C7E70"
                autoFocus
              />
              <Text style={styles.modalUnit}>lb</Text>
            </View>
            <TouchableOpacity
              style={[styles.cta, { marginTop: 18 }]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.ctaText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.layout.screenPadding,
    marginBottom: theme.spacing.xxl,
    backgroundColor: 'transparent',
  },
  pageTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 28,
    color: '#2B221B',
    letterSpacing: -0.7,
    lineHeight: 32,
    marginBottom: 6,
  },
  pageTitleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  heroRow: {
    marginTop: 12,
    marginBottom: 18,
  },
  weightValue: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 44,
    color: '#2B221B',
    letterSpacing: -1.2,
    lineHeight: 48,
  },
  weightUnit: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 16,
    color: '#8C7E70',
  },
  range: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#8C7E70',
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: '#FDFAF6',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 18,
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  axisLabel: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 10,
    color: '#8C7E70',
    letterSpacing: 0.5,
  },
  entries: {
    backgroundColor: '#FDFAF6',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    overflow: 'hidden',
    marginBottom: 18,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  entryRowDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFE5D5',
  },
  entryDate: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 12,
    color: '#8C7E70',
    letterSpacing: 0.3,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryWeight: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    color: '#2B221B',
    letterSpacing: -0.3,
  },
  entryWeightUnit: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 11,
    color: '#8C7E70',
  },
  editIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    paddingVertical: 16,
    borderRadius: 100,
    backgroundColor: '#2B221B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,34,27,0.4)',
  },
  modalSheet: {
    backgroundColor: '#F6F1EA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8E0D5',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 24,
    color: '#2B221B',
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  modalTitleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2B221B',
    paddingBottom: 8,
  },
  modalInput: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 32,
    color: '#2B221B',
    letterSpacing: -0.6,
    padding: 0,
  },
  modalUnit: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 14,
    color: '#8C7E70',
  },
});
