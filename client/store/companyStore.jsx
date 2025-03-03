// File: client/store/companyStore.jsx

import { create } from "zustand";
import { Alert } from "react-native";
import { API_BASE_URL } from "../config/constant";

const useCompanyStore = create((set, get) => ({
  companies: [],
  loading: false,
  error: null,
  companyUserCounts: {},

  fetchCompanies: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/companies/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set({ companies: data.data || [], loading: false });
      } else {
        set({ error: data.message || "Failed to fetch companies.", loading: false });
        Alert.alert("Error", data.message || "Failed to fetch companies.");
      }
    } catch (error) {
      set({ error: "An error occurred while fetching companies.", loading: false });
      Alert.alert("Error", "An error occurred while fetching companies.");
    }
  },

  fetchCompanyById: async (token, companyId) => {
    const { companies } = get();
    if (companies.find((c) => c.id === companyId)) {
      return; // Already have it, skip network call
    }

    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          companies: [...state.companies.filter((c) => c.id !== companyId), data.data],
        }));
      } else {
        Alert.alert("Error", data.message || "Failed to fetch company by ID.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while fetching the company by ID.");
    }
  },

  deleteCompany: async (companyId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/delete/${companyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          companies: state.companies.filter((company) => company.id !== companyId),
        }));
        Alert.alert("Success", data.message || "Company deleted successfully.");
        return { success: true, message: data.message || "Company deleted successfully." };
      } else {
        Alert.alert("Error", data.message || "Failed to delete company.");
        return { success: false, message: data.message || "Failed to delete company." };
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while deleting the company.");
      return { success: false, message: "An error occurred while deleting the company." };
    }
  },

  getCompanyName: (companyId) => {
    const { companies } = get();
    const found = companies.find((c) => c.id === companyId);
    return found ? found.name : "";
  },

  fetchCompanyUserCount: async (token, companyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/user-count`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch user count.");
      }
      const { userCount } = data.data || {};
      set((state) => ({
        companyUserCounts: {
          ...state.companyUserCounts,
          [companyId]: userCount,
        },
      }));
      return userCount;
    } catch (err) {
      console.error("Error fetching user count:", err);
      Alert.alert("Error", err.message || "Failed to fetch user count.");
      return 0;
    }
  },
}));

export default useCompanyStore;
