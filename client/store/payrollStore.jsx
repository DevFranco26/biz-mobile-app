// File: store/payrollStore.jsx

import { create } from "zustand";
import { Alert } from "react-native";
import { API_BASE_URL } from "../config/constant";

const usePayrollStore = create((set, get) => ({
  loading: false,
  error: null,

  // For admin - list all
  payrollRecords: [],
  // For the current user - list
  myPayrollRecords: [],
  // For payroll settings
  payrollSettings: null,

  // ============== ACTIONS ==============
  fetchAllPayroll: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/payroll`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ payrollRecords: data.data, loading: false });
      } else {
        set({
          error: data.message || "Failed to fetch payroll.",
          loading: false,
        });
        Alert.alert("Error", data.message || "Failed to fetch payroll.");
      }
    } catch (error) {
      set({
        error: "An error occurred while fetching payroll.",
        loading: false,
      });
      Alert.alert("Error", "An error occurred while fetching payroll.");
    }
  },

  fetchMyPayroll: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/payroll/my`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ myPayrollRecords: data.data, loading: false });
      } else {
        set({
          error: data.message || "Failed to fetch my payroll.",
          loading: false,
        });
        Alert.alert("Error", data.message || "Failed to fetch my payroll.");
      }
    } catch (error) {
      set({ error: "Error fetching my payroll.", loading: false });
      Alert.alert("Error", "Error fetching my payroll.");
    }
  },

  fetchPayrollSettings: async (token) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/settings`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        set({ payrollSettings: data.data, loading: false });
      } else {
        set({
          error: data.message || "Failed to fetch payroll settings.",
          loading: false,
        });
        Alert.alert("Error", data.message || "Failed to fetch payroll settings.");
      }
    } catch (error) {
      set({
        error: "An error occurred while fetching payroll settings.",
        loading: false,
      });
      Alert.alert("Error", "An error occurred while fetching payroll settings.");
    }
  },

  updatePayrollSettings: async (token, { cutoffCycle, currency, overtimeRate }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cutoffCycle, currency, overtimeRate }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ payrollSettings: data.data, loading: false });
        Alert.alert("Success", "Payroll settings updated successfully.");
      } else {
        set({
          error: data.message || "Failed to update payroll settings.",
          loading: false,
        });
        Alert.alert("Error", data.message || "Failed to update payroll settings.");
      }
    } catch (error) {
      set({ error: "Error updating payroll settings.", loading: false });
      Alert.alert("Error", "Error updating payroll settings.");
    }
  },

  createOrUpdatePayRate: async (token, userId, { payType, rate }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/payrate/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payType, rate }),
      });
      const data = await res.json();
      if (res.ok) {
        set({ loading: false });
        Alert.alert("Success", data.message || "Pay rate updated.");
      } else {
        set({
          error: data.message || "Failed to set pay rate.",
          loading: false,
        });
        Alert.alert("Error", data.message || "Failed to set pay rate.");
      }
    } catch (error) {
      set({ error: "Error setting pay rate.", loading: false });
      Alert.alert("Error", "Error setting pay rate.");
    }
  },

  // admin triggers calculation
  calculatePayroll: async (token, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/calculate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        set({ loading: false });
        Alert.alert("Success", data.message || "Payroll calculation complete.");
      } else {
        set({
          error: data.message || "Failed to calculate payroll.",
          loading: false,
        });
        Alert.alert("Error", data.message || "Failed to calculate payroll.");
      }
    } catch (error) {
      set({ error: "Error calculating payroll.", loading: false });
      Alert.alert("Error", "Error calculating payroll.");
    }
  },
}));

export default usePayrollStore;
