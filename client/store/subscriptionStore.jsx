import create from 'zustand';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const useSubscriptionStore = create((set, get) => ({
  // For superAdmin to see all subscriptions
  allSubscriptions: [],
  loadingAll: false,
  errorAll: null,

  // For admin/superAdmin to see the current subscription
  currentSubscription: null,
  loadingCurrent: false,
  errorCurrent: null,

  /**
   * Fetch all subscriptions (superAdmin only).
   * Endpoint: GET /api/subscriptions/all
   */
  fetchAllSubscriptions: async (token) => {
    set({ loadingAll: true, errorAll: null });
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/all`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ allSubscriptions: data.data || [], loadingAll: false });
      } else {
        set({
          errorAll: data.message || 'Failed to fetch all subscriptions.',
          loadingAll: false,
        });
        Alert.alert('Error', data.message || 'Failed to fetch all subscriptions.');
      }
    } catch (error) {
      set({ errorAll: 'An error occurred while fetching all subscriptions.', loadingAll: false });
      Alert.alert('Error', 'An error occurred while fetching all subscriptions.');
    }
  },

  /**
   * Fetch the current subscription for the authenticated user’s company.
   * Endpoint: GET /api/subscriptions/current (admin/superAdmin)
   */
  fetchCurrentSubscription: async (token) => {
    set({ loadingCurrent: true, errorCurrent: null });
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ currentSubscription: data.data, loadingCurrent: false });
      } else {
        // If 404 (no subscription found), we can keep currentSubscription as null
        set({ currentSubscription: null, loadingCurrent: false });
        Alert.alert('Notice', data.message || 'No active subscription found.');
      }
    } catch (error) {
      set({ errorCurrent: 'An error occurred while fetching the current subscription.', loadingCurrent: false });
      Alert.alert('Error', 'An error occurred while fetching the current subscription.');
    }
  },

  /**
   * Upgrade (or create) a subscription for the current user’s company.
   * Endpoint: PUT /api/subscriptions/upgrade
   */
  upgradeSubscription: async (token, planId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/upgrade`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message || 'Subscription upgraded successfully.');
        // Optionally refetch current subscription
        await get().fetchCurrentSubscription(token);
        return { success: true, data: data.data };
      } else {
        Alert.alert('Error', data.message || 'Failed to upgrade subscription.');
        return { success: false };
      }
    } catch (error) {
      console.error('Upgrade Subscription Error:', error);
      Alert.alert('Error', 'An error occurred while upgrading subscription.');
      return { success: false };
    }
  },

  /**
   * Cancel the current subscription immediately.
   * Endpoint: PUT /api/subscriptions/cancel
   */
  cancelSubscription: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message || 'Subscription canceled successfully.');
        // Optionally refetch current subscription => none
        set({ currentSubscription: null });
        return { success: true };
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel subscription.');
        return { success: false };
      }
    } catch (error) {
      console.error('Cancel Subscription Error:', error);
      Alert.alert('Error', 'An error occurred while canceling subscription.');
      return { success: false };
    }
  },
}));

export default useSubscriptionStore;
