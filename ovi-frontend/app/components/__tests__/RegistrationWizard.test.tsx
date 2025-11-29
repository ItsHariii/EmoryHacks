import React from 'react';
import { render, fireEvent, waitFor } from '../../utils/test-utils';
import { RegistrationWizard } from '../RegistrationWizard';

describe('RegistrationWizard', () => {
    const mockOnComplete = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('validates required fields in step 1', async () => {
        const { getByText, getByPlaceholderText } = render(
            <RegistrationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
        );

        // Try to go next without filling fields
        fireEvent.press(getByText('Next'));

        // Should show validation errors
        await waitFor(() => {
            expect(getByText('First name is required')).toBeTruthy();
            expect(getByText('Last name is required')).toBeTruthy();
            expect(getByText('Invalid email address')).toBeTruthy();
            expect(getByText('Password must be at least 8 characters')).toBeTruthy();
        });
    });

    it('navigates to next step when fields are valid', async () => {
        const { getByText, getByPlaceholderText } = render(
            <RegistrationWizard onComplete={mockOnComplete} onCancel={mockOnCancel} />
        );

        // Fill in fields
        fireEvent.changeText(getByPlaceholderText('First Name *'), 'John');
        fireEvent.changeText(getByPlaceholderText('Last Name *'), 'Doe');
        fireEvent.changeText(getByPlaceholderText('Email *'), 'john@example.com');
        fireEvent.changeText(getByPlaceholderText('Password *'), 'Password123');

        // Go next
        fireEvent.press(getByText('Next'));

        // Should be on step 2
        await waitFor(() => {
            expect(getByText('Pregnancy Information')).toBeTruthy();
        });
    });
});
