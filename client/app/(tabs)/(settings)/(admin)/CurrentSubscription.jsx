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

/** Format a date/time or return 'N/A' if falsy */
const formatDateTime = (dt) => {
  if (!dt) return 'N/A';
  return new Date(dt).toLocaleString();
};

const CurrentSubscription = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const accentColor = isLightTheme ? '#c2410c' : '#f97316'; // dynamic color, will keep inline usage

  const { user } = useUserStore();

  const {
    currentSubscription,
    loadingCurrent,
    fetchCurrentSubscription,
    upgradeSubscription,
    cancelSubscription,
  } = useSubscriptionStore();

  const {
    subscriptionPlans,
    loadingPlans,
    fetchSubscriptionPlans,
  } = useSubscriptionPlansStore();

  const [token, setToken] = useState(null);
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

      // Fetch current subscription for this company
      await fetchCurrentSubscription(storedToken);

      // Also fetch subscription plans for the upgrade modal
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

  const planName = currentSubscription?.plan?.planName || 'N/A';
  const isFreePlan = planName.toLowerCase().includes('free');

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
    >
      {/* Header */}
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
        // Active subscription info
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
              Price: ${currentSubscription?.plan?.price ?? '0.00'}
            </Text>

            <Text
              className={`text-base ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              Max Users: {currentSubscription?.plan?.maxUsers || 1}
            </Text>

            {/* PaymentMethod & paymentDateTime */}
            <Text
              className={`text-sm mt-2 ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Payment Method: {currentSubscription.paymentMethod || 'N/A'}
            </Text>
            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Payment Date: {formatDateTime(currentSubscription.paymentDateTime)}
            </Text>

            {/* Expiration & renewal */}
            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Expiration: {formatDateTime(currentSubscription.expirationDateTime)}
            </Text>
            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Renewal: {formatDateTime(currentSubscription.renewalDateTime)}
            </Text>

            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Status: {currentSubscription.status}
            </Text>

            {/* Features Section */}
            {currentSubscription.plan?.features && (
              <View className="mt-2">
                <Text
                  className={`text-sm ${
                    isLightTheme ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  Features:
                </Text>
                {Object.entries(currentSubscription.plan.features).map(
                  ([feature, available]) => (
                    <View key={feature} className="flex-row items-center mt-1">
                      <Ionicons
                        name={available ? 'checkmark-circle' : 'lock-closed'}
                        size={16}
                        color="gray"
                      />
                      <Text
                        className={`ml-2 text-sm ${
                          isLightTheme ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        {feature.charAt(0).toUpperCase() + feature.slice(1)}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}

            {/* Buttons row */}
            <View className="flex-row mt-6 ml-auto">
              {!isFreePlan && (
                <Pressable
                  onPress={handleCancel}
                  className={`mr-4 p-3 rounded-lg`}
                >
                  <Text
                    className={`${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    } font-semibold`}
                  >
                    Cancel
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => setPlanModalVisible(true)}
                className="p-3 rounded-lg bg-orange-500"
              >
                <Text className="text-white font-semibold">
                  {isFreePlan ? 'Upgrade' : 'Upgrade'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        // No active subscription => Possibly new user or canceled
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

      {/* Choose a Plan Modal */}
      <Modal
        visible={planModalVisible}
        transparent={false}
        animationType="slide"
        presentationStyle="pageSheet" // allows swipe-down to dismiss on iOS
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <SafeAreaView
          className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
        >
          <View className="flex-row justify-center items-center p-4">
            <TouchableOpacity onPress={() => setPlanModalVisible(false)}>
              <Ionicons
                name="arrow-down-outline"
                size={28}
                color={isLightTheme ? '#374151' : '#d1d5db'}
              />
            </TouchableOpacity>
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
                const isCurrentPlan = currentSubscription?.plan?.id === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => handleUpgrade(plan.id)}
                    className={`p-4 mb-3 rounded-lg ${
                      isCurrentPlan
                        ? 'border-2 border-orange-500'
                        : isLightTheme
                        ? 'bg-slate-100'
                        : 'bg-slate-800'
                    }`}
                  >
                    {/* Top row: plan name/price on the left, (Current Plan) on the right */}
                    <View className="flex-row justify-between items-start">
                      <Text
                        className={`text-base font-semibold ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        {plan.planName} — ${plan.price}
                      </Text>
                      {isCurrentPlan && (
                        <Text
                          className={`text-sm font-semibold text-orange-500`}
                        >
                          (Current Plan)
                        </Text>
                      )}
                    </View>

                    {/* Range of Users */}
                    {plan.rangeOfUsers && (
                      <Text
                        className={`text-xs mt-2 ${
                          isLightTheme ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        Range of Users: {plan.rangeOfUsers}
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
