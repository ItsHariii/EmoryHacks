import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SimpleDatePicker } from './SimpleDatePicker';
import { theme } from '../theme';
import { registrationSchema, RegistrationFormData } from '../utils/validation';

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
        fieldsToValidate = ['prePregnancyWeight', 'height', 'currentWeight', 'bloodType'];
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
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Let's get started!</Text>
      <Text style={styles.stepSubtitle}>Create your account</Text>

      <Controller
        control={control}
        name="firstName"
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="First Name *"
              value={value}
              onChangeText={onChange}
              placeholderTextColor={theme.colors.text.muted}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="lastName"
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Last Name *"
              value={value}
              onChangeText={onChange}
              placeholderTextColor={theme.colors.text.muted}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email *"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={theme.colors.text.muted}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Password *"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              placeholderTextColor={theme.colors.text.muted}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>
        )}
      />
      <Text style={styles.passwordHint}>
        Password must be at least 8 characters and include uppercase, lowercase, and a number
      </Text>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pregnancy Information</Text>
      <Text style={styles.stepSubtitle}>Help us personalize your experience</Text>

      <Text style={styles.label}>Due Date *</Text>
      <Controller
        control={control}
        name="dueDate"
        render={({ field: { onChange, value } }) => (
          <View>
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
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Health Information</Text>
      <Text style={styles.stepSubtitle}>Optional - helps us provide better recommendations</Text>

      <Controller
        control={control}
        name="prePregnancyWeight"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Pre-pregnancy Weight (lbs)"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.text.muted}
          />
        )}
      />

      <Controller
        control={control}
        name="height"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Height (inches)"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.text.muted}
          />
        )}
      />

      <Controller
        control={control}
        name="currentWeight"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Current Weight (lbs)"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            placeholderTextColor={theme.colors.text.muted}
          />
        )}
      />

      <Controller
        control={control}
        name="bloodType"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Blood Type (e.g., A+, O-)"
            value={value}
            onChangeText={onChange}
            autoCapitalize="characters"
            placeholderTextColor={theme.colors.text.muted}
          />
        )}
      />
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dietary Preferences</Text>
      <Text style={styles.stepSubtitle}>Optional - helps us provide personalized nutrition advice</Text>

      <Text style={styles.label}>Allergies</Text>
      <View style={styles.tagInputContainer}>
        <TextInput
          style={styles.tagInput}
          placeholder="Add allergy (e.g., peanuts)"
          value={allergyInput}
          onChangeText={setAllergyInput}
          placeholderTextColor={theme.colors.text.muted}
        />
        <TouchableOpacity style={styles.addButton} onPress={addAllergy}>
          <MaterialCommunityIcons name="plus" size={20} color={theme.colors.text.inverse} />
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
        <TextInput
          style={styles.tagInput}
          placeholder="Add condition (e.g., gestational diabetes)"
          value={conditionInput}
          onChangeText={setConditionInput}
          placeholderTextColor={theme.colors.text.muted}
        />
        <TouchableOpacity style={styles.addButton} onPress={addCondition}>
          <MaterialCommunityIcons name="plus" size={20} color={theme.colors.text.inverse} />
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
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {renderProgressBar()}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {step === 4 ? 'Complete' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.xs,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  backButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  nextButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text.inverse,
  },
});
