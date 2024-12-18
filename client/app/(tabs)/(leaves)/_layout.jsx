// File: app/(tabs)/(leaves)/_layout.jsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const LeavesTabsLayout = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  // Helper function to generate tab icons
  const getTabBarIcon = (iconName, IconComponent = Ionicons, size = 24, accessibilityLabel = '') => ({ color }) => (
    <IconComponent
      name={iconName}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
    />
  );

  return (
    <Tabs
      initialRouteName="SubmitLeaves"
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
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
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
        tabBarLabelPosition: 'below-icon', // Ensures labels are below icons
      }}
    >
      {/* Submit Leaves */}
      <Tabs.Screen
        name="SubmitLeaves"
        options={{
          tabBarLabel: 'Submit',
          tabBarIcon: getTabBarIcon('document-text-outline', Ionicons, 24, 'Submit Leaves Tab Icon'),
        }}
      />
      
      {/* Approval Leaves Screen */}
      <Tabs.Screen
        name="ApprovalLeaves"
        options={{
          tabBarLabel: 'Approval',
          tabBarIcon: getTabBarIcon('check-circle', FontAwesome5, 24, 'Approval Leaves Tab Icon'),
        }}
      />
    </Tabs>
  );
};

export default LeavesTabsLayout;
