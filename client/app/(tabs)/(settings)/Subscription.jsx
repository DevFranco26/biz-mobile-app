// File: app/(tabs)/(settings)/subscription.jsx

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const Subscription = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}
      edges={['top']}
    >
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
          Subscription
        </Text>
      </View>

      {/* Subscription Content */}
      <View className="flex-1 px-4 py-6">
        {/* Subscription Plan */}
        <View className={`p-4 rounded-lg ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}>
          <Text className={`text-xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
            Current Plan: Professional
          </Text>
          <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'} mt-2`}>
            You have access to all features and priority support.
          </Text>
        </View>

        {/* Upgrade Button */}
        <Pressable
          onPress={() => router.push('upgrade-subscription')}
          className={`mt-6 py-4 rounded-lg items-center ${
            isLightTheme ? 'bg-orange-700' : 'bg-orange-600'
          }`}
        >
          <Text className="text-white text-lg font-semibold">Upgrade Plan</Text>
        </Pressable>

        {/* Subscription Details */}
        <View className="mt-8">
          <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
            Subscription Details
          </Text>
          <View className="mt-4">
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>
              Next Billing Date: <Text className="font-semibold">September 30, 2023</Text>
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-200'} mt-2`}>
              Payment Method: <Text className="font-semibold">Visa **** 1234</Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Subscription;
