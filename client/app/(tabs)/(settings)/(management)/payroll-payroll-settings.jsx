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
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const PayrollSettings = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();
  const {
    payrollSettings,
    fetchPayrollSettings,
    updatePayrollSettings,
    loading,
  } = usePayrollStore();
  const [token, setToken] = useState(null);
  const [cutoffOpen, setCutoffOpen] = useState(false);
  const [cutoffValue, setCutoffValue] = useState('bi-weekly');
  const [cutoffItems, setCutoffItems] = useState([
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Bi-Weekly', value: 'bi-weekly' },
    { label: 'Monthly', value: 'monthly' },
  ]);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [currencyValue, setCurrencyValue] = useState('USD');
  const [currencyItems, setCurrencyItems] = useState([
    { label: 'USD', value: 'USD' },
    { label: 'EUR', value: 'EUR' },
    { label: 'GBP', value: 'GBP' },
  ]);
  const [overtimeRate, setOvertimeRate] = useState('1.5');

  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        if (!storedToken) {
          Alert.alert('Authentication Error', 'Please sign in again.');
          return;
        }
        setToken(storedToken);
        await fetchPayrollSettings(storedToken);
      } catch (error) {
        console.error('Error loading PayrollSettings:', error);
        Alert.alert('Error', 'Failed to load payroll settings.');
      }
    };
    initialize();
  }, [fetchPayrollSettings]);

  useEffect(() => {
    if (payrollSettings) {
      setCutoffValue(payrollSettings.cutoffCycle || 'bi-weekly');
      setCurrencyValue(payrollSettings.currency || 'USD');
      setOvertimeRate(String(payrollSettings.overtimeRate || '1.5'));
    }
  }, [payrollSettings]);

  const handleUpdateSettings = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing authentication token.');
      return;
    }
    if (isNaN(parseFloat(overtimeRate))) {
      Alert.alert('Validation Error', 'Overtime rate must be a number.');
      return;
    }
    try {
      await updatePayrollSettings(token, {
        cutoffCycle: cutoffValue,
        currency: currencyValue,
        overtimeRate: parseFloat(overtimeRate),
      });
      Alert.alert('Success', 'Payroll settings updated successfully.');
    } catch (error) {
      console.error('Error updating PayrollSettings:', error);
      Alert.alert('Error', 'Failed to update payroll settings.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
        edges={['top']}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0f766e" />
          <Text
            className={`mt-4 ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            Loading Payroll Settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!payrollSettings) {
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
            Company Payroll Settings
          </Text>
        </View>
        <View className="flex-1 px-4 mt-4">
          <Text
            className={`text-lg font-semibold text-center ${
              isLightTheme ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            No payroll settings found.
          </Text>
          <Text
            className={`mt-2 mb-4 text-center ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            Please set up your company’s payroll settings below.
          </Text>
          <Text
            className={`font-semibold mb-1 mt-4 ${
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
            zIndex={5000}
            zIndexInverse={1000}
            placeholderStyle={{ color: isLightTheme ? '#6B7280' : '#9CA3AF' }}
          />
          <Text
            className={`font-semibold mb-1 mt-4 ${
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
            zIndex={4000}
            zIndexInverse={1000}
            placeholderStyle={{ color: isLightTheme ? '#6B7280' : '#9CA3AF' }}
          />
          <Text
            className={`font-semibold mb-1 mt-4 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Overtime Rate
          </Text>
          <View
            className={`mb-3 p-4 rounded-lg ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
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
            className="bg-orange-500 p-4 rounded-lg mt-6"
            onPress={handleUpdateSettings}
          >
            <Text className="text-white text-center font-semibold">
              Create Payroll Settings
            </Text>
          </Pressable>
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
          Company Payroll Settings
        </Text>
      </View>
      <View className="flex-1 px-4 mt-4">
        <Text
          className={`font-semibold mb-1 ${
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
          zIndex={5000}
          zIndexInverse={1000}
          placeholderStyle={{ color: isLightTheme ? '#6B7280' : '#9CA3AF' }}
        />
        <Text
          className={`font-semibold mb-1 mt-4 ${
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
          zIndex={4000}
          zIndexInverse={1000}
          placeholderStyle={{ color: isLightTheme ? '#6B7280' : '#9CA3AF' }}
        />
        <Text
          className={`font-semibold mb-1 mt-4 ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          Overtime Rate
        </Text>
        <View
          className={`mb-3 p-4 rounded-lg ${
            isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
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
          className="bg-orange-500 p-4 rounded-lg mt-6"
          onPress={handleUpdateSettings}
        >
          <Text className="text-white text-center font-semibold">Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default PayrollSettings;
