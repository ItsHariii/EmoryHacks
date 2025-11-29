import React, { useRef, useEffect, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './app/contexts/AuthContext';
import { ToastProvider } from './app/components/ToastProvider';
import { ErrorBoundary } from './app/components/ErrorBoundary';
import { AuthScreen } from './app/screens/AuthScreen';
import { DashboardScreen } from './app/screens/DashboardScreen';
// Lazy load other screens
const FoodLoggingScreen = React.lazy(() => import('./app/screens/FoodLoggingScreen').then(module => ({ default: module.FoodLoggingScreen })));
const SearchFoodScreen = React.lazy(() => import('./app/screens/SearchFoodScreen').then(module => ({ default: module.SearchFoodScreen })));
const EditFoodEntryScreen = React.lazy(() => import('./app/screens/EditFoodEntryScreen').then(module => ({ default: module.EditFoodEntryScreen })));
const ProfileScreen = React.lazy(() => import('./app/screens/ProfileScreen').then(module => ({ default: module.ProfileScreen })));
const BarcodeScannerScreen = React.lazy(() => import('./app/screens/BarcodeScannerScreen').then(module => ({ default: module.BarcodeScannerScreen })));
const AIPhotoAnalysisScreen = React.lazy(() => import('./app/screens/AIPhotoAnalysisScreen').then(module => ({ default: module.AIPhotoAnalysisScreen })));
const JournalScreen = React.lazy(() => import('./app/screens/JournalScreen').then(module => ({ default: module.JournalScreen })));
const JournalEntryScreen = React.lazy(() => import('./app/screens/JournalEntryScreen').then(module => ({ default: module.JournalEntryScreen })));
const ChatJournalScreen = React.lazy(() => import('./app/screens/ChatJournalScreen').then(module => ({ default: module.ChatJournalScreen })));
const NotificationSettingsScreen = React.lazy(() => import('./app/screens/NotificationSettingsScreen').then(module => ({ default: module.NotificationSettingsScreen })));

import { TrimesterTrackerScreen } from './app/screens/TrimesterTrackerScreen';

import { useAuth } from './app/contexts/AuthContext';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from './app/theme';
import { setupNotificationListener } from './app/services/notificationService';
import { CustomTabBar } from './app/components/CustomTabBar';
import {
  slideFromRightTransition,
  fadeTransition,
  modalSlideFromBottomTransition,
  detailViewScreenOptions,
  enhancedStackScreenOptions,
  enhancedModalScreenOptions,
  swipeBackGestureConfig,
  swipeToDismissGestureConfig,
} from './app/utils/navigationTransitions';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const LoadingFallback = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
);

const withSuspense = (Component: React.ComponentType<any>) => (props: any) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component {...props} />
  </Suspense>
);

// Wrap lazy components
const FoodLoggingScreenWrapped = withSuspense(FoodLoggingScreen);
const SearchFoodScreenWrapped = withSuspense(SearchFoodScreen);
const EditFoodEntryScreenWrapped = withSuspense(EditFoodEntryScreen);
const ProfileScreenWrapped = withSuspense(ProfileScreen);
const BarcodeScannerScreenWrapped = withSuspense(BarcodeScannerScreen);
const AIPhotoAnalysisScreenWrapped = withSuspense(AIPhotoAnalysisScreen);
const JournalScreenWrapped = withSuspense(JournalScreen);
const JournalEntryScreenWrapped = withSuspense(JournalEntryScreen);
const ChatJournalScreenWrapped = withSuspense(ChatJournalScreen);
const NotificationSettingsScreenWrapped = withSuspense(NotificationSettingsScreen);


function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text.inverse,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          headerShown: false, // Use custom header in screen
        }}
      />
      <Tab.Screen
        name="FoodLogging"
        component={FoodStack}
        options={{
          tabBarLabel: 'Food',
          headerShown: false, // Use custom headers in stack screens
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalStack}
        options={{
          tabBarLabel: 'Journal',
        }}
      />
      <Tab.Screen
        name="Baby"
        component={TrimesterTrackerScreen}
        options={{
          tabBarLabel: 'Baby',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

function FoodStack() {
  return (
    <Stack.Navigator
      screenOptions={enhancedStackScreenOptions}
      initialRouteName="SearchFood"
    >
      <Stack.Screen
        name="SearchFood"
        component={SearchFoodScreenWrapped}
        options={{
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <Stack.Screen
        name="FoodLoggingMain"
        component={FoodLoggingScreenWrapped}
        options={{
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <Stack.Screen
        name="EditFoodEntry"
        component={EditFoodEntryScreenWrapped}
        options={{
          ...detailViewScreenOptions,
          ...swipeToDismissGestureConfig,
          headerShown: false, // Use custom header in screen
        }}
      />
      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScannerScreenWrapped}
        options={{
          ...fadeTransition,
          ...swipeToDismissGestureConfig,
        }}
      />
      <Stack.Screen
        name="AIPhotoAnalysis"
        component={AIPhotoAnalysisScreenWrapped}
        options={{
          headerShown: false,
          ...fadeTransition,
          ...swipeToDismissGestureConfig,
        }}
      />
    </Stack.Navigator>
  );
}

function JournalStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text.inverse,
        headerTitleStyle: {
          fontWeight: theme.fontWeight.bold,
        },
        ...enhancedStackScreenOptions,
      }}
    >
      <Stack.Screen
        name="JournalMain"
        component={JournalScreenWrapped}
        options={{
          headerShown: false,
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <Stack.Screen
        name="JournalEntry"
        component={JournalEntryScreenWrapped}
        options={{
          title: 'Journal Entry',
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <Stack.Screen
        name="ChatJournal"
        component={ChatJournalScreenWrapped}
        options={{
          headerShown: false,
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Set up notification listener for handling notification taps
    if (navigationRef.current) {
      const subscription = setupNotificationListener(navigationRef);
      return () => subscription.remove();
    }
  }, [navigationRef.current]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text.inverse} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={enhancedStackScreenOptions}
    >
      {user ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{
              ...slideFromRightTransition,
              gestureEnabled: false, // Disable gesture for main tabs
            }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreenWrapped}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: theme.colors.text.inverse,
              headerTitleStyle: {
                fontWeight: theme.fontWeight.bold,
              },
              title: 'Notification Settings',
              ...enhancedModalScreenOptions,
            }}
          />

        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            ...fadeTransition,
            gestureEnabled: false, // Disable gesture for auth screen
          }}
        />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    // Set up notification listener for handling notification taps
    if (navigationRef.current) {
      const subscription = setupNotificationListener(navigationRef);
      return () => subscription.remove();
    }
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer ref={navigationRef}>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
  },
});
