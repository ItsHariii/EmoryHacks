import { create } from 'zustand';
import { userAPI } from '../services/api';

interface UserProfile {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    due_date?: string;
    babies?: number;
    pre_pregnancy_weight?: number; // in kg
    height?: number; // in cm
    current_weight?: number; // in kg
    // Add other fields as needed
}

interface UserState {
    profile: UserProfile | null;
    loading: boolean;
    error: string | null;
    fetchProfile: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    profile: null,
    loading: false,
    error: null,

    fetchProfile: async () => {
        set({ loading: true, error: null });
        try {
            const profile = await userAPI.getCurrentUser();
            set({ profile, loading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch profile', loading: false });
        }
    },

    updateProfile: async (updates) => {
        set({ loading: true, error: null });
        try {
            const updatedProfile = await userAPI.updateCurrentUser(updates);
            set({ profile: updatedProfile, loading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to update profile', loading: false });
            throw error;
        }
    },

    clearUser: () => set({ profile: null, error: null }),
}));
