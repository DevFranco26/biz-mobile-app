import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

import useThemeStore from "../../../../store/themeStore";
import useUserStore from "../../../../store/userStore";
import { API_BASE_URL } from "../../../../config/constant";

const MyAccount = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore(); // Fix: Use correct function
  const isLightTheme = theme === "light";

  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      if (!storedToken) {
        Alert.alert("Authentication Error", "No token found. Please sign in again.");
        router.replace("(auth)/login-user");
      } else {
        setToken(storedToken);
      }
    };
    init();
  }, []);

  if (!user) {
    return (
      <SafeAreaView edges={["top"]} className={`flex-1 items-center justify-center px-4 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
        <Text className={`mb-4 text-lg ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>You are not signed in.</Text>
        <Pressable onPress={() => router.replace("(auth)/login-user")} className="bg-orange-500 px-4 py-2 rounded-lg">
          <Text className="text-white">Sign In</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Confirm Account Deletion",
      user.role === "admin"
        ? "As an admin, deleting your account will remove your entire company, all employees, and active subscriptions. This action is irreversible."
        : "This action will permanently delete your account. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: proceedWithAccountDeletion,
        },
      ]
    );
  };

  const proceedWithAccountDeletion = async () => {
    if (!token) {
      Alert.alert("Error", "No authentication token. Please sign in again.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/account/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        await SecureStore.deleteItemAsync("token");
        clearUser(); // Fix: Use correct function
        Alert.alert("Account Deleted", "Your account has been deleted.");
        router.replace("(auth)/login-user");
      } else {
        Alert.alert("Error", data.message || "Failed to delete account.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons name="chevron-back-outline" size={24} color={isLightTheme ? "#333333" : "#ffffff"} />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>My Account</Text>
      </View>

      <View className="flex-1 px-4 py-2">
        <View className={`p-4 rounded-xl mb-4 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
          <Text className={`text-xl font-bold mb-2 ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
            {user.firstName} {user.middleName ? ` ${user.middleName}` : ""} {user.lastName}
          </Text>

          <Text className={`text-base ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Role: {user.role}</Text>
          <Text className={`text-base mt-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Email: {user.email}</Text>
          <Text className={`text-base mt-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Phone: {user.phone || "N/A"}</Text>
        </View>

        <Pressable className="bg-red-600 p-4 rounded-xl items-center justify-center mt-4" onPress={handleDeleteAccount} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text className="text-white font-semibold">Delete Account</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default MyAccount;
