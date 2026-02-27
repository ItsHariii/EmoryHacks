import React from 'react';
import { render, fireEvent, waitFor, act } from '../../utils/test-utils';
import { SearchFoodScreen } from '../SearchFoodScreen';
import { foodAPI } from '../../services/api';

// Mock API
jest.mock('../../services/api', () => ({
    foodAPI: {
        getRecentFoods: jest.fn(),
        search: jest.fn(),
    },
}));

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
    const actual = jest.requireActual('@react-navigation/native');
    return {
        ...actual,
        useNavigation: () => ({
            navigate: mockNavigate,
            goBack: jest.fn(),
        }),
        useRoute: () => ({
            params: { mealType: 'lunch' },
        }),
    };
});

describe('SearchFoodScreen', () => {
    const mockRecentFoods = [
        { id: '1', name: 'Apple', calories_per_100g: 52 },
        { id: '2', name: 'Banana', calories_per_100g: 89 },
    ];

    const mockSearchResults = {
        foods: [
            { id: '3', name: 'Chicken Breast', calories_per_100g: 165, brand: 'Generic' },
        ],
        total: 1,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (foodAPI.getRecentFoods as jest.Mock).mockResolvedValue(mockRecentFoods);
        (foodAPI.search as jest.Mock).mockResolvedValue(mockSearchResults);
    });

    it('renders and loads recent foods', async () => {
        const { getByPlaceholderText, findByText } = render(<SearchFoodScreen />);

        expect(getByPlaceholderText('Search for food...')).toBeTruthy();

        await waitFor(() => {
            expect(foodAPI.getRecentFoods).toHaveBeenCalled();
        });

        expect(await findByText('Apple')).toBeTruthy();
        expect(await findByText('Banana')).toBeTruthy();
    });

    it('performs search and displays results', async () => {
        const { getByPlaceholderText, findByText, queryByText } = render(<SearchFoodScreen />);

        const searchInput = getByPlaceholderText('Search for food...');

        fireEvent.changeText(searchInput, 'Chicken');

        // Wait for debounce
        await waitFor(() => {
            expect(foodAPI.search).toHaveBeenCalledWith('Chicken');
        }, { timeout: 1000 });

        expect(await findByText('Chicken Breast')).toBeTruthy();
        expect(queryByText('Apple')).toBeNull(); // Recent foods should disappear
    });

    it('navigates to EditFoodEntry on item press', async () => {
        const { findByText } = render(<SearchFoodScreen />);

        const apple = await findByText('Apple');
        fireEvent.press(apple);

        expect(mockNavigate).toHaveBeenCalledWith('EditFoodEntry', {
            food: mockRecentFoods[0],
            mealType: 'lunch',
            isNewEntry: true,
        });
    });

    it('shows empty state when no results found', async () => {
        (foodAPI.search as jest.Mock).mockResolvedValue({ foods: [], total: 0 });
        const { getByPlaceholderText, findByText } = render(<SearchFoodScreen />);

        const searchInput = getByPlaceholderText('Search for food...');
        fireEvent.changeText(searchInput, 'NonexistentFood');

        await waitFor(() => {
            expect(foodAPI.search).toHaveBeenCalled();
        }, { timeout: 1000 });

        expect(await findByText('No foods found')).toBeTruthy();
    });
});
