// File: app/(tabs)/(settings)/admin.jsx

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons'; // Added Entypo for subscription icon
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const Admin = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  // Function to navigate to different features
  const navigateToFeature = (featurePath) => {
    router.push(featurePath);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}
      edges={['top']}
    >
      {/* Custom Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-2"
          accessibilityLabel="Go back"
          accessibilityHint="Navigates to the previous screen"
        >
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text
          className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}
        >
          Admin Dashboard
        </Text>
      </View>

      {/* Feature Categories */}
      <View className="flex-1 px-4 py-6">
        {/* Manage Locations */}
        <Pressable
          onPress={() => navigateToFeature('./ManageLocations')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
          accessibilityLabel="Manage Locations"
          accessibilityHint="Navigate to Manage Locations screen"
        >
          <Ionicons
            name="time-outline"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text
              className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}
            >
              Manage Locations
            </Text>
            <Text
              className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}
            >
              Create , update, and delete locations.
            </Text>
          </View>
        </Pressable>

        {/* Manage Leaves */}
        <Pressable
          onPress={() => navigateToFeature('./ManageLeaves')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
          accessibilityLabel="Manage Leaves"
          accessibilityHint="Navigate to Manage Leaves screen"
        >
          <MaterialIcons
            name="event-note"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text
              className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}
            >
              Manage Leaves
            </Text>
            <Text
              className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}
            >
              Approve leave requests and assign approvers.
            </Text>
          </View>
        </Pressable>

        {/* Manage Payroll */}
        <Pressable
          onPress={() => navigateToFeature('./ManagePayroll')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
          accessibilityLabel="Manage Payroll"
          accessibilityHint="Navigate to Manage Payroll screen"
        >
          <Ionicons
            name="cash-outline"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text
              className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}
            >
              Manage Payroll
            </Text>
            <Text
              className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}
            >
              Configure rates and generate salary reports.
            </Text>
          </View>
        </Pressable>

        {/* Manage Users */}
        <Pressable
          onPress={() => navigateToFeature('./ManageUsers')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
          accessibilityLabel="Manage Users"
          accessibilityHint="Navigate to Manage Users screen"
        >
          <Ionicons
            name="people-outline"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text
              className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}
            >
              Manage Users
            </Text>
            <Text
              className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}
            >
              View, edit, and track real-time punch-in status.
            </Text>
          </View>
        </Pressable>

        {/* Manage Subscription */}
        <Pressable
          onPress={() => navigateToFeature('./ManageSubscription')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
          accessibilityLabel="Manage Subscription"
          accessibilityHint="Navigate to Manage Subscription screen"
        >
          <Entypo
            name="newsletter"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text
              className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}
            >
              Manage Subscription
            </Text>
            <Text
              className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}
            >
              View and manage user subscriptions.
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Admin;
