// File: store/companiesStore.jsx

import create from 'zustand';
import { Alert } from 'react-native';

// Define your API base URL
const API_BASE_URL = 'http://192.168.100.8:5000/api'; // Update this if different

const useCompaniesStore = create((set, get) => ({
  companies: [],
  loading: false,
  error: null,

  // Fetch all companies
  fetchCompanies: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch companies.');
      }

      const data = await response.json();
      set({ companies: data.data, loading: false });
    } catch (error) {
      console.error('Fetch Companies Error:', error);
      set({ error: error.message, loading: false });
      Alert.alert('Error', error.message);
    }
  },

  // Create a new company
  createCompany: async (token, companyData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create company.');
      }

      const data = await response.json();
      set((state) => ({ companies: [...state.companies, data.data], loading: false }));
      Alert.alert('Success', 'Company created successfully.');
    } catch (error) {
      console.error('Create Company Error:', error);
      set({ error: error.message, loading: false });
      Alert.alert('Error', error.message);
    }
  },

  // Update a company
  updateCompany: async (token, companyId, updatedData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update company.');
      }

      const data = await response.json();
      set((state) => ({
        companies: state.companies.map((company) =>
          company.id === companyId ? data.data : company
        ),
        loading: false,
      }));
      Alert.alert('Success', 'Company updated successfully.');
    } catch (error) {
      console.error('Update Company Error:', error);
      set({ error: error.message, loading: false });
      Alert.alert('Error', error.message);
    }
  },

  // Delete a company
  deleteCompany: async (token, companyId) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete company.');
      }

      await response.json();
      set((state) => ({
        companies: state.companies.filter((company) => company.id !== companyId),
        loading: false,
      }));
      Alert.alert('Success', 'Company deleted successfully.');
    } catch (error) {
      console.error('Delete Company Error:', error);
      set({ error: error.message, loading: false });
      Alert.alert('Error', error.message);
    }
  },
}));

export default useCompaniesStore;
