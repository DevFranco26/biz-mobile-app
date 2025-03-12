// File: app/(tabs)/(settings)/(management)/superadmin-subscriptions.jsx

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import useThemeStore from "../../../../store/themeStore";
import useSubscriptionStore from "../../../../store/subscriptionStore";
import useCompanyStore from "../../../../store/companyStore";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

const Subscriptions = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const accentColor = isLightTheme ? "#c2410c" : "#f97316";
  const { allSubscriptions, loadingAll, fetchAllSubscriptions } = useSubscriptionStore();
  const { fetchCompanyUserCount, companyUserCounts } = useCompanyStore();
  const [token, setToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      if (!storedToken) {
        Alert.alert("Auth Error", "Please sign in again.");
        router.replace("(auth)/login-user");
        return;
      }
      setToken(storedToken);
      await fetchAllSubscriptions(storedToken);
    };
    init();
  }, [fetchAllSubscriptions, router]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!token || !allSubscriptions?.length) return;
      for (const sub of allSubscriptions) {
        const cId = sub.company?.id;
        if (cId) {
          await fetchCompanyUserCount(token, cId);
        }
      }
    };
    fetchCounts();
  }, [allSubscriptions, token, fetchCompanyUserCount]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchAllSubscriptions(token);
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
      <View className="px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back-outline" size={24} color={isLightTheme ? "#333" : "#fff"} />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Subscribers</Text>
      </View>
      <ScrollView className="flex-1 px-4" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Text className={`text-lg font-bold mt-4 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Monitor subscriptions</Text>
        {loadingAll ? (
          <ActivityIndicator size="large" color={accentColor} className="mt-4" />
        ) : !allSubscriptions?.length ? (
          <Text className={`text-center mt-4 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>No subscriptions found.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 10 }}>
            <View style={{ minWidth: 600 }}>
              <View className={`flex-row items-center px-2 py-2 rounded-md ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`}>
                <Text
                  className="text-xs font-semibold text-left"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    width: 80,
                    color: isLightTheme ? "#1e293b" : "#cbd5e1",
                    flexShrink: 0,
                  }}
                >
                  COMPANY
                </Text>
                <Text
                  className="text-xs font-semibold text-center"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    width: 50,
                    color: isLightTheme ? "#1e293b" : "#cbd5e1",
                    flexShrink: 0,
                  }}
                >
                  PLAN
                </Text>
                <Text
                  className="text-xs font-semibold text-center"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    width: 60,
                    color: isLightTheme ? "#1e293b" : "#cbd5e1",
                    flexShrink: 0,
                  }}
                >
                  USERS
                </Text>
                <Text
                  className="text-xs font-semibold text-center"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    width: 60,
                    color: isLightTheme ? "#1e293b" : "#cbd5e1",
                    flexShrink: 0,
                  }}
                >
                  STATUS
                </Text>
                <Text
                  className="text-xs font-semibold text-center"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    width: 60,
                    color: isLightTheme ? "#1e293b" : "#cbd5e1",
                    flexShrink: 0,
                  }}
                >
                  START
                </Text>
                <Text
                  className="text-xs font-semibold text-center"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    width: 60,
                    color: isLightTheme ? "#1e293b" : "#cbd5e1",
                    flexShrink: 0,
                  }}
                >
                  END
                </Text>
              </View>
              {allSubscriptions.map((sub) => {
                const companyId = sub.companyId;
                const companyName = sub.company?.name || "No Company";
                const planName = sub.plan?.planName || "N/A";
                const maxUsers = sub.plan?.rangeOfUsers || 0;
                const userCount = companyUserCounts[companyId] || 0;
                const status = sub.status;
                const startStr = formatDate(sub.paymentDateTime);
                const endStr = formatDate(sub.expirationDateTime);
                return (
                  <View key={sub.id} className={`flex-row items-center border-b px-2 py-2 ${isLightTheme ? "border-slate-300" : "border-slate-700"}`}>
                    <Text
                      className="text-xs text-left"
                      style={{
                        width: 80,
                        color: isLightTheme ? "#1e293b" : "#cbd5e1",
                        flexWrap: "wrap",
                        flexShrink: 0,
                      }}
                    >
                      {companyName}
                    </Text>
                    <Text
                      className="text-xs text-center"
                      style={{
                        width: 50,
                        color: isLightTheme ? "#1e293b" : "#cbd5e1",
                        flexWrap: "wrap",
                        flexShrink: 0,
                      }}
                    >
                      {planName}
                    </Text>
                    <Text
                      className="text-xs text-center"
                      style={{
                        width: 60,
                        color: isLightTheme ? "#1e293b" : "#cbd5e1",
                        flexWrap: "wrap",
                        flexShrink: 0,
                      }}
                    >
                      {userCount}/{maxUsers}
                    </Text>
                    <Text
                      className="text-xs text-center"
                      style={{
                        width: 60,
                        color: isLightTheme ? "#1e293b" : "#cbd5e1",
                        flexWrap: "wrap",
                        flexShrink: 0,
                      }}
                    >
                      {status}
                    </Text>
                    <Text
                      className="text-xs text-center"
                      style={{
                        width: 60,
                        color: isLightTheme ? "#1e293b" : "#cbd5e1",
                        flexWrap: "wrap",
                        flexShrink: 0,
                      }}
                    >
                      {startStr}
                    </Text>
                    <Text
                      className="text-xs text-center"
                      style={{
                        width: 60,
                        color: isLightTheme ? "#1e293b" : "#cbd5e1",
                        flexWrap: "wrap",
                        flexShrink: 0,
                      }}
                    >
                      {endStr}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Subscriptions;
