import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { FEATURE_ICONS } from './icons/iconConstants';

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onFocus,
  onBlur,
  placeholder = 'Search...',
  containerStyle,
  expandable = false,
  expanded = true,
  onToggleExpand,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const expandAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();

    if (expanded && inputRef.current) {
      // Auto-focus when expanded
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [expanded]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleToggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleExpand?.();
  };

  const containerWidth = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 300], // Collapsed: icon button size, Expanded: full width
  });

  const inputOpacity = expandAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  if (expandable && !expanded) {
    // Collapsed state - just show search icon button
    return (
      <TouchableOpacity
        onPress={handleToggleExpand}
        style={[styles.collapsedButton, containerStyle]}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Expand search"
      >
        <MaterialCommunityIcons
          name={FEATURE_ICONS.search}
          size={24}
          color={theme.colors.text.inverse}
        />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        expandable && { width: containerWidth },
        containerStyle,
      ]}
    >
      <MaterialCommunityIcons
        name={FEATURE_ICONS.search}
        size={20}
        color={theme.colors.text.secondary}
        style={styles.searchIcon}
      />
      
      <Animated.View style={[styles.inputWrapper, { opacity: inputOpacity }]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.muted}
          returnKeyType="search"
          autoCorrect={false}
          accessible={true}
          accessibilityLabel="Search input"
          {...textInputProps}
        />
      </Animated.View>

      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <MaterialCommunityIcons
            name={FEATURE_ICONS.close}
            size={20}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      )}

      {expandable && (
        <TouchableOpacity
          onPress={handleToggleExpand}
          style={styles.collapseButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Collapse search"
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  containerFocused: {
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  collapsedButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    padding: 0,
  },
  clearButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
  collapseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
  },
});
