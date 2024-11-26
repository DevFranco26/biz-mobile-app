// store/themeStore.js
import create from 'zustand';
const useThemeStore = create((set) => ({
  theme: 'light', // Default theme is light
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light', // Toggle between light and dark
    })),
}));

export default useThemeStore;
