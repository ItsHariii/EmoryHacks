// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.7;

export const ScanningOverlay: React.FC<{ instruction?: string; subInstruction?: string }> = ({
  instruction = 'Align the barcode within the frame',
  subInstruction,
}) => {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.scanFrame}>
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>
      <View style={styles.captionWrap}>
        <Text style={styles.instructionText}>{instruction}</Text>
        {subInstruction ? <Text style={styles.subInstructionText}>{subInstruction}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE * 0.74,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#B84C3F',
  },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 8,
  },
  captionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -56,
    alignItems: 'center',
  },
  instructionText: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  subInstructionText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
});
