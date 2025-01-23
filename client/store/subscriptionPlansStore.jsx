// File: client/store/subscriptionPlansStore.jsx

import {create} from 'zustand';
import { Alert } from 'react-native';
import { API_BASE_URL } from '../config/constant';

const useSubscriptionPlansStore = create((set, get) => ({
  subscriptionPlans: [],
  loadingPlans: false,
  errorPlans: null,

  fetchSubscriptionPlans: async (token) => {
    set({ loadingPlans: true, errorPlans: null });
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/subscription-plans`, {
        method: 'GET',
        headers,
      });
      const data = await response.json();
      if (response.ok) {
        set({ subscriptionPlans: data.data || [], loadingPlans: false });
      } else {
        set({
          errorPlans: data.message || 'Failed to fetch subscription plans.',
          loadingPlans: false,
        });
        Alert.alert('Error', data.message || 'Failed to fetch subscription plans.');
      }
    } catch (error) {
      console.error('fetchSubscriptionPlans Error:', error);
      set({
        errorPlans: 'An error occurred while fetching subscription plans.',
        loadingPlans: false,
      });
      Alert.alert('Error', 'An error occurred while fetching subscription plans.');
    }
  },

  createSubscriptionPlan: async (token, planData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-plans`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message || 'Plan created successfully.');
        await get().fetchSubscriptionPlans(token);
        return { success: true };
      } else {
        Alert.alert('Error', data.message || 'Failed to create plan.');
        return { success: false };
      }
    } catch (error) {
      console.error('createSubscriptionPlan Error:', error);
      Alert.alert('Error', 'An error occurred while creating the plan.');
      return { success: false };
    }
  },

  updateSubscriptionPlan: async (token, planId, updatedFields) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-plans/${planId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message || 'Plan updated successfully.');
        await get().fetchSubscriptionPlans(token);
        return { success: true };
      } else {
        Alert.alert('Error', data.message || 'Failed to update plan.');
        return { success: false };
      }
    } catch (error) {
      console.error('updateSubscriptionPlan Error:', error);
      Alert.alert('Error', 'An error occurred while updating the plan.');
      return { success: false };
    }
  },

  deleteSubscriptionPlan: async (token, planId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-plans/${planId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message || 'Plan deleted successfully.');
        await get().fetchSubscriptionPlans(token);
        return { success: true };
      } else {
        Alert.alert('Error', data.message || 'Failed to delete plan.');
        return { success: false };
      }
    } catch (error) {
      console.error('deleteSubscriptionPlan Error:', error);
      Alert.alert('Error', 'An error occurred while deleting the plan.');
      return { success: false };
    }
  },
}));

export default useSubscriptionPlansStore;
