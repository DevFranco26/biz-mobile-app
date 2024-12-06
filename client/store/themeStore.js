// File: store/themeStore.jsx

import create from 'zustand';
import { Appearance } from 'react-native';

// Get the system theme
const systemTheme = Appearance.getColorScheme();

const useThemeStore = create((set) => ({
  theme: systemTheme || 'light', // Default to light if system theme is undefined
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));

export default useThemeStore;
