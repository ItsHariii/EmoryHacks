import { useState, useEffect } from 'react';
import { calculatePregnancyWeek, PregnancyWeekInfo } from '../utils/pregnancyCalculations';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface UsePregnancyWeekResult {
  pregnancyInfo: PregnancyWeekInfo | null;
  dueDate: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to calculate and manage pregnancy week information
 * Loads due date from user profile and provides pregnancy calculations
 */
export const usePregnancyWeek = (): UsePregnancyWeekResult => {
  const { user } = useAuth();
  const [pregnancyInfo, setPregnancyInfo] = useState<PregnancyWeekInfo | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user profile from backend
      const userProfile = await userAPI.getCurrentUser();
      
      if (userProfile.due_date) {
        const dueDateStr = userProfile.due_date;
        setDueDate(dueDateStr);
        
        // Calculate pregnancy week information
        const info = calculatePregnancyWeek(dueDateStr);
        setPregnancyInfo(info);
      } else {
        // No due date set
        setError('Due date not set. Please update your profile.');
        setPregnancyInfo(null);
        setDueDate(null);
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      setError(err.message || 'Failed to load pregnancy information');
      setPregnancyInfo(null);
      setDueDate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user]);

  return {
    pregnancyInfo,
    dueDate,
    loading,
    error,
    refetch: fetchUserProfile,
  };
};
