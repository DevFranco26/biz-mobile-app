// File: client/store/departmentStore.jsx

import { create } from "zustand";
import { Alert } from "react-native";
import { API_BASE_URL } from "../config/constant";

const useDepartmentStore = create((set, get) => ({
  departments: [],
  loading: false,
  error: null,

  /**
   * Fetch all departments (for the current user's company).
   */
  fetchDepartments: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/departments/all`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set({ departments: data.departments || [], loading: false });
      } else {
        set({ error: data.message || "Failed to fetch departments.", loading: false });
        Alert.alert("Error", data.message || "Failed to fetch departments.");
      }
    } catch (error) {
      set({ error: "An error occurred while fetching departments.", loading: false });
      Alert.alert("Error", "An error occurred while fetching departments.");
    }
  },

  /**
   * Fetch a single department by ID and add to store.
   * If the department is not found, handle gracefully without showing an alert.
   */
  fetchDepartmentById: async (token, departmentId) => {
    const { departments } = get();
    if (departments.find((d) => d.id === departmentId)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          departments: [...state.departments.filter((dep) => dep.id !== departmentId), data.department],
        }));
      } else if (response.status === 404) {
        // Department not found. Do not show an alert. Handle it in getDepartmentName.
        console.warn(`Department with ID ${departmentId} not found.`);
        // No need to update the store; getDepartmentName will handle it.
      } else {
        set({ error: data.message || "Failed to fetch department by ID." });
        Alert.alert("Error", data.message || "Failed to fetch department by ID.");
      }
    } catch (error) {
      set({ error: "An error occurred while fetching the department by ID." });
      Alert.alert("Error", "An error occurred while fetching the department by ID.");
    }
  },

  /**
   * Helper to retrieve a department name from local store.
   * Returns "No Department" if the department is not found.
   */
  getDepartmentName: (departmentId) => {
    const { departments } = get();
    const found = departments.find((dep) => dep.id === departmentId);
    return found ? found.name : "No Department";
  },
}));

export default useDepartmentStore;
