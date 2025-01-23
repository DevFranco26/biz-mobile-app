// File: app/(tabs)/(settings)/(management)/payroll-payrate-settings.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '../../../../store/themeStore';
import usePayrollStore from '../../../../store/payrollStore';
import useUsersStore from '../../../../store/usersStore';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const PayrateSettings = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();
  const { createOrUpdatePayRate, loading } = usePayrollStore();
  const { users, fetchUsers, loading: usersLoading } = useUsersStore();
  const [token, setToken] = useState(null);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userPickerValue, setUserPickerValue] = useState(null);
  const [userPickerItems, setUserPickerItems] = useState([]);
  const [payTypeOpen, setPayTypeOpen] = useState(false);
  const [payTypeValue, setPayTypeValue] = useState('hourly');
  const [payTypeItems, setPayTypeItems] = useState([
    { label: 'Hourly', value: 'hourly' },
    { label: 'Monthly', value: 'monthly' },
  ]);
  const [rate, setRate] = useState('');

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        if (!storedToken) {
          Alert.alert('Authentication Error', 'Please sign in again.');
          return;
        }
        setToken(storedToken);
        await fetchUsers(storedToken);
      } catch (error) {
        console.error('Error loading PayrateSettings:', error);
        Alert.alert('Error', 'Failed to load users.');
      }
    };
    initialize();
  }, [fetchUsers]);

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

  const handleSetPayRate = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing authentication token.');
      return;
    }
    if (!userPickerValue) {
      Alert.alert('Validation Error', 'Please select a user.');
      return;
    }
    if (isNaN(parseFloat(rate))) {
      Alert.alert('Validation Error', 'Rate must be a number.');
      return;
    }
    try {
      await createOrUpdatePayRate(token, userPickerValue, {
        payType: payTypeValue,
        rate: parseFloat(rate),
      });
      Alert.alert('Success', 'Pay rate set successfully.');
      setUserPickerValue(null);
      setPayTypeValue('hourly');
      setRate('');
    } catch (error) {
      console.error('Error setting Payrate:', error);
      Alert.alert('Error', 'Failed to set pay rate.');
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
            className={`mt-4 ${isLightTheme ? 'text-slate-700' : 'text-gray-300'}`}
          >
            Loading Payrate Settings...
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
      <View className="flex-row items-center px-4 py-4">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text
          className={`text-xl font-bold ${
            isLightTheme ? 'text-slate-800' : 'text-white'
          }`}
        >
          Payrate Settings
        </Text>
      </View>
      <View className="flex-1 px-4 mt-4">
        <Text
          className={`font-semibold mb-1 ${
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
          textStyle={{ color: isLightTheme ? '#374151' : '#9ca3af' }}
          className="mb-3"
          style={{
            borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
          }}
          dropDownContainerStyle={{
            borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
          }}
          arrowIconStyle={{ tintColor: isLightTheme ? '#1e293b' : '#cbd5e1' }}
          tickIconStyle={{ tintColor: isLightTheme ? '#1e293b' : '#cbd5e1' }}
          zIndex={3000}
          zIndexInverse={1000}
          placeholderStyle={{ color: isLightTheme ? '#6B7280' : '#9CA3AF' }}
        />
        <Text
          className={`font-semibold mt-4 mb-1 ${
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
          textStyle={{ color: isLightTheme ? '#374151' : '#9ca3af' }}
          className="mb-3"
          style={{
            borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
          }}
          dropDownContainerStyle={{
            borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
          }}
          arrowIconStyle={{ tintColor: isLightTheme ? '#1e293b' : '#cbd5e1' }}
          tickIconStyle={{ tintColor: isLightTheme ? '#1e293b' : '#cbd5e1' }}
          zIndex={2000}
          zIndexInverse={1000}
          placeholderStyle={{ color: isLightTheme ? '#6B7280' : '#9CA3AF' }}
        />
        <Text
          className={`font-semibold mb-1 mt-4 ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          Rate (USD)
        </Text>
        <View
          className={`mb-3 p-4 rounded-lg ${
            isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
          }`}
        >
          <TextInput
            placeholder="e.g., 500"
            value={rate}
            onChangeText={setRate}
            keyboardType="numeric"
            placeholderTextColor={isLightTheme ? '#6B7280' : '#9CA3AF'}
            className={isLightTheme ? 'text-slate-800' : 'text-slate-100'}
          />
        </View>
        <Pressable
          className="bg-orange-500 p-4 rounded-lg mt-6"
          onPress={handleSetPayRate}
        >
          <Text className="text-white text-center font-semibold">Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default PayrateSettings;
