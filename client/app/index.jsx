// File: app/index.jsx

import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../store/themeStore';
import * as SecureStore from 'expo-secure-store';
import useUserStore from '../store/userStore';
import { useRouter } from 'expo-router';

export default function Index() {
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Retrieve token and user data
        const token = await SecureStore.getItemAsync('token');
        const user = await SecureStore.getItemAsync('user');

        if (token && user) {
          setUser(JSON.parse(user));
          router.replace('(tabs)/profile');
        } else {
          router.replace('(auth)/signin');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('(auth)/signin');
      }
    };

    checkAuth();
  }, [setUser, router]);

  return (
    <SafeAreaView className={`flex-1 ${theme === 'light' ? 'bg-white' : 'bg-slate-900'} justify-center items-center`}>
      <ActivityIndicator size="large" color="#0f766e" />
      <Text className={`mt-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
        Checking authentication...
      </Text>
    </SafeAreaView>
  );
}
