// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { RegistrationWizard } from '../components/auth/RegistrationWizard';
import { theme } from '../theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const formCardOpacity = useRef(new Animated.Value(0)).current;
  const formCardTranslateY = useRef(new Animated.Value(24)).current;

  const { login, register } = useAuth();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(formCardOpacity, {
        toValue: 1,
        duration: theme.animations.duration.normal,
        useNativeDriver: true,
      }),
      Animated.timing(formCardTranslateY, {
        toValue: 0,
        duration: theme.animations.duration.normal,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationComplete = async (data: any) => {
    setLoading(true);
    try {
      await register({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        due_date: data.dueDate ? data.dueDate.toISOString().split('T')[0] : undefined,
        babies: data.babies,
        pre_pregnancy_weight: data.prePregnancyWeight ? parseFloat(data.prePregnancyWeight) : undefined,
        height: data.height ? parseFloat(data.height) : undefined,
        current_weight: data.currentWeight ? parseFloat(data.currentWeight) : undefined,
        blood_type: data.bloodType || undefined,
        allergies: data.allergies,
        conditions: data.conditions,
        dietary_preferences: data.dietaryPreferences || undefined,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert('Registration Error', error.message || 'Registration failed. Please try again.');
      setShowWizard(false);
    } finally {
      setLoading(false);
    }
  };

  if (showWizard) {
    return (
      <ScreenWrapper>
        <RegistrationWizard
          onComplete={handleRegistrationComplete}
          onCancel={() => setShowWizard(false)}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper gradientBackground gradientColors={theme.gradients.warmBackground}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Ovi</Text>
            <Text style={styles.subtitle}>Your Pregnancy Nutrition Companion</Text>
          </View>

          <Animated.View
            style={[
              styles.formCard,
              {
                opacity: formCardOpacity,
                transform: [{ translateY: formCardTranslateY }],
              },
            ]}
          >
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button
              title={loading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              variant="primary"
              style={styles.loginButton}
            />

            <Button
              title="Don't have an account? Sign Up"
              onPress={() => setShowWizard(true)}
              variant="ghost"
              style={styles.switchButton}
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  title: {
    ...theme.typography.presets.heading1,
    fontSize: theme.typography.fontSize.hero,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.presets.bodyLarge,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    opacity: 0.9,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.layout.cardPadding,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    gap: theme.spacing.lg,
  },
  loginButton: {
    marginTop: theme.spacing.xl,
  },
  switchButton: {
    marginTop: theme.spacing.lg,
  },
});
