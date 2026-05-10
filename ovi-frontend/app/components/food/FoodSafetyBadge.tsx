// @ts-nocheck
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { SAFETY_STATUS_ICONS, ICON_COLORS } from '../icons/iconConstants';
import { scaleDownAnimation, scaleUpAnimation } from '../../utils/animations';
import { SafetyDisclaimer } from '../safety/SafetyDisclaimer';
import { SafetyVerdict } from '../../types';
import { safetyAPI } from '../../services/api';

interface FoodSafetyBadgeProps {
  status: 'safe' | 'limited' | 'avoid' | 'caution'; // 'caution' for backward compatibility
  notes?: string;
  onPress?: () => void;
  /** Layered verdict from the backend safety pipeline. When present, renders
   * a sectioned modal with per-ingredient findings and authoritative citations. */
  verdict?: SafetyVerdict | null;
  /** When provided, surfaces a "Report incorrect classification" button that
   * POSTs to /food/safety/report. */
  foodId?: string | null;
  foodName?: string;
}

export const FoodSafetyBadge: React.FC<FoodSafetyBadgeProps> = ({
  status,
  notes,
  onPress,
  verdict,
  foodId,
  foodName,
}) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuggested, setReportSuggested] = useState<'safe' | 'limited' | 'avoid' | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const normalizedReportedStatus =
    status === 'caution' ? 'limited' : status === 'safe' || status === 'limited' || status === 'avoid' ? status : 'limited';

  const submitReport = async () => {
    if (!foodName || reportReason.trim().length < 5) {
      Alert.alert('Add a reason', 'Tell us briefly why this classification looks wrong (5+ characters).');
      return;
    }
    setReportSubmitting(true);
    try {
      await safetyAPI.reportIncorrect({
        food_id: foodId ?? null,
        food_name: foodName,
        reported_status: normalizedReportedStatus,
        suggested_status: reportSuggested,
        reason: reportReason.trim(),
      });
      setReportSubmitted(true);
      setReportReason('');
      setReportSuggested(null);
    } catch (e: any) {
      const msg = e?.response?.status === 429
        ? 'You’ve hit the report limit for this hour. Try again later.'
        : 'Could not submit report. Please try again.';
      Alert.alert('Report failed', msg);
    } finally {
      setReportSubmitting(false);
    }
  };

  const [modalVisible, setModalVisible] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    scaleDownAnimation(scaleValue).start();
  };

  const handlePressOut = () => {
    scaleUpAnimation(scaleValue).start();
  };

  const hasModalContent = !!notes || !!verdict;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (hasModalContent) {
      setModalVisible(true);
    }
  };

  const getStatusConfig = () => {
    // Normalize 'caution' to 'limited' for backward compatibility
    const normalizedStatus = status === 'caution' ? 'limited' : status;

    switch (normalizedStatus) {
      case 'safe':
        return {
          backgroundColor: theme.colors.safe,
          textColor: theme.colors.text.primary,
          icon: SAFETY_STATUS_ICONS.safe,
          label: 'Safe',
        };
      case 'limited':
        return {
          backgroundColor: theme.colors.limited,
          textColor: theme.colors.text.primary,
          icon: SAFETY_STATUS_ICONS.limited,
          label: 'Limited',
        };
      case 'avoid':
        return {
          backgroundColor: theme.colors.avoid,
          textColor: theme.colors.text.primary,
          icon: SAFETY_STATUS_ICONS.avoid,
          label: 'Avoid',
        };
      default:
        return {
          backgroundColor: theme.colors.border,
          textColor: theme.colors.text.primary,
          icon: SAFETY_STATUS_ICONS.safe,
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig();
  const isTappable = !!(onPress || notes);

  const badgeContent = (
    <Animated.View
      style={[
        styles.badge,
        { backgroundColor: config.backgroundColor },
        { transform: [{ scale: scaleValue }] },
      ]}
    >
      <MaterialCommunityIcons
        name={config.icon}
        size={15}
        color={config.textColor}
        style={styles.icon}
      />
      <Text style={[styles.label, { color: config.textColor }]}>
        {config.label}
      </Text>
    </Animated.View>
  );

  return (
    <>
      {isTappable ? (
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Food safety status: ${config.label}`}
          accessibilityHint={hasModalContent ? 'Tap to view safety details' : undefined}
        >
          {badgeContent}
        </TouchableOpacity>
      ) : (
        <View
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Food safety status: ${config.label}`}
        >
          {badgeContent}
        </View>
      )}

      {/* Safety Notes Modal */}
      {hasModalContent && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <MaterialCommunityIcons
                    name={config.icon}
                    size={24}
                    color={config.textColor}
                    style={[
                      styles.modalIcon,
                      { backgroundColor: config.backgroundColor },
                    ]}
                  />
                  <Text style={styles.modalTitle}>Safety Information</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Close safety information"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: config.backgroundColor },
                  ]}
                >
                  <Text
                    style={[styles.statusBadgeText, { color: config.textColor }]}
                  >
                    {config.label}
                    {verdict && verdict.confidence != null
                      ? `  ·  ${Math.round(verdict.confidence * 100)}% confidence`
                      : ''}
                  </Text>
                </View>

                <Text style={styles.notesText}>
                  {verdict?.summary || notes}
                </Text>

                {verdict && !verdict.reviewed_by_human && (
                  <View style={styles.aiBanner}>
                    <MaterialCommunityIcons
                      name="robot-outline"
                      size={18}
                      color={theme.colors.text.primary}
                      style={styles.warningIcon}
                    />
                    <Text style={styles.warningText}>
                      AI-assisted estimate — not yet reviewed by our clinical team.
                    </Text>
                  </View>
                )}

                {verdict?.ingredient_findings && verdict.ingredient_findings.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why</Text>
                    {verdict.ingredient_findings.map((f, idx) => (
                      <View key={`${f.ingredient}-${idx}`} style={styles.findingRow}>
                        <View
                          style={[
                            styles.findingPill,
                            {
                              backgroundColor:
                                f.status === 'avoid'
                                  ? theme.colors.avoid
                                  : f.status === 'limited'
                                  ? theme.colors.limited
                                  : theme.colors.safe,
                            },
                          ]}
                        >
                          <Text style={styles.findingPillText}>{f.status}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.findingIngredient}>
                            {f.ingredient || 'Overall'}
                          </Text>
                          {f.notes ? (
                            <Text style={styles.findingNotes}>{f.notes}</Text>
                          ) : null}
                          {f.source ? (
                            <TouchableOpacity
                              onPress={() => f.source?.url && Linking.openURL(f.source.url)}
                              accessibilityRole="link"
                              disabled={!f.source.url}
                            >
                              <Text style={styles.citationLink}>
                                Source: {f.source.label}
                                {f.source.last_reviewed
                                  ? ` (reviewed ${f.source.last_reviewed})`
                                  : ''}
                              </Text>
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {verdict?.cited_sources && verdict.cited_sources.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sources</Text>
                    {verdict.cited_sources.map((src) => (
                      <TouchableOpacity
                        key={src.id}
                        onPress={() => src.url && Linking.openURL(src.url)}
                        disabled={!src.url}
                        accessibilityRole="link"
                      >
                        <Text style={styles.citationLink}>
                          {src.label}
                          {src.last_reviewed ? ` · ${src.last_reviewed}` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {(status === 'avoid' || verdict?.status === 'avoid') && (
                  <View style={styles.warningBox}>
                    <MaterialCommunityIcons
                      name="alert-outline"
                      size={20}
                      color={theme.colors.error}
                      style={styles.warningIcon}
                    />
                    <Text style={styles.warningText}>
                      It's recommended to avoid this food during pregnancy. Please
                      consult with your healthcare provider if you have questions.
                    </Text>
                  </View>
                )}

                {foodName ? (
                  <View style={styles.reportWrap}>
                    {!reportOpen && !reportSubmitted && (
                      <TouchableOpacity
                        style={styles.reportButton}
                        onPress={() => setReportOpen(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Report incorrect classification"
                      >
                        <MaterialCommunityIcons name="flag-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={styles.reportButtonText}>Report incorrect classification</Text>
                      </TouchableOpacity>
                    )}

                    {reportOpen && !reportSubmitted && (
                      <View style={styles.reportForm}>
                        <Text style={styles.reportLabel}>What should it be?</Text>
                        <View style={styles.reportChips}>
                          {(['safe', 'limited', 'avoid'] as const).map((s) => (
                            <TouchableOpacity
                              key={s}
                              style={[
                                styles.reportChip,
                                reportSuggested === s && styles.reportChipSelected,
                              ]}
                              onPress={() => setReportSuggested(s)}
                              accessibilityRole="button"
                              accessibilityLabel={`Suggested status ${s}`}
                            >
                              <Text
                                style={[
                                  styles.reportChipText,
                                  reportSuggested === s && styles.reportChipTextSelected,
                                ]}
                              >
                                {s}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={styles.reportLabel}>Why?</Text>
                        <TextInput
                          style={styles.reportInput}
                          multiline
                          numberOfLines={3}
                          maxLength={2000}
                          value={reportReason}
                          onChangeText={setReportReason}
                          placeholder="A source we missed, an ingredient interaction, a wording problem…"
                          placeholderTextColor={theme.colors.textMuted}
                        />

                        <View style={styles.reportActions}>
                          <TouchableOpacity
                            style={styles.reportCancel}
                            onPress={() => {
                              setReportOpen(false);
                              setReportReason('');
                              setReportSuggested(null);
                            }}
                            accessibilityRole="button"
                          >
                            <Text style={styles.reportCancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.reportSubmit,
                              reportSubmitting && styles.reportSubmitDisabled,
                            ]}
                            disabled={reportSubmitting}
                            onPress={submitReport}
                            accessibilityRole="button"
                          >
                            <Text style={styles.reportSubmitText}>
                              {reportSubmitting ? 'Submitting…' : 'Submit'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {reportSubmitted && (
                      <Text style={styles.reportThanks}>
                        Thanks — your report is in our review queue.
                      </Text>
                    )}
                  </View>
                ) : null}

                <View style={styles.disclaimerWrap}>
                  <SafetyDisclaimer />
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setModalVisible(false)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: theme.spacing.xs - 2, // 6px spacing
  },
  label: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...theme.shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  modalTitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  modalBody: {
    marginBottom: theme.spacing.md,
  },
  statusBadge: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  statusBadgeText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  notesText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.md * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.error + '20', // 20% opacity
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  warningIcon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  warningText: {
    fontFamily: theme.typography.fontFamily.regular,
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
  },
  closeModalButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  section: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  findingPill: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  findingPillText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  findingIngredient: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  findingNotes: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
    marginBottom: 2,
  },
  citationLink: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
    marginTop: 2,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: (theme.colors.warning || theme.colors.limited) + '30',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning || theme.colors.limited,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  disclaimerWrap: {
    marginTop: theme.spacing.md,
  },
  reportWrap: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border || '#e5e7eb',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  reportButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  reportForm: {
    gap: theme.spacing.sm,
  },
  reportLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  reportChips: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  reportChip: {
    paddingVertical: 6,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border || '#e5e7eb',
  },
  reportChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  reportChipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  reportChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  reportInput: {
    borderWidth: 1,
    borderColor: theme.colors.border || '#e5e7eb',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
    color: theme.colors.text,
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  reportCancel: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  reportCancelText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  reportSubmit: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
  },
  reportSubmitDisabled: {
    opacity: 0.6,
  },
  reportSubmitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reportThanks: {
    fontSize: 13,
    color: theme.colors.success || theme.colors.primary,
    fontStyle: 'italic',
  },
});
