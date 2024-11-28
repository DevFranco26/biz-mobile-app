import React from 'react';
import { View, Text, Image, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router'; // useRouter for navigation
import useUserStore from '../../store/userStore';

const Profile = () => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const router = useRouter();

  // Static data for testing
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

  const getInitials = (name) => {
    const nameArray = name.split(' ');
    return nameArray.map((n) => n[0]).join('').toUpperCase();
  };

  const logout = async () => {
    try {
      // Step 1: Make the API call to the server to log out (invalidate the token)
      const response = await fetch('http://192.168.100.8:5000/api/auth/sign-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await SecureStore.getItemAsync('token')}`,
        },
      });

      if (response.ok) {
        // Step 2: Clear token and user data from SecureStore
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');

        // Step 3: Redirect to the sign-in screen
        router.push('/signin'); // Redirect to the Sign-In screen

        Alert.alert('Success', 'You have been logged out successfully');
      } else {
        // Handle error if the API call fails
        Alert.alert('Error', 'Failed to log out, please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An error occurred while logging out.');
    }
  };

  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800 flex-1'}`}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 0 }}>
        <View className="bg-teal-700 rounded-xl p-6 mb-7 flex-row items-center">
          {userData.profileImage ? (
            <Image
              source={{ uri: userData.profileImage }}
              style={{ width: 80, height: 80, borderRadius: 40 }}
            />
          ) : (
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#ffffff',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#16a085',
              }}
            >
              <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold' }}>
                {getInitials(userData.firstName + ' ' + userData.lastName)}
              </Text>
            </View>
          )}
          <View className="ml-4">
            <Text className="text-2xl font-bold text-white">{userData.firstName} {userData.lastName}</Text>
            <Text className="text-white text-base">{userData.position}</Text>
          </View>
        </View>

        {/* Contact Information */}
        <View className={`${theme === 'light' ? 'bg-white' : 'bg-slate-700'} rounded-lg p-6 shadow-sm mb-6`}>
          <Text className={`text-xl font-semibold ${theme === 'light' ? 'text-teal-900' : 'text-teal-400'}`}>Contact Information</Text>
          <Text className="text-lg text-gray-400 mt-4">Company: {userData.companyId}</Text>
          <Text className="text-lg text-gray-400 mt-2">Email: {userData.email}</Text>
          <Text className="text-lg text-gray-400 mt-2">Role: {userData.role}</Text>
          <Text className="text-lg text-gray-400 mt-2">Contact: {userData.phone}</Text>
        </View>

        {/* Edit Profile Button */}
        <View className="mb-6">
          <Pressable
            className="bg-teal-700 p-4 rounded-lg items-center"
            onPress={() => alert('Edit Profile')}
          >
            <Text className="text-white text-center">Edit Profile</Text>
          </Pressable>
        </View>

        {/* Account Settings */}
        <View className={`${theme === 'light' ? 'bg-white' : 'bg-slate-700'} rounded-lg p-6 shadow-sm mb-6`}>
          <Text className={`text-xl font-semibold ${theme === 'light' ? 'text-teal-900' : 'text-teal-400'}`}>Account Settings</Text>
          <Pressable
            className={`rounded-lg mt-4 p-4 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800'}`}
            onPress={() => alert('Change Password')}
          >
            <Text className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-gray-400'}`}>Change Password</Text>
          </Pressable>
          <Pressable
            className={`rounded-lg mt-4 p-4 ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800'}`}
            onPress={logout} // Call logout function
          >
            <Text className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-gray-400'}`}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
