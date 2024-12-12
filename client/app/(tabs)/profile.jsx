// File: app/(tabs)/profile.jsx

import React from 'react';
import { View, Text, Image, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';

const Profile = () => {
  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();
  const router = useRouter();
  const isLightTheme = theme === 'light';

  // User data
  const userData = {
    firstName: user.firstName,
    lastName: user.lastName,
    position: 'Software Engineer',
    email: user.email,
    phone: user.phone,
    companyId: user.companyId + 1000,
    role: user.role,
    profileImage: null,
  };

  // Function to get initials
  const getInitials = (name) => {
    const nameArray = name.split(' ');
    return nameArray.map((n) => n[0]).join('').toUpperCase();
  };

  // Logout function
  const logout = async () => {
    try {
      const response = await fetch('http://192.168.100.8:5000/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await SecureStore.getItemAsync('token')}`,
        },
      });

      if (response.ok) {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        clearUser();
        router.replace('(auth)/signin');
        Alert.alert('Success', 'You have been logged out successfully');
      } else {
        Alert.alert('Error', 'Failed to log out, please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An error occurred while logging out.');
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Header */}
        <View className="bg-slate-800 rounded-xl p-6 mb-6 flex-row items-center">
          {userData.profileImage ? (
            <Image
              source={{ uri: userData.profileImage }}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-slate-900 justify-center items-center">
              <Text className="text-white text-2xl font-bold tracking-widest">
                {getInitials(userData.firstName + ' ' + userData.lastName)}
              </Text>
            </View>
          )}
          <View className="ml-4">
            <Text className="text-2xl font-bold text-white">
              {userData.firstName} {userData.lastName}
            </Text>
            <Text className="text-white">{userData.position}</Text>
          </View>
        </View>

        {/* Contact Information */}
        <View className={`rounded-lg p-6 mb-6 ${isLightTheme ? 'bg-gray-100' : 'bg-slate-800'}`}>
          <Text className={`text-xl font-semibold mb-4 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
            Contact Information
          </Text>
          <Text className={`mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
            Company ID: {userData.companyId}
          </Text>
          <Text className={`mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
            Email: {userData.email}
          </Text>
          <Text className={`mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
            Role: {userData.role}
          </Text>
          <Text className={`mb-2 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
            Phone: {userData.phone}
          </Text>
        </View>

        {/* Account Settings */}
        <View className={`rounded-lg p-6 ${isLightTheme ? 'bg-gray-100' : 'bg-slate-800'}`}>
          <Text className={`text-xl font-semibold mb-6 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
            Account Settings
          </Text>
          <Pressable
            className={`p-4 rounded-lg mb-4 ${isLightTheme ? 'bg-white' : 'bg-slate-700'}`}
            onPress={() => Alert.alert('Change Password')}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-100'} font-medium text-center` } onPress={() => Alert.alert('Change pass feature: on going')}>
              Change Password
            </Text>
          </Pressable>
          <Pressable
            className={`p-4 rounded-lg mb-4 ${isLightTheme ? 'bg-white' : 'bg-slate-700'}`}
            onPress={() => Alert.alert('Change Password')}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-100'} font-medium text-center`} onPress={() => Alert.alert('Edit profile feature: on going')}>
            Edit Profile
            </Text>
          </Pressable>
          <Pressable
            className={`p-4 rounded-lg ${isLightTheme ? 'bg-white' : 'bg-slate-700'}`}
            onPress={logout}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-100'} font-medium text-center`}>
              Logout
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
