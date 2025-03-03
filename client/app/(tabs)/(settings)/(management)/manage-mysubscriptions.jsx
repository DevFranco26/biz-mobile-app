// File: app/(tabs)/(settings)/(management)/manage-mysubscription.jsx

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert, Pressable, Modal, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import useThemeStore from "../../../../store/themeStore";
import useUserStore from "../../../../store/userStore";
import useSubscriptionStore from "../../../../store/subscriptionStore";
import useSubscriptionPlansStore from "../../../../store/subscriptionPlansStore";
import useCompanyStore from "../../../../store/companyStore";
import { getMaxUsers } from "../../../../utils/maxUsers";

function formatDateTime(dt) {
  if (!dt) return "N/A";
  return new Date(dt).toLocaleString();
}

const MySubscriptions = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const accentColor = isLightTheme ? "#c2410c" : "#6B7280";
  const { user } = useUserStore();
  const { currentSubscription, loadingCurrent, fetchCurrentSubscription, cancelSubscription } = useSubscriptionStore();
  const { subscriptionPlans, loadingPlans, fetchSubscriptionPlans } = useSubscriptionPlansStore();
  const { companyUserCounts, fetchCompanyUserCount } = useCompanyStore();
  const [token, setToken] = useState(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const planName = currentSubscription?.plan?.planName || "N/A";
  const isFreePlan = planName.toLowerCase().includes("free");
  const currentUserCount = companyUserCounts[user?.companyId] || 0;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchCurrentSubscription(token);
    await fetchSubscriptionPlans(token);
    if (user?.companyId) {
      await fetchCompanyUserCount(token, user.companyId);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    const init = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      if (!storedToken) {
        Alert.alert("Auth Error", "Please sign in again.");
        router.replace("(auth)/login-user");
        return;
      }
      setToken(storedToken);
      await fetchCurrentSubscription(storedToken);
      await fetchSubscriptionPlans(storedToken);
      if (user?.companyId) {
        await fetchCompanyUserCount(storedToken, user.companyId);
      }
    };
    init();
  }, [user?.companyId, fetchCurrentSubscription, fetchSubscriptionPlans, fetchCompanyUserCount, router]);

  const confirmCancelSubscription = () => {
    Alert.alert("Confirm Cancellation", "Are you sure you want to cancel your current subscription immediately?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          if (!token) return;
          await cancelSubscription(token);
        },
      },
    ]);
  };

  const handleCancel = async () => {
    if (!token) return;
    const planMax = getMaxUsers(currentSubscription?.plan?.rangeOfUsers);
    if (currentUserCount > planMax) {
      Alert.alert(
        "Cannot Cancel",
        `You currently have ${currentUserCount} users, which exceeds the plan's maximum (${planMax}).\n\nPlease remove users or choose a different plan before canceling.`
      );
      return;
    }
    confirmCancelSubscription();
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
      <View className="px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back-outline" size={24} color={isLightTheme ? "#333" : "#fff"} />
        </Pressable>
        <Text className={`text-xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>My Subscription</Text>
      </View>
      {loadingCurrent ? (
        <ActivityIndicator size="large" color={accentColor} className="mt-8" />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6B7280"]} tintColor={isLightTheme ? "#6B7280" : "#6B7280"} />
          }
          className="px-4"
        >
          {currentSubscription ? (
            <View className={`p-4 mt-4 rounded-lg ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
              <Text className={`text-lg font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Current Plan: {planName}</Text>
              <Text className={`text-base mt-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                Price: ${currentSubscription?.plan?.price ?? "0.00"}
              </Text>
              <Text className={`text-base ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                Range of Users: {currentSubscription?.plan?.rangeOfUsers || "N/A"}
              </Text>
              <Text className={`text-base ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                Max Users: {getMaxUsers(currentSubscription?.plan?.rangeOfUsers)}
              </Text>
              <Text className={`text-sm mt-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                Payment Method: {currentSubscription.paymentMethod || "N/A"}
              </Text>
              <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                Payment Date: {formatDateTime(currentSubscription.paymentDateTime)}
              </Text>
              <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                Expiration: {formatDateTime(currentSubscription.expirationDateTime)}
              </Text>
              <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                Renewal: {formatDateTime(currentSubscription.renewalDateTime)}
              </Text>
              <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Status: {currentSubscription.status}</Text>
              {currentSubscription.plan?.features && (
                <View className="mt-2">
                  <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Features:</Text>
                  {Object.entries(currentSubscription.plan.features).map(([feature, available]) => (
                    <View key={feature} className="flex-row items-center mt-1">
                      <Ionicons name={available ? "checkmark-circle" : "lock-closed"} size={16} color="#f97316" />
                      <Text className={`ml-2 text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                        {feature.charAt(0).toUpperCase() + feature.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <View className="flex-row mt-6 ml-auto">
                {!isFreePlan && (
                  <Pressable onPress={handleCancel} className="mr-4 p-3 rounded-lg">
                    <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"} font-semibold`}>Cancel</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setPlanModalVisible(true)} className="p-3 rounded-lg bg-orange-500">
                  <Text className="text-white font-semibold">Upgrade</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="mt-4">
              <Text className={`text-lg font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>You have no active subscription.</Text>
              <Pressable onPress={() => setPlanModalVisible(true)} className={`mt-4 p-3 rounded-lg ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                <Text className={`text-center font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Create/Upgrade Subscription</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}
      <Modal
        visible={planModalVisible}
        transparent={false}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
          <View className="flex-row justify-center items-center p-4">
            <TouchableOpacity onPress={() => setPlanModalVisible(false)}>
              <Ionicons name="arrow-down-outline" size={28} color={isLightTheme ? "#374151" : "#d1d5db"} />
            </TouchableOpacity>
          </View>
          {loadingPlans ? (
            <ActivityIndicator size="large" color={accentColor} className="mt-8" />
          ) : (
            <ScrollView className="px-4">
              <Text className={`text-xl font-bold mb-4 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Choose a Subscription Plan</Text>
              {[...subscriptionPlans]
                .sort((a, b) => a.id - b.id)
                .map((plan) => {
                  const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
                  const planMaxUsers = getMaxUsers(plan.rangeOfUsers);
                  const cannotDowngrade = currentUserCount > planMaxUsers;
                  const handlePlanPress = () => {
                    if (cannotDowngrade) {
                      Alert.alert(
                        "Plan Not Available",
                        `You have ${currentUserCount} users, which exceeds this plan’s maximum (${planMaxUsers}).\n\nPlease remove users or select a different plan.`
                      );
                      return;
                    }
                    if (selectedPlan?.id === plan.id) setSelectedPlan(null);
                    else setSelectedPlan(plan);
                  };
                  const containerStyle = isCurrentPlan ? "border-2 border-orange-500" : isLightTheme ? "bg-slate-100" : "bg-slate-800";
                  const textColorClass = cannotDowngrade ? "text-slate-500" : isLightTheme ? "text-slate-800" : "text-slate-200";
                  return (
                    <Pressable key={plan.id} onPress={handlePlanPress} disabled={cannotDowngrade} className={`p-4 mb-3 rounded-lg ${containerStyle}`}>
                      <View className="flex-row justify-between items-start">
                        <Text className={`text-base font-semibold ${textColorClass}`}>
                          {plan.planName} — ${plan.price}
                        </Text>
                        {isCurrentPlan && <Text className="text-sm font-semibold text-orange-500">(Current Plan)</Text>}
                      </View>
                      {plan.rangeOfUsers && (
                        <Text className={`text-xs mt-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                          Range of Users: {plan.rangeOfUsers}
                          {cannotDowngrade && <Text className="text-red-500"> (Not Available)</Text>}
                        </Text>
                      )}
                      {selectedPlan?.id === plan.id && !cannotDowngrade && (
                        <View className="mt-2">
                          {plan.description && (
                            <Text className={`text-xs ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Description: {plan.description}</Text>
                          )}
                          <Text className={`text-sm mt-1 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Features:</Text>
                          {Object.entries(plan.features).map(([feature, available]) => (
                            <View key={feature} className="flex-row items-center mt-1">
                              <Ionicons name={available ? "checkmark-circle" : "lock-closed"} size={16} color={available ? "#f97316" : "#6B7280"} />
                              <Text className={`ml-2 text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                                {feature.charAt(0).toUpperCase() + feature.slice(1)}
                              </Text>
                            </View>
                          ))}
                          <View className="mt-6">
                            <Pressable
                              onPress={() => {
                                console.log("Subscribe pressed for plan:", plan);
                                // First close the modal
                                setPlanModalVisible(false);
                                // Then navigate to the payment screen with the plan details
                                router.push({
                                  pathname: "(auth)/payment",
                                  params: {
                                    planId: plan.id,
                                    planName: plan.planName,
                                    planPrice: plan.price,
                                  },
                                });
                              }}
                              className="bg-orange-500 px-4 py-4 rounded-lg"
                            >
                              <Text className="text-white text-center">Subscribe</Text>
                            </Pressable>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default MySubscriptions;
