import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export const ScanningOverlay: React.FC = () => {
  return (
    <View style={styles.overlay}>
      <View style={styles.topOverlay} />
      <View style={styles.middleRow}>
        <View style={styles.sideOverlay} />
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={styles.sideOverlay} />
      </View>
      <View style={styles.bottomOverlay}>
        <Text style={styles.instructionText}>
          Position barcode within the frame
        </Text>
        <Text style={styles.subInstructionText}>
          Supports UPC and EAN formats
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_AREA_SIZE,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: theme.colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: theme.spacing.xxl,
  },
  instructionText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subInstructionText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    opacity: 0.8,
  },
});
