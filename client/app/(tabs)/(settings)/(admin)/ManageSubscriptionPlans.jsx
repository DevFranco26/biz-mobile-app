// File: app/(tabs)/(settings)/(admin)/ManageSubscriptionPlans.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../../store/themeStore';
import useUserStore from '../../../../store/userStore';
import useSubscriptionPlansStore from '../../../../store/subscriptionPlansStore';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const ManageSubscriptionPlans = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const accentColor = isLightTheme ? '#c2410c' : '#f97316';

  const { user } = useUserStore();
  const {
    subscriptionPlans,
    loadingPlans,
    errorPlans,
    fetchSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
  } = useSubscriptionPlansStore();

  const [token, setToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // For create/edit plan modals:
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [editPlanId, setEditPlanId] = useState(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planMaxUsers, setPlanMaxUsers] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');

  useEffect(() => {
    const init = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (!storedToken) {
        Alert.alert('Auth Error', 'Please sign in again.');
        router.replace('(auth)/signin');
        return;
      }
      setToken(storedToken);

      // Load subscription plans
      await fetchSubscriptionPlans(storedToken);
    };
    init();
  }, [fetchSubscriptionPlans]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchSubscriptionPlans(token);
    setRefreshing(false);
  };

  // Helper to open "create plan" modal
  const handleOpenCreatePlan = () => {
    setEditPlanId(null);
    setPlanName('');
    setPlanDesc('');
    setPlanPrice('');
    setPlanMaxUsers('');
    setPlanFeatures('');
    setPlanModalVisible(true);
  };

  // Helper to open "edit plan" modal
  const handleEditPlan = (plan) => {
    setEditPlanId(plan.id);
    setPlanName(plan.name);
    setPlanDesc(plan.description || '');
    setPlanPrice(String(plan.price));
    setPlanMaxUsers(String(plan.maxUsers));
    setPlanFeatures(JSON.stringify(plan.features || {}));
    setPlanModalVisible(true);
  };

  // Save changes to plan: create or update
  const handleSavePlan = async () => {
    if (!planName || !planPrice || !planMaxUsers) {
      Alert.alert('Validation Error', 'Name, Price, and MaxUsers are required.');
      return;
    }
    if (!token) return;

    // Attempt to parse features as JSON
    let parsedFeatures = {};
    try {
      parsedFeatures = planFeatures ? JSON.parse(planFeatures) : {};
    } catch (err) {
      Alert.alert('Error', 'Invalid JSON in features field.');
      return;
    }

    const payload = {
      name: planName,
      description: planDesc,
      price: parseFloat(planPrice),
      maxUsers: parseInt(planMaxUsers, 10),
      features: parsedFeatures,
    };

    if (editPlanId) {
      // Update existing plan
      const result = await updateSubscriptionPlan(token, editPlanId, payload);
      if (result.success) {
        setPlanModalVisible(false);
      }
    } else {
      // Create new plan
      const result = await createSubscriptionPlan(token, payload);
      if (result.success) {
        setPlanModalVisible(false);
      }
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!token) return;
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSubscriptionPlan(token, planId);
          },
        },
      ]
    );
  };

  // Render a single plan row
  const renderPlanItem = ({ item }) => {
    return (
      <View
        className={`p-4 mb-3 rounded-lg flex-row justify-between ${
          isLightTheme ? 'bg-slate-50' : 'bg-slate-800'
        }`}
      >
        <View className="flex-1">
          <Text
            className={`text-base font-semibold ${
              isLightTheme ? 'text-slate-800' : 'text-slate-200'
            }`}
          >
            {item.name}
          </Text>
          <Text
            className={`text-xs mt-0.5 ${
              isLightTheme ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Price: {item.price} USD — Max Users: {item.maxUsers}
          </Text>
        </View>
        <View className="flex-row">
          <Pressable onPress={() => handleEditPlan(item)} className="mr-3">
            <Ionicons name="create-outline" size={20} color={accentColor} />
          </Pressable>
          <Pressable onPress={() => handleDeletePlan(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </Pressable>
        </View>
      </View>
    );
  };

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
          Manage Subscription Plans
        </Text>
      </View>

      {/* The FlatList is the only scrolling component */}
      {loadingPlans ? (
        <ActivityIndicator size="large" color={accentColor} className="mt-4" />
      ) : (
        <>
          {/* Title + Add Button */}
          <View className="flex-row items-center justify-between px-4 mt-3 mb-2">
            <Text
              className={`text-lg font-bold ${
                isLightTheme ? 'text-slate-800' : 'text-slate-100'
              }`}
            >
              Available Plans
            </Text>
            <Pressable onPress={handleOpenCreatePlan} className="p-2">
              <Ionicons name="add-circle-outline" size={24} color={accentColor} />
            </Pressable>
          </View>

          <FlatList
            data={subscriptionPlans}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderPlanItem}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={
              <Text
                className={`text-center mt-4 ${
                  isLightTheme ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                No subscription plans found.
              </Text>
            }
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
        </>
      )}

      {/* Create/Edit Plan Modal */}
      <Modal
        visible={planModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-11/12"
            >
              <View
                className={`p-6 rounded-2xl w-full ${
                  isLightTheme ? 'bg-white' : 'bg-slate-900'
                }`}
              >
                <Text
                  className={`text-xl font-bold mb-4 ${
                    isLightTheme ? 'text-slate-900' : 'text-slate-300'
                  }`}
                >
                  {editPlanId ? 'Edit Plan' : 'Create Plan'}
                </Text>

                {/* Plan Name */}
                <Text
                  className={`text-sm mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-2 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-300 bg-slate-100 text-slate-800'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                  value={planName}
                  onChangeText={setPlanName}
                  placeholder="e.g., Basic Plan"
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                />

                {/* Description */}
                <Text
                  className={`text-sm mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Description
                </Text>
                <TextInput
                  className={`w-full p-3 mb-2 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-300 bg-slate-100 text-slate-800'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                  value={planDesc}
                  onChangeText={setPlanDesc}
                  placeholder="e.g., This plan is good for small teams"
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                />

                {/* Price */}
                <Text
                  className={`text-sm mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Price (USD) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-2 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-300 bg-slate-100 text-slate-800'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                  value={planPrice}
                  onChangeText={setPlanPrice}
                  placeholder="e.g., 9.99"
                  keyboardType="numeric"
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                />

                {/* Max Users */}
                <Text
                  className={`text-sm mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Max Users <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-2 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-300 bg-slate-100 text-slate-800'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                  value={planMaxUsers}
                  onChangeText={setPlanMaxUsers}
                  placeholder="e.g., 10"
                  keyboardType="numeric"
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                />

                {/* Features (JSON) */}
                <Text
                  className={`text-sm mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Features (JSON)
                </Text>
                <TextInput
                  className={`w-full p-3 mb-4 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-300 bg-slate-100 text-slate-800'
                      : 'border-slate-700 bg-slate-800 text-slate-300'
                  }`}
                  value={planFeatures}
                  onChangeText={setPlanFeatures}
                  placeholder='e.g., {"prioritySupport":true}'
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  multiline
                  numberOfLines={3}
                  style={{ textAlignVertical: 'top' }}
                />

                {/* Action Buttons */}
                <View className="flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => setPlanModalVisible(false)}
                    className="mr-4"
                  >
                    <Text
                      className={`text-base font-semibold my-auto ${
                        isLightTheme ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSavePlan}
                    className="bg-orange-500 py-3 px-6 rounded-lg"
                  >
                    <Text className="text-white text-base font-semibold">
                      Save
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageSubscriptionPlans;
