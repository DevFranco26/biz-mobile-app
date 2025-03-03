// File: client/app/(tabs)/(settings)/(management)/preference.jsx

import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import useThemeStore from "../../../../store/themeStore";

const Preferences = () => {
  const router = useRouter();
  const { theme, setTheme } = useThemeStore();
  const isLightTheme = theme === "light";

  // Define theme options
  const themeOptions = [
    {
      label: "Light",
      value: "light",
      icon: "sunny-outline",
    },
    {
      label: "Dark",
      value: "dark",
      icon: "moon-outline",
    },
  ];

  // Handle theme selection
  const handleThemeChange = (selectedTheme) => {
    setTheme(selectedTheme);
    // Optionally, you can show a toast or a non-intrusive notification instead of an alert
    // Alert.alert(
    //   'Theme Updated',
    //   `Theme set to ${selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)} mode.`,
    //   [{ text: 'OK' }],
    //   { cancelable: true }
    // );
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"} p-4`} edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <Pressable onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back-outline" size={28} color={isLightTheme ? "#1f2937" : "#f9fafb"} />
        </Pressable>
        <Text className={`text-lg font-extrabold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Preferences</Text>
      </View>

      {/* Theme Selection */}
      <View className="space-y-4">
        <Text className={`text-xl font-semibold ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Theme</Text>
        {themeOptions.map((option) => (
          <Pressable
            key={option.value}
            className={`flex-row items-center p-4 my-2 rounded-lg ${
              theme === option.value ? (isLightTheme ? "bg-orange-500/10" : "bg-orange-500/10") : isLightTheme ? "bg-slate-100" : "bg-slate-800"
            }`}
            onPress={() => handleThemeChange(option.value)}
          >
            <Ionicons
              name={option.icon}
              size={24}
              color={
                theme === option.value
                  ? "#f97316" // Orange accent for selected
                  : "#6b7280" // Gray for unselected
              }
              className="mr-4"
            />
            <Text className={`text-lg font-medium ${theme === option.value ? "text-orange-500" : isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
              {option.label}
            </Text>
            {/* Show checkmark if selected */}
            {theme === option.value && <Ionicons name="checkmark-circle" size={20} color="#f97316" className="absolute right-4" />}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
};

export default Preferences;
