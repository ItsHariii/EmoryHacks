import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { SAFETY_STATUS_ICONS, ICON_COLORS } from './icons/iconConstants';
import { scaleDownAnimation, scaleUpAnimation } from '../utils/animations';

interface FoodSafetyBadgeProps {
  status: 'safe' | 'limited' | 'avoid' | 'caution'; // 'caution' for backward compatibility
  notes?: string;
  onPress?: () => void;
}

export const FoodSafetyBadge: React.FC<FoodSafetyBadgeProps> = ({
  status,
  notes,
  onPress,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleValue = new Animated.Value(1);

  const handlePressIn = () => {
    scaleDownAnimation(scaleValue).start();
  };

  const handlePressOut = () => {
    scaleUpAnimation(scaleValue).start();
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (notes) {
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
          accessibilityHint={notes ? 'Tap to view safety details' : undefined}
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
      {notes && (
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
                  </Text>
                </View>

                <Text style={styles.notesText}>{notes}</Text>

                {status === 'avoid' && (
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
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  notesText: {
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
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
