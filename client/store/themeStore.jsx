// File: client/store/themeStore.jsx

import {create} from 'zustand';
import { Appearance } from 'react-native';

const systemTheme = Appearance.getColorScheme();

const useThemeStore = create((set) => ({
  theme: systemTheme || 'light', 
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),
}));

export default useThemeStore;
