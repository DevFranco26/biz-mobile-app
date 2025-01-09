// File: app/(tabs)/(shifts)/TimeCard.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  RefreshControl,
  ScrollView,
  Platform as RNPlatform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
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
import * as SecureStore from 'expo-secure-store';
import DropDownPicker from 'react-native-dropdown-picker';

const TimeCard = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const insets = useSafeAreaInsets();

  const [shiftLogs, setShiftLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [totalDurationMs, setTotalDurationMs] = useState(0);
  const [logsWithDuration, setLogsWithDuration] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [rangeType, setRangeType] = useState('Monthly');
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());

  const [currentPicker, setCurrentPicker] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(customStartDate);
  const [tempEndDate, setTempEndDate] = useState(customEndDate);

  const [openRangeType, setOpenRangeType] = useState(false);
  const [rangeTypeItems, setRangeTypeItems] = useState([
    { label: 'Monthly', value: 'Monthly' },
    { label: 'Bi-Monthly', value: 'Bi-Monthly' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Custom Range', value: 'Custom' },
  ]);

  const combineDateTime = (date, time) => {
    const dateTimeString = `${date}T${time}Z`;
    const dateObj = new Date(dateTimeString);
    return !isNaN(dateObj) ? dateObj : null;
  };

  const formatDateWithDay = (dateObj) => format(dateObj, 'EEEE, MMMM d, yyyy');
  const formatTime = (dateObj) => format(dateObj, 'p');

  useEffect(() => {
    fetchTimeLogs();
  }, [rangeType, selectedDate, customStartDate, customEndDate]);

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
            timeInObj: timeIn,
            timeOutObj: timeOut,
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

  const formatTotalDuration = (durationMs) => {
    const hrs = Math.floor(durationMs / 3600000);
    const mins = Math.floor((durationMs % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const getDateRangeBounds = () => {
    let startDate, endDate;
    switch (rangeType) {
      case 'Monthly':
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
      case 'Bi-Monthly':
        if (selectedDate.getDate() <= 15) {
          startDate = startOfMonth(selectedDate);
          endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 15);
        } else {
          startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 16);
          endDate = endOfMonth(selectedDate);
        }
        break;
      case 'Weekly':
        startDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
        endDate = endOfWeek(selectedDate, { weekStartsOn: 0 });
        break;
      case 'Custom':
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
        break;
      default:
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
    }
    return { startDate, endDate };
  };

  const getDateRange = () => {
    const { startDate, endDate } = getDateRangeBounds();
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  const fetchTimeLogs = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeBounds();
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert(
          'Authentication Error',
          'You are not logged in. Please sign in again.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get('http://192.168.100.8:5000/api/timelogs/range', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
        },
      });

      const sortedLogs = (response.data.data || []).sort((a, b) => b.id - a.id);
      setShiftLogs(sortedLogs);
    } catch (error) {
      console.error('Error fetching time logs:', error);
      if (error.response && error.response.status === 401) {
        Alert.alert(
          'Authentication Error',
          'Your session has expired. Please sign in again.',
          [{
            text: 'OK',
            onPress: async () => {
              await SecureStore.deleteItemAsync('token');
              useUserStore.getState().setUser(null);
            },
          }]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch time logs. Please try again later.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimeLogs();
  };

  const handlePrev = () => {
    switch (rangeType) {
      case 'Monthly':
        setSelectedDate(subMonths(selectedDate, 1));
        break;
      case 'Bi-Monthly': {
        const day = selectedDate.getDate();
        if (day <= 15) {
          const prevMonth = subMonths(selectedDate, 1);
          setSelectedDate(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 16));
        } else {
          setSelectedDate(startOfMonth(selectedDate));
        }
        break;
      }
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
      case 'Bi-Monthly': {
        const day = selectedDate.getDate();
        if (day <= 15) {
          setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 16));
        } else {
          const nextMonth = addMonths(selectedDate, 1);
          setSelectedDate(startOfMonth(nextMonth));
        }
        break;
      }
      case 'Weekly':
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      default:
        break;
    }
  };

  const renderIOSPickerModal = () => {
    if (!currentPicker || RNPlatform.OS !== 'ios') return null;
    return (
      <Modal
        visible={!!currentPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrentPicker(null)}
      >
        <TouchableWithoutFeedback onPress={() => setCurrentPicker(null)}>
          <View className="flex-1 justify-center items-center bg-black/60">
            <TouchableWithoutFeedback>
              <View
                className={`w-11/12 p-5 rounded-lg ${
                  isLightTheme ? 'bg-white' : 'bg-slate-800'
                }`}
              >
                <DateTimePicker
                  value={currentPicker === 'startDate' ? tempStartDate : tempEndDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, selectedDate) => {
                    if (event.type === 'set') {
                      if (currentPicker === 'startDate') {
                        const newStart = selectedDate || tempStartDate;
                        if (newStart > customEndDate) {
                          Alert.alert('Invalid Date', 'Start Date cannot be after End Date.');
                          setTempEndDate(newStart);
                        }
                        setTempStartDate(newStart);
                      } else {
                        const newEnd = selectedDate || tempEndDate;
                        if (newEnd < customStartDate) {
                          Alert.alert('Invalid Date', 'End Date cannot be before Start Date.');
                          setTempStartDate(newEnd);
                        }
                        setTempEndDate(newEnd);
                      }
                    }
                  }}
                  textColor={isLightTheme ? '#000' : '#FFF'}
                />
                <View className="flex-row justify-end mt-5">
                  <Pressable
                    onPress={() => setCurrentPicker(null)}
                    className={`px-4 py-3 mr-2 rounded ${
                      isLightTheme ? 'bg-slate-300' : 'bg-slate-600'
                    }`}
                  >
                    <Text className={`${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (currentPicker === 'startDate') {
                        setCustomStartDate(tempStartDate);
                        if (tempStartDate > customEndDate) {
                          setCustomEndDate(tempStartDate);
                        }
                      } else {
                        setCustomEndDate(tempEndDate);
                        if (tempEndDate < customStartDate) {
                          setCustomStartDate(tempEndDate);
                        }
                      }
                      setCurrentPicker(null);
                    }}
                    className="px-4 py-3 rounded bg-orange-500/90"
                  >
                    <Text className="text-white">Confirm</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderAndroidPicker = () => {
    if (!currentPicker || RNPlatform.OS !== 'android') return null;
    return (
      <DateTimePicker
        value={currentPicker === 'startDate' ? customStartDate : customEndDate}
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
            } else {
              if (selectedDate < customStartDate) {
                Alert.alert('Invalid Date', 'End Date cannot be before Start Date.');
                setCustomStartDate(selectedDate);
              }
              setCustomEndDate(selectedDate || customEndDate);
            }
          }
          setCurrentPicker(null);
        }}
        textColor={isLightTheme ? '#000' : '#FFF'}
      />
    );
  };

  const openPicker = (pickerType) => {
    setCurrentPicker(pickerType);
    if (RNPlatform.OS !== 'android') {
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isLightTheme ? '#FFFFFF' : '#0f172a',
        paddingTop: insets.top + 60,
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
        <Text
          className={`text-base mb-2 ${
            isLightTheme ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          Select Range:
        </Text>

        <View className="mb-4">
          <DropDownPicker
            open={openRangeType}
            value={rangeType}
            items={rangeTypeItems}
            setOpen={setOpenRangeType}
            setValue={setRangeType}
            setItems={setRangeTypeItems}
            placeholder="Select Range"
            style={{
              borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
              backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            }}
            dropDownContainerStyle={{
              borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
              backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            }}
            textStyle={{
              color: isLightTheme ? '#374151' : '#9CA3AF',
            }}
            placeholderStyle={{
              color: isLightTheme ? '#6B7280' : '#9CA3AF',
            }}
            arrowIconStyle={{
              tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
            }}
            tickIconStyle={{
              tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
            }}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

        {rangeType === 'Custom' && (
          <View className="mb-6">
            <Pressable
              onPress={() => openPicker('startDate')}
              className={`p-4 rounded-lg mb-3 ${
                isLightTheme ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            >
              <Text className={`${isLightTheme ? 'text-slate-700' : 'text-slate-400'}`}>
                Start Date: {format(customStartDate, 'MMMM d, yyyy')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => openPicker('endDate')}
              className={`p-4 rounded-lg ${
                isLightTheme ? 'bg-slate-200' : 'bg-slate-800'
              }`}
            >
              <Text className={`${isLightTheme ? 'text-slate-700' : 'text-slate-400'}`}>
                End Date: {format(customEndDate, 'MMMM d, yyyy')}
              </Text>
            </Pressable>
          </View>
        )}

        {rangeType !== 'Custom' && (
          <View className="flex-row items-center my-2">
            <Text
              className={`text-base font-semibold ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              {getDateRange()}
            </Text>
            <View className="flex-row items-center ml-auto gap-3">
              <Pressable
                onPress={handlePrev}
                className={`p-2 rounded-full ${
                  isLightTheme ? 'bg-white' : 'bg-slate-900'
                }`}
              >
                <FontAwesome5
                  name="arrow-left"
                  size={20}
                  color={isLightTheme ? '#334155' : '#cbd5e1'}
                />
              </Pressable>

              <Pressable
                onPress={handleNext}
                className={`p-2 rounded-full ${
                  isLightTheme ? 'bg-white' : 'bg-slate-900'
                }`}
              >
                <FontAwesome5
                  name="arrow-right"
                  size={20}
                  color={isLightTheme ? '#334155' : '#cbd5e1'}
                />
              </Pressable>
            </View>
          </View>
        )}

        {rangeType === 'Custom' && (
          <View className="mb-4">
            <Text
              className={`text-base font-semibold ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              {getDateRange()}
            </Text>
          </View>
        )}

        <View
          className={`p-4 rounded-lg mb-4 flex-row justify-between items-center ${
            isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
          }`}
        >
          <Text
            className={`text-lg font-semibold ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            Total Hours:
          </Text>
          <Text
            className={`text-xl font-semibold ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            {formatTotalDuration(totalDurationMs)}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#475569']}
            tintColor={isLightTheme ? '#475569' : '#94a3b8'}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#475569" className="mt-12" />
        ) : logsWithDuration.length > 0 ? (
          logsWithDuration.map((log, index) => {
            const localDateFormatted = formatDateWithDay(log.timeInObj);
            const timeInFormatted = formatTime(log.timeInObj);
            const timeOutFormatted = formatTime(log.timeOutObj);

            return (
              <View
                key={index}
                className={`p-4 rounded-lg mb-4 ${
                  isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
                }`}
              >
                <Text
                  className={`text-xl font-semibold ${
                    isLightTheme ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  {localDateFormatted}
                </Text>
                <Text
                  className={`text-md ${
                    isLightTheme ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {timeInFormatted} - {timeOutFormatted}
                </Text>
                <Text
                  className={`text-md mt-2 text-right ${
                    isLightTheme ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {log.duration}
                </Text>
              </View>
            );
          })
        ) : (
          <Text
            className={`text-center mt-12 text-md ${
              isLightTheme ? 'text-slate-500' : 'text-slate-400'
            }`}
          >
            No logs available for this range.
          </Text>
        )}
      </ScrollView>

      {renderIOSPickerModal()}
      {renderAndroidPicker()}
    </View>
  );
};

export default TimeCard;
