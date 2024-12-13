// File: store/departmentsStore.jsx

import create from 'zustand';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const useDepartmentsStore = create((set, get) => ({
  departments: [],
  loading: false,
  error: null,

  // Fetch all departments (filtered by backend)
  fetchDepartments: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/departments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Departments API Response Status:', response.status);

      let data;
      try {
        data = await response.json();
        console.log('Departments API Response Data:', data);
      } catch (jsonError) {
        const text = await response.text();
        console.error('Failed to parse JSON:', jsonError);
        console.error('Response Text:', text);
        throw new Error('Invalid JSON response from server.');
      }

      if (response.ok) {
        set({ departments: data.data, loading: false });
      } else {
        set({ error: data.message || 'Failed to fetch departments.', loading: false });
        Alert.alert('Error', data.message || 'Failed to fetch departments.');
      }
    } catch (error) {
      console.error('Fetch Departments Error:', error);
      set({ error: error.message || 'An unexpected error occurred.', loading: false });
      Alert.alert('Error', error.message || 'An unexpected error occurred while fetching departments.');
    }
  },

  // ... other actions (createDepartment, updateDepartment, deleteDepartment)
}));

export default useDepartmentsStore;
