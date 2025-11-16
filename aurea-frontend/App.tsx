import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './app/contexts/AuthContext';
import { ToastProvider } from './app/components/ToastProvider';
import { AuthScreen } from './app/screens/AuthScreen';
import { DashboardScreen } from './app/screens/DashboardScreen';
import { FoodLoggingScreen } from './app/screens/FoodLoggingScreen';
import { SearchFoodScreen } from './app/screens/SearchFoodScreen';
import { EditFoodEntryScreen } from './app/screens/EditFoodEntryScreen';
import { ProfileScreen } from './app/screens/ProfileScreen';
import { BarcodeScannerScreen } from './app/screens/BarcodeScannerScreen';
import { JournalScreen } from './app/screens/JournalScreen';
import { JournalEntryScreen } from './app/screens/JournalEntryScreen';
import { NotificationSettingsScreen } from './app/screens/NotificationSettingsScreen';
import { useAuth } from './app/contexts/AuthContext';
import { View, Text, StyleSheet } from 'react-native';
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

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.text.light,
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
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerShown: false, // Use custom header in screen
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
        component={SearchFoodScreen}
        options={{
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <Stack.Screen 
        name="FoodLoggingMain" 
        component={FoodLoggingScreen}
        options={{
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <Stack.Screen 
        name="EditFoodEntry" 
        component={EditFoodEntryScreen}
        options={{
          ...detailViewScreenOptions,
          ...swipeToDismissGestureConfig,
        }}
      />
      <Stack.Screen 
        name="BarcodeScanner" 
        component={BarcodeScannerScreen}
        options={{
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
        headerTintColor: theme.colors.text.light,
        headerTitleStyle: {
          fontWeight: theme.fontWeight.bold,
        },
        ...enhancedStackScreenOptions,
      }}
    >
      <Stack.Screen 
        name="JournalMain" 
        component={JournalScreen}
        options={{ 
          headerShown: false,
          ...slideFromRightTransition,
          ...swipeBackGestureConfig,
        }}
      />
      <Stack.Screen 
        name="JournalEntry" 
        component={JournalEntryScreen}
        options={{ 
          title: 'Journal Entry',
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
        <Text>Loading...</Text>
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
            component={NotificationSettingsScreen}
            options={{
              headerShown: true,
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: theme.colors.text.light,
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
    <AuthProvider>
      <ToastProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </ToastProvider>
    </AuthProvider>
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
