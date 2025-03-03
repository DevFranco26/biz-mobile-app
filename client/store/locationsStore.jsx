// File: store/locationsStore.js

import { create } from "zustand";
import axios from "axios";
import { API_BASE_URL } from "../config/constant";

const useLocationsStore = create((set) => ({
  locations: [],
  loading: false,
  error: null,

  fetchLocations: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set({ locations: response.data.data, loading: false });
    } catch (err) {
      console.error("Error fetching locations:", err);
      set({ error: err.message || "Error fetching locations", loading: false });
    }
  },

  createLocation: async (locationData, token) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/locations/create`, locationData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set((state) => ({ locations: [...state.locations, response.data.data] }));
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error("Error creating location:", err);
      return { success: false, message: err.response?.data?.message || "Error creating location" };
    }
  },

  updateLocation: async (locationId, locationData, token) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/locations/update/${locationId}`, locationData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set((state) => ({
        locations: state.locations.map((loc) => (loc.id === locationId ? response.data.data : loc)),
      }));
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error("Error updating location:", err);
      return { success: false, message: err.response?.data?.message || "Error updating location" };
    }
  },

  deleteLocation: async (locationId, token) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/locations/delete/${locationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      set((state) => ({
        locations: state.locations.filter((loc) => loc.id !== locationId),
      }));
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error("Error deleting location:", err);
      return { success: false, message: err.response?.data?.message || "Error deleting location" };
    }
  },
}));

export default useLocationsStore;
