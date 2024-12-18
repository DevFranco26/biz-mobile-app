// File: app/(tabs)/(settings)/User.jsx

import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons, Entypo } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const User = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const headerBg = isLightTheme ? 'bg-slate-100' : 'bg-slate-800';
  const headerTextColor = isLightTheme ? 'text-slate-800' : 'text-white';
  const cardBg = isLightTheme ? 'bg-slate-100' : 'bg-slate-800';
  const accentColor = isLightTheme ? '#c2410c' : '#f97316'; 

  const navigateToFeature = (featurePath) => {
    router.push(featurePath);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      edges={['top']}
    >
      {/* Header Section */}
      <View
        className={`rounded-xl py-6 px-4 my-4 mx-4 ${headerBg}`}
      >
        <View className="flex-row items-center mb-3">
          <Ionicons
            name="person-outline"
            size={32}
            color={accentColor}
            style={{ marginRight: 10 }}
          />
          <Text className={`text-2xl font-bold ${headerTextColor}`}>
            User Dashboard
          </Text>
        </View>
        <Text className={`text-sm ${headerTextColor}`}>
          Manage your profile, view shifts, and stay updated.
        </Text>
      </View>

      {/* Feature Categories - Scrollable */}
      <ScrollView
        className="flex-1 px-4 pb-6"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View className="space-y-5">
          {/* View Profile */}
          {/* <Pressable
            onPress={() => navigateToFeature('./ViewProfile')}
            className={`p-4 rounded-xl flex-row items-center shadow-sm my-2 ${cardBg}`}
            accessibilityLabel="View Profile"
            accessibilityHint="Navigate to View Profile screen"
          >
            <Ionicons
              name="person-circle-outline"
              size={28}
              color={accentColor}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text className={`text-lg font-semibold ${headerTextColor}`}>
                View Profile
              </Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                Check and update your personal details.
              </Text>
            </View>
          </Pressable> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default User;
