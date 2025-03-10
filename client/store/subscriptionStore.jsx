// File: client/store/subscriptionStore.jsx
import { create } from "zustand";
import { Alert } from "react-native";
import { API_BASE_URL } from "../config/constant";

const useSubscriptionStore = create((set, get) => ({
  // For superadmin to see ALL subscriptions
  allSubscriptions: [],
  loadingAll: false,
  errorAll: null,

  // For admin/superadmin to see the CURRENT subscription
  currentSubscription: null,
  loadingCurrent: false,
  errorCurrent: null,

  /**
   * GET /api/subscriptions/all (superadmin only)
   */
  fetchAllSubscriptions: async (token) => {
    set({ loadingAll: true, errorAll: null });
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/all`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ allSubscriptions: data.data || [], loadingAll: false });
      } else {
        set({
          errorAll: data.message || "Failed to fetch all subscriptions.",
          loadingAll: false,
        });
        Alert.alert("Error", data.message || "Failed to fetch all subscriptions.");
      }
    } catch (error) {
      console.error("fetchAllSubscriptions Error:", error);
      set({ errorAll: "Error fetching all subscriptions.", loadingAll: false });
      Alert.alert("Error", "Error fetching all subscriptions.");
    }
  },

  /**
   * GET /api/subscriptions/current (admin or superadmin)
   */
  fetchCurrentSubscription: async (token) => {
    set({ loadingCurrent: true, errorCurrent: null });
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions/current`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ currentSubscription: data.data, loadingCurrent: false });
      } else {
        set({ currentSubscription: null, loadingCurrent: false });
        Alert.alert("Notice", data.message || "No active subscription found.");
      }
    } catch (error) {
      console.error("fetchCurrentSubscription Error:", error);
      set({
        errorCurrent: "Error fetching the current subscription.",
        loadingCurrent: false,
      });
      Alert.alert("Error", "Error fetching the current subscription.");
    }
  },
}));

export default useSubscriptionStore;
