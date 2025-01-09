// File: client/app/(tabs)/_layout.jsx

import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/userStore';

// Helper to get initials
const getInitials = (user) => {
  if (!user) return '';
  const { firstName = '', lastName = '' } = user;
  const firstInitial = firstName.charAt(0).toUpperCase() || '';
  const lastInitial = lastName.charAt(0).toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
};

const TabsLayout = () => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const isLightTheme = theme === 'light';

  // Reusable Avatar icon that uses the color passed from the tab bar
  const AvatarIcon = ({ color, size }) => {
    const initials = getInitials(user);
    const circleSize = 23;

    return (
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: color,       // <--- Use the "color" from tabBarIcon
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
          {initials}
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isLightTheme ? '#ffffff' : '#0f172a',
          borderTopColor: isLightTheme ? '#ffffff' : '#0f172a',
        },
        tabBarActiveTintColor: '#f97316',  // Active color
        tabBarInactiveTintColor: '#9ca3af', // Inactive color
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(leaves)"
        options={{
          title: 'Leaves',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(shifts)"
        options={{
          title: 'Shifts',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          headerShown: false,
          // Use AvatarIcon here so it matches the active/inactive color
          tabBarIcon: AvatarIcon,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
