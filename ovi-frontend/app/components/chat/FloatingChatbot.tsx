// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { foodAPI } from '../../services/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  nutritionData?: any;
}

interface FloatingChatbotProps {
  bottom?: number;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({ bottom = 100 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Ovi, your pregnancy nutrition assistant. Ask me anything about food safety, nutrition, or what to eat during pregnancy! 🤰",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await foodAPI.askChatbot(userMessage.text);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        isUser: false,
        timestamp: new Date(),
        nutritionData: response.nutrition_data,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Chatbot error:', error);
      console.error('Error response:', error.response?.data);

      let errorText = "I'm sorry, I'm having trouble responding right now. Please try again in a moment.";

      // Check for specific error types
      if (error.response?.status === 401) {
        errorText = "Please log in to use the chatbot.";
      } else if (error.response?.data?.detail) {
        errorText = `Error: ${error.response.data.detail}`;
      } else if (error.message) {
        errorText = `Error: ${error.message}`;
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.botBubble,
      ]}
    >
      {!message.isUser && (
        <View style={styles.botIcon}>
          <Text style={styles.botIconText}>🤖</Text>
        </View>
      )}
      <View style={styles.messageContent}>
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userText : styles.botText,
          ]}
        >
          {message.text}
        </Text>
        {message.nutritionData && Object.keys(message.nutritionData).length > 0 && (
          <View style={styles.nutritionBadge}>
            <MaterialCommunityIcons name="food-apple" size={12} color={theme.colors.primary} />
            <Text style={styles.nutritionBadgeText}>
              Nutrition data included
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <>
      {/* Floating Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          { bottom, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          style={styles.button}
          accessibilityLabel="Open nutrition chatbot"
          accessibilityRole="button"
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="robot"
            size={28}
            color={theme.colors.text.inverse}
          />
          {!isOpen && (
            <View style={styles.badge}>
              <MaterialCommunityIcons name="chat" size={12} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={handleClose}
        statusBarTranslucent={false}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>🤖</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Ovi Nutrition Assistant</Text>
                <Text style={styles.headerSubtitle}>Ask me about pregnancy nutrition</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel="Close chatbot"
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={28}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(renderMessage)}
            {isLoading && (
              <View style={[styles.messageBubble, styles.botBubble]}>
                <View style={styles.botIcon}>
                  <Text style={styles.botIconText}>🤖</Text>
                </View>
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about food safety, nutrition..."
                placeholderTextColor={theme.colors.text.muted}
                multiline
                maxLength={500}
                editable={!isLoading}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                disabled={!inputText.trim() || isLoading}
                accessibilityLabel="Send message"
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color={
                    !inputText.trim() || isLoading
                      ? theme.colors.text.muted
                      : theme.colors.text.inverse
                  }
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.disclaimer}>
              AI-powered advice. Always consult your healthcare provider.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: theme.spacing.md,
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    paddingTop: Platform.OS === 'ios' ? 60 : theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: 20,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.semibold,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold as any,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  closeButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  botIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.xs,
  },
  botIconText: {
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.md,
    lineHeight: 20,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  userText: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.text.inverse,
    borderBottomRightRadius: 4,
  },
  botText: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text.primary,
    borderBottomLeftRadius: 4,
  },
  nutritionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  nutritionBadgeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium as any,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  loadingText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.xl : theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  input: {
    fontFamily: theme.typography.fontFamily.regular,
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text.primary,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surface,
  },
  disclaimer: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.fontSize.xs,
    color: theme.colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
