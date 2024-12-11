// File: app/(tabs)/(settings)/(admin)/ManageLeaves.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import useLeaveStore from '../../../../store/leaveStore';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ManageLeaves = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { leaves, loading, error, fetchLeaves, approveLeave, rejectLeave } = useLeaveStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetchLeaves(token);
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
      await fetchLeaves(token);
      setRefreshing(false);
    }
  };

  const handleLeaveAction = (leave) => {
    Alert.alert(
      'Leave Actions',
      `Choose an action for ${leave.employeeName}'s leave request.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => handleApprove(leave.id) },
        { text: 'Reject', onPress: () => handleReject(leave.id) },
      ]
    );
  };

  const handleApprove = async (leaveId) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      const result = await approveLeave(leaveId, token);
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

  const handleReject = async (leaveId) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      const result = await rejectLeave(leaveId, token);
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

  const renderItem = ({ item }) => (
    <View
      className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${
        isLightTheme ? 'bg-gray-100' : 'bg-gray-800'
      }`}
    >
      <View className="flex-row items-center flex-1">
        <Ionicons
          name="calendar-outline"
          size={40}
          color={isLightTheme ? '#4b5563' : '#d1d5db'}
        />
        <View className="ml-3 flex-1">
          <Text
            className={`text-lg font-semibold ${
              isLightTheme ? 'text-gray-800' : 'text-white'
            }`}
          >
            {item.employeeName}
          </Text>
          <Text
            className={`${
              isLightTheme ? 'text-gray-700' : 'text-gray-300'
            }`}
          >
            {item.leaveType}
          </Text>
          <Text
            className={`${
              item.status === 'Approved'
                ? 'text-green-500'
                : item.status === 'Pending'
                ? 'text-yellow-500'
                : 'text-red-500'
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>
      <Pressable onPress={() => handleLeaveAction(item)} className="p-2">
        <Ionicons
          name="ellipsis-vertical"
          size={24}
          color={isLightTheme ? '#1f2937' : '#f9fafb'}
        />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}
      edges={['top']}
    >
      {/* Custom Header */}
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
            isLightTheme ? 'text-gray-800' : 'text-white'
          }`}
        >
          Manage Leaves
        </Text>
      </View>

      <Text
        className={`text-2xl font-bold text-center mb-4 ${
          isLightTheme ? 'text-gray-800' : 'text-white'
        }`}
      >
        Leave Requests
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#64748B" // Slate-500
          style={{ marginTop: 48 }} // Equivalent to className="mt-12"
        />
      ) : (
        <FlatList
          data={leaves}
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
            <Text
              className={`text-center mt-12 text-lg ${
                isLightTheme ? 'text-gray-700' : 'text-gray-300'
              }`}
            >
              No leave requests found.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ManageLeaves;
