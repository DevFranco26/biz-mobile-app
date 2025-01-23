// File: client/store/themeStore.jsx

import { create } from 'zustand';
import { Appearance } from 'react-native';

const useThemeStore = create((set) => ({
  theme: 'light', // Default to 'light'
  
  // Function to set the theme explicitly
  setTheme: (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      set(() => ({
        theme: newTheme,
      }));
    }
  },
  
  // Optional: Toggle theme between 'light' and 'dark'
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));

export default useThemeStore;
