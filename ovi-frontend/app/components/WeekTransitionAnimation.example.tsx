/**
 * Example integration of WeekTransitionModal component
 * This shows how to integrate the week transition modal into a screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeekTransitionModal, shouldShowWeekTransition } from './WeekTransitionAnimation';
import { usePregnancyProgress } from '../hooks/usePregnancyProgress';

/**
 * Example 1: Using with usePregnancyProgress hook
 */
export const DashboardWithWeekTransition: React.FC = () => {
  const { pregnancyInfo, weekChanged, dismissWeekChange } = usePregnancyProgress();
  
  return (
    <View style={styles.container}>
      <Text>Dashboard Content</Text>
      
      {/* Week Transition Modal */}
      {pregnancyInfo && (
        <WeekTransitionModal
          visible={weekChanged}
          week={pregnancyInfo.week}
          onDismiss={dismissWeekChange}
        />
      )}
    </View>
  );
};

/**
 * Example 2: Manual control with shouldShowWeekTransition helper
 */
export const ManualWeekTransition: React.FC = () => {
  const [showTransition, setShowTransition] = useState(false);
  const currentWeek = 24; // This would come from your pregnancy calculation

  useEffect(() => {
    // Check if we should show the transition
    const checkTransition = async () => {
      const shouldShow = await shouldShowWeekTransition(currentWeek);
      setShowTransition(shouldShow);
    };
    
    checkTransition();
  }, [currentWeek]);

  const handleDismiss = () => {
    setShowTransition(false);
    // The modal automatically stores the dismissed week in AsyncStorage
  };

  return (
    <View style={styles.container}>
      <Text>Your Content Here</Text>
      
      <WeekTransitionModal
        visible={showTransition}
        week={currentWeek}
        onDismiss={handleDismiss}
      />
    </View>
  );
};

/**
 * Example 3: Triggering manually (e.g., from a button)
 */
export const ManualTriggerExample: React.FC = () => {
  const [showTransition, setShowTransition] = useState(false);
  const currentWeek = 25;

  return (
    <View style={styles.container}>
      <Text>Content</Text>
      
      {/* Manual trigger button for testing */}
      <Text 
        style={styles.button}
        onPress={() => setShowTransition(true)}
      >
        Show Week Transition
      </Text>
      
      <WeekTransitionModal
        visible={showTransition}
        week={currentWeek}
        onDismiss={() => setShowTransition(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  button: {
    padding: 12,
    backgroundColor: '#E8B4B8',
    borderRadius: 8,
    textAlign: 'center',
    marginTop: 16,
  },
});
