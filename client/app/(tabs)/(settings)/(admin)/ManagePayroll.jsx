// File: app/(tabs)/(settings)/(admin)/ManagePayroll.jsx

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  Pressable, 
  RefreshControl 
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import usePayrollStore from '../../../../store/payrollStore';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ManagePayroll = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { payrollData, loading, error, fetchPayrollData, markAsPaid } = usePayrollStore();

  // Define the 'refreshing' state
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetchPayrollData(token);
      } else {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/signin');
      }
    };
    initialize();
  }, []);

  const onRefresh = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      setRefreshing(true);
      await fetchPayrollData(token);
      setRefreshing(false);
    }
  };

  const handlePayrollAction = (payrollItem) => {
    Alert.alert(
      'Payroll Actions',
      `Choose an action for ${payrollItem.employeeName}'s payroll.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Paid', onPress: () => handleMarkAsPaid(payrollItem.id) },
        { text: 'View Details', onPress: () => handleViewDetails(payrollItem.id) },
      ]
    );
  };

  const handleMarkAsPaid = async (payrollId) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      const result = await markAsPaid(payrollId, token);
      if (result.success) {
        Alert.alert('Success', result.message);
      } else {
        Alert.alert('Error', result.message);
      }
    } else {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
    }
  };

  const handleViewDetails = (payrollId) => {
    // Navigate to the payroll details screen with payrollId as a parameter
    router.push({ pathname: 'payroll-details', params: { payrollId } });
  };

  const renderItem = ({ item }) => (
    <View className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
      <View className="flex-row items-center flex-1">
        <Ionicons name="cash-outline" size={40} color={isLightTheme ? '#4b5563' : '#d1d5db'} />
        <View className="ml-3 flex-1">
          <Text className={`text-lg font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
            {item.employeeName}
          </Text>
          <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
            Salary: ${item.salary.toLocaleString()}
          </Text>
          <Text className={`${item.isPaid ? 'text-green-500' : 'text-red-500'}`}>
            Status: {item.isPaid ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>
      <Pressable onPress={() => handlePayrollAction(item)} className="p-2">
        <Ionicons name="ellipsis-vertical" size={24} color={isLightTheme ? '#1f2937' : '#f9fafb'} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`} edges={['top']}>
      {/* Custom Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          Manage Payroll
        </Text>
      </View>

      <Text className={`text-2xl font-bold text-center mb-4 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
        Payroll Overview
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#475569" className="mt-12" />
      ) : (
        <FlatList
          data={payrollData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#475569']}
              tintColor={isLightTheme ? '#475569' : '#f9fafb'} 
            />
          }
          ListEmptyComponent={
            <Text className={`text-center mt-12 text-lg ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              No payroll data available.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ManagePayroll;
