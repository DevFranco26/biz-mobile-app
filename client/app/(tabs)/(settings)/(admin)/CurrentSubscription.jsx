// File: app/(tabs)/(settings)/(admin)/CurrentSubscription.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

import useThemeStore from '../../../../store/themeStore';
import useUserStore from '../../../../store/userStore';
import useSubscriptionStore from '../../../../store/subscriptionStore';
import useSubscriptionPlansStore from '../../../../store/subscriptionPlansStore';

const CurrentSubscription = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const accentColor = isLightTheme ? '#c2410c' : '#f97316';

  const { user } = useUserStore();
  const {
    currentSubscription,
    loadingCurrent,
    errorCurrent,
    fetchCurrentSubscription,
    upgradeSubscription,
    cancelSubscription,
  } = useSubscriptionStore();
  const {
    subscriptionPlans,
    loadingPlans,
    errorPlans,
    fetchSubscriptionPlans,
  } = useSubscriptionPlansStore();

  const [token, setToken] = useState(null);

  // For choose-plan modal
  const [planModalVisible, setPlanModalVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (!storedToken) {
        Alert.alert('Auth Error', 'Please sign in again.');
        router.replace('(auth)/signin');
        return;
      }
      setToken(storedToken);

      // Fetch the company's current subscription
      await fetchCurrentSubscription(storedToken);
      // Also fetch subscription plans (so admin can pick a new one)
      await fetchSubscriptionPlans(storedToken);
    };
    init();
  }, [fetchCurrentSubscription, fetchSubscriptionPlans]);

  const handleUpgrade = async (planId) => {
    if (!token) return;
    const result = await upgradeSubscription(token, planId);
    if (result.success) {
      setPlanModalVisible(false);
    }
  };

  const handleCancel = async () => {
    if (!token) return;
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel your current subscription immediately?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            await cancelSubscription(token);
          },
        },
      ]
    );
  };

  const planName = currentSubscription?.plan?.name || 'N/A';
  // Check if current plan is "Free Plan"
  const isFreePlan = planName.toLowerCase() === 'free plan';

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
    >
      <View className="px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text
          className={`text-xl font-bold ${
            isLightTheme ? 'text-slate-800' : 'text-slate-100'
          }`}
        >
          My Subscription
        </Text>
      </View>

      {loadingCurrent ? (
        <ActivityIndicator size="large" color={accentColor} className="mt-8" />
      ) : currentSubscription ? (
        // Show the current subscription details
        <View className="px-4 mt-4">
          <View
            className={`p-4 rounded-lg ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            }`}
          >
            <Text
              className={`text-lg font-semibold ${
                isLightTheme ? 'text-slate-800' : 'text-slate-200'
              }`}
            >
              Current Plan: {planName}
            </Text>
            <Text
              className={`text-base mt-2 ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Price: ${currentSubscription.plan?.price}
            </Text>
            <Text
              className={`text-base ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Max Users: {currentSubscription.plan?.maxUsers}
            </Text>
            <Text
              className={`text-sm mt-2 ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Start:{' '}
              {currentSubscription.startDate
                ? new Date(currentSubscription.startDate).toLocaleString()
                : 'N/A'}
            </Text>
            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              End:{' '}
              {currentSubscription.endDate
                ? new Date(currentSubscription.endDate).toLocaleString()
                : 'N/A'}
            </Text>
            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Status: {currentSubscription.status}
            </Text>

            <View className="flex-row mt-4">
              {/* Hide Cancel button if it's a Free Plan */}
              {!isFreePlan && (
                <Pressable
                  onPress={handleCancel}
                  className="mr-4 p-3 rounded-lg"
                  style={{
                    backgroundColor: isLightTheme ? '#ffffff' : '#1e293b',
                  }}
                >
                  <Text
                    className={`${
                      isLightTheme ? 'text-red-600' : 'text-red-400'
                    } font-semibold`}
                  >
                    Cancel
                  </Text>
                </Pressable>
              )}

              {/* Upgrade Button */}
              <Pressable
                onPress={() => setPlanModalVisible(true)}
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: accentColor,
                }}
              >
                <Text className="text-white font-semibold">
                  {isFreePlan ? 'Choose Plan' : 'Upgrade'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        // No active subscription
        <View className="px-4 mt-4">
          <Text
            className={`text-lg font-semibold ${
              isLightTheme ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            You have no active subscription.
          </Text>
          <Pressable
            onPress={() => setPlanModalVisible(true)}
            className={`mt-4 p-3 rounded-lg ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                isLightTheme ? 'text-slate-800' : 'text-slate-100'
              }`}
            >
              Create/Upgrade Subscription
            </Text>
          </Pressable>
        </View>
      )}

      {/* Choose Plan Modal */}
      <Modal
        visible={planModalVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <SafeAreaView
          className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
        >
          <View
            style={{
              marginTop: Platform.OS === 'ios' ? 60 : 0, 
            }}
          >
            <View className="flex-row justify-end items-center p-4">
              <TouchableOpacity onPress={() => setPlanModalVisible(false)}>
                <Ionicons
                  name="close-circle-outline"
                  size={28}
                  color={isLightTheme ? '#374151' : '#d1d5db'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {loadingPlans ? (
            <ActivityIndicator size="large" color={accentColor} className="mt-8" />
          ) : (
            <ScrollView className="px-4">
              <Text
                className={`text-xl font-bold mb-4 ${
                  isLightTheme ? 'text-slate-800' : 'text-slate-100'
                }`}
              >
                Choose a Subscription Plan
              </Text>
              {subscriptionPlans.map((plan) => {
                // Check if this plan is the user's current plan
                const isCurrentPlan =
                  currentSubscription?.plan?.id === plan.id;

                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => handleUpgrade(plan.id)}
                    className={`p-4 mb-3 rounded-lg flex-col ${
                      isCurrentPlan
                        ? 'border-2 border-blue-500'
                        : isLightTheme
                        ? 'bg-slate-100'
                        : 'bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-200'
                      }`}
                    >
                      {plan.name} — ${plan.price} / 30 days
                    </Text>
                    <Text
                      className={`text-sm ${
                        isLightTheme ? 'text-slate-600' : 'text-slate-300'
                      }`}
                    >
                      Max Users: {plan.maxUsers}
                    </Text>
                    {isCurrentPlan && (
                      <Text
                        className={`mt-1 text-sm font-semibold ${
                          isLightTheme ? 'text-green-700' : 'text-green-400'
                        }`}
                      >
                        (Current Plan)
                      </Text>
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

export default CurrentSubscription;
