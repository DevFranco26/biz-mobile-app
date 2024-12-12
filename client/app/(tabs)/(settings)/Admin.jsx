// File: app/(tabs)/(settings)/admin.jsx

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const Admin = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  // Determine colors based on theme
  const headerBg = isLightTheme ? 'bg-slate-100' : 'bg-slate-800';
  const headerTextColor = isLightTheme ? 'text-slate-800' : 'text-white';
  const cardBg = isLightTheme ? 'bg-slate-100' : 'bg-slate-800';
  const accentColor = isLightTheme ? '#c2410c' : '#f97316';

  // Function to navigate to different features
  const navigateToFeature = (featurePath) => {
    router.push(featurePath);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}
      edges={['top']}
    >
      {/* Header Section */}
      <View
        className={`rounded-xl py-6 px-4 my-4 mx-4 ${headerBg}`}
      >
        <View className="flex-row items-center mb-3">
          <Ionicons
            name="construct-outline"
            size={32}
            color={accentColor}
            style={{ marginRight: 10 }}
          />
          <Text className={`text-2xl font-bold ${headerTextColor}`}>
            Admin Dashboard
          </Text>
        </View>
        <Text className={`text-sm ${headerTextColor}`}>
          Manage everything from locations to subscriptions in one place.
        </Text>
      </View>

      {/* Feature Categories - Scrollable */}
      <ScrollView
        className="flex-1 px-4 pb-6"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="space-y-5">
          
          {/* Manage Locations */}
          <Pressable
            onPress={() => navigateToFeature('./ManageLocations')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="Manage Locations"
            accessibilityHint="Navigate to Manage Locations screen"
          >
            <Ionicons
              name="time-outline"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                Manage Locations
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Create, update, and delete locations.
              </Text>
            </View>
          </Pressable>

          {/* Manage Leaves */}
          <Pressable
            onPress={() => navigateToFeature('./ManageLeaves')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="Manage Leaves"
            accessibilityHint="Navigate to Manage Leaves screen"
          >
            <MaterialIcons
              name="event-note"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                Manage Leaves
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Approve leave requests and assign approvers.
              </Text>
            </View>
          </Pressable>

           {/* Manage Schedules */}
           <Pressable
            onPress={() => navigateToFeature('./ManageSchedules')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="Manage Leaves"
            accessibilityHint="Navigate to Manage Leaves screen"
          >
            <MaterialIcons
              name="event-note"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                Manage Leaves
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Approve leave requests and assign approvers.
              </Text>
            </View>
          </Pressable>

          {/* Manage Payroll */}
          <Pressable
            onPress={() => navigateToFeature('./ManagePayroll')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="Manage Payroll"
            accessibilityHint="Navigate to Manage Payroll screen"
          >
            <Ionicons
              name="cash-outline"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                Manage Payroll
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Configure rates and generate salary reports.
              </Text>
            </View>
          </Pressable>

          {/* Manage Users */}
          <Pressable
            onPress={() => navigateToFeature('./ManageUsers')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="Manage Users"
            accessibilityHint="Navigate to Manage Users screen"
          >
            <Ionicons
              name="people-outline"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                Manage Users
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                View, edit, and track real-time punch-in status.
              </Text>
            </View>
          </Pressable>

          {/* Manage Subscription */}
          <Pressable
            onPress={() => navigateToFeature('./ManageSubscription')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="Manage Subscription"
            accessibilityHint="Navigate to Manage Subscription screen"
          >
            <Entypo
              name="newsletter"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                Manage Subscription
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                View and manage user subscriptions.
              </Text>
            </View>
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Admin;
