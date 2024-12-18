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
      const data = await response.json();
      if (response.ok) {
        set({ departments: data.data, loading: false });
      } else {
        set({ error: data.message || 'Failed to fetch departments.', loading: false });
        Alert.alert('Error', data.message || 'Failed to fetch departments.');
      }
    } catch (error) {
      console.error('Fetch Departments Error:', error);
      set({ error: 'An unexpected error occurred.', loading: false });
      Alert.alert('Error', 'An unexpected error occurred while fetching departments.');
    }
  },

  // Create a new department
  createDepartment: async (token, departmentData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(departmentData),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({ departments: [...state.departments, data.data], loading: false }));
        Alert.alert('Success', 'Department created successfully.');
      } else {
        set({ error: data.message || 'Failed to create department.', loading: false });
        Alert.alert('Error', data.message || 'Failed to create department.');
      }
    } catch (error) {
      console.error('Create Department Error:', error);
      set({ error: 'An unexpected error occurred.', loading: false });
      Alert.alert('Error', 'An unexpected error occurred while creating the department.');
    }
  },

  // Update a department
  updateDepartment: async (token, departmentId, updatedData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          departments: state.departments.map((dept) =>
            dept.id === departmentId ? data.data : dept
          ),
          loading: false,
        }));
        Alert.alert('Success', 'Department updated successfully.');
      } else {
        set({ error: data.message || 'Failed to update department.', loading: false });
        Alert.alert('Error', data.message || 'Failed to update department.');
      }
    } catch (error) {
      console.error('Update Department Error:', error);
      set({ error: 'An unexpected error occurred.', loading: false });
      Alert.alert('Error', 'An unexpected error occurred while updating the department.');
    }
  },

  // Delete a department
  deleteDepartment: async (token, departmentId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          departments: state.departments.filter((dept) => dept.id !== departmentId),
          loading: false,
        }));
        Alert.alert('Success', 'Department deleted successfully.');
      } else {
        set({ error: data.message || 'Failed to delete department.', loading: false });
        Alert.alert('Error', data.message || 'Failed to delete department.');
      }
    } catch (error) {
      console.error('Delete Department Error:', error);
      set({ error: 'An unexpected error occurred.', loading: false });
      Alert.alert('Error', 'An unexpected error occurred while deleting the department.');
    }
  },
}));

export default useDepartmentsStore;
