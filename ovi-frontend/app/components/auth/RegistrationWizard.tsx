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
import { registrationSchema, RegistrationFormData } from '../../utils/validation';

interface RegistrationWizardProps {
  onComplete: (data: RegistrationFormData) => void;
  onCancel: () => void;
}

export const RegistrationWizard: React.FC<RegistrationWizardProps> = ({
  onComplete,
  onCancel,
}) => {
  const [step, setStep] = useState(1);
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
    resolver: zodResolver(registrationSchema) as any,
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
    if (step > 1) {
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

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((s) => (
        <View
          key={s}
          style={[
            styles.progressDot,
            s <= step && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
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
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
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
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
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
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
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
        <Button
          variant="outline"
          title={step === 1 ? 'Cancel' : 'Back'}
          onPress={handleBack}
          style={styles.navButton}
        />

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
    backgroundColor: theme.colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  stepTitle: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  stepSubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  card: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  inputWrapper: {
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  passwordHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  babiesContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  babiesButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  babiesButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  babiesButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  babiesButtonTextActive: {
    color: theme.colors.primary,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2, // Align with input
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  dietaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  dietaryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  dietaryButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  dietaryButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  dietaryButtonTextActive: {
    color: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  navButton: {
    flex: 1,
  },
});
