import React, { useRef, useEffect, Suspense } from 'react';
import * as Linking from 'expo-linking';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Fraunces_300Light,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces';
import {
  InstrumentSans_400Regular,
  InstrumentSans_400Regular_Italic,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { AuthProvider } from './app/contexts/AuthContext';
import { ToastProvider } from './app/components/ui/ToastProvider';
import { ErrorBoundary } from './app/components/ui/ErrorBoundary';
import { AuthScreen } from './app/screens/AuthScreen';
import { OnboardingScreen } from './app/screens/OnboardingScreen';
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
import { CustomTabBar } from './app/components/layout/CustomTabBar';
import type {
  RootStackParamList,
  MainTabParamList,
  FoodStackParamList,
  JournalStackParamList,
} from './app/types/navigation';
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

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();
const FoodStackNavigator = createStackNavigator<FoodStackParamList>();
const JournalStackNavigator = createStackNavigator<JournalStackParamList>();

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
          headerShown: false, // Use custom header in JournalScreen
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
    <FoodStackNavigator.Navigator
      screenOptions={enhancedStackScreenOptions}
      initialRouteName="SearchFood"
    >
      <FoodStackNavigator.Screen
        name="SearchFood"
        component={SearchFoodScreenWrapped}
        options={{
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <FoodStackNavigator.Screen
        name="FoodLoggingMain"
        component={FoodLoggingScreenWrapped}
        options={{
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <FoodStackNavigator.Screen
        name="EditFoodEntry"
        component={EditFoodEntryScreenWrapped}
        options={{
          ...detailViewScreenOptions,
          ...swipeToDismissGestureConfig,
          headerShown: false, // Use custom header in screen
        }}
      />
      <FoodStackNavigator.Screen
        name="BarcodeScanner"
        component={BarcodeScannerScreenWrapped}
        options={{
          ...fadeTransition,
          ...swipeToDismissGestureConfig,
        }}
      />
      <FoodStackNavigator.Screen
        name="AIPhotoAnalysis"
        component={AIPhotoAnalysisScreenWrapped}
        options={{
          headerShown: false,
          ...fadeTransition,
          ...swipeToDismissGestureConfig,
        }}
      />
    </FoodStackNavigator.Navigator>
  );
}

function JournalStack() {
  return (
    <JournalStackNavigator.Navigator
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
      <JournalStackNavigator.Screen
        name="JournalMain"
        component={JournalScreenWrapped}
        options={{
          headerShown: false,
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <JournalStackNavigator.Screen
        name="JournalEntry"
        component={JournalEntryScreenWrapped}
        options={{
          title: 'Journal Entry',
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <JournalStackNavigator.Screen
        name="ChatJournal"
        component={ChatJournalScreenWrapped}
        options={{
          headerShown: false,
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
    </JournalStackNavigator.Navigator>
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
    <RootStack.Navigator
      screenOptions={enhancedStackScreenOptions}
    >
      {!user ? (
        <RootStack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            ...fadeTransition,
            gestureEnabled: false,
          }}
        />
      ) : user.onboarding_completed === false ? (
        <RootStack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            ...fadeTransition,
            gestureEnabled: false,
            headerShown: false,
          }}
        />
      ) : (
        <>
          <RootStack.Screen
            name="Main"
            component={MainTabs}
            options={{
              ...slideFromRightTransition,
              gestureEnabled: false,
            }}
          />
          <RootStack.Screen
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
          <RootStack.Screen
            name="Profile"
            component={ProfileScreenWrapped}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: theme.colors.text.inverse,
              headerTitleStyle: {
                fontWeight: theme.fontWeight.bold,
              },
              title: 'Profile',
              ...slideFromRightTransition,
            }}
          />
        </>
      )}
    </RootStack.Navigator>
  );
}

// Registers both the native `ovi://` scheme and Expo Go's `exp://.../--/`
// prefix so OAuth callbacks resolve correctly in all runtimes:
// - dev client / production build → ovi://auth/callback
// - Expo Go (dev)                  → exp://<host>/--/auth/callback
const linking: LinkingOptions<any> = {
  prefixes: ['ovi://', Linking.createURL('/')],
  config: {
    screens: {
      Auth: 'auth/callback',
    },
  },
};

export default function App() {
  const navigationRef = useRef<any>(null);

  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Fraunces_300Light,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium_Italic,
    InstrumentSans_400Regular,
    InstrumentSans_400Regular_Italic,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });

  useEffect(() => {
    // Set up notification listener for handling notification taps
    if (navigationRef.current) {
      const subscription = setupNotificationListener(navigationRef);
      return () => subscription.remove();
    }
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text.inverse} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer ref={navigationRef} linking={linking}>
            <StatusBar style="dark" />
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
    backgroundColor: theme.colors.background,
  },
});
