  // File: client/store/userStore.jsx

  import create from 'zustand';
  import { Alert } from 'react-native';
  import * as SecureStore from 'expo-secure-store';

  const useUserStore = create((set) => ({
    user: null,            // Authenticated user details
    loading: false,       // Indicates if user data is being loaded
    error: null,          // Stores any error during data fetching

    // Action to set user after sign-in
    setUser: (user) => set({ user }),

    // Action to clear user on sign-out
    clearUser: () => set({ user: null }),

    // Action to load user from SecureStore on app start
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
