import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useThemeStore from '../../../../store/themeStore';
import useTimeLogsStore from '../../../../store/timeLogsStore';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker from '@react-native-community/datetimepicker';

const ManageTimeLogs = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { timeLogs, loading, error, fetchTimeLogs } = useTimeLogsStore();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Sorting
  const [sortOrder, setSortOrder] = useState('desc'); // or 'asc'

  // Date Picker State
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'

  // Auth Token
  const [token, setToken] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (!storedToken) {
        router.replace('(auth)/signin');
      } else {
        setToken(storedToken);
        // Initial fetch with no date filters
        await fetchTimeLogs(storedToken, {});
      }
    };
    loadToken();
  }, []);

  // Filtering and Sorting
  const filteredLogs = timeLogs
    .filter((log) => {
      const userName = `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.toLowerCase();
      const matchSearch = !searchQuery || userName.includes(searchQuery.toLowerCase());

      let matchDates = true;
      if (startDate) {
        matchDates = matchDates && new Date(log.timeInDate) >= new Date(startDate);
      }
      if (endDate) {
        matchDates = matchDates && new Date(log.timeInDate) <= new Date(endDate);
      }

      return matchSearch && matchDates;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timeInDate);
      const dateB = new Date(b.timeInDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

  const handleSortChange = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const openDatePicker = (mode) => {
    setDatePickerMode(mode);
    setDatePickerVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      if (datePickerMode === 'start') {
        setStartDate(formattedDate);
      } else {
        setEndDate(formattedDate);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
  };

  const handleFetch = async () => {
    // Re-fetch with updated filters
    if (token) {
      await fetchTimeLogs(token, { startDate, endDate });
    }
  };

  useEffect(() => {
    if (token) {
      handleFetch();
    }
  }, [startDate, endDate]);

  const renderItem = ({ item }) => {
    const userName = `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || 'N/A';
    const date = item.timeInDate || 'N/A';
    const timeIn = item.timeInTime || 'N/A';
    const timeOut = item.timeOutTime || 'N/A';

    // Device info (Assume it's stored in JSON fields like { model: 'iPhone 12', platform: 'iOS' })
    const timeInDevice = item.timeInDevice?.model ? item.timeInDevice.model : 'N/A';
    const timeOutDevice = item.timeOutDevice?.model ? item.timeOutDevice.model : 'N/A';

    // Location info (lat/long)
    const timeInLocation = (item.timeInLat && item.timeInLong) ? `${item.timeInLat}, ${item.timeInLong}` : 'N/A';
    const timeOutLocation = (item.timeOutLat && item.timeOutLong) ? `${item.timeOutLat}, ${item.timeOutLong}` : 'N/A';

    return (
      <View
        className={`flex-row py-2 border-b ${isLightTheme ? 'border-gray-300' : 'border-gray-600'}`}
      >
        <View style={{ width: 120 }}>
          <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-xs`}>
            {userName}
          </Text>
        </View>
        <View style={{ width: 100 }}>
          <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-xs`}>
            {date}
          </Text>
        </View>
        <View style={{ width: 80 }}>
          <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-xs`}>
            {timeIn}
          </Text>
        </View>
        <View style={{ width: 80 }}>
          <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-xs`}>
            {timeOut}
          </Text>
        </View>
        <View style={{ width: 120 }}>
          <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-xs`}>
            {timeInDevice}
          </Text>
        </View>
        <View style={{ width: 120 }}>
          <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-xs`}>
            {timeOutDevice}
          </Text>
        </View>
        <View style={{ width: 150 }}>
          <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-xs`}>
            {timeInLocation}
          </Text>
        </View>
        <View style={{ width: 150 }}>
          <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-xs`}>
            {timeOutLocation}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          Manage TimeLogs
        </Text>
      </View>

      {/* Filters */}
      <View className="px-4 pb-4">
        <Text className={`text-xl font-bold mb-2 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          Time Logs
        </Text>
        <View className="flex-row items-center mb-2">
          <View className="flex-1 mr-2">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by user name..."
              placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
              className={`w-full px-3 py-2 rounded-lg ${isLightTheme ? 'bg-slate-100 text-gray-800' : 'bg-slate-700 text-gray-200'}`}
            />
          </View>
          <Pressable
            onPress={clearFilters}
            className={`p-2 rounded-full ${isLightTheme ? 'bg-slate-300' : 'bg-slate-600'}`}
          >
            <Ionicons name="close" size={20} color={isLightTheme ? '#1f2937' : '#fff'} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between mb-2">
          <Pressable
            onPress={() => openDatePicker('start')}
            className={`flex-1 mr-2 py-2 px-3 rounded-lg ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'}`}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-sm`}>
              Start Date: {startDate || 'None'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => openDatePicker('end')}
            className={`flex-1 ml-2 py-2 px-3 rounded-lg ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'}`}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} text-sm`}>
              End Date: {endDate || 'None'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Sorting and Table Header */}
      <ScrollView horizontal className="px-4" showsHorizontalScrollIndicator={false}>
        <View
          className={`flex-row py-2 border-b ${isLightTheme ? 'border-gray-300' : 'border-gray-700'} ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}
        >
          <View style={{ width: 120 }}>
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} font-semibold text-xs`}>
              User
            </Text>
          </View>
          <Pressable
            onPress={handleSortChange}
            style={{ width: 100, flexDirection: 'row', alignItems: 'center' }}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} font-semibold text-xs mr-1`}>
              Date
            </Text>
            <Ionicons
              name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
              size={14}
              color={isLightTheme ? '#4b5563' : '#d1d5db'}
            />
          </Pressable>
          <View style={{ width: 80 }}>
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} font-semibold text-xs`}>
              Time In
            </Text>
          </View>
          <View style={{ width: 80 }}>
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} font-semibold text-xs`}>
              Time Out
            </Text>
          </View>
          <View style={{ width: 120 }}>
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} font-semibold text-xs`}>
              Time In Device
            </Text>
          </View>
          <View style={{ width: 120 }}>
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} font-semibold text-xs`}>
              Time Out Device
            </Text>
          </View>
          <View style={{ width: 150 }}>
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} font-semibold text-xs`}>
              Time In Location
            </Text>
          </View>
          <View style={{ width: 150 }}>
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} font-semibold text-xs`}>
              Time Out Location
            </Text>
          </View>
        </View>
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color="#475569" style={{ marginTop: 48 }} />
      ) : (
        <ScrollView className="px-4" horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flex: 1 }}>
            <FlatList
              data={filteredLogs}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <Text className={`text-center mt-12 text-lg ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                  No time logs found.
                </Text>
              }
            />
          </View>
        </ScrollView>
      )}

      {/* Date Picker Modal */}
      {datePickerVisible && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </SafeAreaView>
  );
};

export default ManageTimeLogs;
