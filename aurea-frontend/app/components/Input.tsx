import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';

type ValidationState = 'default' | 'error' | 'success';

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  validationState?: ValidationState;
  containerStyle?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  validationState = 'default',
  containerStyle,
  accessibilityLabel,
  accessibilityHint,
  style,
  ...textInputProps
}) => {
  const showError = validationState === 'error' && errorMessage;
  const showHelper = !showError && helperText;

  const inputBorderColor = {
    default: theme.colors.border,
    error: theme.colors.error,
    success: theme.colors.success,
  }[validationState];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          { borderColor: inputBorderColor },
          style,
        ]}
        placeholderTextColor={theme.colors.text.muted}
        accessible={true}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityHint={accessibilityHint}
        {...textInputProps}
      />
      {showError && (
        <Text
          style={styles.errorText}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {errorMessage}
        </Text>
      )}
      {showHelper && (
        <Text style={styles.helperText} accessibilityRole="text">
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    minHeight: 44,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
