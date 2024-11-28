import React from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome, FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons';
import useThemeStore from '../../store/themeStore';

const TabsLayout = () => {
  const { theme } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme === 'dark' ? '#1E293B' : '#ffffff', // Dark: slate-800, Light: white
          borderTopColor: 'teal',
        },
        tabBarActiveTintColor: '#0F766E',
        tabBarInactiveTintColor: theme === 'dark' ? '#9ca3af' : 'gray',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaves"
        options={{
          title: 'Leaves',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome6 name="stopwatch" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="payments" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(shifts)"
        options={{
          title: 'Shifts',
          headerShown: false,
          tabBarStyle: { display: 'none' }, 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="user" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
