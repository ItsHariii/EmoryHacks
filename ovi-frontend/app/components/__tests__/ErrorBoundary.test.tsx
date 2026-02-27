// @ts-nocheck
import React from 'react';
import { Text, View, Button } from 'react-native';
import { render, fireEvent } from '../../utils/test-utils';
import { ErrorBoundary } from '../ui/ErrorBoundary';

const ProblematicComponent = () => {
    throw new Error('Test Error');
};

const SafeComponent = () => <Text>Safe Component</Text>;

describe('ErrorBoundary', () => {
    // Suppress console.error for this test file since we expect errors
    const originalConsoleError = console.error;
    beforeAll(() => {
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalConsoleError;
    });

    it('renders children when there is no error', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <SafeComponent />
            </ErrorBoundary>
        );

        expect(getByText('Safe Component')).toBeTruthy();
    });

    it('renders error UI when a child throws', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ProblematicComponent />
            </ErrorBoundary>
        );

        expect(getByText('Oops! Something went wrong.')).toBeTruthy();
        expect(getByText('Error: Test Error')).toBeTruthy();
    });
});
