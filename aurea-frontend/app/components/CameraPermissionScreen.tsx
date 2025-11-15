import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { theme } from '../theme';

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
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera access denied</Text>
        <Text style={styles.errorSubtext}>
          Please enable camera permissions in settings to use the barcode scanner.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onRequestPermission}>
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={onGoBack}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
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
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
  },
  errorText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  secondaryButton: {
    backgroundColor: theme.colors.text.secondary,
  },
  buttonText: {
    color: theme.colors.text.light,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
});
