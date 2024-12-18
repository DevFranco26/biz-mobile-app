// File: store/leaveStore.jsx

import create from 'zustand';
import axios from 'axios';
import { Alert } from 'react-native';

// Define your API base URL
const API_BASE_URL = 'http://192.168.100.8:5000/api';

const useLeaveStore = create((set, get) => ({
  // State Variables
  approvers: [],
  loadingApprovers: false,
  submittingLeave: false,
  loadingLeaves: false,
  leaves: [],
  errorApprovers: null,
  errorSubmittingLeave: null,
  errorLeaves: null,
  userLeaves: [],
  loadingUserLeaves: false,
  errorUserLeaves: null,

  // Actions

  /**
   * Fetch Approvers within the Same Company
   * @param {string} token - JWT token for authentication
   */
  fetchApprovers: async (token) => {
    set({ loadingApprovers: true, errorApprovers: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/leaves/approvers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Fetch Approvers Response:', response.data); // Debugging Log
      if (response.status === 200) {
        set({ approvers: response.data.data, loadingApprovers: false });
        console.log('Approvers set in store:', response.data.data); // Debugging Log
      } else {
        set({
          errorApprovers: response.data.message || 'Failed to fetch approvers.',
          loadingApprovers: false,
        });
        Alert.alert('Error', response.data.message || 'Failed to fetch approvers.');
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
      set({
        errorApprovers: 'An error occurred while fetching approvers.',
        loadingApprovers: false,
      });
      Alert.alert('Error', 'An error occurred while fetching approvers.');
    }
  },

  /**
   * Fetch Leaves based on Status for Approver
   * @param {string} token - JWT token for authentication
   * @param {string} status - 'Pending', 'Approved', 'Rejected'
   */
  fetchLeaves: async (token, status = 'Pending') => {
    set({ loadingLeaves: true, errorLeaves: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/leaves`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: { status },
      });
      console.log('Fetch Leaves Response:', response.data); // Debugging Log
      if (response.status === 200) {
        set({ leaves: response.data.data, loadingLeaves: false });
        console.log('Leaves set in store:', response.data.data); // Debugging Log
      } else {
        set({
          errorLeaves: response.data.message || 'Failed to fetch leaves.',
          loadingLeaves: false,
        });
        Alert.alert('Error', response.data.message || 'Failed to fetch leaves.');
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      set({
        errorLeaves: 'An error occurred while fetching leaves.',
        loadingLeaves: false,
      });
      Alert.alert('Error', 'An error occurred while fetching leaves.');
    }
  },

  /**
   * Approve a Leave Request
   * @param {number} leaveId - ID of the leave request to approve
   * @param {string} token - JWT token for authentication
   */
  approveLeave: async (leaveId, token) => {
    set({ submittingLeave: true, errorSubmittingLeave: null });
    try {
      const response = await axios.put(`${API_BASE_URL}/leaves/${leaveId}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Approve Leave Response:', response.data); // Debugging Log
      if (response.status === 200) {
        Alert.alert('Success', 'Leave request approved successfully.');
        set({ submittingLeave: false });
        // Refresh leaves
        await get().fetchLeaves(token, get().filterStatus || 'Pending');
      } else {
        set({
          errorSubmittingLeave: response.data.message || 'Failed to approve leave request.',
          submittingLeave: false,
        });
        Alert.alert('Error', response.data.message || 'Failed to approve leave request.');
      }
      return { success: response.status === 200, message: response.data.message };
    } catch (error) {
      console.error('Error approving leave request:', error);
      if (error.response && error.response.data && error.response.data.message) {
        set({
          errorSubmittingLeave: error.response.data.message,
          submittingLeave: false,
        });
        Alert.alert('Error', error.response.data.message);
        return { success: false, message: error.response.data.message };
      } else {
        set({
          errorSubmittingLeave: 'An error occurred while approving leave request.',
          submittingLeave: false,
        });
        Alert.alert('Error', 'An error occurred while approving leave request.');
        return { success: false, message: 'An error occurred while approving leave request.' };
      }
    }
  },

  /**
   * Reject a Leave Request
   * @param {number} leaveId - ID of the leave request to reject
   * @param {string} rejectionReason - Reason for rejection
   * @param {string} token - JWT token for authentication
   */
  rejectLeave: async (leaveId, rejectionReason, token) => {
    set({ submittingLeave: true, errorSubmittingLeave: null });
    try {
      const response = await axios.put(`${API_BASE_URL}/leaves/${leaveId}/reject`, { rejectionReason }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Reject Leave Response:', response.data); // Debugging Log
      if (response.status === 200) {
        Alert.alert('Success', 'Leave request rejected successfully.');
        set({ submittingLeave: false });
        // Refresh leaves
        await get().fetchLeaves(token, get().filterStatus || 'Pending');
      } else {
        set({
          errorSubmittingLeave: response.data.message || 'Failed to reject leave request.',
          submittingLeave: false,
        });
        Alert.alert('Error', response.data.message || 'Failed to reject leave request.');
      }
      return { success: response.status === 200, message: response.data.message };
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      if (error.response && error.response.data && error.response.data.message) {
        set({
          errorSubmittingLeave: error.response.data.message,
          submittingLeave: false,
        });
        Alert.alert('Error', error.response.data.message);
        return { success: false, message: error.response.data.message };
      } else {
        set({
          errorSubmittingLeave: 'An error occurred while rejecting leave request.',
          submittingLeave: false,
        });
        Alert.alert('Error', 'An error occurred while rejecting leave request.');
        return { success: false, message: 'An error occurred while rejecting leave request.' };
      }
    }
  },

  /**
   * Submit a Leave Request
   * @param {string} token - JWT token for authentication
   * @param {object} leaveData - Data for the leave request
   */
  submitLeave: async (token, leaveData) => {
    set({ submittingLeave: true, errorSubmittingLeave: null });
    try {
      const response = await axios.post(`${API_BASE_URL}/leaves/submit`, leaveData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Submit Leave Response:', response.data);
      if (response.status === 201 || response.status === 200) {
        Alert.alert('Success', 'Leave request submitted successfully.');
        set({ submittingLeave: false });
      } else {
        set({
          errorSubmittingLeave: response.data.message || 'Failed to submit leave request.',
          submittingLeave: false,
        });
        Alert.alert('Error', response.data.message || 'Failed to submit leave request.');
      }
      return { success: response.status === 201 || response.status === 200, message: response.data.message };
    } catch (error) {
      console.error('Error submitting leave request:', error);
      if (error.response && error.response.data && error.response.data.message) {
        set({
          errorSubmittingLeave: error.response.data.message,
          submittingLeave: false,
        });
        Alert.alert('Error', error.response.data.message);
        return { success: false, message: error.response.data.message };
      } else {
        set({
          errorSubmittingLeave: 'An error occurred while submitting leave request.',
          submittingLeave: false,
        });
        Alert.alert('Error', 'An error occurred while submitting leave request.');
        return { success: false, message: 'An error occurred while submitting leave request.' };
      }
    }
  },

  /**
   * Get Approvers within the Same Company
   * @param {string} token - JWT token for authentication
   */
  getApprovers: async (token) => {
    set({ loadingApprovers: true, errorApprovers: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/leaves/approvers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Get Approvers Response:', response.data); // Debugging Log
      if (response.status === 200) {
        set({ approvers: response.data.data, loadingApprovers: false });
        console.log('Approvers set in store:', response.data.data); // Debugging Log
      } else {
        set({
          errorApprovers: response.data.message || 'Failed to fetch approvers.',
          loadingApprovers: false,
        });
        Alert.alert('Error', response.data.message || 'Failed to fetch approvers.');
      }
    } catch (error) {
      console.error('Error fetching approvers:', error);
      set({
        errorApprovers: 'An error occurred while fetching approvers.',
        loadingApprovers: false,
      });
      Alert.alert('Error', 'An error occurred while fetching approvers.');
    }
  },

  /**
   * Fetch User's Leave Requests
   * @param {string} token - JWT token for authentication
   */
  fetchUserLeaves: async (token) => {
    set({ loadingUserLeaves: true, errorUserLeaves: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/leaves/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Fetch User Leaves Response:', response.data); // Debugging Log
      if (response.status === 200) {
        set({ userLeaves: response.data.data, loadingUserLeaves: false });
        console.log('User Leaves set in store:', response.data.data); // Debugging Log
      } else {
        set({
          errorUserLeaves: response.data.message || 'Failed to fetch your leave requests.',
          loadingUserLeaves: false,
        });
        Alert.alert('Error', response.data.message || 'Failed to fetch your leave requests.');
      }
    } catch (error) {
      console.error('Error fetching user leaves:', error);
      set({
        errorUserLeaves: 'An error occurred while fetching your leave requests.',
        loadingUserLeaves: false,
      });
      Alert.alert('Error', 'An error occurred while fetching your leave requests.');
    }
  },

  // Additional state for filtering
  filterStatus: 'Pending',

  setFilterStatus: (status) => set({ filterStatus: status }),

}));

export default useLeaveStore;
