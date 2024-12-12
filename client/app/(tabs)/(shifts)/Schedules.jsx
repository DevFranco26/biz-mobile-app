// File: app/(tabs)/(shifts)/Schedule.jsx

import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';
import useUserStore from '../../../store/userStore';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment'; // Install moment for date manipulation
import 'moment/locale/en-ca'; // Ensure correct locale

// Install moment if not already installed
// npm install moment

const Schedule = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const insets = useSafeAreaInsets();
  const { user } = useUserStore(); // Assuming user data is available

  // State to toggle between week and month views
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'

  // Static shift data
  const staticShifts = [
    {
      id: '1',
      title: 'Morning Shift',
      date: '2024-12-15',
      startTime: '08:00 AM',
      endTime: '04:00 PM',
      location: 'Office A',
    },
    {
      id: '2',
      title: 'Evening Shift',
      date: '2024-12-16',
      startTime: '04:00 PM',
      endTime: '12:00 AM',
      location: 'Office B',
    },
    {
      id: '3',
      title: 'Night Shift',
      date: '2024-12-17',
      startTime: '12:00 AM',
      endTime: '08:00 AM',
      location: 'Office C',
    },
    // Add more static shifts as needed
  ];

  // Function to filter shifts based on current view
  const getFilteredShifts = () => {
    const today = moment();
    if (viewMode === 'week') {
      const startOfWeek = moment().startOf('isoWeek');
      const endOfWeek = moment().endOf('isoWeek');
      return staticShifts.filter(shift => {
        const shiftDate = moment(shift.date, 'YYYY-MM-DD');
        return shiftDate.isBetween(startOfWeek, endOfWeek, null, '[]');
      });
    } else if (viewMode === 'month') {
      const startOfMonth = moment().startOf('month');
      const endOfMonth = moment().endOf('month');
      return staticShifts.filter(shift => {
        const shiftDate = moment(shift.date, 'YYYY-MM-DD');
        return shiftDate.isBetween(startOfMonth, endOfMonth, null, '[]');
      });
    }
    return staticShifts;
  };

  const filteredShifts = getFilteredShifts();

  // Render each shift item
  const renderShiftItem = ({ item }) => (
    <View
      className={`p-4 rounded-lg mb-3 ${
        isLightTheme ? 'bg-white shadow' : 'bg-gray-800 shadow-lg'
      }`}
    >
      <Text className={`text-lg font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
        {item.title}
      </Text>
      <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
        Date: {moment(item.date).format('MMMM Do, YYYY')}
      </Text>
      <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
        Time: {item.startTime} - {item.endTime}
      </Text>
      <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
        Location: {item.location}
      </Text>
    </View>
  );

  return (
    <View
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}
      style={{ paddingTop: insets.top + 60, paddingHorizontal: 16 }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-2xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          My Schedule
        </Text>
        {/* Toggle Buttons */}
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setViewMode('week')}
            className={`px-4 py-2 rounded-l-lg ${
              viewMode === 'week'
                ? isLightTheme
                  ? 'bg-blue-500'
                  : 'bg-blue-600'
                : isLightTheme
                ? 'bg-gray-200'
                : 'bg-gray-700'
            }`}
          >
            <Text
              className={`font-semibold ${
                viewMode === 'week'
                  ? 'text-white'
                  : isLightTheme
                  ? 'text-gray-800'
                  : 'text-white'
              }`}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('month')}
            className={`px-4 py-2 rounded-r-lg ${
              viewMode === 'month'
                ? isLightTheme
                  ? 'bg-blue-500'
                  : 'bg-blue-600'
                : isLightTheme
                ? 'bg-gray-200'
                : 'bg-gray-700'
            }`}
          >
            <Text
              className={`font-semibold ${
                viewMode === 'month'
                  ? 'text-white'
                  : isLightTheme
                  ? 'text-gray-800'
                  : 'text-white'
              }`}
            >
              Month
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Shift List */}
      <FlatList
        data={filteredShifts}
        keyExtractor={(item) => item.id}
        renderItem={renderShiftItem}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center mt-20">
            <Ionicons
              name="calendar-outline"
              size={60}
              color={isLightTheme ? '#4B5563' : '#D1D5DB'}
              className="mb-4"
            />
            <Text className={`text-lg ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
              No shifts scheduled for this {viewMode}.
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Placeholder for Future Backend Integration */}
      {/* 
        TODO: 
        - Fetch shifts from backend using API.
        - Replace staticShifts with dynamic data.
        - Implement pull-to-refresh to update shifts.
        - Add shift creation and assignment features for admins.
      */}
    </View>
  );
};

export default Schedule;
