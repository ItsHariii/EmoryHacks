import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useUserStore } from '../useUserStore';
import { userAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
    userAPI: {
        getCurrentUser: jest.fn(),
        updateCurrentUser: jest.fn(),
    },
}));

describe('useUserStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset store state if necessary (Zustand stores persist between tests unless reset)
        // For simplicity, we assume fresh state or handle it in tests
        const { result } = renderHook(() => useUserStore());
        act(() => {
            useUserStore.setState({ profile: null, loading: false, error: null });
        });
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useUserStore());
        expect(result.current.profile).toBeNull();
        expect(result.current.loading).toBeFalsy();
        expect(result.current.error).toBeNull();
    });

    it('fetches profile successfully', async () => {
        const mockProfile = { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' };
        (userAPI.getCurrentUser as jest.Mock).mockResolvedValue(mockProfile);

        const { result } = renderHook(() => useUserStore());

        await act(async () => {
            await result.current.fetchProfile();
        });

        expect(result.current.loading).toBeFalsy();
        expect(result.current.profile).toEqual(mockProfile);
        expect(result.current.error).toBeNull();
    });

    it('handles fetch profile error', async () => {
        const errorMessage = 'Network error';
        (userAPI.getCurrentUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() => useUserStore());

        await act(async () => {
            await result.current.fetchProfile();
        });

        expect(result.current.loading).toBeFalsy();
        expect(result.current.profile).toBeNull();
        expect(result.current.error).toBe(errorMessage);
    });

    it('updates profile successfully', async () => {
        const initialProfile = { first_name: 'Jane', last_name: 'Doe' };
        const updatedData = { first_name: 'Janet' };
        const updatedProfile = { ...initialProfile, ...updatedData };

        (userAPI.updateCurrentUser as jest.Mock).mockResolvedValue(updatedProfile);

        const { result } = renderHook(() => useUserStore());

        // Set initial state
        act(() => {
            useUserStore.setState({ profile: initialProfile as any });
        });

        await act(async () => {
            await result.current.updateProfile(updatedData);
        });

        expect(result.current.loading).toBeFalsy();
        expect(result.current.profile).toEqual(updatedProfile);
        expect(result.current.error).toBeNull();
    });
});
