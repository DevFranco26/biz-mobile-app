// File: app/index.jsx

import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../store/themeStore';
import * as SecureStore from 'expo-secure-store';
import useUserStore from '../store/userStore';
import { useRouter } from 'expo-router';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

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
          const userData = JSON.parse(user);
          setUser(userData);

          // Immediately set presence to 'active' upon app load if user is authenticated
          try {
            const setActiveResponse = await fetch(`${API_BASE_URL}/users/me/presence`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ presenceStatus: 'active' }),
            });

            if (setActiveResponse.ok) {
              const updatedPresenceData = await setActiveResponse.json();
              // Update Zustand with the newly updated presence status
              setUser(updatedPresenceData.data);
            } else {
              console.log('Failed to set presence to active on app load');
            }
          } catch (err) {
            console.error('Error setting presence to active on app load:', err);
          }

          // Once done, go to Profile screen
          router.replace('(tabs)/profile');
        } else {
          // No valid token or user data, go to sign in
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
    <SafeAreaView
      className={`flex-1 ${theme === 'light' ? 'bg-white' : 'bg-slate-900'} justify-center items-center`}
    >
      <ActivityIndicator size="large" color="#0f766e" />
      <Text className={`mt-4 ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
        Checking authentication...
      </Text>
    </SafeAreaView>
  );
}
