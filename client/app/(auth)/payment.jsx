// File: app/(auth)/payment.jsx
import React, { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, SafeAreaView, StatusBar } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import useOnboardingStore from "../../store/globalOnboardingStore";
import useThemeStore from "../../store/themeStore";
import { API_BASE_URL } from "../../config/constant";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const { selectedPlan, setPaymentStatus } = useOnboardingStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);

  const fetchPaymentSheetParams = async () => {
    const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(selectedPlan.price * 100), planId: selectedPlan.id }),
    });
    const { paymentIntent, ephemeralKey, customer } = await response.json();
    return { paymentIntent, ephemeralKey, customer };
  };

  const initializePaymentSheet = async () => {
    setLoading(true);
    try {
      const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();
      const { error } = await initPaymentSheet({
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        returnURL: "yourapp://stripe-redirect",
        merchantDisplayName: "Biz Buddy",
        style: isLightTheme ? "automatic" : "alwaysDark",
      });

      if (!error) {
        setPaymentSheetEnabled(true);
      } else {
        Alert.alert("Error", error.message);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to initialize payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      Alert.alert("Payment failed", error.message);
    } else {
      setPaymentStatus("paid");
      router.push("(auth)/details-user");
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`} style={{ paddingTop: StatusBar.currentHeight }}>
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} />

      <View className="flex-1 px-6">
        <View className="flex-row items-center justify-between py-4">
          <Pressable onPress={() => router.back()} className={`p-2 rounded-full ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
            <Ionicons name="arrow-back" size={24} color={isLightTheme ? "#334155" : "#e2e8f0"} />
          </Pressable>
          <Text className={`text-xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Payment</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 justify-center items-center">
          {selectedPlan && (
            <View
              className={`w-full rounded-2xl p-6 mb-8 ${isLightTheme ? "bg-slate-50" : "bg-slate-800"}`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className={`text-2xl font-bold mb-2 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>{selectedPlan.planName} Plan</Text>
              <Text className={`mb-4 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>{selectedPlan.description}</Text>

              <View className="flex-row justify-between items-center py-3 border-t border-b mb-4 border-dashed border-slate-300">
                <Text className={`${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>{selectedPlan.rangeOfUsers}</Text>
                <Text className={`text-xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                  ${selectedPlan.price}
                  <Text className={`text-sm font-normal ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>/month</Text>
                </Text>
              </View>

              <View className="mb-4">
                <Text className={`font-medium mb-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Included features:</Text>
                {selectedPlan.features &&
                  Object.entries(selectedPlan.features)
                    .filter(([_, enabled]) => enabled)
                    .map(([feature, _]) => (
                      <View key={feature} className="flex-row items-center mb-1.5">
                        <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                        <Text className={`ml-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/-/g, " ")}
                        </Text>
                      </View>
                    ))}
              </View>
            </View>
          )}

          {loading ? (
            <View className="items-center">
              <ActivityIndicator size="large" color="#f97316" />
              <Text className={`mt-4 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Preparing payment...</Text>
            </View>
          ) : (
            <View className="w-full">
              <Pressable
                disabled={!paymentSheetEnabled}
                onPress={openPaymentSheet}
                className={`w-full py-4 rounded-xl flex-row justify-center items-center ${paymentSheetEnabled ? "bg-orange-500" : "bg-orange-300"}`}
                style={{
                  shadowColor: "#f97316",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons name="card-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text className="text-white text-center text-base font-semibold">Pay ${selectedPlan?.price || "0"} Now</Text>
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                className="mt-4 py-4 w-full rounded-xl border-2 border-slate-300 flex-row justify-center items-center"
              >
                <Ionicons name="arrow-back" size={20} color={isLightTheme ? "#64748b" : "#94a3b8"} style={{ marginRight: 8 }} />
                <Text className={`text-center text-base font-semibold ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Back to Plans</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
