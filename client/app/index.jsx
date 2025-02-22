// app/index.jsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StatusBar,
  Modal,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useThemeStore from "../store/themeStore";
import * as SecureStore from "expo-secure-store";
import useUserStore from "../store/userStore";
import { useRouter } from "expo-router";
import { API_BASE_URL, VERSION } from "../config/constant";

export default function Index() {
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const { setUser } = useUserStore();
  const router = useRouter();
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check app version first
        const storedVersion = await SecureStore.getItemAsync("appVersion");
        if (!storedVersion) {
          // First launch: store the current version
          await SecureStore.setItemAsync("appVersion", VERSION);
        } else if (storedVersion !== VERSION) {
          // Version mismatch: prompt update and block further navigation
          setShowUpdateModal(true);
          return; // Exit initialization until user updates
        }

        // Proceed with authentication check if version is valid
        const token = await SecureStore.getItemAsync("token");
        const user = await SecureStore.getItemAsync("user");

        if (token && user) {
          const userData = JSON.parse(user);
          setUser(userData);

          try {
            const setActiveResponse = await fetch(
              `${API_BASE_URL}/users/me/presence`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ presenceStatus: "active" }),
              }
            );

            if (setActiveResponse.ok) {
              const updatedPresenceData = await setActiveResponse.json();
              setUser(updatedPresenceData.data);
            } else {
              console.log("Failed to set presence to active on app load");
            }
          } catch (err) {
            console.error("Error setting presence to active on app load:", err);
          }
          router.replace("(tabs)/profile");
        } else {
          router.replace("(auth)/login-user");
        }
      } catch (error) {
        console.error("Error during app initialization:", error);
        router.replace("(auth)/login-user");
      }
    };

    initApp();
  }, [setUser, router]);

  // Handler for the update button (modify the URL to your app's update page or app store)
  const handleUpdate = () => {
    // For example, open a URL to the app store or update instructions
    Linking.openURL("https://your-app-update-url.com");
  };

  const statusBarBackground = isLightTheme ? "#ffffff" : "#1e293b";

  return (
    <>
      <StatusBar
        barStyle={isLightTheme ? "dark-content" : "light-content"}
        backgroundColor={statusBarBackground}
        translucent={false}
        animated={true}
      />

      <SafeAreaView
        className={`flex-1 ${
          isLightTheme ? "bg-white" : "bg-slate-900"
        } justify-center items-center`}
        style={{ paddingTop: 60 }}
      >
        <ActivityIndicator size="large" color="#0f766e" />
        <Text
          className={`mt-4 ${
            isLightTheme ? "text-slate-700" : "text-slate-300"
          }`}
        >
          Checking authentication...
        </Text>
      </SafeAreaView>

      {/* Update Modal */}
      <Modal visible={showUpdateModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-11/12 bg-white p-6 rounded-lg">
            <Text className="text-xl font-bold mb-4">Update Required</Text>
            <Text className="mb-6">
              A new version of the app is available. Please update to continue
              using BizBuddy.
            </Text>
            <TouchableOpacity
              onPress={handleUpdate}
              className="bg-orange-500 py-3 rounded-lg"
            >
              <Text className="text-white text-center">Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
