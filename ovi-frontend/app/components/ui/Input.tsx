// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../../theme';

type ValidationState = 'default' | 'error' | 'success';
type InputVariant = 'default' | 'glass' | 'outlined' | 'filled';

interface InputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  validationState?: ValidationState;
  variant?: InputVariant;
  containerStyle?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  validationState = 'default',
  variant = 'default',
  containerStyle,
  accessibilityLabel,
  accessibilityHint,
  style,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.(e);
  };

  const showError = validationState === 'error' && errorMessage;
  const showHelper = !showError && helperText;

  const getBorderColor = () => {
    if (validationState === 'error') return '#B84C3F';
    if (validationState === 'success') return '#6F8C6F';
    if (isFocused) return '#2B221B';
    return '#E8E0D5';
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'filled':
        return '#F6F1EA';
      case 'glass':
        return 'transparent';
      case 'outlined':
      case 'default':
      default:
        return '#FFFFFF';
    }
  };

  const inputContainerStyle = [
    styles.inputContainer,
    {
      borderColor: getBorderColor(),
      backgroundColor: getBackgroundColor(),
      borderWidth: variant === 'glass' ? 0 : 1,
    },
    variant === 'glass' && styles.glassContainer,
    style,
  ];

  const renderInput = () => (
    <TextInput
      style={[
        styles.input,
        variant === 'glass' && styles.glassInput,
        { color: theme.colors.text.primary }
      ]}
      placeholderTextColor={theme.colors.text.muted}
      onFocus={handleFocus}
      onBlur={handleBlur}
      accessible={true}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
      {...textInputProps}
    />
  );

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      )}

      {variant === 'glass' ? (
        <View style={[styles.inputWrapper, { borderRadius: theme.borderRadius.md, overflow: 'hidden' }]}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 20 : 100}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[
            inputContainerStyle,
            {
              borderColor: focusAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(255,255,255,0.3)', theme.colors.primary]
              })
            }
          ]}>
            {renderInput()}
          </Animated.View>
        </View>
      ) : (
        <Animated.View style={inputContainerStyle}>
          {renderInput()}
        </Animated.View>
      )}

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
  inputWrapper: {
    position: 'relative',
  },
  inputContainer: {
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E8E0D5',
  },
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  label: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#8C7E70',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    fontFamily: theme.typography.fontFamily.regular,
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    height: '100%',
  },
  glassInput: {
    color: theme.colors.text.primary, // Or inverse depending on background
  },
  helperText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
});
