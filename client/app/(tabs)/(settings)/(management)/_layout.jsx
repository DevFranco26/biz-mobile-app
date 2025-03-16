// File: app/(tabs)/(settings)/(management)/_layout.jsx

import React from "react";
import { View, StyleSheet } from "react-native";
import { Slot } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AdminLayout = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className=" flex-1
    bg-white"
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

export default AdminLayout;
