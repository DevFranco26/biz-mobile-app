import React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';

const Profile = () => {
  const { theme } = useThemeStore();
  const userData = {
    name: 'John Doe',
    position: 'Software Engineer',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    profileImage: null,
  };

  const getInitials = (name) => {
    const nameArray = name.split(' ');
    return nameArray.map((n) => n[0]).join('').toUpperCase();
  };

  const recentActivities = [
    'Logged in to the system',
    'Completed the "React Native Basics" course',
    'Requested a vacation leave for next week',
  ];

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
                {getInitials(userData.name)}
              </Text>
            </View>
          )}
          <View className="ml-4">
            <Text className="text-2xl font-bold text-white">{userData.name}</Text>
            <Text className="text-white text-base">{userData.position}</Text>
          </View>
        </View>

        <View className={`${theme === 'light' ? 'bg-white' : 'bg-slate-700'} rounded-lg p-6 shadow-sm mb-6`}>
          <Text className={`text-xl font-semibold ${theme === 'light' ? 'text-teal-900' : 'text-teal-400'}`}>Contact Information</Text>
          <Text className="text-lg text-gray-400 mt-4">Email: {userData.email}</Text>
          <Text className="text-lg text-gray-400 mt-2">Phone: {userData.phone}</Text>
        </View>

        <View className="mb-6">
          <Pressable
            className="bg-teal-700 p-4 rounded-lg items-center"
            onPress={() => alert('Edit Profile')}
          >
            <Text className="text-white font-bold">Edit Profile</Text>
          </Pressable>
        </View>

        <View className={`${theme === 'light' ? 'bg-white' : 'bg-slate-700'} rounded-lg p-6 shadow-sm mb-6`}>
          <Text className={`text-xl font-semibold ${theme === 'light' ? 'text-teal-900' : 'text-teal-400'}`}>Account Settings</Text>
          <Pressable
            className={`rounded-lg mt-4 p-4 ${theme === 'light'?'bg-slate-50': 'bg-slate-800'}`}
            onPress={() => alert('Change Password')}
          >
            <Text className={`font-semibold ${theme === 'light'?'text-gray-800': 'text-gray-400'}`}>Change Password</Text>
          </Pressable>
          <Pressable
            className={`rounded-lg mt-4 p-4 ${theme === 'light'?'bg-slate-50': 'bg-slate-800'}`}
            onPress={() => alert('Manage Notifications')}
          >
            <Text className={`font-semibold ${theme === 'light'?'text-gray-800': 'text-gray-400'}`}>Logout</Text>
          </Pressable>
        </View>

        <View className={`${theme === 'light' ? 'bg-white' : 'bg-slate-700'} rounded-lg p-6 shadow-sm mb-6`}>
          <Text className={`text-xl font-semibold ${theme === 'light' ? 'text-teal-900' : 'text-teal-400'}`}>Notifications</Text>
          <Text className="text-gray-400 mt-4">You have 3 new notifications</Text>
          <Pressable
            className={`rounded-lg mt-4 p-4 ${theme === 'light'?'bg-slate-50': 'bg-slate-800'}`}
            onPress={() => alert('View Notifications')}
          >
            <Text className={`font-semibold ${theme === 'light'?'text-gray-800': 'text-gray-400'}`}>View All Notifications</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
