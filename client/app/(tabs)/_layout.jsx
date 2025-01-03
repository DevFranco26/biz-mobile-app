// File: client/app/(tabs)/_layout.jsx

import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/userStore';

// Helper function to get initials
const getInitials = (user) => {
  if (!user) return '';
  const { firstName = '', lastName = '' } = user;
  const firstInitial = firstName.charAt(0).toUpperCase() || '';
  const lastInitial = lastName.charAt(0).toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
};

const TabsLayout = () => {
  const { theme } = useThemeStore();
  const { user } = useUserStore(); // to get the user's name
  const isLightTheme = theme === 'light';

  // Create the avatar as a small circle with initials
  const AvatarIcon = ({ color, size }) => {
    const initials = getInitials(user);
    // We'll just keep the circle size
    const circleSize = 23; // slightly bigger
    return (
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: color, // Use the color from tabBar
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: isLightTheme ? '#fff' : '#0f172a', fontWeight: 'bold', fontSize: 12 }}>
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
          // Ionicons outline for profile
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Leaves Screen */}
      <Tabs.Screen
        name="(leaves)"
        options={{
          title: 'Leaves',
          headerShown: false,
          // Ionicons outline for calendar
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Payroll Screen */}
      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          headerShown: false,
          // Ionicons outline for cash
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Shifts Screen */}
      <Tabs.Screen
        name="(shifts)"
        options={{
          title: 'Shifts',
          headerShown: false,
          // Ionicons outline for time
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Settings Screen */}
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          headerShown: false,
          // Instead of Ionicons gear, use an avatar:
          tabBarIcon: AvatarIcon,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;

