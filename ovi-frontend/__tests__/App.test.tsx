import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';
import { AuthProvider, useAuth } from '../app/contexts/AuthContext';

// Mock the AuthContext
jest.mock('../app/contexts/AuthContext', () => {
    const actualAuth = jest.requireActual('../app/contexts/AuthContext');
    return {
        ...actualAuth,
        AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        useAuth: jest.fn(),
    };
});

import { View } from 'react-native';

// Mock the screens to avoid rendering complex children
jest.mock('../app/screens/AuthScreen', () => {
    const { View } = require('react-native');
    return {
        AuthScreen: () => <View testID="auth-screen" />,
    };
});

jest.mock('../app/screens/DashboardScreen', () => {
    const { View } = require('react-native');
    return {
        DashboardScreen: () => <View testID="dashboard-screen" />,
    };
});

// Mock other lazy loaded screens to prevent suspense issues during test
jest.mock('../app/screens/FoodLoggingScreen', () => ({ FoodLoggingScreen: () => null }));
jest.mock('../app/screens/SearchFoodScreen', () => ({ SearchFoodScreen: () => null }));
jest.mock('../app/screens/EditFoodEntryScreen', () => ({ EditFoodEntryScreen: () => null }));
jest.mock('../app/screens/ProfileScreen', () => ({ ProfileScreen: () => null }));
jest.mock('../app/screens/BarcodeScannerScreen', () => ({ BarcodeScannerScreen: () => null }));
jest.mock('../app/screens/AIPhotoAnalysisScreen', () => ({ AIPhotoAnalysisScreen: () => null }));
jest.mock('../app/screens/JournalScreen', () => ({ JournalScreen: () => null }));
jest.mock('../app/screens/JournalEntryScreen', () => ({ JournalEntryScreen: () => null }));
jest.mock('../app/screens/ChatJournalScreen', () => ({ ChatJournalScreen: () => null }));
jest.mock('../app/screens/NotificationSettingsScreen', () => ({ NotificationSettingsScreen: () => null }));
jest.mock('../app/screens/TrimesterTrackerScreen', () => ({ TrimesterTrackerScreen: () => null }));

// Mock services and utils
jest.mock('../app/services/notificationService', () => ({
    setupNotificationListener: jest.fn(() => ({ remove: jest.fn() })),
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// Mock ToastProvider
jest.mock('../app/components/ui/ToastProvider', () => ({
    ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock ErrorBoundary
jest.mock('../app/components/ui/ErrorBoundary', () => ({
    ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('App Navigation', () => {
    it('renders loading state initially', () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            loading: true,
        });

        const { queryByTestId } = render(<App />);
        // App.tsx renders ActivityIndicator when loading is true
        // We can check for the loading container or just ensure no screens are rendered
        expect(queryByTestId('auth-screen')).toBeNull();
        expect(queryByTestId('dashboard-screen')).toBeNull();
    });

    it('renders AuthScreen when user is not logged in', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: null,
            loading: false,
        });

        const { getByTestId, queryByTestId } = render(<App />);

        // Wait for navigation to settle
        await waitFor(() => {
            expect(getByTestId('auth-screen')).toBeTruthy();
        });
        expect(queryByTestId('dashboard-screen')).toBeNull();
    });

    it('renders Dashboard (MainTabs) when user is logged in', async () => {
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: '123', email: 'test@example.com' },
            loading: false,
        });

        const { getByTestId, queryByTestId } = render(<App />);

        await waitFor(() => {
            expect(getByTestId('dashboard-screen')).toBeTruthy();
        });
        expect(queryByTestId('auth-screen')).toBeNull();
    });
});
