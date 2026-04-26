// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SimpleDatePicker } from '../ui/SimpleDatePicker';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { theme } from '../../theme';
import { registrationSchema, oauthOnboardingSchema, RegistrationFormData } from '../../utils/validation';

interface RegistrationWizardProps {
  onComplete: (data: any) => void;
  onCancel: () => void;
  mode?: 'email' | 'oauth';
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  onComplete,
  onCancel,
  mode = 'email',
}) => {
  const [step, setStep] = useState(mode === 'oauth' ? 2 : 1);
  const [allergyInput, setAllergyInput] = useState('');
  const [conditionInput, setConditionInput] = useState('');

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(mode === 'oauth' ? oauthOnboardingSchema : registrationSchema) as any,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      babies: 1,
      birthDate: undefined,
      allergies: [],
      conditions: [],
      dietaryPreferences: '',
    },
    mode: 'onChange',
  });

  const allergies = watch('allergies');
  const conditions = watch('conditions');
  const dietaryPreferences = watch('dietaryPreferences');
  const babies = watch('babies');

  const validateStep = async () => {
    let fieldsToValidate: (keyof RegistrationFormData)[] = [];
    switch (step) {
      case 1:
        fieldsToValidate = ['firstName', 'lastName', 'email', 'password'];
        break;
      case 2:
        fieldsToValidate = ['dueDate', 'babies'];
        break;
      case 3:
        fieldsToValidate = ['birthDate', 'prePregnancyWeight', 'height', 'currentWeight', 'bloodType'];
        break;
      case 4:
        fieldsToValidate = ['allergies', 'conditions', 'dietaryPreferences'];
        break;
    }

    const isStepValid = await trigger(fieldsToValidate);
    return isStepValid;
  };

  const handleNext = async () => {
    const isStepValid = await validateStep();
    if (isStepValid) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        handleSubmit(onComplete)();
      }
    }
  };

  const handleBack = () => {
    const minStep = mode === 'oauth' ? 2 : 1;
    if (step > minStep) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      const currentAllergies = allergies || [];
      setValue('allergies', [...currentAllergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    const currentAllergies = allergies || [];
    setValue('allergies', currentAllergies.filter((_, i) => i !== index));
  };

  const addCondition = () => {
    if (conditionInput.trim()) {
      const currentConditions = conditions || [];
      setValue('conditions', [...currentConditions, conditionInput.trim()]);
      setConditionInput('');
    }
  };

  const removeCondition = (index: number) => {
    const currentConditions = conditions || [];
    setValue('conditions', currentConditions.filter((_, i) => i !== index));
  };

  const renderProgressBar = () => {
    const dots = mode === 'oauth' ? [2, 3, 4] : [1, 2, 3, 4];
    return (
      <View style={styles.progressContainer}>
        {dots.map((s) => (
          <View
            key={s}
            style={[styles.progressDot, s <= step && styles.progressDotActive]}
          />
        ))}
      </View>
    );
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Let's get started!</Text>
      <Text style={styles.stepSubtitle}>Create your account</Text>

      <Card style={styles.card}>
        <Controller
          control={control}
          name="firstName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="First Name"
              placeholder="Enter your first name"
              value={value}
              onChangeText={onChange}
              errorMessage={errors.firstName?.message}
              validationState={errors.firstName ? 'error' : 'default'}
              leftIcon="account"
            />
          )}
        />

        <Controller
          control={control}
          name="lastName"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Last Name"
              placeholder="Enter your last name"
              value={value}
              onChangeText={onChange}
              errorMessage={errors.lastName?.message}
              validationState={errors.lastName ? 'error' : 'default'}
              leftIcon="account"
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              errorMessage={errors.email?.message}
              validationState={errors.email ? 'error' : 'default'}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="email"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              placeholder="Create a password"
              value={value}
              onChangeText={onChange}
              errorMessage={errors.password?.message}
              validationState={errors.password ? 'error' : 'default'}
              secureTextEntry
              leftIcon="lock"
            />
          )}
        />
        <Text style={styles.passwordHint}>
          Password must be at least 8 characters and include uppercase, lowercase, and a number
        </Text>
      </Card>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Pregnancy Information</Text>
      <Text style={styles.stepSubtitle}>Help us personalize your experience</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Due Date *</Text>
        <Controller
          control={control}
          name="dueDate"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputWrapper}>
              <SimpleDatePicker
                value={value || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)}
                onChange={onChange}
                minimumDate={new Date()}
                maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
              />
              {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate.message}</Text>}
            </View>
          )}
        />

        <Text style={styles.label}>Number of Babies</Text>
        <View style={styles.babiesContainer}>
          {[1, 2, 3].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.babiesButton,
                babies === num && styles.babiesButtonActive,
              ]}
              onPress={() => setValue('babies', num)}
            >
              <Text
                style={[
                  styles.babiesButtonText,
                  babies === num && styles.babiesButtonTextActive,
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Health Information</Text>
      <Text style={styles.stepSubtitle}>Optional - helps us provide better recommendations</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Date of Birth</Text>
        <Controller
          control={control}
          name="birthDate"
          render={({ field: { onChange, value } }) => (
            <View style={styles.inputWrapper}>
              <SimpleDatePicker
                value={value || new Date(new Date().setFullYear(new Date().getFullYear() - 30))}
                onChange={onChange}
                maximumDate={new Date()}
              />
              {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="prePregnancyWeight"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Pre-pregnancy Weight (lbs)"
              placeholder="e.g., 140"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              leftIcon="scale-bathroom"
            />
          )}
        />

        <Controller
          control={control}
          name="height"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Height (inches)"
              placeholder="e.g., 65"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              leftIcon="ruler"
            />
          )}
        />

        <Controller
          control={control}
          name="currentWeight"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Current Weight (lbs)"
              placeholder="e.g., 145"
              value={value}
              onChangeText={onChange}
              keyboardType="numeric"
              leftIcon="scale-bathroom"
            />
          )}
        />

        <Controller
          control={control}
          name="bloodType"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Blood Type"
              placeholder="e.g., A+, O-"
              value={value}
              onChangeText={onChange}
              autoCapitalize="characters"
              leftIcon="water"
            />
          )}
        />
      </Card>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>Dietary Preferences</Text>
      <Text style={styles.stepSubtitle}>Optional - helps us provide personalized nutrition advice</Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Allergies</Text>
        <View style={styles.tagInputContainer}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Add allergy (e.g., peanuts)"
              value={allergyInput}
              onChangeText={setAllergyInput}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
            <MaterialCommunityIcons name="plus" size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
        <View style={styles.tagsContainer}>
          {allergies?.map((allergy, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{allergy}</Text>
              <TouchableOpacity onPress={() => removeAllergy(index)}>
                <MaterialCommunityIcons name="close" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Health Conditions</Text>
        <View style={styles.tagInputContainer}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Add condition (e.g., diabetes)"
              value={conditionInput}
              onChangeText={setConditionInput}
              containerStyle={{ marginBottom: 0 }}
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addCondition}>
            <MaterialCommunityIcons name="plus" size={24} color={theme.colors.text.inverse} />
          </TouchableOpacity>
        </View>
        <View style={styles.tagsContainer}>
          {conditions?.map((condition, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{condition}</Text>
              <TouchableOpacity onPress={() => removeCondition(index)}>
                <MaterialCommunityIcons name="close" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Text style={styles.label}>Dietary Preference</Text>
        <View style={styles.dietaryContainer}>
          {['None', 'Vegetarian', 'Vegan', 'Gluten-Free'].map((pref) => (
            <TouchableOpacity
              key={pref}
              style={[
                styles.dietaryButton,
                dietaryPreferences === pref && styles.dietaryButtonActive,
              ]}
              onPress={() => setValue('dietaryPreferences', pref)}
            >
              <Text
                style={[
                  styles.dietaryButtonText,
                  dietaryPreferences === pref && styles.dietaryButtonTextActive,
                ]}
              >
                {pref}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {renderProgressBar()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <View style={styles.buttonContainer}>
        {/* Hide back/cancel button on the first oauth onboarding step — the user must complete it */}
        {!(mode === 'oauth' && step === 2) && (
          <Button
            variant="outline"
            title={step === 1 ? 'Cancel' : 'Back'}
            onPress={handleBack}
            style={styles.navButton}
          />
        )}

        <Button
          variant="primary"
          title={step === 4 ? 'Complete' : 'Next'}
          onPress={handleNext}
          style={styles.navButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F1EA',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D9CEBF',
  },
  progressDotActive: {
    width: 22,
    backgroundColor: '#2B221B',
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 28,
  },
  stepTitle: {
    fontFamily: theme.typography.fontFamily.displayLight,
    fontSize: 32,
    color: '#2B221B',
    letterSpacing: -1,
    lineHeight: 36,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: 13,
    color: '#6A5D52',
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'transparent',
    padding: 0,
    marginBottom: 20,
    borderWidth: 0,
  },
  label: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#9C8E80',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    marginBottom: 14,
  },
  errorText: {
    fontFamily: theme.typography.fontFamily.regular,
    color: '#B84C3F',
    fontSize: 12,
    marginTop: 6,
  },
  passwordHint: {
    fontFamily: theme.typography.fontFamily.displayItalic,
    fontStyle: 'italic',
    fontSize: 11,
    color: '#9C8E80',
    marginTop: 4,
    marginBottom: 12,
  },
  babiesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  babiesButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
    alignItems: 'center',
  },
  babiesButtonActive: {
    backgroundColor: '#2B221B',
    borderColor: '#2B221B',
  },
  babiesButtonText: {
    fontFamily: theme.typography.fontFamily.display,
    fontSize: 18,
    color: '#2B221B',
  },
  babiesButtonTextActive: {
    color: '#FFFFFF',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2B221B',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFE7DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  tagText: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: 11,
    color: '#2B221B',
    letterSpacing: 0.2,
  },
  dietaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dietaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E8E0D5',
  },
  dietaryButtonActive: {
    borderColor: '#2B221B',
    backgroundColor: '#2B221B',
  },
  dietaryButtonText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: 13,
    color: '#2B221B',
  },
  dietaryButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: '#F6F1EA',
  },
  navButton: {
    flex: 1,
  },
});
