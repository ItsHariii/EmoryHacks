import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { theme } from '../theme';
import { SafetyTag } from './SafetyTag';
import { Button } from './Button';

interface SafetyWarningModalProps {
  visible: boolean;
  foodName?: string;
  safetyNotes?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * SafetyWarningModal Component
 * 
 * Displays safety warning for foods marked as "avoid" during pregnancy
 */
export const SafetyWarningModal: React.FC<SafetyWarningModalProps> = ({
  visible,
  foodName,
  safetyNotes,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Safety Notice</Text>
            <SafetyTag status="avoid" />
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalText}>
              {foodName
                ? `${foodName} is generally recommended to avoid during pregnancy.`
                : 'This food is generally recommended to avoid during pregnancy.'}
            </Text>

            {safetyNotes && (
              <View style={styles.safetyNotesBox}>
                <Text style={styles.safetyNotesTitle}>Important Information:</Text>
                <Text style={styles.safetyNotesText}>{safetyNotes}</Text>
              </View>
            )}

            <Text style={styles.modalFooterText}>
              We recommend consulting with your healthcare provider before consuming
              this food. Would you still like to log it?
            </Text>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={onCancel}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Log Anyway"
              onPress={onConfirm}
              variant="primary"
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.lg,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalBody: {
    marginBottom: theme.spacing.lg,
  },
  modalText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.md,
    marginBottom: theme.spacing.md,
  },
  safetyNotesBox: {
    backgroundColor: theme.colors.accentLight,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  safetyNotesTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  safetyNotesText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  modalFooterText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
