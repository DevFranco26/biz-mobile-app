import create from 'zustand';
import { Appearance } from 'react-native';

// Get the current system theme (light or dark)
const systemTheme = Appearance.getColorScheme(); // 'light' or 'dark'

const useThemeStore = create((set) => ({
  theme: systemTheme || 'light', // Default to light if the system theme can't be detected
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light', // Toggle between light and dark
    })),
}));

export default useThemeStore;
