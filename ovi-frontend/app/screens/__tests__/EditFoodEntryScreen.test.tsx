import React from 'react';
import { render, fireEvent, waitFor } from '../../utils/test-utils';
import { EditFoodEntryScreen } from '../EditFoodEntryScreen';
import { foodAPI } from '../../services/api';
import { useRoute } from '@react-navigation/native';

// Mock dependencies
jest.mock('../../services/api', () => ({
    foodAPI: {
        logFood: jest.fn(),
        updateFoodEntry: jest.fn(),
        deleteFoodEntry: jest.fn(),
    },
}));

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: mockNavigate,
            goBack: mockGoBack,
        }),
        useRoute: jest.fn(),
    };
});

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

// Mock useFoodEntry to avoid logic issues during UI test
jest.mock('../../hooks/useFoodEntry', () => ({
    useFoodEntry: ({ food, entry, mealType }: any) => ({
        servingSize: entry?.serving_size ? `${entry.serving_size}g` : '100g',
        selectedMealType: entry?.meal_type || mealType || 'breakfast',
        currentFood: food || (entry ? {
            id: entry.food_id,
            name: entry.food_name,
            calories_per_100g: 52,
            safety_status: entry.food?.safety_status || 'safe',
        } : null),
        setServingSize: jest.fn(),
        setSelectedMealType: jest.fn(),
        nutrition: { calories: 52, protein: 0, carbs: 14, fat: 0 },
        isValid: true,
    }),
}));

// Mock child components
jest.mock('../../components/ui/SafetyTag', () => ({
    SafetyTag: ({ status }: any) => {
        const { Text } = require('react-native');
        return <Text testID="safety-tag">{status}</Text>;
    },
}));

jest.mock('../../components/food/ServingSizeInput', () => ({
    ServingSizeInput: ({ value, onChange }: any) => {
        const { TextInput } = require('react-native');
        return (
            <TextInput
                testID="serving-size-input"
                value={value}
                onChangeText={onChange}
            />
        );
    },
}));

jest.mock('../../components/food/NutritionPreview', () => ({
    NutritionPreview: ({ nutrition }: any) => {
        const { Text } = require('react-native');
        if (!nutrition) return null;
        return <Text testID="nutrition-preview">{`${nutrition.calories} cal`}</Text>;
    },
}));

jest.mock('../../components/modals/SafetyWarningModal', () => ({
    SafetyWarningModal: ({ visible, onConfirm, onCancel }: any) => {
        const { View, Button } = require('react-native');
        if (!visible) return null;
        return (
            <View testID="safety-warning-modal">
                <Button title="Confirm" onPress={onConfirm} testID="safety-confirm-button" />
                <Button title="Cancel" onPress={onCancel} />
            </View>
        );
    },
}));

jest.mock('../../components/ui/Button', () => ({
    Button: ({ title, onPress, loading, disabled }: any) => {
        const { TouchableOpacity, Text } = require('react-native');
        return (
            <TouchableOpacity onPress={onPress} disabled={disabled || loading}>
                <Text>{loading ? 'Loading...' : title}</Text>
            </TouchableOpacity>
        );
    },
}));

jest.mock('../../components/modals/CelebrationModal', () => ({
    __esModule: true,
    default: () => null,
}));

jest.mock('@react-native-picker/picker', () => {
    const React = require('react');
    const Picker = ({ children }: any) => React.createElement('View', { testID: "picker" }, children);
    Picker.Item = ({ label, value }: any) => React.createElement('View', { testID: "picker-item", label, value });
    return { Picker };
});

jest.mock('@expo/vector-icons', () => ({
    MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('EditFoodEntryScreen', () => {
    const mockFood = {
        id: 'food-1',
        name: 'Apple',
        calories_per_100g: 52,
        protein_per_100g: 0.3,
        carbs_per_100g: 14,
        fat_per_100g: 0.2,
        safety_status: 'safe',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly for new entry', async () => {
        (useRoute as jest.Mock).mockReturnValue({
            params: {
                food: mockFood,
                isNewEntry: true,
                mealType: 'snack',
            },
        });

        const { findAllByText, findByText, getByTestId } = render(<EditFoodEntryScreen />);

        const logFoodElements = await findAllByText('Log Food');
        expect(logFoodElements.length).toBeGreaterThan(0);
        expect(await findByText('Apple')).toBeTruthy();
        expect(getByTestId('serving-size-input').props.value).toBe('100g');
    });

    it('logs new food entry', async () => {
        (useRoute as jest.Mock).mockReturnValue({
            params: {
                food: mockFood,
                isNewEntry: true,
                mealType: 'breakfast',
            },
        });

        const { findAllByText } = render(<EditFoodEntryScreen />);

        const logFoodElements = await findAllByText('Log Food');
        // The last one should be the button at the bottom
        const saveButton = logFoodElements[logFoodElements.length - 1];

        fireEvent.press(saveButton);

        await waitFor(() => {
            expect(foodAPI.logFood).toHaveBeenCalled();
        });

        expect(mockShowToast).toHaveBeenCalledWith('Food logged successfully!', 'success');
        expect(mockCelebrate).toHaveBeenCalledWith('first_meal_logged');
        expect(mockNavigate).toHaveBeenCalledWith('Dashboard', { refresh: true });
    });

    it('updates existing food entry', async () => {
        const mockEntry = {
            id: 'entry-1',
            food_id: 'food-1',
            food_name: 'Apple',
            calories_logged: 52,
            serving_size: 100,
            serving_unit: 'g',
            meal_type: 'lunch',
            food: mockFood,
        };

        (useRoute as jest.Mock).mockReturnValue({
            params: {
                entry: mockEntry,
                isNewEntry: false,
            },
        });

        const { findByText, getByTestId } = render(<EditFoodEntryScreen />);

        expect(await findByText('Edit Entry')).toBeTruthy();

        const updateButton = await findByText('Update Entry');
        fireEvent.press(updateButton);

        await waitFor(() => {
            expect(foodAPI.updateFoodEntry).toHaveBeenCalled();
        });

        expect(mockShowToast).toHaveBeenCalledWith('Food entry updated!', 'success');
        expect(mockGoBack).toHaveBeenCalled();
    });

    it('shows safety warning for avoid foods', async () => {
        const avoidFood = { ...mockFood, safety_status: 'avoid', safety_notes: 'Not safe' };
        (useRoute as jest.Mock).mockReturnValue({
            params: {
                food: avoidFood,
                isNewEntry: true,
            },
        });

        const { findByTestId } = render(<EditFoodEntryScreen />);

        expect(await findByTestId('safety-warning-modal')).toBeTruthy();
    });
});
