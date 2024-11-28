import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { useNavigation } from 'expo-router';
import useThemeStore from '../../../store/themeStore';

export default function ShiftsTabsLayout() {
  const { theme } = useThemeStore();
  const navigation = useNavigation();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme === 'dark' ? '#1E293B' : '#ffffff',
          borderTopColor: 'teal',
        },
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: theme === 'dark' ? '#9ca3af' : 'gray',
        headerStyle: {
          backgroundColor: theme === 'dark' ? '#1E293B' : '#ffffff',
        },
        headerTitleStyle: {
          color: theme === 'dark' ? '#ffffff' : '#333',
        },
        headerLeft: () => (
          <Pressable onPress={() => navigation.goBack()} style={{ paddingLeft: 10 }}>
            <Ionicons name="arrow-back" size={24} color={theme === 'dark' ? '#ffffff' : '#333'} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="timecard"
        options={{
          headerShown: true,
          title: 'Time Card',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="calendar-days" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="punch"
        options={{
          headerShown: true,
          title: 'Punch',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          headerShown: true,
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
