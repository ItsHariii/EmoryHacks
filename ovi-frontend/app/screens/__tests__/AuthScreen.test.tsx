import React from 'react';
import { render, fireEvent, waitFor } from '../../utils/test-utils';
import { AuthScreen } from '../AuthScreen';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from 'react-native';

// Mock useAuth
jest.mock('../../contexts/AuthContext', () => {
    const actual = jest.requireActual('../../contexts/AuthContext');
    return {
        ...actual,
        useAuth: jest.fn(),
    };
});

// Mock RegistrationWizard
jest.mock('../../components/auth/RegistrationWizard', () => ({
    RegistrationWizard: ({ onComplete, onCancel }: any) => {
        const { Button, View } = require('react-native');
        return (
            <View testID="registration-wizard">
                <Button title="Complete" onPress={() => onComplete({
                    email: 'new@example.com',
                    password: 'password123',
                    firstName: 'New',
                    lastName: 'User',
                    babies: 1,
                })} />
                <Button title="Cancel" onPress={onCancel} />
            </View>
        );
    },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AuthScreen', () => {
    const mockLogin = jest.fn();
    const mockRegister = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAuth as jest.Mock).mockReturnValue({
            login: mockLogin,
            register: mockRegister,
        });
    });

    it('renders login form by default', () => {
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        expect(getByPlaceholderText('Enter your email')).toBeTruthy();
        expect(getByPlaceholderText('Enter your password')).toBeTruthy();
        expect(getByText('Sign In')).toBeTruthy();
    });

    it('calls login with correct credentials', async () => {
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        });
    });

    it('shows error alert on login failure', async () => {
        mockLogin.mockRejectedValue(new Error('Invalid credentials'));
        const { getByPlaceholderText, getByText } = render(<AuthScreen />);

        fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
        fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrong');
        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith('Error', 'Invalid credentials');
        });
    });

    it('switches to registration wizard', async () => {
        const { getByText, getByTestId } = render(<AuthScreen />);

        fireEvent.press(getByText("Don't have an account? Sign Up"));

        await waitFor(() => {
            expect(getByTestId('registration-wizard')).toBeTruthy();
        });
    });

    it('calls register on wizard completion', async () => {
        const { getByText, getByTestId } = render(<AuthScreen />);

        // Switch to wizard
        fireEvent.press(getByText("Don't have an account? Sign Up"));

        await waitFor(() => {
            expect(getByTestId('registration-wizard')).toBeTruthy();
        });

        // Complete registration
        fireEvent.press(getByText('Complete'));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({
                email: 'new@example.com',
                first_name: 'New',
            }));
        });
    });
});
