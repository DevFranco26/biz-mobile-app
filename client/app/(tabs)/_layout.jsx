// app/(tabs)/_layout.jsx
import React, { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Tabs } from "expo-router";
import * as SecureStore from "expo-secure-store";
import UserInactivity from "react-native-user-inactivity";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../config/constant";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/useAuthStore";
import usePresenceStore from "../../store/presenceStore";

const AvatarIcon = ({ color, size }) => {
  const circleSize = 23;
  return (
    <Ionicons
      name="person-outline"
      size={size}
      color="#fff"
      style={{
        width: circleSize,
        height: circleSize,
        borderRadius: circleSize / 2,
        backgroundColor: color,
        textAlign: "center",
        paddingTop: 2,
      }}
    />
  );
};

const TabsLayout = () => {
  const { theme } = useThemeStore();
  const { token } = useAuthStore();
  const { setPresence } = usePresenceStore();
  const isLightTheme = theme === "light";
  const [appState, setAppState] = useState(AppState.currentState);

  const updateUserPresence = async (status) => {
    let currentToken = token;
    if (!currentToken) {
      currentToken = await SecureStore.getItemAsync("token");
    }
    if (!currentToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/presence`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          presenceStatus: status,
          lastActiveAt: new Date().toISOString(),
        }),
      });
      const resData = await response.json();
      if (response.ok) {
        setPresence(status, new Date().toISOString());
      }
    } catch (error) {
      console.error("Error updating user presence:", error);
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background") {
        updateUserPresence("away");
      } else if (nextAppState === "active") {
        updateUserPresence("available");
      }
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  const handleUserActivity = (active) => {
    if (active) {
      updateUserPresence("available");
    } else {
      updateUserPresence("away");
    }
  };

  const inactivityTimeout = 5000;
  return (
    <UserInactivity timeForInactivity={inactivityTimeout} onAction={handleUserActivity} style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: isLightTheme ? "#ffffff" : "#0f172a",
            borderTopColor: isLightTheme ? "#ffffff" : "#0f172a",
          },
          tabBarActiveTintColor: "#f97316",
          tabBarInactiveTintColor: "#6B7280",
        }}
      >
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(leaves)"
          options={{
            title: "Leaves",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="payroll"
          options={{
            title: "Payroll",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="cash-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(shifts)"
          options={{
            title: "Timekeeping",
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="(settings)"
          options={{
            title: "Settings",
            headerShown: false,
            tabBarIcon: AvatarIcon,
          }}
        />
      </Tabs>
    </UserInactivity>
  );
};

export default TabsLayout;
