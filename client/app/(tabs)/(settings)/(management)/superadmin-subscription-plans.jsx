// File: app/(tabs)/(settings)/(management)/superadmin-subscription-plans.jsx

import React, { useEffect, useState } from 'react'
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
  ScrollView,
  Switch,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import useThemeStore from '../../../../store/themeStore'
import useUserStore from '../../../../store/userStore'
import useSubscriptionPlansStore from '../../../../store/subscriptionPlansStore'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'

const SubscriptionPlans = () => {
  const router = useRouter()
  const { theme } = useThemeStore()
  const isLightTheme = theme === 'light'
  const accentColor = isLightTheme ? '#c2410c' : '#f97316'
  const { user } = useUserStore()
  const {
    subscriptionPlans,
    loadingPlans,
    fetchSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
  } = useSubscriptionPlansStore()

  const [token, setToken] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [planModalVisible, setPlanModalVisible] = useState(false)
  const [editPlanId, setEditPlanId] = useState(null)
  const [planName, setPlanName] = useState('')
  const [planDesc, setPlanDesc] = useState('')
  const [planPrice, setPlanPrice] = useState('')
  const [planMaxUsers, setPlanMaxUsers] = useState('')
  const [timekeeping, setTimekeeping] = useState(false)
  const [payroll, setPayroll] = useState(false)
  const [leaves, setLeaves] = useState(false)
  const [timekeepingPunchOffline, setTimekeepingPunchOffline] = useState(false)
  const [viewPlanModalVisible, setViewPlanModalVisible] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    const init = async () => {
      const storedToken = await SecureStore.getItemAsync('token')
      if (!storedToken) {
        Alert.alert('Auth Error', 'Please sign in again.')
        router.replace('(auth)/login-user')
        return
      }
      setToken(storedToken)
      await fetchSubscriptionPlans(storedToken)
    }
    init()
  }, [fetchSubscriptionPlans])

  const onRefresh = async () => {
    if (!token) return
    setRefreshing(true)
    await fetchSubscriptionPlans(token)
    setRefreshing(false)
  }

  const handleOpenCreatePlan = () => {
    setEditPlanId(null)
    setPlanName('')
    setPlanDesc('')
    setPlanPrice('')
    setPlanMaxUsers('')
    setTimekeeping(false)
    setPayroll(false)
    setLeaves(false)
    setTimekeepingPunchOffline(false)
    setPlanModalVisible(true)
  }

  const handleEditPlan = plan => {
    setEditPlanId(plan?.id)
    setPlanName(plan?.planName)
    setPlanDesc(plan.description || '')
    setPlanPrice(String(plan.price))
    setPlanMaxUsers(plan.rangeOfUsers)
    if (plan.features) {
      setTimekeeping(!!plan.features.timekeeping)
      setPayroll(!!plan.features.payroll)
      setLeaves(!!plan.features.leaves)
      setTimekeepingPunchOffline(!!plan.features['timekeeping-punch-offline'])
    } else {
      setTimekeeping(false)
      setPayroll(false)
      setLeaves(false)
      setTimekeepingPunchOffline(false)
    }
    setPlanModalVisible(true)
  }

  const handleViewPlan = plan => {
    setSelectedPlan(plan)
    setViewPlanModalVisible(true)
  }

  const handleSavePlan = async () => {
    if (!planName || !planPrice || !planMaxUsers) {
      Alert.alert('Validation Error', 'Name, Price, and Max Users are required.')
      return
    }
    if (!token) return
    const payload = {
      planName,
      description: planDesc,
      price: parseFloat(planPrice),
      rangeOfUsers: planMaxUsers,
      features: {
        timekeeping,
        payroll,
        leaves,
        'timekeeping-punch-offline': timekeepingPunchOffline,
      },
    }
    if (editPlanId) {
      const result = await updateSubscriptionPlan(token, editPlanId, payload)
      if (result.success) {
        setPlanModalVisible(false)
      }
    } else {
      const result = await createSubscriptionPlan(token, payload)
      if (result.success) {
        setPlanModalVisible(false)
      }
    }
  }

  const handleDeletePlan = async planId => {
    if (!token) return
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSubscriptionPlan(token, planId)
          if (selectedPlan && selectedPlan.id === planId) {
            setViewPlanModalVisible(false)
          }
        },
      },
    ])
  }

  const renderPlanItem = ({ item }) => {
    return (
      <View
        className={`p-4 mb-3 rounded-lg flex-row justify-between ${
          isLightTheme ? 'bg-slate-50' : 'bg-slate-800'
        }`}
      >
        <Pressable
          className="flex-row justify-between w-full items-center gap-1"
          onPress={() => handleViewPlan(item)}
        >
          <Text
            className={`text-base font-bold ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            {item.planName}
          </Text>
          <Text
            className={`font-medium ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            ({item.rangeOfUsers})
          </Text>
          <Text
            className={`font-semibold ml-auto ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            ${item.price}
          </Text>
        </Pressable>
      </View>
    )
  }

  const sortedPlans = subscriptionPlans ? [...subscriptionPlans].sort((a, b) => a.id - b.id) : []

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
      <View className="px-4 py-3 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back-outline" size={24} color={isLightTheme ? '#333' : '#fff'} />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
          Subscription Plans
        </Text>
      </View>
      {loadingPlans ? (
        <ActivityIndicator size="large" color={accentColor} className="mt-4" />
      ) : (
        <>
          <View className="flex-row items-center justify-between px-4 mt-3 mb-2">
            <Text className={`text-lg font-bold ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
            Subscription Plans
            </Text>
            <Pressable onPress={handleOpenCreatePlan} className="p-2">
              <Ionicons
                name="add"
                size={24}
                color={isLightTheme ? '#1e293b' : '#cbd5e1'}
              />
            </Pressable>
          </View>
          <FlatList
            data={sortedPlans}
            keyExtractor={item => String(item.id)}
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
      <Modal
        visible={planModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPlanModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-11/12"
            >
              <View className={`p-6 rounded-2xl w-full ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
                <Text className={`text-xl font-bold mb-4 ${isLightTheme ? 'text-slate-900' : 'text-slate-300'}`}>
                  {editPlanId ? 'Edit Plan' : 'Create Plan'}
                </Text>
                <Text className={`text-sm mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                  Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-2 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-100 bg-slate-100 text-slate-800'
                      : 'border-slate-800 bg-slate-800 text-slate-300'
                  }`}
                  value={planName}
                  onChangeText={setPlanName}
                  placeholder="e.g., Basic Plan"
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                />
                <Text className={`text-sm mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                  Description
                </Text>
                <TextInput
                  className={`w-full p-3 mb-2 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-100 bg-slate-100 text-slate-800'
                      : 'border-slate-800 bg-slate-800 text-slate-300'
                  }`}
                  value={planDesc}
                  onChangeText={setPlanDesc}
                  placeholder="e.g., This plan is good for small teams"
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                />
                <Text className={`text-sm mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                  Price (USD) <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-2 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-100 bg-slate-100 text-slate-800'
                      : 'border-slate-800 bg-slate-800 text-slate-300'
                  }`}
                  value={planPrice}
                  onChangeText={setPlanPrice}
                  placeholder="e.g., 9.99"
                  keyboardType="numeric"
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                />
                <Text className={`text-sm mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                  Range of Users <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-2 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-100 bg-slate-100 text-slate-800'
                      : 'border-slate-800 bg-slate-800 text-slate-300'
                  }`}
                  value={planMaxUsers}
                  onChangeText={setPlanMaxUsers}
                  placeholder="e.g., 10"
                  keyboardType="numeric"
                  placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                />
                <Text className={`text-sm mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                  Features:
                </Text>
                <View className="mb-4">
                  <View className="flex-row items-center mb-2">
                    <Text
                      className={`${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      } mr-1 text-sm`}
                    >
                      Timekeeping
                    </Text>
                    <Switch
                      value={timekeeping}
                      onValueChange={setTimekeeping}
                      trackColor={{ true: 'slate', false: 'slate' }}
                      thumbColor={timekeeping ? 'orange' : 'slate'}
                    />
                  </View>
                  <View className="flex-row items-center mb-2">
                    <Text
                      className={`${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      } mr-1 text-sm`}
                    >
                      Payroll
                    </Text>
                    <Switch
                      value={payroll}
                      onValueChange={setPayroll}
                      trackColor={{ true: 'slate', false: 'slate' }}
                      thumbColor={payroll ? 'orange' : 'slate'}
                    />
                  </View>
                  <View className="flex-row items-center mb-2">
                    <Text
                      className={`${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      } mr-1 text-sm`}
                    >
                      Leaves
                    </Text>
                    <Switch
                      value={leaves}
                      onValueChange={setLeaves}
                      trackColor={{ true: 'slate', false: 'slate' }}
                      thumbColor={leaves ? 'orange' : 'slate'}
                    />
                  </View>
                  <View className="flex-row items-center mb-2">
                    <Text
                      className={`${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      } mr-1 text-sm`}
                    >
                      Punch Offline
                    </Text>
                    <Switch
                      value={timekeepingPunchOffline}
                      onValueChange={setTimekeepingPunchOffline}
                      trackColor={{ true: 'slate', false: 'slate' }}
                      thumbColor={timekeepingPunchOffline ? 'orange' : 'slate'}
                    />
                  </View>
                </View>
                <View className="flex-row justify-end">
                  <TouchableOpacity onPress={() => setPlanModalVisible(false)} className="mr-4">
                    <Text
                      className={`text-base font-semibold my-auto ${
                        isLightTheme ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSavePlan} className="bg-orange-500 py-3 px-6 rounded-lg">
                    <Text className="text-white text-base font-semibold">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      <Modal
        visible={viewPlanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewPlanModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setViewPlanModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className={`p-6 rounded-2xl w-11/12 ${isLightTheme ? 'bg-white' : 'bg-slate-800'}`}>
              <Text className={`text-xl font-bold mb-4 ${isLightTheme ? 'text-slate-900' : 'text-slate-100'}`}>
                Plan Details
              </Text>
              {selectedPlan ? (
                <ScrollView>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="finger-print-outline" size={16} color={isLightTheme ? '#1e293b' : '#cbd5e1'} />
                    <Text className={`ml-2 text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                      Plan ID: {selectedPlan.id}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="pricetag-outline" size={16} color={isLightTheme ? '#1e293b' : '#cbd5e1'} />
                    <Text className={`ml-2 text-sm ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}>
                      Subscription: {selectedPlan.planName}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="people-outline" size={16} color={isLightTheme ? '#1e293b' : '#cbd5e1'} />
                    <Text className={`ml-2 text-sm ${isLightTheme ? 'text-slate-800' : 'text-slate-200'}`}>
                      Range of Users: {selectedPlan.rangeOfUsers}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="cash-outline" size={16} color={isLightTheme ? '#1e293b' : '#cbd5e1'} />
                    <Text className={`ml-2 text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                      Price: ${selectedPlan.price}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="book-outline" size={16} color={isLightTheme ? '#1e293b' : '#cbd5e1'} />
                    <Text className={`ml-2 text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                      Description: {selectedPlan.description}
                    </Text>
                  </View>
                  <Text className={`text-sm mt-4 font-semibold ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
                    Features:
                  </Text>
                  {selectedPlan.features && Object.keys(selectedPlan.features).length > 0 ? (
                    Object.entries(selectedPlan.features).map(([feature, available]) => (
                      <View key={feature} className="flex-row items-center mt-1">
                        <Ionicons name={available ? 'checkmark-circle' : 'lock-closed'} size={16} color={available ? 'green' : 'red'} />
                        <Text className={`ml-2 text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                          {feature}: {available ? 'Available' : 'Locked'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text className={`text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                      No features listed.
                    </Text>
                  )}
                  <View className="flex-row justify-between mt-8 space-x-2 gap-3">
                    <Pressable
                      onPress={() => {
                        setViewPlanModalVisible(false)
                        handleEditPlan(selectedPlan)
                      }}
                      className="flex-1 p-4 rounded-lg items-center bg-orange-500"
                    >
                      <Ionicons name="create-outline" size={24} color="#fff" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeletePlan(selectedPlan.id)}
                      className="flex-1 p-4 rounded-lg items-center bg-red-500"
                    >
                      <Ionicons name="trash-outline" size={24} color="#fff" />
                    </Pressable>
                    <Pressable
                      onPress={() => setViewPlanModalVisible(false)}
                      className="flex-1 p-4 rounded-lg items-center bg-slate-500"
                    >
                      <Ionicons name="close-circle-outline" size={24} color="#fff" />
                    </Pressable>
                  </View>
                </ScrollView>
              ) : (
                <ActivityIndicator size="large" color={accentColor} />
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  )
}

export default SubscriptionPlans
