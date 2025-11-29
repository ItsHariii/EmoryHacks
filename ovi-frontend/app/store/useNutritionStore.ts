import { create } from 'zustand';
import { nutritionAPI, userAPI } from '../services/api';
import { NutritionSummary, NutritionTargets } from '../types';

interface NutritionState {
    summary: NutritionSummary | null;
    targets: NutritionTargets | null;
    loading: boolean;
    error: string | null;
    fetchDailySummary: (date?: string) => Promise<void>;
    fetchTargets: () => Promise<void>;
    refreshNutrition: () => Promise<void>;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
    summary: null,
    targets: null,
    loading: false,
    error: null,

    fetchDailySummary: async (date) => {
        set({ loading: true, error: null });
        try {
            const summary = await nutritionAPI.getDailySummary(date);
            set({ summary, loading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch nutrition summary', loading: false });
        }
    },

    fetchTargets: async () => {
        // Don't set loading true if we already have targets, to avoid flicker
        if (!get().targets) {
            set({ loading: true, error: null });
        }
        try {
            const targets = await userAPI.getNutritionTargets();
            set({ targets, loading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch nutrition targets', loading: false });
        }
    },

    refreshNutrition: async () => {
        const { fetchDailySummary, fetchTargets } = get();
        await Promise.all([fetchDailySummary(), fetchTargets()]);
    },
}));
