// File: app/(tabs)/(settings)/admin.jsx

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const Admin = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  // Navigate to different features
  const navigateToFeature = (feature) => {
    router.push(feature);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}
      edges={['top']}
    >
      {/* Custom Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          Admin Dashboard
        </Text>
      </View>

      {/* Feature Categories */}
      <View className="flex-1 px-4 py-6">
        {/* Shifts Feature */}
        <Pressable
          onPress={() => navigateToFeature('shifts-dashboard')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
        >
          <Ionicons
            name="time-outline"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
              Manage Shifts
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              Create locations, restrict users, and track time-in/out.
            </Text>
          </View>
        </Pressable>

        {/* Leaves Feature */}
        <Pressable
          onPress={() => navigateToFeature('leaves-dashboard')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
        >
          <MaterialIcons
            name="event-note"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
              Manage Leaves
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              Approve leave requests and assign approvers.
            </Text>
          </View>
        </Pressable>

        {/* Payroll Feature */}
        <Pressable
          onPress={() => navigateToFeature('payroll-dashboard')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
        >
          <Ionicons
            name="cash-outline"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
              Manage Payroll
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              Configure rates and generate salary reports.
            </Text>
          </View>
        </Pressable>

        {/* Manage Users */}
        <Pressable
          onPress={() => navigateToFeature('ManageUsers')}
          className={`p-4 mb-4 rounded-lg flex-row items-center ${
            isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
          }`}
        >
          <Ionicons
            name="people-outline"
            size={28}
            color={isLightTheme ? '#c2410c' : '#f97316'}
            style={{ marginRight: 12 }}
          />
          <View>
            <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
              Manage Users
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              View, edit, and track real-time punch-in status.
            </Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Admin;
