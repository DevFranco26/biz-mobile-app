import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, RefreshControl, SafeAreaView, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import useThemeStore from "../../../../store/themeStore";
import useAuthStore from "../../../../store/useAuthStore";
import useSubscriptionStore from "../../../../store/subscriptionStore";
import { WEBSITE_URL } from "../../../../config/constant";

function formatDateTime(dt) {
  if (!dt) return "N/A";
  return new Date(dt).toLocaleDateString();
}

const MySubscriptions = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const { user } = useAuthStore();
  const { currentSubscription, loadingCurrent, fetchCurrentSubscription } = useSubscriptionStore();
  const [token, setToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      if (!storedToken) {
        router.replace("(auth)/signin");
        return;
      }
      setToken(storedToken);
      await fetchCurrentSubscription(storedToken);
    };
    init();
  }, [fetchCurrentSubscription, router]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchCurrentSubscription(token);
    setRefreshing(false);
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
      <View className="px-4 py-3 flex-row items-center">
        <Ionicons name="chevron-back-outline" size={24} color={isLightTheme ? "#333" : "#fff"} />
        <Text className={`text-xl font-bold ml-2 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>My Subscription</Text>
      </View>
      {loadingCurrent ? (
        <ActivityIndicator size="large" color={isLightTheme ? "#333" : "#fff"} className="mt-8" />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6B7280"]} />}
        >
          {currentSubscription ? (
            <View className={`p-4 rounded-lg ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
              <Text className={`text-lg font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                Current Plan: {currentSubscription.plan?.planName || "N/A"}
              </Text>
              <Text className={`text-base mt-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                Price: ${currentSubscription.plan?.price ?? "0.00"}
              </Text>
              <Text className={`text-base ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                Expiration: {formatDateTime(currentSubscription.expirationDateTime)}
              </Text>
              <Text className={`text-base ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Status: {currentSubscription.status}</Text>
            </View>
          ) : (
            <View className="mt-4">
              <Text className={`text-lg font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>You have no active subscription.</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => Linking.openURL(WEBSITE_URL)} className="mt-6 self-center p-2">
            <Text className={`text-sm text-center ${isLightTheme ? "text-blue-600" : "text-blue-400"}`}>Need help? Visit our website</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MySubscriptions;
