// File: app/(tabs)/(settings)/_layout.jsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const SettingsTabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isLightTheme ? '#ffffff' : '#0f172a',
          borderTopColor:  isLightTheme ? '#ffffff' : '#0f172a',
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          height: 60, 
       
        },
        tabBarActiveTintColor: isLightTheme ? '#c2410c' : '#fb923c', 
        tabBarInactiveTintColor: isLightTheme ? 'gray' : '#9ca3af',
        tabBarShowIcon: true,
        tabBarLabelStyle: {
          fontSize: 12,
          textTransform: 'none',
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
        tabBarItemStyle: {
          flexDirection: 'column',
        },
        headerShown: false,
      }}
    >
      {/* Admin Screen */}
      <Tabs.Screen
        name="Admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      {/* Subscription Screen */}
      <Tabs.Screen
        name="Subscription"
        options={{
          title: 'Subscription',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="subscriptions" size={size} color={color} />
          ),
        }}
      />

      
    </Tabs>
  );
};

export default SettingsTabsLayout;
