// File: client/app/(tabs)/(settings)/_layout.jsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import useThemeStore from "../../../store/themeStore";

const SettingsLayout = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isLightTheme ? "#ffffff" : "#fb923c",
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
