// File: app/(tabs)/(settings)/Supervisor.jsx

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const Supervisor = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const headerBg = isLightTheme ? 'bg-slate-100' : 'bg-slate-800';
  const headerTextColor = isLightTheme ? 'text-slate-800' : 'text-white';
  const cardBg = isLightTheme ? 'bg-slate-100' : 'bg-slate-800';
  const accentColor = isLightTheme ? '#a21caf' : '#c026d3'; // Different accent color for supervisor

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
            name="briefcase-outline"
            size={32}
            color={accentColor}
            style={{ marginRight: 10 }}
          />
          <Text className={`text-2xl font-bold ${headerTextColor}`}>
            Supervisor Dashboard
          </Text>
        </View>
        <Text className={`text-sm ${headerTextColor}`}>
          Oversee team operations, review schedules, and approve leave requests.
        </Text>
      </View>

      {/* Feature Categories - Scrollable */}
      <ScrollView
        className="flex-1 px-4 pb-6"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="space-y-5">
          {/* Approve Leaves */}
          <Pressable
            onPress={() => navigateToFeature('./ApproveLeaves')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="Approve Leaves"
            accessibilityHint="Navigate to Approve Leaves screen"
          >
            <MaterialIcons
              name="event-available"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                Approve Leaves
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Review and approve pending leave requests.
              </Text>
            </View>
          </Pressable>

          {/* View Team Schedules */}
          <Pressable
            onPress={() => navigateToFeature('./TeamSchedules')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="View Team Schedules"
            accessibilityHint="Navigate to View Team Schedules screen"
          >
            <Ionicons
              name="calendar-outline"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                View Team Schedules
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Check and adjust team shift schedules.
              </Text>
            </View>
          </Pressable>

          {/* Monitor Attendance */}
          <Pressable
            onPress={() => navigateToFeature('./MonitorAttendance')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="Monitor Attendance"
            accessibilityHint="Navigate to Monitor Attendance screen"
          >
            <Entypo
              name="eye"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                Monitor Attendance
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Track your team's attendance and punch-ins.
              </Text>
            </View>
          </Pressable>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Supervisor;
