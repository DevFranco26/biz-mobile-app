// File: client/app/(auth)/upgrade-subscription.jsx
import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, SafeAreaView, StatusBar, Platform, ScrollView, Image } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "../../config/constant";
import useSubscriptionStore from "../../store/subscriptionStore";
import useThemeStore from "../../store/themeStore";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

export default function UpgradeSubscription() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";

  // Retrieve plan details passed from the modal in manage-mysubscriptions
  const { planId, planName, planPrice, planFeatures, currentPlanName } = params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);
  const { upgradeSubscription } = useSubscriptionStore();
  const [token, setToken] = useState(null);

  const fetchPaymentSheetParams = async () => {
    try {
      console.log("Fetching payment params for upgrade:", { planId, planName, planPrice });
      const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(Number(planPrice) * 100),
          planId: planId,
          // Optionally, include a flag such as isUpgrade: true if your backend requires it
        }),
      });
      const data = await response.json();
      console.log("Payment sheet params:", data);
      if (!data.paymentIntent || !data.ephemeralKey || !data.customer) {
        throw new Error("Missing payment parameters from backend.");
      }
      return {
        paymentIntent: data.paymentIntent,
        ephemeralKey: data.ephemeralKey,
        customer: data.customer,
      };
    } catch (error) {
      console.error("Error fetching payment sheet params:", error);
      Alert.alert("Error", "Unable to fetch payment parameters.");
      return {};
    }
  };

  const initializePaymentSheet = async () => {
    setLoading(true);
    const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();
    if (!paymentIntent || !ephemeralKey || !customer) {
      setLoading(false);
      setInitializing(false);
      return;
    }
    const { error } = await initPaymentSheet({
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      returnURL: "yourapp://stripe-redirect",
      merchantDisplayName: "Biz Buddy",
      style: isLightTheme ? "automatic" : "alwaysDark",
    });
    if (error) {
      console.error("Error initializing payment sheet:", error);
      Alert.alert("Error", error.message);
    } else {
      setPaymentSheetEnabled(true);
      console.log("Payment sheet initialized successfully.");
    }
    setLoading(false);
    setInitializing(false);
  };

  useEffect(() => {
    const getToken = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      setToken(storedToken);
    };
    getToken();
    initializePaymentSheet();
  }, []);

  const openPaymentSheet = async () => {
    setLoading(true);
    console.log("Presenting payment sheet for upgrade...");
    const { error } = await presentPaymentSheet();
    if (error) {
      console.error("Payment error:", error);
      Alert.alert("Payment failed", error.message);
      setLoading(false);
    } else {
      // After payment succeeds, call the upgrade endpoint to update the subscription record
      if (!token) {
        Alert.alert("Error", "Authentication token not found.");
        setLoading(false);
        return;
      }
      const result = await upgradeSubscription(token, planId, "stripe");
      if (result.success) {
        Alert.alert("Success", "Your subscription has been upgraded successfully!");
        router.push("/(tabs)/(settings)/(management)/manage-mysubscriptions");
      } else {
        Alert.alert("Error", "Subscription upgrade failed. Please contact support.");
      }
      setLoading(false);
    }
  };

  // Parse features if they were passed as a string
  const parsedFeatures = planFeatures ? (typeof planFeatures === "string" ? JSON.parse(planFeatures) : planFeatures) : null;

  // Get plan color based on plan name
  const getPlanColor = (name) => {
    const planNameLower = (name || "").toLowerCase();
    if (planNameLower.includes("basic")) {
      return {
        bg: isLightTheme ? "bg-purple-500" : "bg-purple-600",
        bgLight: isLightTheme ? "bg-purple-50" : "bg-purple-900/30",
        text: isLightTheme ? "text-purple-500" : "text-purple-400",
        border: isLightTheme ? "border-purple-200" : "border-purple-800",
      };
    } else if (planNameLower.includes("pro")) {
      return {
        bg: isLightTheme ? "bg-orange-500" : "bg-orange-600",
        bgLight: isLightTheme ? "bg-orange-50" : "bg-orange-900/30",
        text: isLightTheme ? "text-orange-500" : "text-orange-400",
        border: isLightTheme ? "border-orange-200" : "border-orange-800",
      };
    } else if (planNameLower.includes("premium") || planNameLower.includes("enterprise")) {
      return {
        bg: isLightTheme ? "bg-indigo-500" : "bg-indigo-600",
        bgLight: isLightTheme ? "bg-indigo-50" : "bg-indigo-900/30",
        text: isLightTheme ? "text-indigo-500" : "text-indigo-400",
        border: isLightTheme ? "border-indigo-200" : "border-indigo-800",
      };
    } else {
      return {
        bg: isLightTheme ? "bg-blue-500" : "bg-blue-600",
        bgLight: isLightTheme ? "bg-blue-50" : "bg-blue-900/30",
        text: isLightTheme ? "text-blue-500" : "text-blue-400",
        border: isLightTheme ? "border-blue-200" : "border-blue-800",
      };
    }
  };

  const planColor = getPlanColor(planName);

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}
      style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
    >
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} />

      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable onPress={() => router.back()} className={`p-2 rounded-full ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
          <Ionicons name="arrow-back" size={24} color={isLightTheme ? "#334155" : "#e2e8f0"} />
        </Pressable>
        <Text className={`text-xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Upgrade Subscription</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {initializing ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color={isLightTheme ? "#f97316" : "#fdba74"} />
            <Text className={`mt-4 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Preparing your upgrade...</Text>
          </View>
        ) : (
          <>
            <View className="items-center mb-6">
              <View className={`w-20 h-20 rounded-full mb-4 items-center justify-center ${planColor.bgLight}`}>
                <Ionicons name="trending-up" size={36} color={isLightTheme ? "#f97316" : "#fdba74"} />
              </View>
              <Text className={`text-2xl font-bold text-center ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Upgrade to {planName} Plan </Text>
              <Text className={`text-base mt-2 text-center ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                You're upgrading from {currentPlanName || "your current plan"}
              </Text>
            </View>

            <View
              className={`rounded-2xl overflow-hidden mb-6 ${isLightTheme ? "bg-white" : "bg-slate-800"}`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className={`px-5 py-4 ${planColor.bg}`}>
                <Text className="text-xl font-bold text-white">{planName} Plan</Text>
              </View>

              <View className="p-5">
                <View className="flex-row justify-between items-center py-3 border-b border-dashed mb-4 border-slate-300">
                  <Text className={`text-base ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Monthly Subscription</Text>
                  <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                    ${planPrice}
                    <Text className={`text-sm font-normal ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>/month</Text>
                  </Text>
                </View>

                {parsedFeatures && (
                  <View>
                    <Text className={`font-medium mb-3 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Features included:</Text>
                    {Object.entries(parsedFeatures).map(([feature, enabled]) => (
                      <View key={feature} className="flex-row items-center mb-2">
                        <Ionicons name={enabled ? "checkmark-circle" : "close-circle"} size={18} color={enabled ? "#10b981" : "#ef4444"} />
                        <Text className={`ml-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/-/g, " ")}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View className={`rounded-xl p-4 mb-6 ${isLightTheme ? "bg-blue-50" : "bg-blue-900/20"}`}>
              <View className="flex-row">
                <Ionicons name="information-circle" size={22} color={isLightTheme ? "#3b82f6" : "#93c5fd"} style={{ marginRight: 8 }} />
                <Text className={`flex-1 ${isLightTheme ? "text-blue-700" : "text-blue-300"}`}>
                  Your subscription will be upgraded immediately after payment.
                </Text>
              </View>
            </View>

            <View className={`rounded-xl p-4 mb-8 ${isLightTheme ? "bg-slate-50" : "bg-slate-800"}`}>
              <Text className={`font-medium mb-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Payment Summary</Text>
              <View className="flex-row justify-between mb-2">
                <Text className={isLightTheme ? "text-slate-600" : "text-slate-400"}>{planName} Plan</Text>
                <Text className={isLightTheme ? "text-slate-600" : "text-slate-400"}>${planPrice}/month</Text>
              </View>
              <View className="border-t border-dashed border-slate-300 my-2" />
              <View className="flex-row justify-between">
                <Text className={`font-medium ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Total to pay now</Text>
                <Text className={`font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>${planPrice}</Text>
              </View>
            </View>

            <View className="mb-4">
              <Image
                source={{
                  uri: "https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4G6gFVsG4=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()-stripe-logo-90A6A69B67-seeklogo.com-5c6a49e746e0fb00017e517b.png",
                }}
                style={{ height: 30, width: 70, resizeMode: "contain", alignSelf: "center", opacity: 0.7 }}
              />
            </View>

            <Pressable
              disabled={!paymentSheetEnabled || loading}
              onPress={openPaymentSheet}
              className={`w-full py-4 rounded-xl flex-row justify-center items-center mb-4 ${
                paymentSheetEnabled && !loading ? planColor.bg : "bg-gray-400"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="card-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              )}
              <Text className="text-white text-center text-base font-semibold">{loading ? "Processing..." : `Pay $${planPrice} Now`}</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              className={`w-full py-4 rounded-xl border-2 flex-row justify-center items-center ${isLightTheme ? "border-slate-300" : "border-slate-700"}`}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color={isLightTheme ? "#64748b" : "#94a3b8"} style={{ marginRight: 8 }} />
              <Text className={`text-center text-base font-semibold ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Cancel Upgrade</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
