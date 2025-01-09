// File: client/store/companyStore.jsx

import create from 'zustand';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const useCompanyStore = create((set, get) => ({
  companies: [],
  loading: false,
  error: null,

  // We'll store user counts keyed by companyId
  companyUserCounts: {},

  /**
   * Fetch all companies (for listing).
   */
  fetchCompanies: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/companies/all`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set({ companies: data.data || [], loading: false });
      } else {
        set({ error: data.message || 'Failed to fetch companies.', loading: false });
        Alert.alert('Error', data.message || 'Failed to fetch companies.');
      }
    } catch (error) {
      set({ error: 'An error occurred while fetching companies.', loading: false });
      Alert.alert('Error', 'An error occurred while fetching companies.');
    }
  },

  /**
   * Fetch a single company by ID and either store or return it.
   */
  fetchCompanyById: async (token, companyId) => {
    const { companies } = get();
    if (companies.find((c) => c.id === companyId)) {
      return; // Already have it, skip network call
    }

    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
        method: 'GET',
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
        Alert.alert('Error', data.message || 'Failed to fetch company by ID.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while fetching the company by ID.');
    }
  },

  /**
   * Delete company from the server & local store.
   */
  deleteCompany: async (companyId, token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/delete/${companyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set((state) => ({
          companies: state.companies.filter((company) => company.id !== companyId),
        }));
        Alert.alert('Success', data.message || 'Company deleted successfully.');
        return { success: true, message: data.message || 'Company deleted successfully.' };
      } else {
        Alert.alert('Error', data.message || 'Failed to delete company.');
        return { success: false, message: data.message || 'Failed to delete company.' };
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while deleting the company.');
      return { success: false, message: 'An error occurred while deleting the company.' };
    }
  },

  /**
   * Return a company's name from the store if found, else blank.
   */
  getCompanyName: (companyId) => {
    const { companies } = get();
    const found = companies.find((c) => c.id === companyId);
    return found ? found.name : '';
  },

  /**
   * Fetch user count for a single company (calls /api/companies/:id/user-count).
   * We'll store it in companyUserCounts[companyId].
   */
  fetchCompanyUserCount: async (token, companyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}/user-count`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user count.');
      }
      // E.g. data.data = { companyId: 9999, userCount: 74 }
      const { userCount } = data.data || {};
      // Update store
      set((state) => ({
        companyUserCounts: {
          ...state.companyUserCounts,
          [companyId]: userCount,
        },
      }));
      return userCount;
    } catch (err) {
      console.error('Error fetching user count:', err);
      Alert.alert('Error', err.message || 'Failed to fetch user count.');
      return 0;
    }
  },
}));

export default useCompanyStore;
