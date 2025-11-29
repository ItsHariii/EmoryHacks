import React from 'react';
import { render, waitFor } from '../../utils/test-utils';
import { DashboardScreen } from '../DashboardScreen';

// Mock dependencies
jest.mock('../../store/useUserStore', () => ({
    useUserStore: () => ({
        profile: { first_name: 'Test', last_name: 'User' },
        fetchProfile: jest.fn(),
        loading: false,
    }),
}));

jest.mock('../../store/useNutritionStore', () => ({
    useNutritionStore: () => ({
        summary: { total_calories: 2000, protein_g: 100, carbs_g: 200, fat_g: 50 },
        targets: { calories: 2500, macros: { protein_g: 150, carbs_g: 300, fat_g: 80 } },
        loading: false,
        refreshNutrition: jest.fn(),
    }),
}));

jest.mock('../../hooks/useNotifications', () => ({
    useNotifications: () => ({
        scheduledCount: 0,
        checkPermissions: jest.fn(),
    }),
}));

jest.mock('../../hooks/usePregnancyProgress', () => ({
    usePregnancyProgress: () => ({
        pregnancyInfo: { week: 20, trimester: 2, daysUntilDue: 140 },
        loading: false,
    }),
}));

jest.mock('../../hooks/useMicronutrientCalculator', () => ({
    useMicronutrientCalculator: () => [],
}));

jest.mock('../../hooks/useCelebrations', () => ({
    useCelebrations: () => ({
        celebrate: jest.fn(),
        currentCelebration: null,
    }),
}));

jest.mock('../../services/api', () => ({
    journalAPI: {
        getJournalEntries: jest.fn().mockResolvedValue([]),
    },
}));

describe('DashboardScreen', () => {
    it('renders correctly', async () => {
        const { getByText } = render(<DashboardScreen />);

        await waitFor(() => {
            expect(getByText('Hello, Test!')).toBeTruthy();
            expect(getByText("Today's Macronutrients")).toBeTruthy();
        });
    });
});
