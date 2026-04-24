import React, { useState } from 'react';
import { Alert } from 'react-native';
import { RegistrationWizard } from '../components/auth/RegistrationWizard';
import { ScreenWrapper } from '../components/layout/ScreenWrapper';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const OnboardingScreen: React.FC = () => {
  const { refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleComplete = async (data: any) => {
    setLoading(true);
    try {
      await userAPI.updateCurrentUser({
        due_date: data.dueDate ? data.dueDate.toISOString().split('T')[0] : undefined,
        babies: data.babies,
        pre_pregnancy_weight: data.prePregnancyWeight ? parseFloat(data.prePregnancyWeight) : undefined,
        height: data.height ? parseFloat(data.height) : undefined,
        current_weight: data.currentWeight ? parseFloat(data.currentWeight) : undefined,
        blood_type: data.bloodType || undefined,
        allergies: data.allergies ?? [],
        conditions: data.conditions ?? [],
        dietary_preferences: data.dietaryPreferences || undefined,
        onboarding_completed: true,
      });
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Skip Setup?',
      'You can complete your profile later from Settings. You will be signed out for now.',
      [
        { text: 'Continue Setup', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <RegistrationWizard
        mode="oauth"
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </ScreenWrapper>
  );
};
