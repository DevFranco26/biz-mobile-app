// File: client/app/(tabs)/(settings)/settings.jsx

// File: client/app/(tabs)/(settings)/settings.jsx

import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import useThemeStore from "../../../store/themeStore";
import useUserStore from "../../../store/userStore";
import useCompanyStore from "../../../store/companyStore";
import useSubscriptionStore from "../../../store/subscriptionStore";

const Settings = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";

  const { user } = useUserStore();
  const { getCompanyName, fetchCompanyById } = useCompanyStore();
  const { currentSubscription, loadingCurrent, fetchCurrentSubscription } = useSubscriptionStore();

  const headerTextColor = isLightTheme ? "text-slate-800" : "text-slate-300";
  const accentColor = "#f97316";

  const userRole = (user?.role || "").toLowerCase();
  const userName = user ? `${user.firstName}`.trim() : "...";
  const userCompanyName = user?.companyId ? getCompanyName(user.companyId) || "..." : "Unknown";

  const [subscriptionName, setSubscriptionName] = useState("Loading...");
  const [isLocked, setIsLocked] = useState(false);

  const ALLOWED_PLANS = ["basic", "pro"];

  useEffect(() => {
    if (!currentSubscription || !currentSubscription.plan) {
      setSubscriptionName("No active subscription");
      setIsLocked(userRole !== "superadmin");
    } else {
      const planName = currentSubscription.plan?.planName || "Unknown Plan";
      setSubscriptionName(planName);

      if (userRole === "superadmin") {
        setIsLocked(false);
      } else {
        const lowerPlanName = planName.toLowerCase();
        setIsLocked(!ALLOWED_PLANS.includes(lowerPlanName));
      }
    }
  }, [currentSubscription, userRole]);

  useEffect(() => {
    const fetchSub = async () => {
      if (!user || !["admin", "superadmin"].includes(userRole)) return;
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        await fetchCurrentSubscription(token);
      }
    };
    fetchSub();
  }, [userRole, fetchCurrentSubscription, user]);

  useEffect(() => {
    const init = async () => {
      if (user?.companyId) {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
          await fetchCompanyById(token, user.companyId);
        }
      }
    };
    init();
  }, [user?.companyId, fetchCompanyById]);

  const roleIconByRole = {
    superadmin: "ribbon-outline",
    admin: "shield-checkmark-outline",
    supervisor: "briefcase-outline",
    user: "person-outline",
  };
  const roleIconName = roleIconByRole[userRole] || "person-outline";

  const punchLocationsLocked = userRole !== "superadmin" && subscriptionName.toLowerCase() !== "pro";

  const renderFeature = (IconComponent, iconName, title, description, featurePath, overrideLock = false) => (
    <Pressable
      onPress={() => {
        if (!isLocked || overrideLock) {
          router.push(featurePath);
        }
      }}
      style={{
        padding: 12,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 4,
        backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
        opacity: isLocked && !overrideLock ? 0.5 : 1,
      }}
      disabled={isLocked && !overrideLock}
    >
      <IconComponent name={iconName} size={28} color={accentColor} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: isLightTheme ? "#1f2937" : "#f1f5f9",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: isLightTheme ? "#4b5563" : "#a0aec0",
          }}
          className="mt-1"
        >
          {description}
        </Text>
      </View>
      {isLocked && !overrideLock && <MaterialIcons name="lock" size={24} color="#f97316" />}
    </Pressable>
  );

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`} edges={["top"]}>
      {/* Header Section */}
      <View className="rounded-xl my-4 mx-4">
        <View className="flex-row justify-between items-center border-b-2 border-slate-300 pb-2">
          <View>
            <Text className={`text-3xl font-extrabold ${headerTextColor}`}>Hi, {userName}</Text>
          </View>
          <View className="flex-row mr-2">
            <Ionicons name={roleIconName} size={25} color={accentColor} />
            <Text className={`text-xs font-semibold capitalize my-auto ml-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{userRole}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pb-6" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* My Account Section */}
        <View className="my-2">
          <Text className={`text-xl font-bold mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>My Account</Text>
          {renderFeature(Ionicons, "person-outline", "Account Configuration", "Manage your account", "./my-account", true)}
        </View>

        {userRole === "user" ? (
          <View className="flex-1 mb-4">
            <Text className={`text-base font-semibold ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
              You currently have no administrative features available.
            </Text>
          </View>
        ) : (
          <View className="space-y-5">
            {userRole === "superadmin" && (
              <View className="my-2">
                <Text className={`text-xl font-bold mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Company</Text>

                {renderFeature(Ionicons, "business-outline", "Companies", "Create, update, remove companies.", "./superadmin-companies")}

                {renderFeature(Ionicons, "reader-outline", "Subscribers", "Track all companies’ subscriptions.", "./superadmin-subscriptions")}

                {renderFeature(Ionicons, "settings-outline", "Subscription Plans", "Create or update subscription plans.", "./superadmin-subscription-plans")}
              </View>
            )}

            <View className="my-2">
              <Text className={`text-xl font-bold mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Department</Text>
              {renderFeature(Ionicons, "briefcase-outline", "Departments", "Organize departments and teams.", "./manage-departments")}
            </View>

            <View className="my-2">
              <Text className={`text-xl font-bold mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Employee</Text>
              {renderFeature(Ionicons, "people-outline", "Employees", "Monitor, create, update, remove employees.", "./manage-employees")}
              {renderFeature(Ionicons, "calendar-outline", "Shifts Schedule", "Create, update, assign shift schedules.", "./manage-schedules")}
              <Pressable
                onPress={() => {
                  if (!punchLocationsLocked) {
                    router.push("./manage-locations");
                  }
                }}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 4,
                  backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
                  opacity: punchLocationsLocked ? 0.5 : 1,
                }}
                disabled={punchLocationsLocked}
              >
                <Ionicons name="location-outline" size={28} color={accentColor} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: isLightTheme ? "#1f2937" : "#f1f5f9",
                    }}
                  >
                    Punch Locations
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: isLightTheme ? "#4b5563" : "#a0aec0",
                    }}
                    className="mt-1"
                  >
                    Create, update, assign or delete punch locations.
                  </Text>
                </View>
                {punchLocationsLocked && <MaterialIcons name="lock" size={24} color="#f97316" />}
              </Pressable>
              {renderFeature(Ionicons, "calendar-outline", "Leave Requests", "Approve and reject employee leaves.", "./manage-leaves")}
            </View>

            {userRole !== "supervisor" && (
              <>
                <View className="my-2">
                  <Text className={`text-xl font-bold mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Company: {userCompanyName} Payroll</Text>
                  {renderFeature(
                    MaterialIcons,
                    "attach-money",
                    "Company Payroll Settings",
                    "Configure cutoff cycles, currency, and overtime rates.",
                    "./payroll-payroll-settings"
                  )}
                  {renderFeature(Ionicons, "cash-outline", "Employee Payrate Settings", "Set or update pay rates for users.", "./payroll-payrate-settings")}
                  {renderFeature(Ionicons, "document-text-outline", "Payroll Records", "View & manage all payroll records.", "./payroll-payroll-records")}
                  {renderFeature(Ionicons, "calculator-outline", "Generate Payroll", "Generate payroll for a user/period.", "./payroll-generate-payroll")}
                </View>

                <View className="my-2">
                  <Text className={`text-xl font-bold mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Subscription</Text>
                  {renderFeature(
                    Ionicons,
                    "reader-outline",
                    loadingCurrent ? "Checking subscription..." : `${subscriptionName} Plan`,
                    "View or manage your company’s subscription plan.",
                    "./manage-mysubscriptions",
                    true
                  )}
                </View>
              </>
            )}
          </View>
        )}

        <View className="my-2">
          <Text className={`text-xl font-bold mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Preference</Text>
          {renderFeature(Ionicons, "reader-outline", "Appearance", "Update appearance settings of the application.", "./preference", true)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
