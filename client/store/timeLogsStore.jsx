import create from 'zustand';
import { Alert } from 'react-native';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const useTimeLogsStore = create((set, get) => ({
  timeLogs: [],
  loading: false,
  error: null,

  // Fetch time logs within a date range
  // If user is admin/superAdmin, can specify a userId
  // If user is a normal user, userId is determined by the backend
  fetchTimeLogs: async (token, { userId = null, startDate = null, endDate = null } = {}) => {
    set({ loading: true, error: null });

    let url = `${API_BASE_URL}/timelogs/range`;
    const params = [];
    if (userId) params.push(`userId=${userId}`);
    if (startDate) params.push(`startDate=${startDate}`);
    if (endDate) params.push(`endDate=${endDate}`);
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set({ timeLogs: data.data, loading: false });
      } else {
        set({ error: data.message || 'Failed to fetch time logs.', loading: false });
        Alert.alert('Error', data.message || 'Failed to fetch time logs.');
      }
    } catch (error) {
      console.error('Error fetching time logs:', error);
      set({ error: 'An error occurred while fetching time logs.', loading: false });
      Alert.alert('Error', 'An error occurred while fetching time logs.');
    }
  },
}));

export default useTimeLogsStore;
