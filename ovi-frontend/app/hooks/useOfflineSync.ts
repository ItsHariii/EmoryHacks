import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import api from '../services/api';
import { PendingAction } from '../types';

interface UseOfflineSyncResult {
  isOnline: boolean;
  queueAction: (action: Omit<PendingAction, 'id' | 'timestamp'>) => Promise<void>;
  syncPendingActions: () => Promise<void>;
  pendingActions: PendingAction[];
}

const PENDING_ACTIONS_KEY = 'pending_actions_queue';

/**
 * Custom hook to manage offline functionality and data synchronization
 * Monitors network connectivity and queues actions when offline
 * Auto-syncs pending actions when connection is restored
 */
export const useOfflineSync = (): UseOfflineSyncResult => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);

  /**
   * Load pending actions from AsyncStorage
   */
  const loadPendingActions = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
      if (stored) {
        const actions: PendingAction[] = JSON.parse(stored);
        setPendingActions(actions);
      }
    } catch (err) {
      console.error('Error loading pending actions:', err);
    }
  }, []);

  /**
   * Save pending actions to AsyncStorage
   */
  const savePendingActions = useCallback(async (actions: PendingAction[]) => {
    try {
      await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
      setPendingActions(actions);
    } catch (err) {
      console.error('Error saving pending actions:', err);
    }
  }, []);

  /**
   * Queue an action to be executed when online
   */
  const queueAction = useCallback(async (
    action: Omit<PendingAction, 'id' | 'timestamp'>
  ): Promise<void> => {
    const newAction: PendingAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const updatedActions = [...pendingActions, newAction];
    await savePendingActions(updatedActions);
  }, [pendingActions, savePendingActions]);

  /**
   * Execute a single pending action
   */
  const executeAction = async (action: PendingAction): Promise<boolean> => {
    try {
      const config: any = {
        method: action.method,
        url: action.endpoint,
      };

      // Add data for POST, PUT, PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(action.method)) {
        config.data = action.data;
      }

      await api.request(config);
      return true;
    } catch (err) {
      console.error(`Error executing action ${action.id}:`, err);
      return false;
    }
  };

  /**
   * Sync all pending actions with the server
   */
  const syncPendingActions = useCallback(async (): Promise<void> => {
    if (!isOnline || pendingActions.length === 0) {
      return;
    }

    console.log(`Syncing ${pendingActions.length} pending actions...`);

    const failedActions: PendingAction[] = [];

    // Execute actions in order
    for (const action of pendingActions) {
      const success = await executeAction(action);
      if (!success) {
        failedActions.push(action);
      }
    }

    // Update pending actions (keep only failed ones)
    await savePendingActions(failedActions);

    if (failedActions.length === 0) {
      console.log('All pending actions synced successfully');
    } else {
      console.log(`${failedActions.length} actions failed to sync`);
    }
  }, [isOnline, pendingActions, savePendingActions]);

  /**
   * Monitor network connectivity
   */
  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);

      // Auto-sync when connection is restored
      if (online && !isOnline) {
        console.log('Connection restored, syncing pending actions...');
        syncPendingActions();
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline, syncPendingActions]);

  /**
   * Load pending actions on mount
   */
  useEffect(() => {
    loadPendingActions();
  }, [loadPendingActions]);

  return {
    isOnline,
    queueAction,
    syncPendingActions,
    pendingActions,
  };
};
