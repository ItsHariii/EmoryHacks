import React from 'react';
import {
    StyleSheet,
    View,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
    edges?: Edge[];
    useSafeArea?: boolean;
    keyboardAvoiding?: boolean;
    backgroundColor?: string;
    gradientBackground?: boolean;
    /** When set, used for gradient instead of default [background, surface]. e.g. theme.gradients.warmBackground */
    gradientColors?: readonly [string, string, ...string[]];
    statusBarStyle?: 'light-content' | 'dark-content';
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    style,
    contentContainerStyle,
    edges = ['top', 'left', 'right', 'bottom'],
    useSafeArea = true,
    keyboardAvoiding = false,
    backgroundColor = theme.colors.background,
    gradientBackground = false,
    gradientColors,
    statusBarStyle = 'dark-content',
}) => {
    const Container = useSafeArea ? SafeAreaView : View;

    const content = (
        <Container
            style={[
                styles.container,
                !gradientBackground && { backgroundColor },
                style,
            ]}
            edges={useSafeArea ? edges : undefined}
        >
            <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
            <View style={[styles.content, contentContainerStyle]}>
                {children}
            </View>
        </Container>
    );

    const gradientPalette = gradientColors ?? [theme.colors.background, theme.colors.surface];
    const wrapper = gradientBackground ? (
        <LinearGradient
            colors={gradientPalette as [string, string, ...string[]]}
            style={styles.gradient}
        >
            {content}
        </LinearGradient>
    ) : (
        content
    );

    if (keyboardAvoiding) {
        return (
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {wrapper}
            </KeyboardAvoidingView>
        );
    }

    return wrapper;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
});
