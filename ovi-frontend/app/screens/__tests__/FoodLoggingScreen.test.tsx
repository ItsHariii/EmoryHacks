import React from 'react';
import { render, fireEvent, waitFor } from '../../utils/test-utils';
import { FoodLoggingScreen } from '../FoodLoggingScreen';
import { foodAPI, nutritionAPI } from '../../services/api';

// Mock API
jest.mock('../../services/api', () => ({
    foodAPI: {
        getFoodEntries: jest.fn(),
        deleteFoodEntry: jest.fn(),
    },
    nutritionAPI: {
        getDailySummary: jest.fn(),
    },
}));

// Mock nutrition store (targets for progress bar)
jest.mock('../../store/useNutritionStore', () => ({
    useNutritionStore: () => ({
        targets: null,
        fetchTargets: jest.fn(),
    }),
}));

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
    const actual = jest.requireActual('@react-navigation/native');
    return {
        ...actual,
        useNavigation: () => ({
            navigate: mockNavigate,
        }),
        useFocusEffect: (effect: any) => {
            const React = require('react');
            React.useEffect(effect, []);
        },
    };
});

// Mock EmptyState
jest.mock('../../components/ui/EmptyState', () => ({
    EmptyState: ({ actionLabel, onAction }: any) => {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
            <View>
                <Text>No meals logged today</Text>
                {actionLabel && (
                    <TouchableOpacity onPress={onAction}>
                        <Text>{actionLabel}</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    },
}));

// Mock MealAccordionCard
jest.mock('../../components/food/MealAccordionCard', () => ({
    MealAccordionCard: ({ mealType, entries, onAddFood }: any) => {
        const { View, Text, Button } = require('react-native');
        return (
            <View testID={`accordion-${mealType}`}>
                <Text>{mealType} ({entries.length})</Text>
                <Button title={`Add to ${mealType}`} onPress={() => onAddFood(mealType)} />
                {entries.map((entry: any) => (
                    <Text key={entry.id}>{entry.food_name}</Text>
                ))}
            </View>
        );
    },
}));

describe('FoodLoggingScreen', () => {
    const mockEntries = [
        { id: '1', food_name: 'Oatmeal', meal_type: 'breakfast', calories_logged: 150 },
        { id: '2', food_name: 'Salad', meal_type: 'lunch', calories_logged: 300 },
    ];

    const mockSummary = {
        total_calories: 450,
        protein_g: 20,
        carbs_g: 50,
        fat_g: 15,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (foodAPI.getFoodEntries as jest.Mock).mockResolvedValue(mockEntries);
        (nutritionAPI.getDailySummary as jest.Mock).mockResolvedValue(mockSummary);
    });

    it('renders and loads food data', async () => {
        const { getByText, findByText } = render(<FoodLoggingScreen />);

        expect(getByText('Food Log')).toBeTruthy();

        await waitFor(() => {
            expect(foodAPI.getFoodEntries).toHaveBeenCalled();
            expect(nutritionAPI.getDailySummary).toHaveBeenCalled();
        });

        expect(await findByText('450')).toBeTruthy();
        expect(await findByText('kcal')).toBeTruthy();
        expect(await findByText('breakfast (1)')).toBeTruthy();
        expect(await findByText('Oatmeal')).toBeTruthy();
        expect(await findByText('lunch (1)')).toBeTruthy();
        expect(await findByText('Salad')).toBeTruthy();
    });

    it('navigates to SearchFood on Add Food press', async () => {
        const { findByText } = render(<FoodLoggingScreen />);

        const addButton = await findByText('Add to breakfast');
        fireEvent.press(addButton);

        expect(mockNavigate).toHaveBeenCalledWith('SearchFood', { mealType: 'breakfast' });
    });

    it('navigates to BarcodeScanner on Scan press', async () => {
        const { findByTestId } = render(<FoodLoggingScreen />);

        fireEvent.press(await findByTestId('scan-button'));

        expect(mockNavigate).toHaveBeenCalledWith('BarcodeScanner', { mealType: 'snack' });
    });

    it('shows empty state when no entries', async () => {
        (foodAPI.getFoodEntries as jest.Mock).mockResolvedValue([]);
        (nutritionAPI.getDailySummary as jest.Mock).mockResolvedValue({ total_calories: 0 });

        const { findByText } = render(<FoodLoggingScreen />);

        expect(await findByText('No meals logged today')).toBeTruthy();

        // Test action button in empty state
        fireEvent.press(await findByText('Search Food'));
        expect(mockNavigate).toHaveBeenCalledWith('SearchFood', { mealType: 'breakfast' });
    });
});
