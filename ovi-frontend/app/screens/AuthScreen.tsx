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
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { RegistrationWizard } from '../components/auth/RegistrationWizard';
import { theme } from '../theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { GoogleLogo } from '../components/auth/GoogleLogo';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const formCardOpacity = useRef(new Animated.Value(0)).current;
  const formCardTranslateY = useRef(new Animated.Value(24)).current;

  const { login, register, loginWithGoogle, loginWithApple } = useAuth();

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
      Alert.alert('Sign In Failed', 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      const msg = error?.message?.toLowerCase() || '';
      const isCancelled = msg.includes('cancel') || msg.includes('dismiss');
      if (!isCancelled) {
        Alert.alert('Sign In Failed', 'Google sign-in could not be completed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    try {
      await loginWithApple();
    } catch (error: any) {
      const msg = error?.message?.toLowerCase() || '';
      const isCancelled = msg.includes('cancel') || msg.includes('dismiss');
      if (!isCancelled) {
        Alert.alert('Sign In Failed', 'Apple sign-in could not be completed. Please try again.');
      }
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
      Alert.alert('Registration Failed', 'Could not create your account. Please check your details and try again.');
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
    <ScreenWrapper backgroundColor={theme.colors.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              Ovi<Text style={styles.titleAccent}>ula</Text>
            </Text>
            <Text style={styles.subtitle}>nourish the two of you</Text>
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
            <View style={styles.socialSection}>
              <Pressable
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && !loading && styles.googleButtonPressed,
                  loading && styles.googleButtonDisabled,
                ]}
                onPress={handleGoogleLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.text.primary} size="small" />
                ) : (
                  <>
                    <View style={styles.googleIconWrap}>
                      <GoogleLogo size={22} />
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </Pressable>
              {Platform.OS === 'ios' ? (
                <Button
                  title={loading ? 'Please wait...' : 'Continue with Apple'}
                  onPress={handleAppleLogin}
                  loading={loading}
                  disabled={loading}
                  variant="secondary"
                />
              ) : null}
            </View>

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
    fontFamily: theme.typography.fontFamily.displayLight,
    fontSize: 56,
    fontWeight: '300',
    color: theme.colors.text.primary,
    textAlign: 'center',
    letterSpacing: -2,
    lineHeight: 60,
    marginBottom: theme.spacing.xs,
  },
  titleAccent: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 4,
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
  socialSection: {
    gap: theme.spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Math.max(48, theme.layout.minTouchTarget),
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.googleBorderColor,
    ...theme.shadows.sm,
  },
  googleButtonPressed: {
    backgroundColor: theme.colors.backgroundDark,
    opacity: 0.96,
  },
  googleButtonDisabled: {
    opacity: 0.65,
  },
  googleIconWrap: {
    marginRight: theme.spacing.md,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.googleTextColor,
    letterSpacing: 0.15,
  },
  loginButton: {
    marginTop: theme.spacing.xl,
  },
  switchButton: {
    marginTop: theme.spacing.lg,
  },
});
