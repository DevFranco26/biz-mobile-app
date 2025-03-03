// store/shiftScheduleStore.jsx

import { create } from "zustand";
import { Alert } from "react-native";
import { API_BASE_URL } from "../config/constant";

const useShiftSchedulesStore = create((set, get) => ({
  shiftSchedules: [],
  loading: false,
  error: null,

  fetchShiftSchedules: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/shiftschedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        set({ shiftSchedules: data.data, loading: false });
      } else {
        set({ error: data.message || "Failed to fetch shift schedules.", loading: false });
        Alert.alert("Error", data.message || "Failed to fetch shift schedules.");
      }
    } catch (error) {
      set({ error: "An error occurred while fetching shifts.", loading: false });
      Alert.alert("Error", "An error occurred while fetching shifts.");
    }
  },

  createShiftSchedule: async (token, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shiftschedules`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Shift schedule created successfully.");
        return { success: true, data: data.data };
      } else {
        Alert.alert("Error", data.message || "Failed to create shift schedule.");
        return { success: false };
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while creating shift schedule.");
      return { success: false };
    }
  },

  updateShiftSchedule: async (token, id, payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shiftschedules/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Shift schedule updated successfully.");
        return { success: true, data: data.data };
      } else {
        Alert.alert("Error", data.message || "Failed to update shift schedule.");
        return { success: false };
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while updating shift schedule.");
      return { success: false };
    }
  },

  deleteShiftSchedule: async (token, id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shiftschedules/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Shift schedule deleted successfully.");
        return { success: true };
      } else {
        Alert.alert("Error", data.message || "Failed to delete shift schedule.");
        return { success: false };
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while deleting shift schedule.");
      return { success: false };
    }
  },

  assignShiftToUser: async (token, shiftScheduleId, userId, recurrence) => {
    try {
      const response = await fetch(`${API_BASE_URL}/shiftschedules/${shiftScheduleId}/assign`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, recurrence }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", data.message || "Shift assigned to user successfully.");
        return { success: true };
      } else {
        Alert.alert("Error", data.message || "Failed to assign shift.");
        return { success: false };
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while assigning shift.");
      return { success: false };
    }
  },

  deleteUserFromShift: async (token, shiftScheduleId, userId) => {
    try {
      console.log(`Attempting to delete user ID ${userId} from shift ID ${shiftScheduleId}`);
      const response = await fetch(`${API_BASE_URL}/shiftschedules/${shiftScheduleId}/assignments/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      console.log("deleteUserFromShift response:", response.status, data);
      if (response.ok) {
        Alert.alert("Success", data.message || "User successfully removed from the shift.");
        await get().fetchShiftSchedules(token);
        return { success: true };
      } else {
        console.log("deleteUserFromShift failed:", data);
        Alert.alert("Error", data.message || "Failed to remove user from the shift.");
        return { success: false };
      }
    } catch (error) {
      console.log("deleteUserFromShift error:", error);
      Alert.alert("Error", "An error occurred while removing user from the shift.");
      return { success: false };
    }
  },
}));

export default useShiftSchedulesStore;
