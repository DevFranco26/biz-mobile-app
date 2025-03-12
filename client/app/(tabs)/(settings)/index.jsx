// File: client/app/(tabs)/(settings)/index.jsx

import React, { useEffect } from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import useAuthStore from "../../../store/useAuthStore";
import { useRouter } from "expo-router";
import Settings from "./settings";

const SettingsIndex = () => {
  const { user, loading, error, loadUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900">
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900 px-4">
        <Text className="text-red-500 text-lg text-center">{error}</Text>
        <Pressable
          onPress={() => {
            loadUser();
          }}
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
        >
          <Text className="text-white">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-slate-900 px-4">
        <Text className="text-slate-700 dark:text-slate-200 text-lg text-center mb-4">You are not signed in.</Text>
        <Pressable onPress={() => router.push("/(auth)/login-user")} className="bg-blue-500 px-4 py-2 rounded-lg">
          <Text className="text-white">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  // Otherwise, load the consolidated Settings screen
  return <Settings />;
};

export default SettingsIndex;
