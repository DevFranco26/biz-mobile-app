// File: client/app/(tabs)/(settings)/_layout.jsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';

const SettingsLayout = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLightTheme ? '#ffffff' : '#fb923c',
        },
      ]}
    >
      <Slot />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SettingsLayout;
