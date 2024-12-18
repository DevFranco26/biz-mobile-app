// File: app/(tabs)/(settings)/index.jsx

import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text, Pressable } from 'react-native';
import Admin from './Admin';
import SuperAdmin from './SuperAdmin';
import Supervisor from './Supervisor';
import User from './User';
import useUserStore from '../../../store/userStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SettingsIndex = () => {
  const { user, loading, error, loadUser } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    // Load user data when the component mounts
    loadUser();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900 px-4">
        <Text className="text-red-500 text-lg text-center">{error}</Text>
        <Pressable
          onPress={() => {
            loadUser(); // Retry loading user data
          }}
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          accessibilityLabel="Retry Loading User Data"
          accessibilityHint="Attempts to reload user data"
        >
          <Text className="text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900 px-4">
        <Text className="text-gray-700 text-lg text-center mb-4">
          You are not signed in.
        </Text>
        <Pressable
          onPress={() => router.push('/(auth)/signin')}
          className="bg-blue-500 px-4 py-2 rounded-lg"
          accessibilityLabel="Navigate to Sign-In"
          accessibilityHint="Navigates to the Sign-In screen"
        >
          <Text className="text-white">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  // Conditional Rendering Based on User Role
  switch (user.role.toLowerCase()) {
    case 'admin':
      return <Admin />;
    case 'superadmin':
      return <SuperAdmin />;
    case 'supervisor':
      return <Supervisor />;
    case 'user':
      return <User />;
    default:
      return (
        <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900 px-4">
          <Text className="text-red-500 text-lg text-center">
            Unknown user role.
          </Text>
        </View>
      );
  }
};

export default SettingsIndex;
