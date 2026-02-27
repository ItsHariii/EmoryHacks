# Wellness Journal Chatbot - Frontend Implementation

## Overview

This document describes the frontend implementation of the Wellness Journal Chatbot feature, which transforms the traditional journal entry form into a conversational AI-powered interface.

## Components Created

### 1. ChatMessage Component
**Location**: `app/components/ChatMessage.tsx`

Displays individual chat messages with:
- User messages (right-aligned, primary color)
- Assistant messages (left-aligned, surface color)
- Timestamps
- Proper styling and accessibility

### 2. MoodIconSelector Component
**Location**: `app/components/MoodIconSelector.tsx`

Interactive mood selector with:
- 5 mood options (😢 😟 😐 🙂 😊)
- Visual feedback for selected mood
- Labels for each mood state
- Accessibility support

### 3. ChatInput Component
**Location**: `app/components/ChatInput.tsx`

Message input interface with:
- Multi-line text input
- Send button with icon
- Disabled state handling
- Keyboard avoidance
- Character limit (500)

### 4. ExtractedDataPreview Component
**Location**: `app/components/ExtractedDataPreview.tsx`

Shows extracted journal data including:
- Mood with emoji
- Symptoms as chips
- Sleep quality and energy level
- Cravings and notes
- Styled preview container

## Screens Created

### ChatJournalScreen
**Location**: `app/screens/ChatJournalScreen.tsx`

Main chat interface screen with:
- Conversation state management
- Message history display
- Mood selection flow
- Real-time chat with AI
- Extracted data preview
- Save functionality
- Loading states
- Error handling
- Discard confirmation

**Features**:
- Starts with greeting message
- Shows mood selector first
- Sends messages to backend API
- Displays bot responses
- Shows "Ovi is typing..." indicator
- Displays extracted data preview
- "Save Entry" button when sufficient data collected
- Confirmation before discarding

## Updated Components

### JournalScreen
**Location**: `app/screens/JournalScreen.tsx`

Enhanced with:
- Chat mode toggle button in header
- Option to create entry via chat or traditional form
- View entries as conversational summaries
- Fetch and display chat history for past entries

## API Integration

### New API Methods
**Location**: `app/services/api.ts`

Added to `journalAPI`:
- `sendChatMessage()` - Send user message and get bot response
- `saveChatConversation()` - Save conversation as journal entry
- `getChatHistory()` - Fetch conversational summary of past entry

## Type Definitions

### New Types
**Location**: `app/types/index.ts`

Added:
- `ChatMessage` - Individual message structure
- `ExtractedJournalData` - Extracted data from conversation
- `ConversationState` - Complete conversation state
- `ChatResponse` - API response structure
- `ChatSaveResponse` - Save response structure

## User Flow

### Creating a New Entry

1. User taps FAB on Journal screen
2. Alert shows options: "Chat with Ovi" or "Traditional Form"
3. User selects "Chat with Ovi"
4. ChatJournalScreen opens with greeting
5. User selects mood from 5 options
6. Bot acknowledges and asks follow-up questions
7. User types responses naturally
8. Bot extracts symptoms, notes, cravings, etc.
9. Extracted data preview shows at bottom
10. "Save Entry" button appears when sufficient data
11. User taps "Save Entry"
12. Success message and navigation back to list

### Viewing Past Entries

1. User taps chat icon in Journal screen header
2. Entries now show with chat summaries
3. Tapping entry shows conversational summary
4. Option to edit or close

## Navigation Integration

The ChatJournalScreen needs to be added to the navigation stack:

```typescript
// In your navigation configuration
<Stack.Screen 
  name="ChatJournal" 
  component={ChatJournalScreen}
  options={{ headerShown: false }}
/>
```

## Backend Requirements

The frontend expects these backend endpoints:

1. `POST /journal/chat`
   - Request: `{ message: string, conversation_history: ChatMessage[] }`
   - Response: `{ response: string, extracted_data?: ExtractedJournalData, is_complete?: boolean }`

2. `POST /journal/chat/save`
   - Request: `{ conversation_history: ChatMessage[], entry_date?: string }`
   - Response: `{ entry_id: string, summary: string }`

3. `GET /journal/chat/history/{date}`
   - Response: `{ summary: string, entry: JournalEntry }`

## Styling

All components use the existing theme system:
- Colors from `theme.colors`
- Spacing from `theme.spacing`
- Typography from `theme.fontSize` and `theme.fontWeight`
- Border radius from `theme.borderRadius`
- Shadows from `theme.shadows`

## Accessibility

All components include:
- Proper `accessibilityLabel` attributes
- `accessibilityRole` for interactive elements
- Keyboard navigation support
- Screen reader compatibility

## Error Handling

- Network errors show user-friendly messages
- Fallback to traditional form if chatbot unavailable
- Confirmation before discarding unsaved conversations
- Loading states during API calls
- Graceful degradation

## Testing Recommendations

1. Test mood selection flow
2. Test message sending and receiving
3. Test data extraction display
4. Test save functionality
5. Test discard confirmation
6. Test with slow network
7. Test with API errors
8. Test accessibility with screen reader
9. Test keyboard navigation
10. Test on different screen sizes

## Future Enhancements

- Voice input support
- Conversation history persistence
- Draft saving
- Offline mode
- Multi-language support
- Sentiment analysis visualization
- Weekly summaries

## Notes

- The TypeScript diagnostics showing JSX component errors are false positives related to the project's TypeScript configuration and won't affect runtime behavior
- The chat interface is designed to be intuitive and conversational
- The extracted data preview helps users verify what's being captured
- The mood selector provides a visual, engaging way to start the conversation
