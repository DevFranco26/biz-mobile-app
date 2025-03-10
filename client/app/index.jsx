// app/index.jsx
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StatusBar, Modal, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useThemeStore from "../store/themeStore";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { VERSION } from "../config/constant";

export default function Index() {
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const router = useRouter();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [deviceVersion, setDeviceVersion] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        const storedVersion = await SecureStore.getItemAsync("appVersion");
        if (!storedVersion) {
          await SecureStore.setItemAsync("appVersion", VERSION);
        } else if (storedVersion !== VERSION) {
          setDeviceVersion(storedVersion);
          setShowUpdateModal(true);
          return;
        }
        // Removed auto sign-in logic.
        router.replace("(auth)/signin");
      } catch (error) {
        console.error("Error during app initialization:", error);
        router.replace("(auth)/signin");
      }
    };

    initApp();
  }, [router]);

  const handleUpdate = () => {
    Linking.openURL("https://your-app-update-url.com");
  };

  const statusBarBackground = isLightTheme ? "#ffffff" : "#1e293b";

  return (
    <>
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} backgroundColor={statusBarBackground} translucent={false} animated={true} />
      <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"} justify-center items-center`} style={{ paddingTop: 60 }}>
        <ActivityIndicator size="large" color="#0f766e" />
        <Text className={`mt-4 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Checking authentication...</Text>
      </SafeAreaView>

      {/* Update Modal */}
      <Modal visible={showUpdateModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-11/12 bg-white p-6 rounded-lg">
            <Text className="text-xl font-bold mb-4">Update Required</Text>
            <Text className="mb-6">A new version of the app is available. Please update to continue using BizBuddy.</Text>
            <Text className="mb-2">Current Version: {deviceVersion}</Text>
            <Text className="mb-4">Latest Version: {VERSION}</Text>
            <TouchableOpacity onPress={handleUpdate} className="bg-orange-500 py-3 rounded-lg">
              <Text className="text-white text-center">Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
