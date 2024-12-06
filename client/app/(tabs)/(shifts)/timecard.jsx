// File: app/(tabs)/(shifts)/TimeCard.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import useThemeStore from '../../../store/themeStore';
import useUserStore from '../../../store/userStore';
import axios from 'axios';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform as RNPlatform } from 'react-native';

const TimeCard = () => {
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  const insets = useSafeAreaInsets();

  // State Variables
  const [shiftLogs, setShiftLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [logsWithDuration, setLogsWithDuration] = useState([]);

  // Range Selection States
  const [rangeType, setRangeType] = useState('Monthly'); // Options: Monthly, Bi-Monthly, Weekly, Custom
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());

  // Picker States
  const [currentPicker, setCurrentPicker] = useState(null); // 'startDate' or 'endDate'

  // Temporary States for iOS
  const [tempStartDate, setTempStartDate] = useState(customStartDate);
  const [tempEndDate, setTempEndDate] = useState(customEndDate);

  // Format Date with Day
  const formatDateWithDay = (dateString) => {
    const date = new Date(dateString);
    const options = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  // Combine Date and Time (if needed for shift logs)
  const combineDateTime = (date, time) => {
    const dateTimeString = `${date}T${time}`;
    const dateObj = new Date(dateTimeString);
    return !isNaN(dateObj) ? dateObj : null;
  };

  // Fetch time logs whenever the selected range or dates change
  useEffect(() => {
    fetchTimeLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeType, selectedDate, customStartDate, customEndDate]);

  // Calculate total duration and format logs
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
            duration: `${Math.floor(diffMs / 3600000)}h ${Math.floor(
              (diffMs % 3600000) / 60000
            )}m`,
          };
        }
        return null;
      })
      .filter(Boolean);

    setLogsWithDuration(validLogs);
    setTotalDurationMs(totalDuration);
  }, [shiftLogs]);

  // Fetch time logs from the server based on selected range
  const fetchTimeLogs = async () => {
    setLoading(true);
    try {
      let startDate, endDate;

      switch (rangeType) {
        case 'Monthly':
          startDate = startOfMonth(selectedDate);
          endDate = endOfMonth(selectedDate);
          break;
        case 'Bi-Monthly':
          const dayOfMonth = selectedDate.getDate();
          if (dayOfMonth <= 15) {
            startDate = startOfMonth(selectedDate);
            endDate = new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              15
            );
          } else {
            startDate = new Date(
              selectedDate.getFullYear(),
              selectedDate.getMonth(),
              16
            );
            endDate = endOfMonth(selectedDate);
          }
          break;
        case 'Weekly':
          startDate = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
          endDate = endOfWeek(selectedDate, { weekStartsOn: 0 }); // Saturday
          break;
        case 'Custom':
          startDate = startOfDay(customStartDate);
          endDate = endOfDay(customEndDate);
          break;
        default:
          startDate = startOfMonth(selectedDate);
          endDate = endOfMonth(selectedDate);
      }

      const response = await axios.get(
        'http://192.168.100.8:5000/api/timelogs/range-logs', // Update API endpoint to handle range
        {
          params: {
            userId: user.id,
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
          },
        }
      );

      const sortedLogs = (response.data.data || []).sort(
        (a, b) => b.id - a.id
      );
      setShiftLogs(sortedLogs);
    } catch (error) {
      console.error('Error fetching time logs:', error);
      Alert.alert('Error', 'Failed to fetch time logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format total duration into hours and minutes
  const formatTotalDuration = (durationMs) => {
    const hrs = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Get the formatted date range with abbreviated months
  const getDateRange = () => {
    let startDate, endDate;

    switch (rangeType) {
      case 'Monthly':
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
      case 'Bi-Monthly':
        const dayOfMonth = selectedDate.getDate();
        if (dayOfMonth <= 15) {
          startDate = startOfMonth(selectedDate);
          endDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            15
          );
        } else {
          startDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            16
          );
          endDate = endOfMonth(selectedDate);
        }
        break;
      case 'Weekly':
        startDate = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
        endDate = endOfWeek(selectedDate, { weekStartsOn: 0 }); // Saturday
        break;
      case 'Custom':
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
        break;
      default:
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
    }

    // Use 'MMM' for abbreviated month names
    return `${format(startDate, 'MMM d, yyyy')} - ${format(
      endDate,
      'MMM d, yyyy'
    )}`;
  };

  // Handle Navigation for Predefined Ranges
  const handlePrev = () => {
    switch (rangeType) {
      case 'Monthly':
        setSelectedDate(subMonths(selectedDate, 1));
        break;
      case 'Bi-Monthly':
        const day = selectedDate.getDate();
        if (day <= 15) {
          // Move to the second half of the previous month
          const previousMonthDate = subMonths(selectedDate, 1);
          setSelectedDate(new Date(previousMonthDate.getFullYear(), previousMonthDate.getMonth(), 16));
        } else {
          // Move to the first half of the current month
          setSelectedDate(startOfMonth(selectedDate));
        }
        break;
      case 'Weekly':
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      default:
        break;
    }
  };

  const handleNext = () => {
    switch (rangeType) {
      case 'Monthly':
        setSelectedDate(addMonths(selectedDate, 1));
        break;
      case 'Bi-Monthly':
        const day = selectedDate.getDate();
        if (day <= 15) {
          // Move to the second half of the current month
          setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 16));
        } else {
          // Move to the first half of the next month
          const nextMonthDate = addMonths(selectedDate, 1);
          setSelectedDate(startOfMonth(nextMonthDate));
        }
        break;
      case 'Weekly':
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      default:
        break;
    }
  };

  // Open Picker Handler
  const openPicker = (pickerType) => {
    setCurrentPicker(pickerType);
    if (RNPlatform.OS === 'android') {
      // For Android, DateTimePicker will be rendered directly
    } else {
      // For iOS, initialize temporary dates
      if (pickerType === 'startDate') {
        setTempStartDate(customStartDate);
      } else if (pickerType === 'endDate') {
        setTempEndDate(customEndDate);
      }
    }
  };

  // Render DateTimePicker Modal for iOS
  const renderIOSPickerModal = () => {
    if (!currentPicker || RNPlatform.OS !== 'ios') return null;

    return (
      <Modal
        visible={!!currentPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCurrentPicker(null)}
      >
        <TouchableWithoutFeedback onPress={() => setCurrentPicker(null)}>
          <View className="flex-1 justify-center items-center bg-slate-950/80 ">
            <TouchableWithoutFeedback>
              <View
                className={`w-11/12 p-4 rounded-lg ${
                  isLightTheme ? 'bg-white' : 'bg-gray-800'
                }`}
              >
                <DateTimePicker
                  value={
                    currentPicker === 'startDate'
                      ? tempStartDate
                      : tempEndDate
                  }
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (event.type === 'set') {
                      if (currentPicker === 'startDate') {
                        const newStartDate =
                          selectedDate || tempStartDate;
                        if (newStartDate > customEndDate) {
                          Alert.alert('Invalid Date', 'Start Date cannot be after End Date.');
                          setTempEndDate(newStartDate);
                        }
                        setTempStartDate(newStartDate);
                      } else if (currentPicker === 'endDate') {
                        const newEndDate = selectedDate || tempEndDate;
                        if (newEndDate < customStartDate) {
                          Alert.alert('Invalid Date', 'End Date cannot be before Start Date.');
                          setTempStartDate(newEndDate);
                        }
                        setTempEndDate(newEndDate);
                      }
                    }
                  }}
                  textColor={isLightTheme ? '#000' : '#fff'}
                  className="w-full"
                />
                <View className="flex-row justify-end mt-4">
                  <Pressable
                    onPress={() => setCurrentPicker(null)}
                    className={`px-4 py-2 rounded ${
                      isLightTheme
                        ? 'bg-gray-200'
                        : 'bg-gray-700'
                    } mr-2`}
                  >
                    <Text
                      className={`text-sm ${
                        isLightTheme ? 'text-gray-800' : 'text-gray-100'
                      }`}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      // Save the temporary dates to actual state
                      if (currentPicker === 'startDate') {
                        setCustomStartDate(tempStartDate);
                        // Adjust end date if needed
                        if (tempStartDate > customEndDate) {
                          setCustomEndDate(tempStartDate);
                        }
                      } else if (currentPicker === 'endDate') {
                        setCustomEndDate(tempEndDate);
                        // Adjust start date if needed
                        if (tempEndDate < customStartDate) {
                          setCustomStartDate(tempEndDate);
                        }
                      }
                      setCurrentPicker(null);
                    }}
                    className={`px-4 py-2 rounded ${
                      isLightTheme
                        ? 'bg-gray-200'
                        : 'bg-gray-700'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isLightTheme ? 'text-gray-800' : 'text-gray-100'
                      }`}
                    >
                      Confirm
                    </Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  // Render DateTimePicker for Android
  const renderAndroidPicker = () => {
    if (!currentPicker || RNPlatform.OS !== 'android') return null;

    return (
      <DateTimePicker
        value={
          currentPicker === 'startDate' ? customStartDate : customEndDate
        }
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          if (event.type === 'set') {
            if (currentPicker === 'startDate') {
              if (selectedDate > customEndDate) {
                Alert.alert('Invalid Date', 'Start Date cannot be after End Date.');
                setCustomEndDate(selectedDate);
              }
              setCustomStartDate(selectedDate || customStartDate);
            } else if (currentPicker === 'endDate') {
              if (selectedDate < customStartDate) {
                Alert.alert('Invalid Date', 'End Date cannot be before Start Date.');
                setCustomStartDate(selectedDate);
              }
              setCustomEndDate(selectedDate || customEndDate);
            }
          }
          setCurrentPicker(null); // Close the picker
        }}
        textColor={isLightTheme ? '#000' : '#fff'}
      />
    );
  };

  return (
    <View
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}
      style={{ paddingTop: insets.top + 60 }} // Adjust paddingTop to account for the tab bar height
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16, // Apply horizontal padding inside ScrollView
          paddingBottom: 16,
          paddingTop: 10,
        }}
      >
        {/* Total Hours */}
        <View
          className={`p-4 rounded-lg mb-6 ${
            isLightTheme ? 'bg-orange-600' : 'bg-orange-500'
          }`}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-lg text-white font-semibold">
              Total Hours
            </Text>
            <Text className="text-xl text-white font-bold">
              {formatTotalDuration(totalDurationMs)}
            </Text>
          </View>
        </View>

        {/* Range Selection */}
        <View className="mb-6">
          <Text
            className={`text-md mb-2 ${
              isLightTheme ? 'text-gray-800' : 'text-gray-100'
            }`}
          >
            Select Range:
          </Text>
          <View
            className={`rounded-lg ${
              isLightTheme ? 'bg-gray-200' : 'bg-gray-700'
            }`}
          >
            <Picker
              selectedValue={rangeType}
              onValueChange={(itemValue) => setRangeType(itemValue)}
              dropdownIconColor={isLightTheme ? '#1E293B' : '#F1F5F9'}
              style={{
                height: 50,
                color: isLightTheme ? '#1E293B' : '#F1F5F9',
              }}
              itemStyle={{
                height: 50,
                color: isLightTheme ? '#1E293B' : '#F1F5F9',
              }}
            >
              <Picker.Item label="Monthly" value="Monthly" />
              <Picker.Item label="Bi-Monthly" value="Bi-Monthly" />
              <Picker.Item label="Weekly" value="Weekly" />
              <Picker.Item label="Custom Range" value="Custom" />
            </Picker>
          </View>

          {/* Custom Date Pickers */}
          {rangeType === 'Custom' && (
            <View className="mt-4 space-y-4">
              {/* Start Date */}
              <Pressable
                onPress={() => openPicker('startDate')}
                className={`p-4 rounded-lg my-1 ${
                  isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
                }`}
              >
                <Text
                  className={`text-center ${
                    isLightTheme ? 'text-gray-800' : 'text-gray-100'
                  }`}
                >
                  Start Date: {format(customStartDate, 'MMMM d, yyyy')}
                </Text>
              </Pressable>

              {/* End Date */}
              <Pressable
                onPress={() => openPicker('endDate')}
                className={`p-4 rounded-lg my-1 ${
                  isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
                }`}
              >
                <Text
                  className={`text-center ${
                    isLightTheme ? 'text-gray-800' : 'text-gray-100'
                  }`}
                >
                  End Date: {format(customEndDate, 'MMMM d, yyyy')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Date Range Navigation (for predefined ranges) */}
        {rangeType !== 'Custom' && (
          <View className="flex-row justify-between items-center mb-6">
            {/* Previous Button */}
            <Pressable
              onPress={handlePrev}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <FontAwesome5
                name="arrow-left"
                size={20}
                color={isLightTheme ? '#1E293B' : '#F1F5F9'}
              />
            </Pressable>

            {/* Date Range Text */}
            <Text
              className={`text-lg font-medium ${
                isLightTheme ? 'text-gray-800' : 'text-gray-100'
              }`}
            >
              {getDateRange()}
            </Text>

            {/* Next Button */}
            <Pressable
              onPress={handleNext}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <FontAwesome5
                name="arrow-right"
                size={20}
                color={isLightTheme ? '#1E293B' : '#F1F5F9'}
              />
            </Pressable>
          </View>
        )}

        {/* Display Custom Range if selected */}
        {rangeType === 'Custom' && (
          <View className="mb-6">
            <Text
              className={`text-lg font-medium ${
                isLightTheme ? 'text-gray-800' : 'text-gray-100'
              }`}
            >
              {getDateRange()}
            </Text>
          </View>
        )}

        {/* Time Logs */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={isLightTheme ? '#F97316' : '#fb923c'}
            className="mt-8"
          />
        ) : logsWithDuration.length > 0 ? (
          logsWithDuration.map((log, index) => (
            <View
              key={index}
              className={`p-4 rounded-lg mb-4 ${
                isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
              } shadow-md`}
            >
              <Text
                className={`text-lg font-bold mb-2 ${
                  isLightTheme ? 'text-gray-800' : 'text-gray-200'
                }`}
              >
                {formatDateWithDay(log.date)}
              </Text>
              <Text
                className={`text-md ${
                  isLightTheme ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {log.timeIn} - {log.timeOut}
              </Text>
              <Text
                className={`text-right text-base mt-2 ${
                  isLightTheme ? 'text-orange-700' : 'text-slate-400'
                }`}
              >
                {log.duration}
              </Text>
            </View>
          ))
        ) : (
          <Text
            className={`text-center mt-8 ${
              isLightTheme ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            No logs available for this range.
          </Text>
        )}
      </ScrollView>

      {/* Render iOS Picker Modal */}
      {renderIOSPickerModal()}

      {/* Render Android Picker */}
      {renderAndroidPicker()}
    </View>
  );
};

export default TimeCard;
