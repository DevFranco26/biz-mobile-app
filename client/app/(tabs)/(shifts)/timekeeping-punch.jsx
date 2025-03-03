// File: app/(tabs)/(shifts)/timekeeping-punch.jsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ToastAndroid,
  Platform,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { MaterialIcons, Ionicons, Entypo } from "@expo/vector-icons";
import { API_BASE_URL } from "../../../config/constant";
import * as Location from "expo-location";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useUserStore from "../../../store/userStore";
import useThemeStore from "../../../store/themeStore";
import useSubscriptionStore from "../../../store/subscriptionStore";
import * as LocalAuthentication from "expo-local-authentication";

const Punch = () => {
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const insets = useSafeAreaInsets();
  const { currentSubscription, fetchCurrentSubscription } = useSubscriptionStore();

  // Main Timekeeping States
  const [isTimeIn, setIsTimeIn] = useState(false);
  const [punchedInTime, setPunchedInTime] = useState("Not Time In");
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Coffee Break States
  const [isCoffeeBreakActive, setIsCoffeeBreakActive] = useState(false);
  const [coffeeTimeElapsed, setCoffeeTimeElapsed] = useState(0);
  const [coffeeUsedCount, setCoffeeUsedCount] = useState(0);

  // Lunch Break States
  const [isLunchBreakActive, setIsLunchBreakActive] = useState(false);
  const [lunchTimeElapsed, setLunchTimeElapsed] = useState(0);
  const [lunchUsedCount, setLunchUsedCount] = useState(0);

  // Network and Synchronization States
  const [isConnected, setIsConnected] = useState(true);
  const [punchQueue, setPunchQueue] = useState([]);

  const punchQueueRef = useRef([]);
  const isSyncingRef = useRef(false);
  const prevIsConnected = useRef(true);

  // Loading and Timezone States
  const [isLoading, setIsLoading] = useState(false);
  const [timeZone, setTimeZone] = useState("");

  // Refreshing state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Helper Function: Format Time in HH:MM:SS
  const formatTime = (seconds = 0) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Reusable BreakButton Component
  const BreakButton = ({ onPress, disabled, isActive, usedCount, maxCount, iconName, label, isLightTheme, timeElapsed }) => {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className={`flex-row items-center px-12 w-1/2 py-2 justify-center rounded-lg mx-2 mb-3 ${
          isActive ? `bg-red-500` : `bg-orange-500`
        }`}
        accessibilityLabel={`${label} Break Button`}
        accessibilityRole="button"
      >
        <Ionicons name={iconName} size={32} color="#f8fafc" />
        <View className="ml-2">
          <Text className={`${isLightTheme ? "text-white" : "text-white"} text-xs`} numberOfLines={1} ellipsizeMode="tail">
            {usedCount >= maxCount
              ? `(${usedCount}/${maxCount})`
              : isActive
              ? formatTime(timeElapsed)
              : `(${usedCount}/${maxCount})`}
          </Text>
        </View>
      </Pressable>
    );
  };

  // Initial Load: Fetch Subscription and Restore Session
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
          await fetchCurrentSubscription(token);
        }
        await restoreSession(token);
      } catch (error) {
        console.error("Error during initial load:", error);
      }
    })();
  }, [fetchCurrentSubscription]);

  // Restore Session: Handle Existing Time Logs
  const restoreSession = async (token) => {
    if (!token) {
      const localState = await AsyncStorage.getItem("localPunchState");
      if (localState) {
        const parsed = JSON.parse(localState);
        if (parsed && parsed.isTimeIn) {
          setIsTimeIn(true);
          setPunchedInTime(parsed.punchedInTime);
          setTimeElapsed(parsed.timeElapsed || 0);
        }
      }
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/timelogs/user/${user.id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        console.log("No active time log or error =>", data.message);
        return;
      }
      const log = data.data;
      if (!log) return;
      if (log.status === true && log.timeInAt) {
        setIsTimeIn(true);
        const timeInDateObj = new Date(log.timeInAt);
        if (!isNaN(timeInDateObj)) {
          const now = new Date();
          const diffSec = Math.floor((now - timeInDateObj) / 1000);
          setTimeElapsed(diffSec);
        }
        const localPunchedInTime = timeInDateObj.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        setPunchedInTime(localPunchedInTime);

        // Handle Coffee Breaks
        let localCoffeeUsed = 0;
        let coffeeActiveStart = null;
        if (log.coffeeBreakStart) {
          if (log.coffeeBreakEnd) {
            localCoffeeUsed += 1;
          } else {
            coffeeActiveStart = new Date(log.coffeeBreakStart);
          }
        }
        if (log.coffeeBreak2Start) {
          if (log.coffeeBreak2End) {
            localCoffeeUsed += 1;
          } else {
            coffeeActiveStart = new Date(log.coffeeBreak2Start);
          }
        }
        setCoffeeUsedCount(localCoffeeUsed);
        if (coffeeActiveStart) {
          setIsCoffeeBreakActive(true);
          const coffeeDiff = Math.floor((new Date() - coffeeActiveStart) / 1000);
          setCoffeeTimeElapsed(coffeeDiff);
        }

        // Handle Lunch Breaks
        let localLunchUsed = 0;
        if (log.lunchBreakStart) {
          if (log.lunchBreakEnd) {
            localLunchUsed = 1;
          } else {
            setIsLunchBreakActive(true);
            const lunchActiveStart = new Date(log.lunchBreakStart);
            const lunchDiff = Math.floor((new Date() - lunchActiveStart) / 1000);
            setLunchTimeElapsed(lunchDiff);
          }
        }
        setLunchUsedCount(localLunchUsed);
      } else {
        // User is not timed in
        setIsTimeIn(false);
        handleTimeoutCleanup();
      }
    } catch (err) {
      console.error("restoreSession error =>", err);
    }
  };

  // Update Ref on Punch Queue Change
  useEffect(() => {
    punchQueueRef.current = punchQueue;
  }, [punchQueue]);

  // Set Timezone on Mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(tz);
  }, []);

  // Load Punch Queue from AsyncStorage
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const storedQueue = await AsyncStorage.getItem("punchQueue");
        if (storedQueue) {
          const parsedQueue = JSON.parse(storedQueue);
          setPunchQueue(parsedQueue);
        }
      } catch (error) {
        console.error("Failed to load punch queue:", error);
        alertWith3s("Error", "Failed to load queued punches.");
      }
    };
    loadQueue();
  }, []);

  // Check if Offline Punching is Allowed
  const canOfflinePunch = useCallback(() => {
    if (!currentSubscription || !currentSubscription.plan || !currentSubscription.plan.features) {
      return false;
    }
    return currentSubscription.plan.features["timekeeping-punch-offline"] === true;
  }, [currentSubscription]);

  // Sync Punch Queue when Online
  const syncPunchQueue = useCallback(async () => {
    if (isSyncingRef.current || punchQueueRef.current.length === 0) return;
    isSyncingRef.current = true;
    const newQueue = [...punchQueueRef.current];
    const successfullySynced = [];
    const errorMessages = [];

    for (const punchData of newQueue) {
      try {
        let apiEndpoint;
        switch (punchData.punchType) {
          case "timeInOut":
            apiEndpoint = punchData.isTimeIn ? `${API_BASE_URL}/timelogs/time-in` : `${API_BASE_URL}/timelogs/time-out`;
            break;
          case "coffeeBreak":
            apiEndpoint = `${API_BASE_URL}/timelogs/coffee-break`;
            break;
          case "lunchBreak":
            apiEndpoint = `${API_BASE_URL}/timelogs/lunch-break`;
            break;
          default:
            throw new Error("Unknown punch type.");
        }
        const token = await SecureStore.getItemAsync("token");
        if (!token) throw new Error("Authentication token not found.");
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(punchData),
        });
        const result = await response.json();
        if (response.ok) {
          successfullySynced.push(punchData);
        } else {
          throw new Error(result.message || "Failed to sync punch.");
        }
      } catch (error) {
        console.error("Sync Error:", error);
        errorMessages.push(error.message);
      }
    }

    if (successfullySynced.length > 0) {
      const remainingQueue = newQueue.filter((item) => !successfullySynced.includes(item));
      setPunchQueue(remainingQueue);
      try {
        await AsyncStorage.setItem("punchQueue", JSON.stringify(remainingQueue));
      } catch (error) {
        console.error("Failed to update punch queue after sync:", error);
        errorMessages.push("Failed to update local punch queue.");
      }
      alertWith3s("Sync Success", "Your offline data has been synced.");
    }
    if (errorMessages.length > 0) {
      alertWith3s("Sync Errors", errorMessages.join("\n"));
    }
    isSyncingRef.current = false;
  }, []);

  // Listen to Network Changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected !== prevIsConnected.current) {
        setIsConnected(state.isConnected);
        if (state.isConnected && !prevIsConnected.current) {
          syncPunchQueue();
        }
        prevIsConnected.current = state.isConnected;
      }
    });
    return () => unsubscribe();
  }, [syncPunchQueue]);

  // Helper Functions for Alerts
  const alertWith3s = (title, message) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(`${title}: ${message}`, ToastAndroid.LONG);
    } else {
      Alert.alert(title, message);
    }
  };

  const alertNeedsUserInput = (title, message) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  };

  // Fetch User Location
  const fetchLocation = async () => {
    try {
      let proceed = false;

      await new Promise((resolve) => {
        Alert.alert(
          "Location Usage",
          "BizBuddy only fetches your location once at the time of clocking in, clocking out, or taking breaks. " +
            "We do not track your location continuously. " +
            "Your coordinates are stored only for verification of your punch location and no other purpose.",
          [
            {
              text: "OK",
              onPress: () => {
                proceed = true;
                resolve();
              },
            },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => resolve(),
            },
          ]
        );
      });

      if (!proceed) {
        Alert.alert("Location Permission", "You have declined to share your location.");
        return null;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to verify punch locations.");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch {
      Alert.alert("Error", "Could not fetch location.");
      return null;
    }
  };

  // Get GMT Offset
  const getGMTOffset = () => {
    const offsetInMinutes = new Date().getTimezoneOffset();
    const offsetInHours = -offsetInMinutes / 60;
    const sign = offsetInHours >= 0 ? "+" : "-";
    return `GMT${sign}${Math.abs(offsetInHours)}`;
  };

  // Get Local Date in YYYY-MM-DD
  const getLocalDate = () => new Date().toLocaleDateString("en-CA");

  // Get Day Name (e.g., Monday)
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });

  // Reset Coffee Break State
  const resetCoffeeBreakLocal = () => {
    setIsCoffeeBreakActive(false);
    setCoffeeTimeElapsed(0);
    setCoffeeUsedCount(0);
  };

  // Reset Lunch Break State
  const resetLunchBreakLocal = () => {
    setIsLunchBreakActive(false);
    setLunchTimeElapsed(0);
    setLunchUsedCount(0);
  };

  // Cleanup on Timeout
  const handleTimeoutCleanup = () => {
    setIsTimeIn(false);
    setTimeElapsed(0);
    setPunchedInTime("Not Time In");
    resetCoffeeBreakLocal();
    resetLunchBreakLocal();
  };

  // Manage Main Timer with useEffect
  useEffect(() => {
    let mainTimer = null;
    if (isTimeIn) {
      mainTimer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setTimeElapsed(0);
    }
    return () => {
      if (mainTimer) clearInterval(mainTimer);
    };
  }, [isTimeIn]);

  // Manage Coffee Break Timer with useEffect
  useEffect(() => {
    let cTimer = null;
    if (isCoffeeBreakActive) {
      cTimer = setInterval(() => {
        setCoffeeTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setCoffeeTimeElapsed(0);
    }
    return () => {
      if (cTimer) clearInterval(cTimer);
    };
  }, [isCoffeeBreakActive]);

  // Manage Lunch Break Timer with useEffect
  useEffect(() => {
    let lTimer = null;
    if (isLunchBreakActive) {
      lTimer = setInterval(() => {
        setLunchTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setLunchTimeElapsed(0);
    }
    return () => {
      if (lTimer) clearInterval(lTimer);
    };
  }, [isLunchBreakActive]);

  // Handle Time In/Out Punch
  const handlePunch = async () => {
    if (isLoading) return;
    if (isTimeIn) {
      if (isCoffeeBreakActive || isLunchBreakActive) {
        alertNeedsUserInput("Cannot Time Out", "Please end your active break(s) before you time out.");
        return;
      }
    }
    setIsLoading(true);
    try {
      const hasBio = await LocalAuthentication.hasHardwareAsync();
      if (!hasBio) {
        alertNeedsUserInput("Biometric Not Supported", "No biometric hardware.");
        setIsLoading(false);
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        alertNeedsUserInput("Biometric Not Set Up", "No biometric found. Please set it up.");
        setIsLoading(false);
        return;
      }
      const bioResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to proceed",
        fallbackEnabled: true,
        fallbackTitle: "Use Passcode",
        cancelLabel: "Cancel",
      });
      if (!bioResult.success) {
        alertNeedsUserInput("Authentication Failed", "Please try again.");
        setIsLoading(false);
        return;
      }
      if (!isConnected && !canOfflinePunch()) {
        alertNeedsUserInput("Subscription Notice", "Your plan does not allow offline punching. Please go online.");
        setIsLoading(false);
        return;
      }
      const deviceInfo = {
        deviceName: Device.deviceName,
        systemName: Device.osName,
        systemVersion: Device.osVersion,
        model: Device.modelName,
      };
      const loc = await fetchLocation();
      if (!loc) {
        setIsLoading(false);
        return;
      }
      const currentDateTime = new Date();
      const date = currentDateTime.toISOString().split("T")[0];
      const time = [
        currentDateTime.getHours().toString().padStart(2, "0"),
        currentDateTime.getMinutes().toString().padStart(2, "0"),
        currentDateTime.getSeconds().toString().padStart(2, "0"),
      ].join(":");

      const punchData = {
        punchType: "timeInOut",
        userId: user.id,
        deviceInfo,
        location: loc,
        date,
        time,
        timeZone,
        isTimeIn: !isTimeIn,
      };
      const token = await SecureStore.getItemAsync("token");
      if (token && isConnected) {
        const apiEndpoint = !isTimeIn ? `${API_BASE_URL}/timelogs/time-in` : `${API_BASE_URL}/timelogs/time-out`;
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(punchData),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Failed to punch.");
        }
        alertWith3s("Success", result.message);
        if (isTimeIn) {
          handleTimeoutCleanup();
        }
        setIsTimeIn(!isTimeIn);
      } else {
        // Offline Punching
        let updatedQueue = [...punchQueueRef.current];
        updatedQueue = updatedQueue.filter((item) => !(item.punchType === "timeInOut" && item.isTimeIn === punchData.isTimeIn));
        updatedQueue.push(punchData);
        setPunchQueue(updatedQueue);
        await AsyncStorage.setItem("punchQueue", JSON.stringify(updatedQueue));
        alertWith3s("Offline", "Your punch has been saved and will sync when online.");
        if (!isTimeIn) {
          setIsTimeIn(!isTimeIn);
        } else {
          handleTimeoutCleanup();
        }
      }
      await AsyncStorage.setItem(
        "localPunchState",
        JSON.stringify({
          isTimeIn: !isTimeIn,
          punchedInTime: isTimeIn ? "Not Time In" : punchedInTime,
          timeElapsed,
        })
      );
    } catch (err) {
      console.error("Punch Error:", err);
      alertNeedsUserInput("Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Coffee Break
  const handleCoffeeBreak = async () => {
    if (isLoading) return;
    if (coffeeUsedCount >= 2) {
      alertWith3s("Notice", "Max coffee breaks used already.");
      return;
    }
    setIsLoading(true);
    try {
      if (!isConnected && !canOfflinePunch()) {
        alertNeedsUserInput("Subscription Notice", "You cannot break offline with your plan.");
        setIsLoading(false);
        return;
      }
      if (!isCoffeeBreakActive && isLunchBreakActive) {
        alertWith3s("Notice", "Cannot start coffee while lunch is active.");
        setIsLoading(false);
        return;
      }
      const loc = await fetchLocation();
      if (!loc) {
        setIsLoading(false);
        return;
      }
      const punchData = {
        punchType: "coffeeBreak",
        userId: user.id,
        deviceInfo: {
          deviceName: Device.deviceName,
          systemName: Device.osName,
          systemVersion: Device.osVersion,
          model: Device.modelName,
        },
        location: loc,
        date: new Date().toISOString(),
        timeZone,
      };
      const token = await SecureStore.getItemAsync("token");
      if (token && isConnected) {
        const response = await fetch(`${API_BASE_URL}/timelogs/coffee-break`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(punchData),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to toggle coffee break.");
        alertWith3s("Success", result.message);
        if (result.message.includes("start")) {
          setIsCoffeeBreakActive(true);
          if (isLunchBreakActive) {
            setIsLunchBreakActive(false);
          }
          setCoffeeUsedCount((prev) => prev); // No change on start
        } else if (result.message.includes("ended")) {
          setIsCoffeeBreakActive(false);
          setCoffeeUsedCount((prev) => {
            const newVal = prev + 1;
            if (newVal >= 2) {
              alertWith3s("Notice", "Max coffee breaks used this shift.");
            }
            return newVal;
          });
        } else if (result.message.includes("Max coffee breaks used")) {
          setCoffeeUsedCount(2);
          alertWith3s("Notice", "Max coffee breaks used for this shift.");
        }
      } else {
        // Offline Coffee Break
        let updatedQueue = [...punchQueueRef.current];
        updatedQueue.push(punchData);
        setPunchQueue(updatedQueue);
        await AsyncStorage.setItem("punchQueue", JSON.stringify(updatedQueue));
        alertWith3s("Offline", "Coffee break saved offline & will sync later.");
        if (!isCoffeeBreakActive) {
          if (isLunchBreakActive) {
            setIsLunchBreakActive(false);
          }
          setIsCoffeeBreakActive(true);
        } else {
          setIsCoffeeBreakActive(false);
          setCoffeeUsedCount((prev) => {
            const newVal = prev + 1;
            if (newVal >= 2) {
              alertWith3s("Notice", "Max coffee breaks used this shift.");
            }
            return newVal;
          });
        }
      }
    } catch (err) {
      console.error("Coffee Break Error:", err);
      alertNeedsUserInput("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Lunch Break
  const handleLunchBreak = async () => {
    if (isLoading) return;
    if (lunchUsedCount >= 1) {
      alertWith3s("Notice", "You already used your 1 lunch break.");
      return;
    }
    setIsLoading(true);
    try {
      if (!isConnected && !canOfflinePunch()) {
        alertNeedsUserInput("Subscription Notice", "Your plan disallows offline lunch break.");
        setIsLoading(false);
        return;
      }
      if (!isLunchBreakActive && isCoffeeBreakActive) {
        alertWith3s("Notice", "Cannot start lunch while coffee is active.");
        setIsLoading(false);
        return;
      }
      const loc = await fetchLocation();
      if (!loc) {
        setIsLoading(false);
        return;
      }
      const punchData = {
        punchType: "lunchBreak",
        userId: user.id,
        deviceInfo: {
          deviceName: Device.deviceName,
          systemName: Device.osName,
          systemVersion: Device.osVersion,
          model: Device.modelName,
        },
        location: loc,
        date: new Date().toISOString(),
        timeZone,
      };
      const token = await SecureStore.getItemAsync("token");
      if (token && isConnected) {
        const response = await fetch(`${API_BASE_URL}/timelogs/lunch-break`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(punchData),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Failed to toggle lunch break.");
        alertWith3s("Success", result.message);
        if (result.message.includes("start")) {
          setIsLunchBreakActive(true);
          if (isCoffeeBreakActive) {
            setIsCoffeeBreakActive(false);
          }
          setLunchUsedCount((prev) => prev); // No change on start
        } else if (result.message.includes("ended")) {
          setIsLunchBreakActive(false);
          setLunchUsedCount((prev) => {
            const newVal = prev + 1;
            if (newVal >= 1) {
              alertWith3s("Notice", "Lunch break used up this shift.");
            }
            return newVal;
          });
        }
      } else {
        // Offline Lunch Break
        let updatedQueue = [...punchQueueRef.current];
        updatedQueue.push(punchData);
        setPunchQueue(updatedQueue);
        await AsyncStorage.setItem("punchQueue", JSON.stringify(updatedQueue));
        alertWith3s("Offline", "Lunch break saved offline & will sync.");
        if (!isLunchBreakActive) {
          if (isCoffeeBreakActive) {
            setIsCoffeeBreakActive(false);
          }
          setIsLunchBreakActive(true);
        } else {
          setIsLunchBreakActive(false);
          setLunchUsedCount((prev) => {
            const newVal = prev + 1;
            if (newVal >= 1) {
              alertWith3s("Notice", "Lunch break used up this shift.");
            }
            return newVal;
          });
        }
      }
    } catch (err) {
      console.error("Lunch Break Error:", err);
      alertNeedsUserInput("Error", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup Timers on Unmount
  useEffect(() => {
    return () => {
      // All timers are managed by their respective useEffect hooks
    };
  }, []);

  const coffeeBreakDisabled = false;
  const lunchBreakDisabled = false;

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await syncPunchQueue(); // Sync any offline punches
      const token = await SecureStore.getItemAsync("token");
      await restoreSession(token); // Fetch latest state
    } catch (error) {
      console.error("Refresh Error:", error);
      alertWith3s("Error", "Failed to refresh data.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isLightTheme ? "white" : "#0f172a",
        paddingTop: insets.top,
        paddingBottom: insets.bottom || 16,
      }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#475569"]} // Android spinner color
            tintColor={isLightTheme ? "#475569" : "#f9fafb"} // iOS spinner color
            progressBackgroundColor={isLightTheme ? "#f1f5f9" : "#1e293b"} // Background color of the spinner
          />
        }
      >
        <View className="mx-4 mt-20 space-y-4">
          {/* Date Section */}
          <View
            className={`flex-row items-center justify-between p-4 rounded-xl my-2 ${
              isLightTheme ? "bg-slate-100" : "bg-slate-800"
            }`}
          >
            <View className="flex-row items-center">
              <MaterialIcons name="date-range" size={30} color="#3B82F6" className="mr-4" accessibilityLabel="Date Icon" />
              <View>
                <Text className={`text-base font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Date</Text>
                <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>{dayName}</Text>
              </View>
            </View>
            <View className="flex-col items-end">
              <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>{getLocalDate()}</Text>
            </View>
          </View>

          {/* Timezone Section */}
          <View className={`flex-row items-center p-4 rounded-xl my-2 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
            <Ionicons name="location" size={30} color="#10B981" className="mr-4" accessibilityLabel="Timezone Icon" />
            <View>
              <Text className={`text-base font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Timezone</Text>
              <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {timeZone} ({getGMTOffset()})
              </Text>
            </View>
          </View>

          {/* Status Section */}
          <View
            className={`flex-row items-center justify-between p-4 rounded-xl my-2 ${
              isLightTheme ? "bg-slate-100" : "bg-slate-800"
            }`}
          >
            <View className="flex-row items-center">
              <Entypo
                name={isTimeIn ? "controller-record" : "controller-play"}
                size={30}
                color={isTimeIn ? "#F59E0B" : "#EF4444"}
                className="mr-4"
                accessibilityLabel="Status Icon"
              />
              <View>
                <Text className={`text-base font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Status</Text>
                <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                  {isTimeIn ? "On the Clock" : "Off the Clock"}
                </Text>
              </View>
            </View>
            <View className="flex-col items-end">
              <Text className={`text-md ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {isTimeIn ? punchedInTime : "00:00:00"}
              </Text>
            </View>
          </View>

          {/* Network Section */}
          <View className={`flex-row items-center p-4 rounded-xl my-2 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
            {isConnected ? (
              <MaterialIcons name="wifi" size={30} color="#8B5CF6" className="mr-4" accessibilityLabel="Network Icon Online" />
            ) : (
              <MaterialIcons
                name="wifi-off"
                size={30}
                color="#6B7280"
                className="mr-4"
                accessibilityLabel="Network Icon Offline"
              />
            )}
            <View>
              <Text className={`text-base font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Network</Text>
              <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                {isConnected ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          {/* Timer Section */}
          <View
            className={`w-full p-5 rounded-xl h-40 justify-center items-center ${isLightTheme ? "bg-white" : "bg-slate-900"}`}
          >
            <Text className={`text-6xl font-medium text-center  ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
              {formatTime(timeElapsed)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {isTimeIn && (
        <View className="flex-col justify-around items-center mb-4 mx-4">
          <View className="flex-row justify-around items-center mx-2">
            <BreakButton
              onPress={handleCoffeeBreak}
              disabled={coffeeBreakDisabled || isLoading}
              isActive={isCoffeeBreakActive}
              usedCount={coffeeUsedCount}
              maxCount={2}
              iconName="cafe"
              label="Coffee"
              isLightTheme={isLightTheme}
              timeElapsed={coffeeTimeElapsed}
            />
            <BreakButton
              onPress={handleLunchBreak}
              disabled={lunchBreakDisabled || isLoading}
              isActive={isLunchBreakActive}
              usedCount={lunchUsedCount}
              maxCount={1}
              iconName="fast-food"
              label="Lunch"
              isLightTheme={isLightTheme}
              timeElapsed={lunchTimeElapsed}
              className="mb-3"
            />
          </View>
          <Pressable
            onPress={handlePunch}
            disabled={isLoading}
            className={`py-4 px-5 rounded-lg w-full flex-row items-center justify-center ${
              isTimeIn ? "bg-red-500" : "bg-orange-500"
            } ${isLoading ? "opacity-50" : "opacity-100"}`}
            accessibilityLabel="Time Out Button"
            accessibilityRole="button"
          >
            {isLoading && <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />}
            <Text className="text-center text-white text-xl font-semibold">{isTimeIn ? "Time Out" : "Time In"}</Text>
          </Pressable>
        </View>
      )}

      {!isTimeIn && (
        <View className="mb-4 mx-4">
          <Pressable
            onPress={handlePunch}
            disabled={isLoading}
            className={`py-4 px-5 rounded-lg w-full flex-row items-center justify-center ${
              isTimeIn ? "bg-red-500" : "bg-orange-500"
            } ${isLoading ? "opacity-50" : "opacity-100"}`}
            accessibilityLabel="Time In Button"
            accessibilityRole="button"
          >
            {isLoading && <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />}
            <Text className="text-center text-white text-xl font-semibold">{isTimeIn ? "Time Out" : "Time In"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default Punch;
