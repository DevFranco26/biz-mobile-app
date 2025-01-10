// File: client/store/subscriptionStore.jsx

import create from 'zustand';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

/**
 * The subscription object from the server might look like:
 * {
 *   id: 123,
 *   companyId: 7,
 *   planId: 1,
 *   paymentMethod: 'card',
 *   paymentDateTime: '2025-01-12T10:23:00Z',
 *   expirationDateTime: '2025-02-11T10:23:00Z',
 *   renewalDateTime: '2025-02-11T10:23:00Z',
 *   status: 'active' | 'canceled' | ...
 *   plan: { id, name, rangeOfUsers, price, maxUsers, ... }
 * }
 */

const useSubscriptionStore = create((set, get) => ({
  // For superAdmin to see ALL subscriptions
  allSubscriptions: [],
  loadingAll: false,
  errorAll: null,

  // For admin/superAdmin to see the CURRENT subscription
  currentSubscription: null,
  loadingCurrent: false,
  errorCurrent: null,

  /**
   * GET /api/subscriptions/all (superAdmin only)
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
        // data.data is an array of subscriptions
        set({ allSubscriptions: data.data || [], loadingAll: false });
      } else {
        set({
          errorAll: data.message || 'Failed to fetch all subscriptions.',
          loadingAll: false,
        });
        Alert.alert('Error', data.message || 'Failed to fetch all subscriptions.');
      }
    } catch (error) {
      console.error('fetchAllSubscriptions Error:', error);
      set({ errorAll: 'Error fetching all subscriptions.', loadingAll: false });
      Alert.alert('Error', 'Error fetching all subscriptions.');
    }
  },

  /**
   * GET /api/subscriptions/current (admin or superAdmin)
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
        // data.data is the single subscription object
        set({ currentSubscription: data.data, loadingCurrent: false });
      } else {
        set({ currentSubscription: null, loadingCurrent: false });
        Alert.alert('Notice', data.message || 'No active subscription found.');
      }
    } catch (error) {
      console.error('fetchCurrentSubscription Error:', error);
      set({
        errorCurrent: 'Error fetching the current subscription.',
        loadingCurrent: false,
      });
      Alert.alert('Error', 'Error fetching the current subscription.');
    }
  },

  /**
   * PUT /api/subscriptions/upgrade (admin or superAdmin)
   * Provide { planId } in body
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
        // Refresh current subscription
        await get().fetchCurrentSubscription(token);
        return { success: true, data: data.data };
      } else {
        Alert.alert('Error', data.message || 'Failed to upgrade subscription.');
        return { success: false };
      }
    } catch (error) {
      console.error('upgradeSubscription Error:', error);
      Alert.alert('Error', 'Error upgrading subscription.');
      return { success: false };
    }
  },

  /**
   * PUT /api/subscriptions/cancel (admin or superAdmin)
   */
  cancelSubscription: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', data.message || 'Subscription canceled successfully.');
        // The server reverts to a Free plan, so let's refetch
        await get().fetchCurrentSubscription(token);
        return { success: true };
      } else {
        Alert.alert('Error', data.message || 'Failed to cancel subscription.');
        return { success: false };
      }
    } catch (error) {
      console.error('cancelSubscription Error:', error);
      Alert.alert('Error', 'Error canceling subscription.');
      return { success: false };
    }
  },
}));

export default useSubscriptionStore;
