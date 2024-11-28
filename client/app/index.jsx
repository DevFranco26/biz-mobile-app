import React, { useState, useEffect } from 'react';
import { ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../store/themeStore';
import * as SecureStore from 'expo-secure-store';
import useUserStore from '../store/userStore';
import { useRouter } from 'expo-router';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const user = await SecureStore.getItemAsync('user');  // Retrieve user data from SecureStore

        console.log("Token:", token);
        console.log("User Data:", user);

        if (token && user) {
          // If token and user data are available, set them in the store
          setUser(JSON.parse(user));  // Set user data in the store
          setIsLoggedIn(true);
          router.push('/home');  // Redirect to Home page if logged in
        } else {
          setIsLoggedIn(false);
          router.push('/signin');  // Redirect to Sign-In page if not logged in
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsLoggedIn(false);
        router.push('/signin');  // In case of an error, redirect to Sign-In
      }
    };

    checkAuth();
  }, [setUser, router]);

  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800 flex-1'}`}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      {/* We don't need conditional rendering anymore */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 0 }}></ScrollView>
    </SafeAreaView>
  );
}
