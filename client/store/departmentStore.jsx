// File: client/store/departmentStore.jsx

import create from 'zustand';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

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
      // According to your code, the route to get all is: GET /api/departments/all
      const response = await fetch(`${API_BASE_URL}/departments/all`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // data.departments is the array in your code
        set({ departments: data.departments || [], loading: false });
      } else {
        set({ error: data.message || 'Failed to fetch departments.', loading: false });
        Alert.alert('Error', data.message || 'Failed to fetch departments.');
      }
    } catch (error) {
      set({ error: 'An error occurred while fetching departments.', loading: false });
      Alert.alert('Error', 'An error occurred while fetching departments.');
    }
  },

  /**
   * Fetch a single department by ID and add to store.
   */
  fetchDepartmentById: async (token, departmentId) => {
    // Only fetch if we don't already have it
    const { departments } = get();
    if (departments.find((d) => d.id === departmentId)) {
      return; // Already loaded
    }

    try {
      const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // data.department is the single department object
        set((state) => ({
          departments: [...state.departments.filter((dep) => dep.id !== departmentId), data.department],
        }));
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch department by ID.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching the department by ID.');
    }
  },

  /**
   * Helper to retrieve a department name from local store.
   */
  getDepartmentName: (departmentId) => {
    const { departments } = get();
    const found = departments.find((dep) => dep.id === departmentId);
    return found ? found.name : '';
  },
}));

export default useDepartmentStore;
