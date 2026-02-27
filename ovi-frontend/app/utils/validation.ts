import { z } from 'zod';

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
    dueDate: z.date(),
    babies: z.number().min(1).max(10),

    // Step 3: Health Info (Optional but validated if present)
    birthDate: z.date().optional(),
    prePregnancyWeight: z.string().optional(),
    height: z.string().optional(),
    currentWeight: z.string().optional(),
    bloodType: z.string().optional(),

    // Step 4: Preferences
    allergies: z.array(z.string()).default([]),
    conditions: z.array(z.string()).default([]),
    dietaryPreferences: z.string().optional(),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
