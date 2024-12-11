// File: app/(tabs)/(settings)/(admin)/ManageUsers.jsx

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
import useUsersStore from '../../../../store/usersStore'; 
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const ManageUsers = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { users, loading, error, fetchUsers, deleteUser } = useUsersStore();

  // Define the 'refreshing' state
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetchUsers(token);
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
      await fetchUsers(token);
      setRefreshing(false);
    }
  };

  const handleUserAction = (user) => {
    Alert.alert(
      'User Actions',
      `Choose an action for ${user.firstName} ${user.lastName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditUser(user) },
        { text: 'Delete', onPress: () => handleDeleteUser(user.id) },
      ]
    );
  };

  const handleEditUser = (user) => {
    // Navigate to the edit user screen with userId as a parameter
    router.push({ pathname: 'edit-user', params: { userId: user.id } });
  };

  const handleDeleteUser = async (userId) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      const result = await deleteUser(userId, token);
      if (result.success) {
        // Optionally, perform additional actions here
      }
      // Errors are handled within the store
    } else {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
    }
  };

  const renderItem = ({ item }) => (
    <View className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <View className="flex-row items-center flex-1">
        <Ionicons name="person-circle" size={50} color={isLightTheme ? '#4b5563' : '#d1d5db'} />
        <View className="ml-3 flex-1">
          <Text className={`text-lg font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
            {item.firstName} {item.middleName ? `${item.middleName} ` : ''}{item.lastName}
          </Text>
          <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
            {item.email}
          </Text>
          <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
            Role: {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Text>
          <Text className={`${item.status ? 'text-green-500' : 'text-red-500'}`}>
            Status: {item.status ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Pressable onPress={() => handleUserAction(item)} className="p-2">
        <Ionicons name="ellipsis-vertical" size={24} color={isLightTheme ? '#1f2937' : '#f9fafb'} />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`} edges={['top']}>
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
          Manage Users
        </Text>
      </View>

      <Text className={`text-2xl font-bold text-center mb-4 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
        Company Users
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#475569" className="mt-12" />
      ) : (
        <FlatList
          data={users}
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
              No users found in your company.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ManageUsers;
