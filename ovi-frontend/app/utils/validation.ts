import { z } from 'zod';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'] as const;

const weightField = z
    .string()
    .optional()
    .refine(
        v => !v || (Number(v) > 0 && Number(v) < 700),
        { message: 'Please enter a valid weight (1–700 lbs)' }
    );

const heightField = z
    .string()
    .optional()
    .refine(
        v => !v || (Number(v) > 0 && Number(v) < 300),
        { message: 'Please enter a valid height (1–300 cm)' }
    );

export const registrationSchema = z.object({
    // Step 1: Basic Info
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),

    // Step 2: Pregnancy Info
    dueDate: z.date().refine(d => d > new Date(), { message: 'Due date must be in the future' }),
    babies: z.number().min(1).max(10),

    // Step 3: Health Info (Optional but validated if present)
    birthDate: z
        .date()
        .optional()
        .refine(
            d => !d || (d < new Date() && d > new Date('1900-01-01')),
            { message: 'Please enter a valid birth date' }
        ),
    prePregnancyWeight: weightField,
    height: heightField,
    currentWeight: weightField,
    bloodType: z.enum(BLOOD_TYPES).optional(),

    // Step 4: Preferences
    allergies: z.array(z.string()).default([]),
    conditions: z.array(z.string()).default([]),
    dietaryPreferences: z.string().optional(),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Used by the post-OAuth onboarding wizard (steps 2-4 only; no email/password).
export const oauthOnboardingSchema = z.object({
    dueDate: z.date().refine(d => d > new Date(), { message: 'Due date must be in the future' }),
    babies: z.number().min(1).max(10),
    birthDate: z
        .date()
        .optional()
        .refine(
            d => !d || (d < new Date() && d > new Date('1900-01-01')),
            { message: 'Please enter a valid birth date' }
        ),
    prePregnancyWeight: weightField,
    height: heightField,
    currentWeight: weightField,
    bloodType: z.enum(BLOOD_TYPES).optional(),
    allergies: z.array(z.string()).default([]),
    conditions: z.array(z.string()).default([]),
    dietaryPreferences: z.string().optional(),
});

export type OAuthOnboardingFormData = z.infer<typeof oauthOnboardingSchema>;
