// File: app/(tabs)/(settings)/Settings.jsx

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import useThemeStore from '../../../store/themeStore';
import useUserStore from '../../../store/userStore';
import useCompanyStore from '../../../store/companyStore';
import useSubscriptionStore from '../../../store/subscriptionStore'; // <-- ADDED
import * as SecureStore from 'expo-secure-store';

const Settings = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  const { user } = useUserStore();
  const { getCompanyName, fetchCompanyById } = useCompanyStore();

  const {
    currentSubscription,
    loadingCurrent,
    fetchCurrentSubscription,
  } = useSubscriptionStore(); // <-- We'll need these

  // Some theming constants
  const headerTextColor = isLightTheme ? 'text-slate-800' : 'text-slate-300';
  const cardBg = isLightTheme ? 'bg-slate-100' : 'bg-slate-800';
  const accentColor = isLightTheme ? '#c2410c' : '#f97316';

  // Helper: user role
  const userRole = (user?.role || '').toLowerCase();

  // For subscription name display
  const [subscriptionName, setSubscriptionName] = useState('Loading...');

  // On mount, optionally fetch single company by ID
  useEffect(() => {
    const init = async () => {
      if (user?.companyId) {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await fetchCompanyById(token, user.companyId);
        }
      }
    };
    init();
  }, [user?.companyId]);

  // Also fetch current subscription if role is admin/superadmin
  useEffect(() => {
    const fetchSub = async () => {
      if (!user || !['admin','superadmin'].includes(userRole)) return;
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetchCurrentSubscription(token);
      }
    };
    fetchSub();
  }, [userRole, fetchCurrentSubscription]);

  // Whenever currentSubscription changes, set subscriptionName
  useEffect(() => {
    if (!currentSubscription) {
      setSubscriptionName('No active subscription');
    } else {
      const planName = currentSubscription.plan?.name || 'Unknown Plan';
      setSubscriptionName(planName);
    }
  }, [currentSubscription]);

  // For the user’s name
  const userName = user ? `${user.firstName}`.trim() : '...';
  const userCompanyName = user?.companyId
    ? getCompanyName(user.companyId) || '...'
    : 'Unknown';

  // Choose an icon for the user role
  const roleIconByRole = {
    superadmin: 'ribbon-outline',
    admin: 'shield-checkmark-outline',
    supervisor: 'briefcase-outline',
    user: 'person-outline',
  };
  const roleIconName = roleIconByRole[userRole] || 'person-outline';

  // Navigation helper
  const navigateToFeature = (featurePath) => {
    router.push(featurePath);
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      edges={['top']}
    >
      {/* Header Section */}
      <View className="rounded-xl my-4 mx-4">
        <View className="flex-row justify-between items-center border-b-2 border-slate-300 pb-2">
          <View>
            <Text className={`text-3xl font-extrabold ${headerTextColor}`}>
              Hi, {userName}
            </Text>
          </View>

          {/* Role icon + label */}
          <View className="flex-row mr-2">
            <Ionicons
              name={roleIconName}
              size={25}
              color={accentColor}
            />
            <Text
              className={`text-xs font-semibold capitalize my-auto ml-1 ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              {userRole}
            </Text>
          </View>
        </View>
      </View>

      {/* If role == user, show an "access" message; otherwise show the features */}
      {userRole === 'user' ? (
        <View className="flex-1 px-4">
          <Text
            className={`text-base font-semibold ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            You currently have no administrative features available.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pb-6"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="space-y-5">
            {/* If superAdmin => show "Manage Companies" AND "Manage Subscription" */}
            {userRole === 'superadmin' && (
  <View className="my-2">
    <Text className={`text-xl font-bold mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
      Company
    </Text>

    {/* Manage Companies */}
    <Pressable
      onPress={() => navigateToFeature('./ManageCompanies')}
      className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
      accessibilityLabel="Manage Companies"
    >
      <Ionicons
        name="business-outline"
        size={28}
        color={accentColor}
        style={{ marginRight: 12 }}
      />
      <View>
        <Text className={`text-lg font-semibold ${headerTextColor}`}>
          Manage Companies
        </Text>
        <Text
          className={`text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}
        >
          Create, update, remove companies.
        </Text>
      </View>
    </Pressable>

    {/* Manage Subscriptions */}
    <Pressable
      onPress={() => navigateToFeature('./ManageSubscriptions')}
      className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
    >
      <Ionicons
        name="reader-outline"
        size={28}
        color={accentColor}
        style={{ marginRight: 12 }}
      />
      <View>
        <Text className={`text-lg font-semibold ${headerTextColor}`}>
          Manage Subscriptions
        </Text>
        <Text
          className={`text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}
        >
          Track all companies’ subscriptions.
        </Text>
      </View>
    </Pressable>

    {/* Manage Subscription Plans */}
    <Pressable
      onPress={() => navigateToFeature('./ManageSubscriptionPlans')}
      className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
    >
      <Ionicons
        name="settings-outline"
        size={28}
        color={accentColor}
        style={{ marginRight: 12 }}
      />
      <View>
        <Text className={`text-lg font-semibold ${headerTextColor}`}>
          Manage Plans
        </Text>
        <Text
          className={`text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}
        >
          Create or update subscription plans.
        </Text>
      </View>
    </Pressable>
  </View>
)}

            {/* Department */}
            <View className="my-2">
              <Text
                className={`text-xl font-bold mb-1 ${
                  isLightTheme ? 'text-slate-800' : 'text-slate-300'
                }`}
              >
                Department
              </Text>
              <Pressable
                onPress={() => navigateToFeature('./ManageDepartments')}
                className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={28}
                  color={accentColor}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text className={`text-lg font-semibold ${headerTextColor}`}>
                    Manage Departments
                  </Text>
                  <Text
                    className={`text-sm ${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    Organize departments and teams.
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Employee Section */}
            <View className="my-2">
              <Text
                className={`text-xl font-bold mb-1 ${
                  isLightTheme ? 'text-slate-800' : 'text-slate-300'
                }`}
              >
                Employee
              </Text>

              {/* Manage Employees */}
              <Pressable
                onPress={() => navigateToFeature('./ManageUsers')}
                className={`p-3 rounded-xl flex-row items-center  my-1 ${cardBg}`}
              >
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={accentColor}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text className={`text-lg font-semibold ${headerTextColor}`}>
                    Manage Employees
                  </Text>
                  <Text
                    className={`text-sm ${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    Monitor, create, update, remove employees.
                  </Text>
                </View>
              </Pressable>

              {/* Shifts */}
              <Pressable
                onPress={() => navigateToFeature('./ManageShiftSchedules')}
                className={`p-3 rounded-xl flex-row items-center  my-1 ${cardBg}`}
              >
                <Ionicons
                  name="calendar-outline"
                  size={28}
                  color={accentColor}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text className={`text-lg font-semibold ${headerTextColor}`}>
                    Employee Shifts
                  </Text>
                  <Text
                    className={`text-sm ${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    Create, update, assign shift schedules.
                  </Text>
                </View>
              </Pressable>

              {/* Punch Locations */}
              <Pressable
                onPress={() => navigateToFeature('./ManageLocations')}
                className={`p-3 rounded-xl flex-row items-center  my-1 ${cardBg}`}
              >
                <Ionicons
                  name="location-outline"
                  size={28}
                  color={accentColor}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text className={`text-lg font-semibold ${headerTextColor}`}>
                    Punch Locations
                  </Text>
                  <Text
                    className={`text-sm ${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    Create, update, assign or delete punch locations.
                  </Text>
                </View>
              </Pressable>

              {/* Manage Leaves */}
              <Pressable
                onPress={() => navigateToFeature('./ManageLeaves')}
                className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
              >
                <Ionicons
                  name="calendar-outline"
                  size={28}
                  color={accentColor}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text className={`text-lg font-semibold ${headerTextColor}`}>
                    Leave Request
                  </Text>
                  <Text
                    className={`text-sm ${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    Approve and reject employee leaves.
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Supervisor excludes subscription & payroll */}
            {userRole !== 'supervisor' && (
              <>
                {/* Manage Payroll Section */}
                <View className="my-2">
                  <Text
                    className={`text-xl font-bold mb-1 ${
                      isLightTheme ? 'text-slate-800' : 'text-slate-300'
                    }`}
                  >
                    {userCompanyName} Payroll
                  </Text>

                  <Pressable
                    onPress={() => navigateToFeature('./PayrollSettings')}
                    className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
                  >
                    <MaterialIcons
                      name="attach-money"
                      size={28}
                      color={accentColor}
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text className={`text-lg font-semibold ${headerTextColor}`}>
                        Payroll Settings
                      </Text>
                      <Text
                        className={`text-sm ${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        Configure cutoff cycles, currency, and overtime rates.
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => navigateToFeature('./PayrateSettings')}
                    className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={28}
                      color={accentColor}
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text className={`text-lg font-semibold ${headerTextColor}`}>
                        Payrate Settings
                      </Text>
                      <Text
                        className={`text-sm ${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        Set or update pay rates for users.
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => navigateToFeature('./CalculatePayrollManually')}
                    className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
                  >
                    <Ionicons
                      name="calculator-outline"
                      size={28}
                      color={accentColor}
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text className={`text-lg font-semibold ${headerTextColor}`}>
                        Calculate Payroll Manually
                      </Text>
                      <Text
                        className={`text-sm ${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        Manually calculate payroll for a user/period.
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => navigateToFeature('./PayrollRecords')}
                    className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={28}
                      color={accentColor}
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text className={`text-lg font-semibold ${headerTextColor}`}>
                        Payroll Records
                      </Text>
                      <Text
                        className={`text-sm ${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        View & manage all payroll records.
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {/* Subscription Section */}
                <View className="my-2">
                  <Text
                    className={`text-xl font-bold mb-1 ${
                      isLightTheme ? 'text-slate-800' : 'text-slate-300'
                    }`}
                  >
                    Subscription
                  </Text>

                  {/* For admin/superAdmin -> show current subscription link
                      But label it with the subscription plan name or "No active subscription" */}
                  <Pressable
                    onPress={() => navigateToFeature('./CurrentSubscription')}
                    className={`p-3 rounded-xl flex-row items-center my-1 ${cardBg}`}
                  >
                    <Ionicons
                      name="reader-outline"
                      size={28}
                      color={accentColor}
                      style={{ marginRight: 12 }}
                    />
                    <View>
                      <Text className={`text-lg font-semibold ${headerTextColor}`}>
                        {loadingCurrent
                          ? 'Checking subscription...'
                          : subscriptionName}
                      </Text>
                      <Text
                        className={`text-sm ${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        View or manage your company’s subscription plan.
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Settings;
