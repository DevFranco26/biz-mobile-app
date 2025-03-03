// File: app/(auth)/pricing.jsx

"use client";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import useThemeStore from "../../store/themeStore";
import useSubscriptionPlansStore from "../../store/subscriptionPlansStore";
import { Ionicons } from "@expo/vector-icons";
import useOnboardingStore from "../../store/globalOnboardingStore";

export default function PricingPage() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const { subscriptionPlans, loadingPlans, errorPlans, fetchSubscriptionPlans } = useSubscriptionPlansStore();
  const { selectedPlan, setSelectedPlan } = useOnboardingStore();
  const [planGroups, setPlanGroups] = useState({});
  const [selectedPlans, setSelectedPlans] = useState({});

  useEffect(() => {
    fetchSubscriptionPlans("");
  }, [fetchSubscriptionPlans]);

  useEffect(() => {
    if (subscriptionPlans && subscriptionPlans.length > 0) {
      const groups = subscriptionPlans.reduce((acc, plan) => {
        const key = plan.planName;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(plan);
        return acc;
      }, {});
      Object.keys(groups).forEach((key) => {
        groups[key].sort((a, b) => a.rangeOfUsers.localeCompare(b.rangeOfUsers, undefined, { numeric: true }));
      });
      setPlanGroups(groups);
      const initialSelected = {};
      Object.keys(groups).forEach((name) => {
        if (groups[name] && groups[name].length > 0) {
          initialSelected[name] = groups[name][0];
        }
      });
      setSelectedPlans(initialSelected);
    }
  }, [subscriptionPlans]);

  const handleRangeChange = (planName, planId) => {
    const plan = planGroups[planName].find((p) => p.id === planId);
    setSelectedPlans((prev) => ({ ...prev, [planName]: plan }));
  };

  const handleProceedToPayment = (planName) => {
    const selectedPlan = selectedPlans[planName];
    setSelectedPlan(selectedPlan);
    router.push("(auth)/payment");
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case "free":
        return "gift-outline";
      case "basic":
        return "rocket-outline";
      case "pro":
        return "diamond-outline";
      default:
        return "layers-outline";
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case "free":
        return "bg-blue-500";
      case "basic":
        return "bg-purple-500";
      case "pro":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const renderFeatures = (features) => {
    return (
      <View className="mt-4">
        {Object.entries(features).map(([feature, enabled]) => (
          <View key={feature} className="flex-row items-center mb-2">
            <Ionicons name={enabled ? "checkmark-circle" : "close-circle"} size={20} color={enabled ? "#10b981" : "#ef4444"} />
            <Text className={`ml-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
              {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/-/g, " ")}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (loadingPlans) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text className={`mt-4 ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Loading subscription plans...</Text>
      </SafeAreaView>
    );
  }

  if (errorPlans) {
    return (
      <SafeAreaView className={`flex-1 justify-center items-center ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text className="text-red-500 mt-4 text-center px-6">Error: {errorPlans}</Text>
        <Pressable onPress={() => fetchSubscriptionPlans("")} className="mt-6 py-3 px-6 rounded-full bg-orange-500">
          <Text className="text-white font-medium">Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-gray-100" : "bg-slate-900"}`} style={{ paddingTop: StatusBar.currentHeight }}>
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className="flex-grow"
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className={`text-3xl font-bold text-center mb-8 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Choose Your Plan</Text>
            {Object.keys(planGroups).map((planName) => {
              const selectedPlan = selectedPlans[planName];
              const planColor = getPlanColor(planName);
              const planIcon = getPlanIcon(planName);
              return (
                <View
                  key={planName}
                  className={`rounded-2xl shadow-lg mb-8 overflow-hidden ${isLightTheme ? "bg-white" : "bg-slate-800"}`}
                  style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}
                >
                  <View className={`px-6 py-4 ${planColor}`}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name={planIcon} size={24} color="white" />
                        <Text className="text-2xl font-bold text-white ml-2">{planName}</Text>
                      </View>
                    </View>
                  </View>
                  <View className="p-6">
                    <Text className={`mb-4 ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>{selectedPlan.description}</Text>
                    <Text className={`mb-2 font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Select Range of Users:</Text>
                    <View className="flex-row flex-wrap mb-4">
                      {planGroups[planName].map((plan) => (
                        <Pressable
                          key={plan.id}
                          onPress={() => handleRangeChange(planName, plan.id)}
                          className={`mr-2 mb-2 px-3 py-2 rounded-lg ${
                            selectedPlan.id === plan.id ? `${planColor} border border-white` : isLightTheme ? "bg-gray-200" : "bg-slate-700"
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selectedPlan.id === plan.id ? "text-white" : isLightTheme ? "text-slate-800" : "text-slate-200"
                            }`}
                          >
                            {plan.rangeOfUsers}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <Text className={`text-2xl font-bold mb-4 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                      ${selectedPlan.price}
                      <Text className={`text-base font-normal ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}> / month</Text>
                    </Text>
                    {renderFeatures(selectedPlan.features)}
                    <Pressable onPress={() => handleProceedToPayment(planName)} className={`mt-6 py-3 rounded-lg ${planColor}`}>
                      <Text className="text-white text-center font-semibold text-lg">Select Plan</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
