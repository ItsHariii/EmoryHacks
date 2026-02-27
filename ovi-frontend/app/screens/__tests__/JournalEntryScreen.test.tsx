// @ts-nocheck
import React from 'react';
import { render, fireEvent, waitFor } from '../../utils/test-utils';
import { JournalEntryScreen } from '../JournalEntryScreen';
import { journalAPI } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api', () => ({
    journalAPI: {
        createJournalEntry: jest.fn(),
        updateJournalEntry: jest.fn(),
        deleteJournalEntry: jest.fn(),
    },
}));

const mockShowToast = jest.fn();
jest.mock('../../components/ui/ToastProvider', () => ({
    ToastProvider: ({ children }: any) => children,
    useToast: () => ({
        showToast: mockShowToast,
    }),
}));

jest.mock('../../contexts/AuthContext', () => ({
    AuthProvider: ({ children }: any) => children,
    useAuth: () => ({
        user: { id: 'user-1' },
    }),
}));

const mockCelebrate = jest.fn();
jest.mock('../../hooks/useCelebrations', () => ({
    useCelebrations: () => ({
        celebrate: mockCelebrate,
        dismissCelebration: jest.fn(),
        currentCelebration: null,
        showCelebration: false,
    }),
}));

// Mock child components
jest.mock('../../components/ui/SimpleDatePicker', () => ({
    SimpleDatePicker: ({ value, onChange }: any) => {
        const { Text, TouchableOpacity } = require('react-native');
        return (
            <TouchableOpacity onPress={() => onChange(new Date('2023-01-01'))} testID="date-picker">
                <Text>{value.toISOString().split('T')[0]}</Text>
            </TouchableOpacity>
        );
    },
}));

jest.mock('../../components/journal/JournalMoodSelector', () => ({
    JournalMoodSelector: ({ value, onChange, label }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        // Create a safe testID from label
        const safeLabel = label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        return (
            <View testID={`mood-selector-${safeLabel}`}>
                <Text>{label}</Text>
                <TouchableOpacity onPress={() => onChange(5)} testID={`mood-option-5-${safeLabel}`}>
                    <Text>5</Text>
                </TouchableOpacity>
            </View>
        );
    },
}));

jest.mock('../../components/pregnancy/SymptomPicker', () => ({
    SymptomPicker: ({ value, onChange }: any) => {
        const { View, TouchableOpacity, Text } = require('react-native');
        return (
            <View testID="symptom-picker">
                <TouchableOpacity onPress={() => onChange(['Nausea'])} testID="symptom-option-nausea">
                    <Text>Nausea</Text>
                </TouchableOpacity>
            </View>
        );
    },
}));

jest.mock('../../components/modals/CelebrationModal', () => ({
    __esModule: true,
    default: () => null,
}));

describe('JournalEntryScreen', () => {
    const mockNavigation = {
        setOptions: jest.fn(),
        goBack: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly for new entry', async () => {
        const route = { params: {} };
        const { findByText } = render(<JournalEntryScreen navigation={mockNavigation} route={route} />);

        expect(await findByText('Date')).toBeTruthy();
        expect(await findByText('How are you feeling today?')).toBeTruthy();

    });

    it('creates a new journal entry', async () => {
        const route = { params: {} };
        const { findByText, getByPlaceholderText, getByTestId } = render(<JournalEntryScreen navigation={mockNavigation} route={route} />);

        // Set mood (label: "How are you feeling today?")
        const moodLabel = "How are you feeling today?";
        const safeMoodLabel = moodLabel.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        fireEvent.press(getByTestId(`mood-option-5-${safeMoodLabel}`)); // Sets mood to 5

        // Set notes
        fireEvent.changeText(getByPlaceholderText('Any additional notes about your day...'), 'Had a great day!');

        // Save
        const saveButton = await findByText('✓');
        fireEvent.press(saveButton);

        await waitFor(() => {
            expect(journalAPI.createJournalEntry).toHaveBeenCalledWith(expect.objectContaining({
                mood: 5,
                notes: 'Had a great day!',
            }));
        });

        expect(mockShowToast).toHaveBeenCalledWith('Journal entry created successfully', 'success');
        expect(mockCelebrate).toHaveBeenCalledWith('first_journal_entry');
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('renders correctly for edit entry', async () => {
        const mockEntry = {
            id: 'entry-1',
            entry_date: '2023-10-27',
            mood: 4,
            notes: 'Existing note',
            symptoms: ['Headache'],
        };
        const route = { params: { entry: mockEntry } };

        const { findByDisplayValue } = render(<JournalEntryScreen navigation={mockNavigation} route={route} />);

        expect(await findByDisplayValue('Existing note')).toBeTruthy();

    });

    it('updates an existing journal entry', async () => {
        const mockEntry = {
            id: 'entry-1',
            entry_date: '2023-10-27',
            mood: 4,
            notes: 'Existing note',
        };
        const route = { params: { entry: mockEntry } };

        const { findByText, getByPlaceholderText } = render(<JournalEntryScreen navigation={mockNavigation} route={route} />);

        // Update notes
        fireEvent.changeText(getByPlaceholderText('Any additional notes about your day...'), 'Updated note');

        // Save
        const saveButton = await findByText('✓');
        fireEvent.press(saveButton);

        await waitFor(() => {
            expect(journalAPI.updateJournalEntry).toHaveBeenCalledWith('entry-1', expect.objectContaining({
                notes: 'Updated note',
            }));
        });

        expect(mockShowToast).toHaveBeenCalledWith('Journal entry updated successfully', 'success');
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('deletes a journal entry', async () => {
        const mockEntry = {
            id: 'entry-1',
            entry_date: '2023-10-27',
        };
        const route = { params: { entry: mockEntry } };

        const { findByText } = render(<JournalEntryScreen navigation={mockNavigation} route={route} />);

        const deleteButton = await findByText('Delete');

        // Mock Alert.alert
        const { Alert } = require('react-native');
        jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
            // Simulate clicking "Delete" (usually the second button)
            if (buttons && buttons[1] && buttons[1].text === 'Delete') {
                buttons[1].onPress && buttons[1].onPress();
            }
        });

        fireEvent.press(deleteButton);

        await waitFor(() => {
            expect(journalAPI.deleteJournalEntry).toHaveBeenCalledWith('entry-1');
        });

        expect(mockShowToast).toHaveBeenCalledWith('Journal entry deleted successfully', 'success');
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });
});
