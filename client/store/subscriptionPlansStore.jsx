import create from 'zustand';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const useSubscriptionPlansStore = create((set, get) => ({
  subscriptionPlans: [],
  loadingPlans: false,
  errorPlans: null,

  /**
   * Fetch all subscription plans (superAdmin to manage, or admin can view).
   * Endpoint: GET /api/subscription-plans
   */
  fetchSubscriptionPlans: async (token) => {
    set({ loadingPlans: true, errorPlans: null });
    try {
      const response = await fetch(`${API_BASE_URL}/subscription-plans`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ subscriptionPlans: data.data || [], loadingPlans: false });
      } else {
        set({ errorPlans: data.message || 'Failed to fetch subscription plans.', loadingPlans: false });
        Alert.alert('Error', data.message || 'Failed to fetch subscription plans.');
      }
    } catch (error) {
      set({ errorPlans: 'An error occurred while fetching subscription plans.', loadingPlans: false });
      Alert.alert('Error', 'An error occurred while fetching subscription plans.');
    }
  },

  /**
   * Create a new subscription plan (superAdmin only).
   * Endpoint: POST /api/subscription-plans
   */
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
        Alert.alert('Success', data.message || 'Subscription plan created successfully.');
        // Refresh the list
        await get().fetchSubscriptionPlans(token);
        return { success: true };
      } else {
        Alert.alert('Error', data.message || 'Failed to create subscription plan.');
        return { success: false };
      }
    } catch (error) {
      console.error('Create Plan Error:', error);
      Alert.alert('Error', 'An error occurred while creating the plan.');
      return { success: false };
    }
  },

  /**
   * Update an existing subscription plan (superAdmin only).
   * Endpoint: PUT /api/subscription-plans/:id
   */
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
        Alert.alert('Success', data.message || 'Subscription plan updated successfully.');
        await get().fetchSubscriptionPlans(token);
        return { success: true };
      } else {
        Alert.alert('Error', data.message || 'Failed to update subscription plan.');
        return { success: false };
      }
    } catch (error) {
      console.error('Update Plan Error:', error);
      Alert.alert('Error', 'An error occurred while updating the subscription plan.');
      return { success: false };
    }
  },

  /**
   * Delete a subscription plan (superAdmin only).
   * Endpoint: DELETE /api/subscription-plans/:id
   */
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
        Alert.alert('Success', data.message || 'Subscription plan deleted successfully.');
        await get().fetchSubscriptionPlans(token);
        return { success: true };
      } else {
        Alert.alert('Error', data.message || 'Failed to delete subscription plan.');
        return { success: false };
      }
    } catch (error) {
      console.error('Delete Plan Error:', error);
      Alert.alert('Error', 'An error occurred while deleting the subscription plan.');
      return { success: false };
    }
  },
}));

export default useSubscriptionPlansStore;
