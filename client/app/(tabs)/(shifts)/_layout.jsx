// File: client/app/(tabs)/(shifts)/_layout.jsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const ShiftsTabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  // Helper function to generate tab icons
  const getTabBarIcon = (iconName, size = 20, accessibilityLabel = '') => ({ color }) => (
    <Ionicons
      name={iconName}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
    />
  );

  return (
    <Tabs
      initialRouteName="Punch"
      screenOptions={{
        // Position the tab bar at the top
        tabBarStyle: {
          backgroundColor: isLightTheme ? '#ffffff' : '#0f172a',
          borderBottomColor: isLightTheme ? '#e5e7eb' : '#0f172a',
          borderTopWidth: 0,
          position: 'absolute',
          top: insets.top,
          left: 0,
          right: 0,
          height: 60,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: isLightTheme ? '#c2410c' : '#f97316',
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
        tabBarLabelPosition: 'below-icon',
      }}
    >
      {/* Punch Screen */}
      <Tabs.Screen
        name="Punch"
        options={{
          tabBarLabel: 'Punch',
          // Ionicons outline for time
          tabBarIcon: getTabBarIcon('time-outline', 20, 'Punch Tab Icon'),
        }}
      />

      {/* TimeCard Screen */}
      <Tabs.Screen
        name="TimeCard"
        options={{
          tabBarLabel: 'Time Card',
          // Ionicons outline for clipboard
          tabBarIcon: getTabBarIcon('clipboard-outline', 20, 'Time Card Tab Icon'),
        }}
      />

      {/* Schedule Screen */}
      <Tabs.Screen
        name="Schedules"
        options={{
          tabBarLabel: 'Shift Schedule',
          // Ionicons outline for calendar
          tabBarIcon: getTabBarIcon('calendar-outline', 20, 'Shift Schedule Tab Icon'),
        }}
      />
    </Tabs>
  );
};

export default ShiftsTabsLayout;
