// @ts-nocheck
import React from 'react';
import { render, fireEvent, waitFor } from '../../utils/test-utils';
import { JournalScreen } from '../JournalScreen';
import { journalAPI } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api', () => ({
    journalAPI: {
        getJournalEntries: jest.fn(),
        getChatHistory: jest.fn(),
    },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: mockNavigate,
            addListener: jest.fn(() => jest.fn()),
        }),
        useFocusEffect: (effect: any) => {
            const React = require('react');
            React.useEffect(effect, []);
        },
    };
});

// Mock child components to avoid rendering complexity
jest.mock('../../components/layout/HeaderBar', () => ({
    HeaderBar: ({ title, rightActions }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
            <View>
                <Text>{title}</Text>
                {rightActions?.map((action: any, index: number) => (
                    <TouchableOpacity key={index} onPress={action.onPress} testID={`header-action-${index}`}>
                        <Text>{action.accessibilityLabel}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    },
}));

jest.mock('../../components/ui/EmptyState', () => ({
    EmptyState: ({ actionLabel, onAction }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
            <View>
                <Text>Start your pregnancy journal today</Text>
                {actionLabel && (
                    <TouchableOpacity onPress={onAction} testID="create-first-entry-button">
                        <Text>{actionLabel}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    },
}));

describe('JournalScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders and loads journal entries', async () => {
        const mockEntries = [
            {
                id: '1',
                entry_date: '2023-10-27',
                mood: 5,
                notes: 'Feeling great today!',
                symptoms: ['Nausea'],
                sleep_quality: 4,
                energy_level: 5,
            },
        ];
        (journalAPI.getJournalEntries as jest.Mock).mockResolvedValue(mockEntries);

        const { findByText } = render(<JournalScreen navigation={{ addListener: jest.fn(() => jest.fn()) }} />);

        expect(await findByText('Feeling great today!')).toBeTruthy();
        expect(journalAPI.getJournalEntries).toHaveBeenCalled();
    });

    it('shows empty state when no entries', async () => {
        (journalAPI.getJournalEntries as jest.Mock).mockResolvedValue([]);

        const { findByText } = render(<JournalScreen navigation={{ addListener: jest.fn(() => jest.fn()) }} />);

        expect(await findByText('Start your pregnancy journal today')).toBeTruthy();
    });

    it('navigates to JournalEntry on Create First Entry press', async () => {
        (journalAPI.getJournalEntries as jest.Mock).mockResolvedValue([]);

        const { findByTestId } = render(<JournalScreen navigation={{ addListener: jest.fn(() => jest.fn()), navigate: mockNavigate }} />);

        const createButton = await findByTestId('create-first-entry-button');

        // Mock Alert.alert to simulate user choice
        const { Alert } = require('react-native');
        jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
            // Simulate selecting "Traditional Form" (usually the second button)
            if (buttons && buttons[1] && buttons[1].text === 'Traditional Form') {
                buttons[1].onPress && buttons[1].onPress();
            }
        });

        fireEvent.press(createButton);

        // Wait for Alert to be called and handled
        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalled();
        });

        expect(mockNavigate).toHaveBeenCalledWith('JournalEntry');
    });

    it('navigates to JournalEntry on header plus press', async () => {
        (journalAPI.getJournalEntries as jest.Mock).mockResolvedValue([]);

        const { findByTestId } = render(<JournalScreen navigation={{ addListener: jest.fn(() => jest.fn()), navigate: mockNavigate }} />);

        // Header action 0 is usually the plus button based on the code
        const plusButton = await findByTestId('header-action-0');
        fireEvent.press(plusButton);

        expect(mockNavigate).toHaveBeenCalledWith('JournalEntry');
    });
});
