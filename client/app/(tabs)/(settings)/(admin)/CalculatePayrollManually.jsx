// File: app/(tabs)/(settings)/(admin)/CalculatePayrollManually.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import useThemeStore from '../../../../store/themeStore';
import usePayrollStore from '../../../../store/payrollStore';
import useUsersStore from '../../../../store/usersStore';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

const formatDate = (dateObj) => {
  if (!dateObj || !(dateObj instanceof Date)) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalculatePayrollManually = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const {
    calculatePayroll,
    loading,
  } = usePayrollStore();

  const {
    users,
    fetchUsers,
    loading: usersLoading,
  } = useUsersStore();

  const [token, setToken] = useState(null);

  // Manual Calculation State
  const [calcUserOpen, setCalcUserOpen] = useState(false);
  const [calcUserValue, setCalcUserValue] = useState(null);
  const [calcUserItems, setCalcUserItems] = useState([]);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Load token and fetch users
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        if (!storedToken) {
          Alert.alert('Authentication Error', 'Please sign in again.');
          // Optionally navigate to sign-in screen
          return;
        }
        setToken(storedToken);
        await fetchUsers(storedToken);
      } catch (error) {
        console.error('Error loading CalculatePayrollManually:', error);
        Alert.alert('Error', 'Failed to load users.');
      }
    };
    initialize();
  }, [fetchUsers]);

  // Populate user picker items when users data changes
  useEffect(() => {
    if (users && Array.isArray(users) && users.length > 0) {
      const items = users.map((u) => ({
        label: `${u.email} (ID:${u.id})`,
        value: u.id,
      }));
      setCalcUserItems(items);
    } else {
      setCalcUserItems([]);
    }
  }, [users]);

  const handleCalculatePayrollManually = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing authentication token.');
      return;
    }
    if (!calcUserValue) {
      Alert.alert('Validation Error', 'Please select a user.');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('Validation Error', 'Start Date cannot be after End Date.');
      return;
    }

    try {
      await calculatePayroll(token, {
        userId: calcUserValue,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
      });
      Alert.alert('Success', 'Payroll calculated successfully.');
      // Optionally, reset the form
      setCalcUserValue(null);
      setStartDate(new Date());
      setEndDate(new Date());
    } catch (error) {
      console.error('Error calculating payroll:', error);
      Alert.alert('Error', 'Failed to calculate payroll.');
    }
  };

  // Date-time pickers (start date)
  const onStartDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setStartDate(selectedDate);
    }
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
  };

  // Date-time pickers (end date)
  const onEndDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setEndDate(selectedDate);
    }
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
  };

  if (loading || usersLoading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
        edges={['top']}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0f766e" />
          <Text
            className={`mt-4 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}
          >
            Loading Manual Payroll Calculation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      edges={['top']}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-4">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text className={`text-xl font-bold ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
          Calculate Payroll Manually
        </Text>
      </View>

      {/* Calculation Form */}
      <View className="flex-1 px-4">
        {/* Select User */}
        <Text
          className={`font-semibold mb-2 ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          Select User
        </Text>
        <DropDownPicker
          open={calcUserOpen}
          value={calcUserValue}
          items={calcUserItems}
          setOpen={setCalcUserOpen}
          setValue={setCalcUserValue}
          setItems={setCalcUserItems}
          placeholder="Select a user"
          textStyle={{
            color: isLightTheme ? '#374151' : '#9ca3af',
          }}
          className="mb-3"
          style={{
            borderColor: isLightTheme ? '#E5E7EB' : '#1E293B',
            backgroundColor: isLightTheme ? '#E5E7EB' : '#1E293B',
          }}
          dropDownContainerStyle={{
            borderColor: isLightTheme ? '#E5E7EB' : '#1E293B',
            backgroundColor: isLightTheme ? '#E5E7EB' : '#1E293B',
          }}
          arrowIconStyle={{
            tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
          }}
          tickIconStyle={{
            tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
          }}
          zIndex={2000}
          zIndexInverse={1000}
          placeholderStyle={{
            color: isLightTheme ? '#6B7280' : '#9CA3AF',
          }}
        />

        {/* Start Date */}
        <Text
          className={`font-semibold mb-1 ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          Start Date
        </Text>
        <Pressable
          className={`mb-3 p-3 rounded ${
            isLightTheme ? 'bg-white' : 'bg-slate-700'
          }`}
          onPress={() => setShowStartPicker(true)}
        >
          <Text
            className={`${
              isLightTheme ? 'text-slate-800' : 'text-slate-100'
            }`}
          >
            {formatDate(startDate) || 'YYYY-MM-DD'}
          </Text>
        </Pressable>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
            maximumDate={endDate}
            textColor={isLightTheme ? '#000' : '#FFF'}
          />
        )}

        {/* End Date */}
        <Text
          className={`font-semibold mb-1 ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          End Date
        </Text>
        <Pressable
          className={`mb-4 p-3 rounded ${
            isLightTheme ? 'bg-white' : 'bg-slate-700'
          }`}
          onPress={() => setShowEndPicker(true)}
        >
          <Text
            className={`${
              isLightTheme ? 'text-slate-800' : 'text-slate-100'
            }`}
          >
            {formatDate(endDate) || 'YYYY-MM-DD'}
          </Text>
        </Pressable>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
            minimumDate={startDate}
            textColor={isLightTheme ? '#000' : '#FFF'}
          />
        )}

        {/* Calculate Payroll Button */}
        <Pressable
          className="bg-green-600 p-3 rounded"
          onPress={handleCalculatePayrollManually}
        >
          <Text className="text-white text-center font-semibold">
            Calculate Payroll
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default CalculatePayrollManually;
