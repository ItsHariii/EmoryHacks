import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderBar } from '../components/HeaderBar';
import { ChatMessage } from '../components/ChatMessage';
import { ChatInput } from '../components/ChatInput';
import { MoodIconSelector } from '../components/MoodIconSelector';
import { ExtractedDataPreview } from '../components/ExtractedDataPreview';
import { theme } from '../theme';
import { journalAPI } from '../services/api';
import { 
  ChatMessage as ChatMessageType, 
  ConversationState,
  ExtractedJournalData,
} from '../types';

interface ChatJournalScreenProps {
  navigation: any;
}

export const ChatJournalScreen: React.FC<ChatJournalScreenProps> = ({ navigation }) => {
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    extractedData: {},
    isComplete: false,
    isLoading: false,
  });
  const [showMoodSelector, setShowMoodSelector] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Send initial greeting
    addBotMessage("Hi! I'm here to help you with your daily wellness check-in. Let's start by selecting how you're feeling today.");
  }, []);

  const addBotMessage = (content: string, extractedData?: ExtractedJournalData) => {
    const newMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };

    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      extractedData: extractedData || prev.extractedData,
    }));

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const addUserMessage = (content: string) => {
    const newMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleMoodSelect = async (mood: number) => {
    setShowMoodSelector(false);
    
    const moodLabels = ['', 'sad', 'down', 'okay', 'good', 'great'];
    addUserMessage(`I'm feeling ${moodLabels[mood]} today`);

    // Update extracted data
    setConversationState(prev => ({
      ...prev,
      extractedData: { ...prev.extractedData, mood },
    }));

    // Send to chatbot
    await sendMessageToChatbot(`I'm feeling ${moodLabels[mood]} today`, mood);
  };

  const sendMessageToChatbot = async (message: string, mood?: number) => {
    setConversationState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await journalAPI.sendChatMessage(
        message,
        conversationState.messages
      );

      // Add bot response
      addBotMessage(response.response, response.extracted_data);

      // Update conversation state
      setConversationState(prev => ({
        ...prev,
        extractedData: response.extracted_data || prev.extractedData,
        isComplete: response.is_complete || false,
        isLoading: false,
      }));
    } catch (error: any) {
      console.error('Chat error:', error);
      addBotMessage(
        "I'm having trouble connecting right now. Would you like to use the traditional journal form instead?"
      );
      setConversationState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSendMessage = async (message: string) => {
    addUserMessage(message);
    await sendMessageToChatbot(message);
  };

  const handleSaveEntry = async () => {
    setIsSaving(true);

    try {
      const result = await journalAPI.saveChatConversation(conversationState.messages);
      
      Alert.alert(
        'Entry Saved!',
        'Your wellness check-in has been saved successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert(
        'Save Failed',
        error.message || 'Failed to save your entry. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = () => {
    const { extractedData } = conversationState;
    return extractedData.mood !== undefined || 
           (extractedData.symptoms && extractedData.symptoms.length > 0) ||
           extractedData.notes;
  };

  const renderMessage = ({ item }: { item: ChatMessageType }) => (
    <ChatMessage
      role={item.role}
      content={item.content}
      timestamp={item.timestamp}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <HeaderBar
        title="Wellness Check-in"
        subtitle="Chat with Ovi"
        leftAction={{
          icon: 'close',
          onPress: () => {
            if (conversationState.messages.length > 1) {
              Alert.alert(
                'Discard Entry?',
                'Are you sure you want to leave? Your conversation will not be saved.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
                ]
              );
            } else {
              navigation.goBack();
            }
          },
          accessibilityLabel: 'Close chat',
        }}
      />

      {showMoodSelector && (
        <MoodIconSelector
          selectedMood={conversationState.extractedData.mood}
          onSelectMood={handleMoodSelect}
        />
      )}

      <FlatList
        ref={flatListRef}
        data={conversationState.messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          <>
            {conversationState.isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Ovi is typing...</Text>
              </View>
            )}
            {canSave() && (
              <ExtractedDataPreview data={conversationState.extractedData} />
            )}
          </>
        }
      />

      {canSave() && !conversationState.isLoading && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveEntry}
            disabled={isSaving}
            accessibilityLabel="Save journal entry"
            accessibilityRole="button"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={theme.colors.text.inverse} />
            ) : (
              <Text style={styles.saveButtonText}>Save Entry</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ChatInput
        onSend={handleSendMessage}
        disabled={conversationState.isLoading || showMoodSelector}
        placeholder={showMoodSelector ? 'Select your mood first...' : 'Type your message...'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  messageList: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  loadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.muted,
    fontStyle: 'italic',
  },
  saveButtonContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  saveButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonText: {
    color: theme.colors.text.inverse,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
  },
});
