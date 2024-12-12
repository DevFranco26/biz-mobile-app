// File: app/(tabs)/(shifts)/_layout.jsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';

const ShiftsTabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  return (
    <Tabs
      initialRouteName="Punch"
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
      }}
    >
      {/* Punch Screen */}
      <Tabs.Screen
        name="Punch"
        options={{
          tabBarLabel: 'Punch',
          tabBarIcon: ({ color }) => (
            <Ionicons name="time" size={20} color={color} />
          ),
        }}
      />
      {/* TimeCard Screen */}
      <Tabs.Screen
        name="TimeCard"
        options={{
          tabBarLabel: 'Time Card',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="calendar-alt" size={18} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default ShiftsTabsLayout;
