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
  Image,
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
  const [activePlan, setActivePlan] = useState(null);

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

      // Set initial selected plans and active plan
      const initialSelected = {};
      let firstPlanName = null;

      Object.keys(groups).forEach((name, index) => {
        if (groups[name] && groups[name].length > 0) {
          initialSelected[name] = groups[name][0];
          if (index === 0) {
            firstPlanName = name;
          }
        }
      });

      setSelectedPlans(initialSelected);
      setActivePlan(firstPlanName);
    }
  }, [subscriptionPlans]);

  const handleRangeChange = (planName, planId) => {
    const plan = planGroups[planName].find((p) => p.id === planId);
    setSelectedPlans((prev) => ({ ...prev, [planName]: plan }));
  };

  const handleProceedToPayment = (planName) => {
    const selectedPlan = selectedPlans[planName];
    setSelectedPlan(selectedPlan);

    // Skip payment page if the plan is free
    if (selectedPlan.id === 1) {
      router.replace("(auth)/details-user"); // Use replace to prevent going back to the payment page
    } else {
      router.push("(auth)/payment");
    }
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
        return {
          bg: isLightTheme ? "bg-blue-500" : "bg-blue-600",
          bgLight: isLightTheme ? "bg-blue-50" : "bg-blue-900/30",
          text: isLightTheme ? "text-blue-500" : "text-blue-400",
          border: isLightTheme ? "border-blue-200" : "border-blue-800",
        };
      case "basic":
        return {
          bg: isLightTheme ? "bg-purple-500" : "bg-purple-600",
          bgLight: isLightTheme ? "bg-purple-50" : "bg-purple-900/30",
          text: isLightTheme ? "text-purple-500" : "text-purple-400",
          border: isLightTheme ? "border-purple-200" : "border-purple-800",
        };
      case "pro":
        return {
          bg: isLightTheme ? "bg-orange-500" : "bg-orange-600",
          bgLight: isLightTheme ? "bg-orange-50" : "bg-orange-900/30",
          text: isLightTheme ? "text-orange-500" : "text-orange-400",
          border: isLightTheme ? "border-orange-200" : "border-orange-800",
        };
      default:
        return {
          bg: isLightTheme ? "bg-gray-500" : "bg-gray-600",
          bgLight: isLightTheme ? "bg-gray-50" : "bg-gray-900/30",
          text: isLightTheme ? "text-gray-500" : "text-gray-400",
          border: isLightTheme ? "border-gray-200" : "border-gray-800",
        };
    }
  };

  const renderFeatures = (features) => {
    return (
      <View className="mt-4">
        {Object.entries(features).map(([feature, enabled]) => (
          <View key={feature} className="flex-row items-center mb-2">
            <Ionicons name={enabled ? "checkmark-circle" : "close-circle"} size={18} color={enabled ? "#10b981" : "#ef4444"} />
            <Text className={`ml-2 text-sm ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
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
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`} style={{ paddingTop: StatusBar.currentHeight }}>
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            <View className="px-6 py-4">
              <View className="items-center mb-6">
                <View className={`w-16 h-16 rounded-full mb-3 items-center justify-center ${isLightTheme ? "bg-orange-100" : "bg-orange-900"}`}>
                  <Ionicons name="pricetags" size={30} color={isLightTheme ? "#f97316" : "#fdba74"} />
                </View>
                <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Choose Your Plan</Text>
                <Text className={`text-sm mt-1 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                  Select the perfect plan for your business needs
                </Text>
              </View>

              {/* Plan tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" contentContainerStyle={{ paddingRight: 20 }}>
                {Object.keys(planGroups).map((planName) => {
                  const planColor = getPlanColor(planName);
                  const planIcon = getPlanIcon(planName);
                  const isActive = activePlan === planName;

                  return (
                    <Pressable
                      key={planName}
                      onPress={() => setActivePlan(planName)}
                      className={`mr-3 px-4 py-2.5 rounded-full flex-row items-center justify-center ${
                        isActive ? planColor.bg : isLightTheme ? "bg-slate-100" : "bg-slate-800"
                      }`}
                    >
                      <Ionicons name={planIcon} size={18} color={isActive ? "white" : isLightTheme ? "#64748b" : "#94a3b8"} />
                      <Text className={`ml-2 font-medium ${isActive ? "text-white" : isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                        {planName}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <ScrollView
              className="flex-grow"
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {activePlan && selectedPlans[activePlan] && (
                <View
                  className={`rounded-2xl shadow-lg mb-8 overflow-hidden ${isLightTheme ? "bg-white" : "bg-slate-800"}`}
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 10,
                    elevation: 5,
                  }}
                >
                  <View className={`px-6 py-5 ${getPlanColor(activePlan).bg}`}>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name={getPlanIcon(activePlan)} size={24} color="white" />
                        <Text className="text-2xl font-bold text-white ml-2">{activePlan}</Text>
                      </View>
                      <View className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-xs font-medium">{selectedPlans[activePlan].rangeOfUsers}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="p-6">
                    <Text className={`mb-4 ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>{selectedPlans[activePlan].description}</Text>

                    <Text className={`mb-2 font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Select Range of Users:</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                      {planGroups[activePlan].map((plan) => {
                        const isSelected = selectedPlans[activePlan].id === plan.id;
                        const planColor = getPlanColor(activePlan);

                        return (
                          <Pressable
                            key={plan.id}
                            onPress={() => handleRangeChange(activePlan, plan.id)}
                            className={`mr-3 px-4 py-2.5 rounded-lg ${isSelected ? planColor.bg : isLightTheme ? "bg-slate-100" : "bg-slate-700"} ${
                              isSelected ? "border border-white" : ""
                            }`}
                          >
                            <Text className={`text-sm font-medium ${isSelected ? "text-white" : isLightTheme ? "text-slate-700" : "text-slate-200"}`}>
                              {plan.rangeOfUsers}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    <View className={`p-4 rounded-lg mb-4 ${getPlanColor(activePlan).bgLight}`}>
                      <View className="flex-row justify-between items-center">
                        <Text className={`text-base font-medium ${getPlanColor(activePlan).text}`}>Monthly Price</Text>
                        <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                          ${selectedPlans[activePlan].price}
                          <Text className={`text-base font-normal ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>/mo</Text>
                        </Text>
                      </View>
                    </View>

                    <Text className={`font-semibold mb-2 ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Features Included:</Text>
                    {renderFeatures(selectedPlans[activePlan].features)}

                    <Pressable
                      onPress={() => handleProceedToPayment(activePlan)}
                      className={`mt-6 py-4 rounded-lg ${getPlanColor(activePlan).bg}`}
                      style={{
                        shadowColor: activePlan.toLowerCase() === "orange" ? "#f97316" : "#6366f1",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <View className="flex-row justify-center items-center">
                        <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white text-center font-semibold text-lg">Select Plan</Text>
                      </View>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
