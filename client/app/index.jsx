// File: app/index.jsx

import React, { useEffect } from 'react';
import { ActivityIndicator, View, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../store/themeStore';
import * as SecureStore from 'expo-secure-store';
import useUserStore from '../store/userStore';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '../config/constant';


export default function Index() {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const { setUser } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const user = await SecureStore.getItemAsync('user');

        if (token && user) {
          const userData = JSON.parse(user);
          setUser(userData);
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
              setUser(updatedPresenceData.data);
            } else {
              console.log('Failed to set presence to active on app load');
            }
          } catch (err) {
            console.error('Error setting presence to active on app load:', err);
          }
          router.replace('(tabs)/profile');
        } else {
          router.replace('(auth)/login-user');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('(auth)/login-user');
      }
    };

    checkAuth();
  }, [setUser, router]);

  const statusBarBackground = isLightTheme ? '#ffffff' : '#1e293b';

  return (
    <>
      <StatusBar
        barStyle={isLightTheme ? 'dark-content' : 'light-content'}
        backgroundColor={statusBarBackground}
        translucent={false}
        animated={true}
      />

      <SafeAreaView
        className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'} justify-center items-center`}
        style={{ paddingTop: 60 }}
      >
        <ActivityIndicator size="large" color="#0f766e" />
        <Text className={`mt-4 ${isLightTheme ? 'text-slate-700' : 'text-gray-300'}`}>
          Checking authentication...
        </Text>
      </SafeAreaView>
    </>
  );
}
