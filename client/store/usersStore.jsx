// File: client/store/usersStore.jsx

import { create } from "zustand";
import { Alert } from "react-native";
import { API_BASE_URL } from "../config/constant";

const useUsersStore = create((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Normalize roles to lowercase
        const formattedUsers = data.data.map((user) => ({
          ...user,
          role: user.role.toLowerCase(),
        }));
        set({ users: formattedUsers, loading: false });
      } else {
        set({ error: data.message || "Failed to fetch users.", loading: false });
        Alert.alert("Error", data.message || "Failed to fetch users.");
      }
    } catch (error) {
      set({ error: "An error occurred while fetching users.", loading: false });
      Alert.alert("Error", "An error occurred while fetching users.");
    }
  },

  deleteUser: async (userId, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        set((state) => ({
          users: state.users.filter((user) => user.id !== userId),
        }));
        Alert.alert("Success", data.message || "User deleted successfully.");
        return { success: true, message: data.message || "User deleted successfully." };
      } else {
        Alert.alert("Error", data.message || "Failed to delete user.");
        return { success: false, message: data.message || "Failed to delete user." };
      }
    } catch (error) {
      console.error("Delete User Error:", error);
      Alert.alert("Error", "An error occurred while deleting the user.");
      return { success: false, message: "An error occurred while deleting the user." };
    }
  },

  fetchUserById: async (userId, token) => {
    try {
      const res = await fetch(`${API_BASE_URL}/users/${userId}/detail`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        // Normalize role to lowercase
        return { ...data.data, role: data.data.role.toLowerCase() };
      } else {
        Alert.alert("Error", data.message || "Failed to fetch user details.");
        return null;
      }
    } catch (error) {
      console.error("fetchUserById Error:", error);
      Alert.alert("Error", "An error occurred while fetching user details.");
      return null;
    }
  },
}));

export default useUsersStore;
