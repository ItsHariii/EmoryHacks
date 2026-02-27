import { renderHook, act } from '@testing-library/react-native';
import { useNutritionStore } from '../useNutritionStore';
import { nutritionAPI, userAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
    nutritionAPI: {
        getDailySummary: jest.fn(),
    },
    userAPI: {
        getNutritionTargets: jest.fn(),
    },
}));

describe('useNutritionStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const { result } = renderHook(() => useNutritionStore());
        act(() => {
            useNutritionStore.setState({ summary: null, targets: null, loading: false, error: null });
        });
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useNutritionStore());
        expect(result.current.summary).toBeNull();
        expect(result.current.targets).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBeNull();
    });

    it('fetches daily summary successfully', async () => {
        const mockSummary = {
            total_calories: 2000,
            protein_g: 100,
            carbs_g: 200,
            fat_g: 50,
            water_ml: 1500,
        };
        (nutritionAPI.getDailySummary as jest.Mock).mockResolvedValue(mockSummary);

        const { result } = renderHook(() => useNutritionStore());

        await act(async () => {
            await result.current.fetchDailySummary('2023-10-27');
        });

        expect(result.current.loading).toBeFalsy();
        expect(result.current.summary).toEqual(mockSummary);
        expect(result.current.error).toBeNull();
    });

    it('fetches targets successfully', async () => {
        const mockTargets = {
            calories: 2500,
            macros: { protein_g: 150, carbs_g: 300, fat_g: 80 },
        };
        (userAPI.getNutritionTargets as jest.Mock).mockResolvedValue(mockTargets);

        const { result } = renderHook(() => useNutritionStore());

        await act(async () => {
            await result.current.fetchTargets();
        });

        expect(result.current.loading).toBeFalsy();
        expect(result.current.targets).toEqual(mockTargets);
        expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
        const errorMessage = 'Failed to fetch';
        (nutritionAPI.getDailySummary as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useNutritionStore());

        await act(async () => {
            await result.current.fetchDailySummary('2023-10-27');
        });

        expect(result.current.loading).toBeFalsy();
        expect(result.current.summary).toBeNull();
        expect(result.current.error).toBe(errorMessage);
    });
});
