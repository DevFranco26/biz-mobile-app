// File: app/(tabs)/_layout.jsx

import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import useThemeStore from '../../store/themeStore';

const TabsLayout = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isLightTheme ? '#ffffff' : '#0f172a',
          borderTopColor:  isLightTheme ? '#ffffff' : '#0f172a',
        },
        tabBarActiveTintColor: isLightTheme ? '#c2410c' : '#f97316',
        tabBarInactiveTintColor: isLightTheme ? 'gray' : '#9ca3af',
      }}
    >
      {/* Profile Screen */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color} />,
        }}
      />
      {/* Leaves Screen */}
      <Tabs.Screen
        name="leaves"
        options={{
          title: 'Leaves',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <FontAwesome5 name="calendar-alt" size={size} color={color} />,
        }}
      />
      {/* Payroll Screen */}
      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <MaterialIcons name="payments" size={size} color={color} />,
        }}
      />
      {/* Shifts Screen */}
      <Tabs.Screen
        name="(shifts)"
        options={{
          title: 'Shifts',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
        }}
        dis
      />
      {/* Settings Screen */}
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
