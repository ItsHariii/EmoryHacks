import { registrationSchema } from '../validation';

describe('registrationSchema', () => {
    const validData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        password: 'Password123',
        dueDate: new Date(),
        babies: 1,
        allergies: [],
        conditions: [],
    };

    it('validates correct data', () => {
        const result = registrationSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('validates email format', () => {
        const invalidData = { ...validData, email: 'invalid-email' };
        const result = registrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('Invalid email address');
        }
    });

    it('validates password requirements', () => {
        const invalidData = { ...validData, password: 'weak' };
        const result = registrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
        // Should have multiple issues (length, uppercase, number)
    });

    it('validates required fields', () => {
        const invalidData = { ...validData, firstName: '' };
        const result = registrationSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it('allows optional fields', () => {
        const dataWithOptionals = {
            ...validData,
            prePregnancyWeight: '60kg',
            dietaryPreferences: 'Vegetarian',
        };
        const result = registrationSchema.safeParse(dataWithOptionals);
        expect(result.success).toBe(true);
    });
});
