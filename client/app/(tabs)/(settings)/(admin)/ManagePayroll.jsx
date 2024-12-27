// File: app/(tabs)/(settings)/(admin)/ManagePayroll.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import * as SecureStore from 'expo-secure-store';

import useThemeStore from '../../../../store/themeStore';
import useUsersStore from '../../../../store/usersStore';
import usePayrollStore from '../../../../store/payrollStore';

/** 
 * Utility: color for payType
 */
const getPayTypeColor = (payType) => {
  switch (payType) {
    case 'hourly':
      return '#3b82f6'; 
    case 'monthly':
      return '#ef4444'; 
    default:
      return '#3b82f6';
  }
};

/** 
 * Utility: format date to "YYYY-MM-DD"
 */
const formatDate = (dateObj) => {
  if (!dateObj || !(dateObj instanceof Date)) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ManagePayroll = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  // ===================== TOKEN HANDLING =====================
  // Instead of pulling token from userStore directly, let's load it from SecureStore 
  // so it behaves like your ManageUsers approach.
  const [token, setToken] = useState(null);

  // Payroll store actions & data
  const {
    payrollRecords,
    payrollSettings,
    fetchAllPayroll,
    fetchPayrollSettings,
    createOrUpdatePayRate,
    updatePayrollSettings,
    calculatePayroll,
    loading,
    error,
  } = usePayrollStore();

  // Users store
  const { users, fetchUsers } = useUsersStore();

  // Refresh control
  const [refreshing, setRefreshing] = useState(false);

  // =========== STATES: PAYROLL SETTINGS ===========
  // Cutoff Cycle
  const [cutoffOpen, setCutoffOpen] = useState(false);
  const [cutoffValue, setCutoffValue] = useState('bi-weekly');
  const [cutoffItems, setCutoffItems] = useState([
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-Weekly', value: 'bi-weekly' },
    { label: 'Monthly', value: 'monthly' },
  ]);

  // Currency
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencyValue, setCurrencyValue] = useState('USD');
  const [currencyItems, setCurrencyItems] = useState([
    { label: 'USD', value: 'USD' },
  ]);

  // Overtime Rate
  const [overtimeRate, setOvertimeRate] = useState('1.5');

  // =========== STATES: SET PAY RATE ===========
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userPickerValue, setUserPickerValue] = useState(null);
  const [userPickerItems, setUserPickerItems] = useState([]);

  const [payTypeOpen, setPayTypeOpen] = useState(false);
  const [payTypeValue, setPayTypeValue] = useState('hourly');
  const [payTypeItems, setPayTypeItems] = useState([
    { label: 'Hourly', value: 'hourly' },
    { label: 'Monthly', value: 'monthly' },
  ]);

  const [rate, setRate] = useState('100');

  // =========== STATES: MANUAL CALCULATION ===========
  const [calcUserOpen, setCalcUserOpen] = useState(false);
  const [calcUserValue, setCalcUserValue] = useState(null);

  // We'll keep the date as a Date object
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  // For toggling date pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // =========== EFFECT: LOAD TOKEN & INITIALIZE ===========
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        if (!storedToken) {
          Alert.alert('Authentication Error', 'Please sign in again.');
          router.replace('(auth)/signin');
          return;
        }
        // We have a valid token
        setToken(storedToken);

        // Now fetch data
        await fetchAllPayroll(storedToken);
        await fetchPayrollSettings(storedToken);
        await fetchUsers(storedToken);
      } catch (err) {
        console.error('Error in ManagePayroll initialize:', err);
        Alert.alert('Error', 'Failed to initialize ManagePayroll.');
      }
    };
    initialize();
  }, [router]);

  // 2) When payrollSettings changes
  useEffect(() => {
    if (payrollSettings) {
      setCutoffValue(payrollSettings.cutoffCycle || 'bi-weekly');
      setCurrencyValue(payrollSettings.currency || 'USD');
      setOvertimeRate(String(payrollSettings.overtimeRate || '1.5'));
    }
  }, [payrollSettings]);

  // 3) When users changes, build the userPicker items
  useEffect(() => {
    if (users && Array.isArray(users) && users.length > 0) {
      const items = users.map((u) => ({
        label: `${u.email} (ID:${u.id})`,
        value: u.id,
      }));
      setUserPickerItems(items);
    } else {
      setUserPickerItems([]);
    }
  }, [users]);

  // =========== HANDLERS ===========

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      await fetchAllPayroll(token);
      await fetchPayrollSettings(token);
      await fetchUsers(token);
    } catch (error) {
      console.error('Error refreshing ManagePayroll:', error);
    }
    setRefreshing(false);
  };

  const handleUpdateSettings = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing token');
      return;
    }
    await updatePayrollSettings(token, {
      cutoffCycle: cutoffValue,
      currency: currencyValue,
      overtimeRate: parseFloat(overtimeRate),
    });
  };

  const handleSetPayRate = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing token');
      return;
    }
    if (!userPickerValue) {
      Alert.alert('Validation', 'Please select a user.');
      return;
    }
    await createOrUpdatePayRate(token, userPickerValue, {
      payType: payTypeValue,
      rate: parseFloat(rate),
    });
  };

  const handleCalculatePayroll = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing token');
      return;
    }
    if (!calcUserValue) {
      Alert.alert('Validation', 'Please select a user to calculate.');
      return;
    }
    // Now parse the date as YYYY-MM-DD from date objects
    const startString = formatDate(startDate);
    const endString = formatDate(endDate);
    await calculatePayroll(token, {
      userId: calcUserValue,
      startDate: startString,
      endDate: endString,
    });
  };

  // Date-time pickers (start date)
  const onStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  // Date-time pickers (end date)
  const onEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // =========== RENDER ITEM FOR FLATLIST ===========
  const renderPayrollItem = ({ item }) => {
    return (
      <View
        className={`p-4 mb-3 rounded-lg flex-col ${
          isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
        }`}
      >
        <Text
          className={`text-base font-semibold ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          UserID: {item.userId}
        </Text>
        <Text
          className={`text-sm mt-1 ${
            isLightTheme ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          Period: {item.startDate} ~ {item.endDate}
        </Text>

        <View className="flex-row items-center mt-1">
          <Ionicons
            name="cash-outline"
            size={16}
            color={getPayTypeColor(item.payType)}
            className="mr-1"
          />
          <Text className={`text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
            PayType: {item.payType}
          </Text>
        </View>

        <Text
          className={`text-sm mt-1 ${
            isLightTheme ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          GrossPay: {item.grossPay}
        </Text>
        <Text
          className={`text-sm mt-1 ${
            isLightTheme ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          NetPay: {item.netPay}
        </Text>
      </View>
    );
  };

  // =========== MAIN RENDER ===========
  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 ${
          isLightTheme ? 'bg-white' : 'bg-slate-900'
        }`}
        edges={['top']}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0f766e" />
          <Text
            className={`mt-4 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}
          >
            Loading payroll...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1  ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      edges={['top']}
    >
      {/* Header Section */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text
          className={`text-lg font-bold ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          Manage Payroll
        </Text>
      </View>

      {/* ScrollView w/ RefreshControl */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#475569']}
            tintColor={isLightTheme ? '#475569' : '#f9fafb'}
          />
        }
      >
        {/* Payroll Settings */}
        <View className="mb-4 px-4">
          <Text
            className={`text-2xl font-bold mb-3 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Payroll Settings
          </Text>
          <View
            className={`p-4 rounded-lg ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            }`}
          >
            <Text
              className={`font-semibold mb-2 ${
                isLightTheme ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              Cutoff Cycle
            </Text>
            <DropDownPicker
              open={cutoffOpen}
              value={cutoffValue}
              items={cutoffItems}
              setOpen={setCutoffOpen}
              setValue={setCutoffValue}
              setItems={setCutoffItems}
              placeholder="Select Cutoff Cycle"
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
              zIndex={5000}
              zIndexInverse={1000}
              placeholderStyle={{
                color: isLightTheme ? '#6B7280' : '#9CA3AF',
              }}
            />

            <Text
              className={`font-semibold mb-2 ${
                isLightTheme ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              Currency
            </Text>
            <DropDownPicker
              open={currencyOpen}
              value={currencyValue}
              items={currencyItems}
              setOpen={setCurrencyOpen}
              setValue={setCurrencyValue}
              setItems={setCurrencyItems}
              placeholder="Select Currency"
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
              zIndex={4000}
              zIndexInverse={1000}
              placeholderStyle={{
                color: isLightTheme ? '#6B7280' : '#9CA3AF',
              }}
            />

            <Text
              className={`font-semibold mb-1 ${
                isLightTheme ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              Overtime Rate
            </Text>
            <View
              className={`mb-3 p-3 rounded ${
                isLightTheme ? 'bg-white' : 'bg-slate-700'
              }`}
            >
              <TextInput
                placeholder="e.g. 1.5"
                value={overtimeRate}
                onChangeText={setOvertimeRate}
                keyboardType="numeric"
                placeholderTextColor={isLightTheme ? '#6B7280' : '#9CA3AF'}
                className={isLightTheme ? 'text-slate-800' : 'text-slate-100'}
              />
            </View>

            <Pressable
              className="bg-orange-500 p-3 rounded"
              onPress={handleUpdateSettings}
            >
              <Text className="text-white text-center font-semibold">
                Update Settings
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Set Pay Rate */}
        <View className="mb-4 px-4">
          <Text
            className={`text-2xl font-bold mb-3 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Set Pay Rate
          </Text>
          <View
            className={`p-4 rounded-lg ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            }`}
          >
            <Text
              className={`font-semibold mb-2 ${
                isLightTheme ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              Select User
            </Text>
            <DropDownPicker
              open={userPickerOpen}
              value={userPickerValue}
              items={userPickerItems}
              setOpen={setUserPickerOpen}
              setValue={setUserPickerValue}
              setItems={setUserPickerItems}
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
              zIndex={3000}
              zIndexInverse={1000}
              placeholderStyle={{
                color: isLightTheme ? '#6B7280' : '#9CA3AF',
              }}
            />

            <Text
              className={`font-semibold mb-2 ${
                isLightTheme ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              Pay Type
            </Text>
            <DropDownPicker
              open={payTypeOpen}
              value={payTypeValue}
              items={payTypeItems}
              setOpen={setPayTypeOpen}
              setValue={setPayTypeValue}
              setItems={setPayTypeItems}
              placeholder="Select Pay Type"
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

            <Text
              className={`font-semibold mb-2 ${
                isLightTheme ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              Rate
            </Text>
            <View
              className={`mb-3 p-3 rounded ${
                isLightTheme ? 'bg-white' : 'bg-slate-700'
              }`}
            >
              <TextInput
                placeholder="Enter rate"
                value={rate}
                onChangeText={setRate}
                keyboardType="numeric"
                placeholderTextColor={isLightTheme ? '#6B7280' : '#9CA3AF'}
                className={isLightTheme ? 'text-slate-800' : 'text-slate-100'}
              />
            </View>

            <Pressable className="bg-blue-600 p-3 rounded" onPress={handleSetPayRate}>
              <Text className="text-white text-center font-semibold">Set Pay Rate</Text>
            </Pressable>
          </View>
        </View>

        {/* Manual Calculation */}
        <View className="mb-4 px-4">
          <Text
            className={`text-2xl font-bold mb-3 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Calculate Payroll Manually
          </Text>
          <View
            className={`p-4 rounded-lg ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            }`}
          >
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
              items={userPickerItems}
              setOpen={setCalcUserOpen}
              setValue={setCalcUserValue}
              setItems={setUserPickerItems}
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
              zIndex={1000}
              zIndexInverse={999}
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
              />
            )}

            <Pressable
              className="bg-green-600 p-3 rounded"
              onPress={handleCalculatePayroll}
            >
              <Text className="text-white text-center font-semibold">
                Calculate Payroll
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Payroll Records */}
        <View className="px-4">
          <Text
            className={`text-2xl font-bold mb-3 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            All Payroll Records
          </Text>
        </View>

        <FlatList
          data={payrollRecords}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPayrollItem}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text
              className={`text-center mt-12 text-lg ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              No payroll records found.
            </Text>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ManagePayroll;
