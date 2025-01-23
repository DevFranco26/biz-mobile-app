  // File: client/store/userStore.jsx

  import {create} from 'zustand';
  import { Alert } from 'react-native';
  import * as SecureStore from 'expo-secure-store';

  const useUserStore = create((set) => ({
    user: null,
    loading: false,
    error: null,

    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),

    loadUser: async () => {
      set({ loading: true, error: null });
      try {
        const userData = await SecureStore.getItemAsync('user');
        if (userData) {
          const user = JSON.parse(userData);
          set({ user, loading: false });
        } else {
          set({ loading: false });
        }
      } catch (error) {
        console.error('Load User Error:', error);
        set({ error: 'Failed to load user data.', loading: false });
        Alert.alert('Error', 'Failed to load user data.');
      }
    },
  }));

  export default useUserStore;
