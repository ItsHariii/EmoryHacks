import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { RegistrationWizard } from '../auth/RegistrationWizard';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
        navigate: mockNavigate,
        goBack: jest.fn(),
    }),
}));

// Mock AuthContext
const mockRegister = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => ({
        register: mockRegister,
        loading: false,
        error: null,
    }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock SimpleDatePicker
jest.mock('../ui/SimpleDatePicker', () => {
    const { View } = require('react-native');
    return {
        SimpleDatePicker: (props: any) => <View testID="date-picker" {...props} />,
    };
});

describe('RegistrationWizard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the first step (Basic Info) initially', () => {
        const { getByText, getByPlaceholderText } = render(
            <AuthProvider>
                <RegistrationWizard onComplete={jest.fn()} onCancel={jest.fn()} />
            </AuthProvider>
        );

        expect(getByText('Create your account')).toBeTruthy();
        expect(getByPlaceholderText('Enter your first name')).toBeTruthy();
        expect(getByPlaceholderText('Enter your last name')).toBeTruthy();
        expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    });

    it('validates basic info and proceeds to next step', async () => {
        const { getByText, getByPlaceholderText, queryByText } = render(
            <AuthProvider>
                <RegistrationWizard onComplete={jest.fn()} onCancel={jest.fn()} />
            </AuthProvider>
        );

        // Try to proceed without filling fields
        fireEvent.press(getByText('Next'));

        await waitFor(() => {
            expect(getByText('First name is required')).toBeTruthy();
        });

        // Fill fields
        fireEvent.changeText(getByPlaceholderText('Enter your first name'), 'Jane');
        fireEvent.changeText(getByPlaceholderText('Enter your last name'), 'Doe');
        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'jane@example.com');
        fireEvent.changeText(getByPlaceholderText('Create a password'), 'Password123');

        // Proceed
        fireEvent.press(getByText('Next'));

        await waitFor(() => {
            // Should be on step 2 (Pregnancy Details)
            expect(queryByText('Pregnancy Information')).toBeTruthy();
        });
    });

    it('navigates through all steps and submits', async () => {
        const onCompleteMock = jest.fn();
        const { getByText, getByPlaceholderText, getAllByText, getByTestId } = render(
            <AuthProvider>
                <RegistrationWizard onComplete={onCompleteMock} onCancel={jest.fn()} />
            </AuthProvider>
        );

        // Step 1: Basic Info
        fireEvent.changeText(getByPlaceholderText('Enter your first name'), 'Jane');
        fireEvent.changeText(getByPlaceholderText('Enter your last name'), 'Doe');
        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'jane@example.com');
        fireEvent.changeText(getByPlaceholderText('Create a password'), 'Password123');
        fireEvent.press(getByText('Next'));

        // Step 2: Pregnancy Details
        await waitFor(() => expect(getByText('Pregnancy Information')).toBeTruthy());

        // Set Due Date
        const datePicker = getByTestId('date-picker');
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6);
        fireEvent(datePicker, 'onChange', futureDate);

        // Select first pregnancy option (Yes) - Wait, the component has "Number of Babies" buttons 1, 2, 3
        // Let's select 1 baby
        fireEvent.press(getByText('1'));

        fireEvent.press(getByText('Next'));

        // Step 3: Health Profile
        await waitFor(() => expect(getByText('Health Information')).toBeTruthy());
        fireEvent.press(getByText('Next'));

        // Step 4: Dietary Preferences
        await waitFor(() => expect(getByText('Dietary Preferences')).toBeTruthy());

        // Submit
        fireEvent.press(getByText('Complete'));

        await waitFor(() => {
            expect(onCompleteMock).toHaveBeenCalled();
        });
    });
});
