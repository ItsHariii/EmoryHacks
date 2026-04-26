// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { RegistrationWizard } from '../components/auth/RegistrationWizard';
import { theme } from '../theme';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { Input } from '../components/ui/Input';
import { GoogleLogo } from '../components/auth/GoogleLogo';

const Wordmark: React.FC = () => (
  <View style={{ alignItems: 'center' }}>
    <Text style={styles.wordmark}>
      Ovi<Text style={styles.wordmarkAccent}>ula</Text>
    </Text>
    <Text style={styles.tagline}>nourish the two of you</Text>
  </View>
);

const ProgressRing: React.FC = () => (
  <Svg width={220} height={220} viewBox="0 0 220 220">
    <Circle cx="110" cy="110" r="104" fill="#F4E4DF" />
    <Circle cx="110" cy="110" r="86" fill="#F6F1EA" />
    <Circle cx="110" cy="110" r="86" fill="none" stroke="#E8E0D5" strokeWidth="1" />
    <Circle
      cx="110"
      cy="110"
      r="86"
      fill="none"
      stroke="#B84C3F"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="270 540"
      transform="rotate(-90 110 110)"
    />
    <Circle cx="110" cy="110" r="4.5" fill="#B84C3F" />
  </Svg>
);

export const AuthScreen: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, loginWithGoogle, loginWithApple } = useAuth();

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
      if (!(msg.includes('cancel') || msg.includes('dismiss'))) {
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
      if (!(msg.includes('cancel') || msg.includes('dismiss'))) {
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
      <ScreenWrapper backgroundColor="#F6F1EA">
        <RegistrationWizard
          onComplete={handleRegistrationComplete}
          onCancel={() => setShowWizard(false)}
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor="#F6F1EA">
      <View style={styles.container}>
        {/* Top: wordmark */}
        <View style={styles.top}>
          <Wordmark />
        </View>

        {/* Middle: progress ring */}
        <View style={styles.middle}>
          <ProgressRing />
        </View>

        {/* Bottom: actions */}
        <View style={styles.bottom}>
          <Pressable
            style={({ pressed }) => [styles.primaryCta, pressed && styles.primaryCtaPressed]}
            onPress={() => setShowEmailForm(true)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Continue with email"
          >
            <Text style={styles.primaryCtaText}>Continue with email</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryCta, pressed && styles.secondaryCtaPressed]}
            onPress={handleGoogleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
          >
            {loading ? (
              <ActivityIndicator color="#2B221B" size="small" />
            ) : (
              <>
                <GoogleLogo size={16} />
                <Text style={styles.secondaryCtaText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {Platform.OS === 'ios' && (
            <Pressable
              style={({ pressed }) => [styles.secondaryCta, pressed && styles.secondaryCtaPressed]}
              onPress={handleAppleLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
            >
              <Text style={styles.secondaryCtaText}>Continue with Apple</Text>
            </Pressable>
          )}

          <Text style={styles.terms}>
            By continuing you agree to our{'\n'}
            <Text style={styles.termsLink}>Terms</Text>
            {' & '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>

      {/* Email sign-in modal */}
      <Modal visible={showEmailForm} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalScrim} onPress={() => setShowEmailForm(false)} />
          <View style={styles.modalSheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                Welcome <Text style={styles.sheetTitleItalic}>back</Text>
                <Text style={styles.sheetTitleDot}>.</Text>
              </Text>
              <View style={{ height: 14 }} />
              <Input
                label="Email"
                placeholder="you@hello.co"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <Pressable
                style={({ pressed }) => [styles.primaryCta, pressed && styles.primaryCtaPressed, { marginTop: 12 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.primaryCtaText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
              </Pressable>
              <Pressable
                style={styles.linkButton}
                onPress={() => {
                  setShowEmailForm(false);
                  setShowWizard(true);
                }}
              >
                <Text style={styles.linkText}>
                  Don't have an account? <Text style={styles.linkTextBold}>Sign up</Text>
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  top: {
    paddingTop: 40,
    alignItems: 'center',
  },
  middle: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    gap: 10,
  },
  wordmark: {
    fontFamily: theme.typography.fontFamily.displayLight,
    fontSize: 56,
    color: '#2B221B',
    textAlign: 'center',
    letterSpacing: -2,
    lineHeight: 60,
  },
  wordmarkAccent: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    color: '#B84C3F',
  },
  tagline: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    fontSize: 15,
    color: '#6A5D52',
    marginTop: 14,
    letterSpacing: 0.2,
  },
  primaryCta: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: '#2B221B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaPressed: {
    opacity: 0.9,
  },
  primaryCtaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryCta: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryCtaPressed: {
    backgroundColor: '#EFE7DC',
  },
  secondaryCtaText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 14,
    color: '#2B221B',
    letterSpacing: 0.2,
  },
  terms: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6A5D52',
    marginTop: 8,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily.regular,
  },
  termsLink: {
    color: '#2B221B',
    fontFamily: theme.typography.fontFamily.semibold,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,34,27,0.4)',
  },
  modalSheet: {
    backgroundColor: '#F6F1EA',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '88%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9CEBF',
    marginBottom: 16,
  },
  sheetTitle: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 28,
    color: '#2B221B',
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  sheetTitleItalic: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
  },
  sheetTitleDot: {
    color: '#B84C3F',
  },
  linkButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  linkText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: '#6A5D52',
  },
  linkTextBold: {
    fontFamily: theme.typography.fontFamily.semibold,
    color: '#2B221B',
  },
});
