import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';
import useUserStore from '../../../store/userStore';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { FontAwesome } from '@expo/vector-icons';
import { FontAwesome5, AntDesign } from '@expo/vector-icons';

const TimeCard = () => {
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const [shiftLogs, setShiftLogs] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [logsWithDuration, setLogsWithDuration] = useState([]);

  // Helper function to format the date and include the day name
  const formatDateWithDay = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  // Combine date and time to create a Date object
  const combineDateTime = (date, time) => {
    const dateTimeString = `${date}T${time}`;
    const dateObj = new Date(dateTimeString);
    return !isNaN(dateObj) ? dateObj : null;
  };

  // Reload data whenever the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchTimeLogs(selectedMonth);
    }, [selectedMonth])
  );

  // Calculate durations for each shift log
  useEffect(() => {
    let totalDuration = 0;
    const validLogs = shiftLogs
      .map((log) => {
        const timeIn = combineDateTime(log.timeInDate, log.timeInTime);
        const timeOut = combineDateTime(log.timeOutDate, log.timeOutTime);
        if (timeIn && timeOut && timeOut > timeIn) {
          const diffMs = timeOut - timeIn;
          totalDuration += diffMs;
          return {
            date: log.timeInDate,
            timeIn: log.timeInTime,
            timeOut: log.timeOutTime,
            duration: `${Math.floor(diffMs / 3600000)}h ${Math.floor((diffMs % 3600000) / 60000)}m`,
          };
        }
        return null;
      })
      .filter(Boolean);

    setLogsWithDuration(validLogs);
    setTotalDurationMs(totalDuration);
  }, [shiftLogs]);

  // Fetch time logs from the API
  const fetchTimeLogs = async (month) => {
    setLoading(true);
    try {
      const response = await axios.get('http://192.168.100.8:5000/api/timelogs/monthly-logs', {
        params: {
          userId: user.id,
          year: format(month, 'yyyy'),
          month: format(month, 'MM'),
        },
      });
      const sortedLogs = (response.data.data || []).sort((a, b) => b.id - a.id);
      setShiftLogs(sortedLogs);
    } catch (error) {
      console.error('Error fetching time logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format total duration in hours and minutes
  const formatTotalDuration = (durationMs) => {
    const hrs = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Get the range of the selected month (start - end)
  const getMonthRange = (month) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return `${format(start, 'MMMM d')}-${format(end, 'd, yyyy')}`;
  };

  return (
    <SafeAreaView className={`flex-1 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800'}`}>
      <ScrollView contentContainerStyle={{ paddingLeft:16, paddingRight:16 }}>
        <View className={`p-6 mb-6 ${theme === 'light' ? 'bg-teal-600' : 'bg-teal-700'} rounded-lg flex-1 flex-row justify-between items-center`}>
          <Text className={`text-lg font-medium ${theme === 'light' ? 'text-white' : 'text-gray-100'}`}>
            Time Card: 
          </Text>
          <Text className={`text-lg font-medium ${theme === 'light' ? 'text-white' : 'text-gray-100'}`}>
            {`${user.firstName} ${user.lastName}`}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-6">
          <Pressable
            onPress={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className={`py-3 px-5 rounded-full ${theme === 'light' ? 'bg-teal-600' : 'bg-teal-700'}`}
          >
            <FontAwesome name="arrow-left" size={15} color="white" />
          </Pressable>
          <Text className={`text-xl font-bold ${theme === 'light' ? 'text-teal-600' : 'text-white'}`}>
            {getMonthRange(selectedMonth)}
          </Text>
          <Pressable
            onPress={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className={`py-3 px-5 rounded-full ${theme === 'light' ? 'bg-teal-600' : 'bg-teal-700'}`}
          >
            <FontAwesome name="arrow-right" size={15} color="white" />
          </Pressable>
        </View>

        <View className={`p-4 rounded-lg mb-4 ${theme === 'light' ? 'bg-slate-50' : 'bg-teal-800'}`}>
          <View className="flex-row justify-between items-center">
            <Text className={`text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>Total Hours:</Text>
            <Text className={`text-xl font-medium ${theme === 'light' ? 'text-teal-700' : 'text-white'}`}>
              {formatTotalDuration(totalDurationMs)}
            </Text>
          </View>
        </View>

        {loading ? (
          <Text className={`text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</Text>
        ) : logsWithDuration.length > 0 ? (
          logsWithDuration.map((log, index) => (
           
              <View key={index} className="mb-4 bg-slate-700 px-3 py-2 rounded-lg gap-3">
                <Text className={`font-bold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} text-center`}>
                  {formatDateWithDay(log.date)}
                </Text>
                <View className="flex-1 flex-row justify-between">
                  <Text className={` ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                    {log.timeIn} - {log.timeOut} 
                  </Text>
                  <Text className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-200'} text-right font-extrabold`}>
                    {log.duration}
                  </Text>
                </View>
                <View className='flex-1 flex-row justify-end items-end gap-2'>
                  <FontAwesome5 
                    name="edit" 
                    size={15} 
                    color={theme === 'light' ? 'gray' : 'white'} 
                  />
                  <AntDesign 
                  name="delete" 
                  size={15} 
                  color={theme === 'light' ? 'gray' : 'white'} 
                />
                </View>
              </View>

          ))
        ) : (
          <Text className={`text-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            No logs available for this month.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TimeCard;
