import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './app/contexts/AuthContext';
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.primary,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.text.light,
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
        }}
      />
      <Tab.Screen 
        name="FoodLogging" 
        component={FoodStack}
        options={{
          tabBarLabel: 'Food Log',
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
        }}
      />
    </Tab.Navigator>
  );
}

function FoodStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FoodLoggingMain" component={FoodLoggingScreen} />
      <Stack.Screen name="SearchFood" component={SearchFoodScreen} />
      <Stack.Screen name="EditFoodEntry" component={EditFoodEntryScreen} />
      <Stack.Screen name="BarcodeScanner" component={BarcodeScannerScreen} />
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
      }}
    >
      <Stack.Screen 
        name="JournalMain" 
        component={JournalScreen}
        options={{ title: 'My Journal' }}
      />
      <Stack.Screen 
        name="JournalEntry" 
        component={JournalEntryScreen}
        options={{ title: 'Journal Entry' }}
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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
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
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
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
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
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
