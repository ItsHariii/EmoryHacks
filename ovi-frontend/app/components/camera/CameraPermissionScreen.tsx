// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { Button } from '../ui/Button';

interface CameraPermissionScreenProps {
  loading?: boolean;
  denied?: boolean;
  onRequestPermission: () => void;
  onGoBack: () => void;
}

export const CameraPermissionScreen: React.FC<CameraPermissionScreenProps> = ({
  loading = false,
  denied = false,
  onRequestPermission,
  onGoBack,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (denied) {
    const openSettings = () => {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    };

    return (
      <View style={styles.container}>
        <View style={styles.errorIconContainer}>
          <MaterialCommunityIcons name="camera-off" size={theme.iconSize.huge} color={theme.colors.error} />
        </View>
        <Text style={styles.errorText}>Camera Access Required</Text>
        <Text style={styles.errorSubtext}>
          To scan barcodes, please enable camera permissions in your device settings.
        </Text>
        <View style={styles.buttonRow}>
          <Button title="Open Settings" onPress={openSettings} variant="primary" />
        </View>
        <View style={styles.buttonRow}>
          <Button title="Go Back" onPress={onGoBack} variant="outline" />
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  errorIconContainer: {
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 22,
    color: '#2B221B',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: '#5A4D42',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 19,
  },
  buttonRow: {
    width: '100%',
    maxWidth: 280,
    marginBottom: theme.spacing.sm,
  },
});
