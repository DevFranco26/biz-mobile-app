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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

import useThemeStore from '../../../../store/themeStore';
import useUserStore from '../../../../store/userStore';
import useSubscriptionStore from '../../../../store/subscriptionStore';
import useSubscriptionPlansStore from '../../../../store/subscriptionPlansStore';
import useCompanyStore from '../../../../store/companyStore'; // <-- Import your company store for user count

/**
 * Utility: format a date/time or return 'N/A' if falsy
 */
const formatDateTime = (dt) => {
  if (!dt) return 'N/A';
  return new Date(dt).toLocaleString();
};

/**
 * Utility: parse a plan’s rangeOfUsers (e.g. "1", "2-9", "10+", etc.) to get the maximum number
 * that plan supports. If parsing fails or not found, default to a large fallback (999999).
 */
const getMaxUsersFromRange = (rangeOfUsers) => {
  if (!rangeOfUsers || typeof rangeOfUsers !== 'string') {
    return 999999; // fallback large
  }
  // e.g. "10+"
  if (rangeOfUsers.includes('+')) {
    return 999999;
  }
  // e.g. "2-9"
  if (rangeOfUsers.includes('-')) {
    const parts = rangeOfUsers.split('-');
    if (parts.length === 2) {
      const maxStr = parts[1].trim();
      const maxVal = parseInt(maxStr, 10);
      return isNaN(maxVal) ? 999999 : maxVal;
    }
  }
  // Single number (e.g. "1")
  const singleVal = parseInt(rangeOfUsers, 10);
  return isNaN(singleVal) ? 999999 : singleVal;
};

const CurrentSubscription = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const accentColor = isLightTheme ? '#c2410c' : '#f97316';

  // Auth user
  const { user } = useUserStore();

  // Subscription store
  const {
    currentSubscription,
    loadingCurrent,
    fetchCurrentSubscription,
    cancelSubscription,
  } = useSubscriptionStore();

  // Plans store
  const {
    subscriptionPlans,
    loadingPlans,
    fetchSubscriptionPlans,
  } = useSubscriptionPlansStore();

  // Company store => user count
  const { companyUserCounts, fetchCompanyUserCount } = useCompanyStore();

  // Local state
  const [token, setToken] = useState(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // On mount, load token, fetch subscriptions, plans, user count
  useEffect(() => {
    const init = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (!storedToken) {
        Alert.alert('Auth Error', 'Please sign in again.');
        router.replace('(auth)/signin');
        return;
      }
      setToken(storedToken);

      // 1) fetch current subscription
      await fetchCurrentSubscription(storedToken);
      // 2) fetch subscription plans
      await fetchSubscriptionPlans(storedToken);
      // 3) fetch user count for the company
      if (user?.companyId) {
        await fetchCompanyUserCount(storedToken, user.companyId);
      }
    };
    init();
  }, [
    user?.companyId,
    fetchCurrentSubscription,
    fetchSubscriptionPlans,
    fetchCompanyUserCount,
  ]);

  // Basic derived data
  const planName = currentSubscription?.plan?.planName || 'N/A';
  const isFreePlan = planName.toLowerCase().includes('free');

  // Current user count in the company
  const currentUserCount = companyUserCounts[user?.companyId] || 0;

  /**
   * handleCancel:
   * - If the user has more users than the FREE plan allows, block cancellation.
   * - Otherwise, show the existing confirmation to cancel.
   */
  const handleCancel = async () => {
    if (!token) return;

    // Find the free plan in subscriptionPlans
    const freePlan = subscriptionPlans.find((p) =>
      p.planName.toLowerCase().includes('free')
    );
    if (!freePlan) {
      // If no free plan found, just proceed with old confirm
      confirmCancelSubscription();
      return;
    }

    // Parse free plan’s max
    const freePlanMax = getMaxUsersFromRange(freePlan.rangeOfUsers);

    if (currentUserCount > freePlanMax) {
      Alert.alert(
        'Cannot Cancel',
        `You currently have ${currentUserCount} users, which is more than the free plan's maximum (${freePlanMax}).\n\n` +
          'Please remove users or choose a different plan before canceling.'
      );
      return;
    }

    // Otherwise, confirm
    confirmCancelSubscription();
  };

  /**
   * confirmCancelSubscription: show the final alert to confirm or cancel
   */
  const confirmCancelSubscription = () => {
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel your current subscription immediately?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            await cancelSubscription(token);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
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

      {/* Main Content */}
      {loadingCurrent ? (
        <ActivityIndicator size="large" color={accentColor} className="mt-8" />
      ) : currentSubscription ? (
        // We have an active subscription
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
              Range of Users:{' '}
              {currentSubscription?.plan?.rangeOfUsers || 'N/A'}
            </Text>

            {/* Payment Info */}
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
              Payment Date:{' '}
              {formatDateTime(currentSubscription.paymentDateTime)}
            </Text>

            {/* Expiration & Renewal */}
            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Expiration:{' '}
              {formatDateTime(currentSubscription.expirationDateTime)}
            </Text>
            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Renewal:{' '}
              {formatDateTime(currentSubscription.renewalDateTime)}
            </Text>

            <Text
              className={`text-sm ${
                isLightTheme ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              Status: {currentSubscription.status}
            </Text>

            {/* Features */}
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
                        color={available ? '#f97316' : 'gray'}
                      />
                      <Text
                        className={`ml-2 text-sm ${
                          isLightTheme ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        {feature.charAt(0).toUpperCase() +
                          feature.slice(1)}
                      </Text>
                    </View>
                  )
                )}
              </View>
            )}

            {/* Buttons Row */}
            <View className="flex-row mt-6 ml-auto">
              {!isFreePlan && (
                <Pressable onPress={handleCancel} className="mr-4 p-3 rounded-lg">
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

      {/* Choose a Plan Modal */}
      <Modal
        visible={planModalVisible}
        transparent={false}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <SafeAreaView
          className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
        >
          {/* Close Modal Button */}
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
            <ActivityIndicator
              size="large"
              color={accentColor}
              className="mt-8"
            />
          ) : (
            <ScrollView className="px-4">
              <Text
                className={`text-xl font-bold mb-4 ${
                  isLightTheme ? 'text-slate-800' : 'text-slate-100'
                }`}
              >
                Choose a Subscription Plan
              </Text>

              {[...subscriptionPlans]
                .sort((a, b) => a.id - b.id)
                .map((plan) => {
                  const isCurrentPlan =
                    currentSubscription?.plan?.id === plan.id;

                  // 1) parse plan's max
                  const planMaxUsers = getMaxUsersFromRange(
                    plan.rangeOfUsers
                  );
                  // 2) compare with current user count to see if it's a valid plan
                  const cannotDowngrade = currentUserCount > planMaxUsers;

                  /**
                   * handlePlanPress: toggles selected plan unless the plan is not valid
                   */
                  const handlePlanPress = () => {
                    // If user already exceeds this plan's max, block
                    if (cannotDowngrade) {
                      Alert.alert(
                        'Plan Not Available',
                        `You have ${currentUserCount} users, which exceeds this plan’s maximum (${planMaxUsers}).\n\n` +
                          'Please remove users or select a different plan.'
                      );
                      return;
                    }
                    // Toggle select
                    if (selectedPlan?.id === plan.id) {
                      setSelectedPlan(null);
                    } else {
                      setSelectedPlan(plan);
                    }
                  };

                  // If it's current plan, highlight border
                  // If user can't downgrade, we'll also show grayed text
                  const containerStyle = isCurrentPlan
                    ? 'border-2 border-orange-500'
                    : isLightTheme
                    ? 'bg-slate-100'
                    : 'bg-slate-800';

                  const textColorClass = cannotDowngrade
                    ? 'text-slate-500' // disabled color
                    : isLightTheme
                    ? 'text-slate-800'
                    : 'text-slate-200';

                  return (
                    <Pressable
                      key={plan.id}
                      onPress={handlePlanPress}
                      disabled={cannotDowngrade}
                      className={`p-4 mb-3 rounded-lg ${containerStyle}`}
                    >
                      {/* Plan Header */}
                      <View className="flex-row justify-between items-start">
                        <Text
                          className={`text-base font-semibold ${textColorClass}`}
                        >
                          {plan.planName} — ${plan.price}
                        </Text>
                        {isCurrentPlan && (
                          <Text className="text-sm font-semibold text-orange-500">
                            (Current Plan)
                          </Text>
                        )}
                      </View>

                      {/* Plan Range */}
                      {plan.rangeOfUsers && (
                        <Text
                          className={`text-xs mt-2 ${
                            isLightTheme ? 'text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          Range of Users: {plan.rangeOfUsers}
                          {cannotDowngrade && (
                            <Text className="text-red-500">
                              {' '}
                              (Not Available)
                            </Text>
                          )}
                        </Text>
                      )}

                      {/* Plan details if selected (and not blocked) */}
                      {selectedPlan?.id === plan.id && !cannotDowngrade && (
                        <View className="mt-2">
                          {plan.description && (
                            <Text
                              className={`text-xs ${
                                isLightTheme
                                  ? 'text-slate-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              Description: {plan.description}
                            </Text>
                          )}
                          <Text
                            className={`text-sm mt-1 ${
                              isLightTheme ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            Features:
                          </Text>
                          {Object.entries(plan.features).map(
                            ([feature, available]) => (
                              <View
                                key={feature}
                                className="flex-row items-center mt-1"
                              >
                                <Ionicons
                                  name={
                                    available
                                      ? 'checkmark-circle'
                                      : 'lock-closed'
                                  }
                                  size={16}
                                  color={available ? '#f97316' : 'gray'}
                                />
                                <Text
                                  className={`ml-2 text-sm ${
                                    isLightTheme
                                      ? 'text-slate-600'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {feature.charAt(0).toUpperCase() +
                                    feature.slice(1)}
                                </Text>
                              </View>
                            )
                          )}

                          {/* Subscribe button */}
                          <View className="mt-6">
                            <Pressable
                              onPress={() => {
                                // Stripe price => URL mapping
                                const stripeUrls = {
                                  '25.99':
                                    'https://buy.stripe.com/7sIeWafmXfVZfyE7t8',
                                  '39.99':
                                    'https://buy.stripe.com/7sI29o1w711586c14L',
                                  '69.99':
                                    'https://buy.stripe.com/8wMg0e1w7h039ag6p6',
                                  '119.99':
                                    'https://buy.stripe.com/28og0egr1dNRaek5l3',
                                  '169.99':
                                    'https://buy.stripe.com/5kA3dsdePh030DKaFo',
                                  '49.99':
                                    'https://buy.stripe.com/7sI8xMfmXdNR4U0cNx',
                                  '59.99':
                                    'https://buy.stripe.com/6oEaFU1w7h032LS8xi',
                                  '79.99':
                                    'https://buy.stripe.com/bIYeWa1w7bFJ3PWeVH',
                                  '129.99':
                                    'https://buy.stripe.com/7sI15k6QrcJN72828W',
                                  '179.99':
                                    'https://buy.stripe.com/bIYbJY1w77ptdqwbJx',
                                };

                                const priceKey = plan.price?.toString();
                                const url = stripeUrls[priceKey];
                                if (url) {
                                  Linking.openURL(url).catch(() =>
                                    Alert.alert(
                                      'Error',
                                      'Unable to open link.'
                                    )
                                  );
                                } else {
                                  Alert.alert(
                                    'Error',
                                    'No payment link available for this plan.'
                                  );
                                }
                              }}
                              className="bg-orange-500 px-4 py-4 rounded-lg"
                            >
                              <Text className="text-white text-center">
                                Subscribe
                              </Text>
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

export default CurrentSubscription;
