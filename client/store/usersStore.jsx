// File: store/usersStore.jsx

import create from 'zustand';
import { Alert } from 'react-native';

const useUsersStore = create((set) => ({
  users: [],
  loading: false,
  error: null,

  // Action to fetch users
  fetchUsers: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://192.168.100.8:5000/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set({ users: data.data, loading: false });
      } else {
        set({ error: data.message || 'Failed to fetch users.', loading: false });
        Alert.alert('Error', data.message || 'Failed to fetch users.');
      }
    } catch (error) {
      set({ error: 'An error occurred while fetching users.', loading: false });
      Alert.alert('Error', 'An error occurred while fetching users.');
    }
  },

  // Action to delete a user
  deleteUser: async (userId, token) => {
    try {
      const response = await fetch(`http://192.168.100.8:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Remove the deleted user from the state
        set((state) => ({
          users: state.users.filter((user) => user.id !== userId),
        }));
        Alert.alert('Success', data.message || 'User deleted successfully.');
        return { success: true, message: data.message || 'User deleted successfully.' };
      } else {
        Alert.alert('Error', data.message || 'Failed to delete user.');
        return { success: false, message: data.message || 'Failed to delete user.' };
      }
    } catch (error) {
      console.error('Delete User Error:', error);
      Alert.alert('Error', 'An error occurred while deleting the user.');
      return { success: false, message: 'An error occurred while deleting the user.' };
    }
  },
}));

export default useUsersStore;
