// @ts-nocheck
import React from 'react';
import { render, fireEvent, waitFor } from '../../utils/test-utils';
import { ChatJournalScreen } from '../ChatJournalScreen';
import { journalAPI } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api', () => ({
    journalAPI: {
        sendChatMessage: jest.fn(),
        saveChatConversation: jest.fn(),
    },
}));

// Mock child components
jest.mock('../../components/layout/HeaderBar', () => ({
    HeaderBar: ({ title }: any) => {
        const { View, Text } = require('react-native');
        return (
            <View>
                <Text>{title}</Text>
            </View>
        );
    },
}));

jest.mock('../../components/chat/ChatMessage', () => ({
    ChatMessage: ({ content, role }: any) => {
        const { View, Text } = require('react-native');
        return (
            <View testID={`message-${role}`}>
                <Text>{content}</Text>
            </View>
        );
    },
}));

jest.mock('../../components/chat/ChatInput', () => ({
    ChatInput: ({ onSend, disabled, placeholder }: any) => {
        const { View, TextInput, Button } = require('react-native');
        const React = require('react');
        const [text, setText] = React.useState('');
        return (
            <View>
                <TextInput
                    testID="chat-input"
                    value={text}
                    onChangeText={setText}
                    placeholder={placeholder}
                    editable={!disabled}
                />
                <Button
                    title="Send"
                    onPress={() => {
                        onSend(text);
                        setText('');
                    }}
                    disabled={disabled}
                    testID="send-button"
                />
            </View>
        );
    },
}));

jest.mock('../../components/journal/MoodIconSelector', () => ({
    MoodIconSelector: ({ onSelectMood }: any) => {
        const { View, Button } = require('react-native');
        return (
            <View testID="mood-selector">
                <Button title="Select Mood 5" onPress={() => onSelectMood(5)} testID="mood-option-5" />
            </View>
        );
    },
}));

jest.mock('../../components/food/ExtractedDataPreview', () => ({
    ExtractedDataPreview: ({ data }: any) => {
        const { View, Text } = require('react-native');
        return (
            <View testID="extracted-data-preview">
                <Text>Extracted Data Preview</Text>
                {data.mood && <Text>Mood: {data.mood}</Text>}
            </View>
        );
    },
}));

describe('ChatJournalScreen', () => {
    const mockNavigation = {
        goBack: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with initial bot message', async () => {
        const { findByText, getByTestId } = render(<ChatJournalScreen navigation={mockNavigation} />);

        expect(await findByText("Hi! I'm here to help you with your daily wellness check-in. Let's start by selecting how you're feeling today.")).toBeTruthy();
        expect(getByTestId('mood-selector')).toBeTruthy();
    });

    it('handles mood selection and updates chat', async () => {
        (journalAPI.sendChatMessage as jest.Mock).mockResolvedValue({
            response: "That's great to hear! Tell me more.",
            extracted_data: { mood: 5 },
            is_complete: false,
        });

        const { findByText, getByTestId, queryByTestId } = render(<ChatJournalScreen navigation={mockNavigation} />);

        // Select mood
        fireEvent.press(getByTestId('mood-option-5'));

        // Check user message added
        expect(await findByText("I'm feeling great today")).toBeTruthy();

        // Check mood selector hidden
        expect(queryByTestId('mood-selector')).toBeNull();

        // Check bot response
        await waitFor(() => {
            expect(journalAPI.sendChatMessage).toHaveBeenCalled();
        });
        expect(await findByText("That's great to hear! Tell me more.")).toBeTruthy();
    });

    it('sends user message and receives response', async () => {
        // Response for mood selection
        (journalAPI.sendChatMessage as jest.Mock).mockResolvedValueOnce({
            response: "Mood recorded. What else?",
            extracted_data: { mood: 5 },
            is_complete: false,
        });

        // Response for user message
        (journalAPI.sendChatMessage as jest.Mock).mockResolvedValueOnce({
            response: "Got it. Anything else?",
            extracted_data: { mood: 5, notes: "Feeling good" },
            is_complete: false,
        });

        const { findByText, getByTestId } = render(<ChatJournalScreen navigation={mockNavigation} />);

        // Select mood first to enable input
        fireEvent.press(getByTestId('mood-option-5'));
        await waitFor(() => expect(journalAPI.sendChatMessage).toHaveBeenCalledTimes(1));
        expect(await findByText("Mood recorded. What else?")).toBeTruthy();

        // Type and send message
        const input = getByTestId('chat-input');
        fireEvent.changeText(input, 'I went for a walk.');
        fireEvent.press(getByTestId('send-button'));

        await waitFor(() => {
            expect(journalAPI.sendChatMessage).toHaveBeenCalledTimes(2);
        });

        expect(await findByText('I went for a walk.')).toBeTruthy();
        expect(await findByText('Got it. Anything else?')).toBeTruthy();
    });

    it('shows save button when data is extracted and allows saving', async () => {
        (journalAPI.sendChatMessage as jest.Mock).mockResolvedValue({
            response: "Thanks for sharing.",
            extracted_data: { mood: 5, notes: "Feeling good" },
            is_complete: true,
        });
        (journalAPI.saveChatConversation as jest.Mock).mockResolvedValue({ success: true });

        const { findByText, getByTestId } = render(<ChatJournalScreen navigation={mockNavigation} />);

        // Select mood to trigger data extraction
        fireEvent.press(getByTestId('mood-option-5'));

        // Wait for save button to appear (it appears when canSave() is true)
        const saveButton = await findByText('Save Entry');
        expect(saveButton).toBeTruthy();
        expect(getByTestId('extracted-data-preview')).toBeTruthy();

        // Mock Alert.alert
        const { Alert } = require('react-native');
        jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
            if (buttons && buttons[0]) {
                buttons[0].onPress && buttons[0].onPress();
            }
        });

        // Save
        fireEvent.press(saveButton);

        await waitFor(() => {
            expect(journalAPI.saveChatConversation).toHaveBeenCalled();
        });

        expect(mockNavigation.goBack).toHaveBeenCalled();
    });
});
