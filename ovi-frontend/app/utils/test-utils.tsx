import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../theme';

// Mock the theme provider if you had one, or just provide necessary contexts
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthProvider>
            <ToastProvider>
                <SafeAreaProvider>
                    <NavigationContainer>
                        {children}
                    </NavigationContainer>
                </SafeAreaProvider>
            </ToastProvider>
        </AuthProvider>
    );
};

const customRender = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react-native';
export { customRender as render };
