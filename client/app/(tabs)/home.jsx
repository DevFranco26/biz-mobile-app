import React from 'react';
import { View, Text, ScrollView, Pressable, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import useThemeStore from '../../store/themeStore';


const Home = () => {
  const { theme } = useThemeStore();
  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800 flex-1'}`}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 0}}>
        {/* Welcome Section */}
        <View className="bg-teal-700 rounded-xl p-6 mb-4">
          <Text className="text-2xl font-bold text-white mb-2">Home</Text>
          <Text className="text-white text-base">
            {`Welcome back, ${'user'}`}
          </Text>
        </View>

        {/* Quick Links */}
        <View className="mb-6">
          <Text className={`text-xl font-bold mb-3 ${theme === 'light'? 'text-teal-950' : 'text-teal-400'}`}>Quick Links</Text>
          <View className="flex-row flex-wrap justify-between">
            <Link href="/schedule" asChild>
              <Pressable className={`rounded-lg p-4 w-[48%] shadow-sm mb-4 ${theme === 'light'? 'bg-white': 'bg-slate-700'}`}>
                <Text className={`font-medium text-center my-auto ${theme === 'light'? 'text-teal-900': 'text-gray-400'}`}>Class Schedule</Text>
              </Pressable>
            </Link>
            <Link href="/attendance" asChild>
              <Pressable className={`rounded-lg p-4 w-[48%] shadow-sm mb-4 ${theme === 'light'? 'bg-white': 'bg-slate-700'}`}>
                <Text className={`font-medium text-center my-auto ${theme === 'light'? 'text-teal-900': 'text-gray-400'}`}>Attendance Records</Text>
              </Pressable>
            </Link>
            <Link href="/grades" asChild>
              <Pressable className={`rounded-lg p-4 w-[48%] shadow-sm mb-4 ${theme === 'light'? 'bg-white': 'bg-slate-700'}`}>
                <Text className={`font-medium text-center my-auto ${theme === 'light'? 'text-teal-900': 'text-gray-400'}`}>Submit Grades</Text>
              </Pressable>
            </Link>
            <Link href="/leaverequests" asChild>
              <Pressable className={`rounded-lg p-4 w-[48%] shadow-sm mb-4 ${theme === 'light'? 'bg-white': 'bg-slate-700'}`}>
                <Text className={`font-medium text-center my-auto ${theme === 'light'? 'text-teal-900': 'text-gray-400'}`}>Leave Requests</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Pending Tasks */}
        <View className="">
          <Text className={`text-xl font-bold mb-3 ${theme === 'light'? 'text-teal-950' : 'text-teal-400'}`}>Pending Tasks</Text>
          <View className={`${theme === 'light'?'bg-white': 'bg-slate-700'} rounded-lg p-4 shadow-sm mb-4`}>
            <Text className={`${theme === 'light'?'text-gray-900': 'text-gray-200'}  font-medium mb-2`}>Grade Math Assignments</Text>
            <Text className="text-gray-500 text-sm">Due: End of the day</Text>
          </View>
          <View className={`${theme === 'light'?'bg-white': 'bg-slate-700'} rounded-lg p-4 shadow-sm mb-4`}>
            <Text className={`${theme === 'light'?'text-gray-900': 'text-gray-200'}  font-medium mb-2`}>Update Attendance for Class 8B</Text>
            <Text className="text-gray-500 text-sm">Pending since yesterday</Text>
          </View>
        </View>
      </ScrollView>
      <StatusBar
        backgroundColor={theme === 'dark' ? 'black' : '#f8fafc'}
        style={theme === 'dark' ? '#f8fafc' : 'dark'}
      />
    </SafeAreaView>
  );
};

export default Home;
