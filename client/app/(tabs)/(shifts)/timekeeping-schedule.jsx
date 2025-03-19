// app/(tabs)/(shifts)/timekeeping-schedule.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
  Animated,
  Dimensions,
  RefreshControl,
  Linking,
  Modal,
  TouchableOpacity,
  Pressable,
} from "react-native";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { API_BASE_URL } from "../../../config/constant";
import { Calendar } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const { height } = Dimensions.get("window");

const COLORS = {
  primary: "#f97316",
  primaryLight: "#ffedd5",
  primaryDark: "#c2410c",
  text: "#1e293b",
  textSecondary: "#64748b",
  textLight: "#94a3b8",
  border: "#e2e8f0",
  white: "#ffffff",
  background: "#ffffff",
  error: "#ef4444",
  success: "#10b981",
  card: "#f1f5f9",
};

// Optional: Customize notification handling.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Function to register and handle notification permissions.
const registerForPushNotificationsAsync = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    Alert.alert(
      "Enable Notifications",
      "We need notifications to remind you about your shifts. Would you like to enable notifications?",
      [
        {
          text: "Cancel",
          onPress: () => {
            console.log("User cancelled notifications prompt");
          },
          style: "cancel",
        },
        {
          text: "Enable",
          onPress: async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            if (finalStatus !== "granted") {
              Alert.alert("Permission Denied", "Notifications have been disabled. To enable them, please go to your device settings.", [
                {
                  text: "Open Settings",
                  onPress: () => Linking.openSettings(),
                },
                { text: "OK" },
              ]);
            }
          },
        },
      ],
      { cancelable: false }
    );
  }
  return finalStatus === "granted";
};

const TimekeepingSchedule = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userShifts, setUserShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedShifts, setSelectedShifts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  // State to hold the current notification permission status.
  const [notificationAllowed, setNotificationAllowed] = useState(false);
  // State for showing the info modal.
  const [modalVisible, setModalVisible] = useState(false);

  // Calculate tab bar height (60px) plus safe area top.
  const topPadding = 60;

  // Animations.
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Request notification permissions on mount.
  useEffect(() => {
    registerForPushNotificationsAsync().then((granted) => setNotificationAllowed(granted));
  }, []);

  // Function to schedule notifications for shifts.
  const scheduleNotificationsForShifts = async (shifts) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = new Date();

    shifts.forEach(async (shift) => {
      const shiftStart = new Date(shift.shift.startTime);
      const shiftEnd = new Date(shift.shift.endTime);
      const startNotificationTime = new Date(shiftStart);
      startNotificationTime.setMinutes(startNotificationTime.getMinutes() - 30);
      const endNotificationTime = new Date(shiftEnd);
      endNotificationTime.setMinutes(endNotificationTime.getMinutes() - 30);

      if (startNotificationTime > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Upcoming Shift",
            body: `Your shift "${shift.shift.shiftName}" starts at ${shiftStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
          },
          trigger: startNotificationTime,
        });
      }
      if (endNotificationTime > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Shift End Reminder",
            body: `Your shift "${shift.shift.shiftName}" ends at ${shiftEnd.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}. Time to punch out.`,
          },
          trigger: endNotificationTime,
        });
      }
    });
  };

  // Fetch user shifts.
  const fetchUserShifts = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await axios.get(`${API_BASE_URL}/api/usershifts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200 && res.data.data) {
        setUserShifts(res.data.data);
        createMarkedDates(res.data.data);
        const todayShifts = res.data.data.filter((shift) => {
          const shiftDate = new Date(shift.assignedDate).toISOString().split("T")[0];
          return shiftDate === selectedDate;
        });
        setSelectedShifts(todayShifts);
        scheduleNotificationsForShifts(res.data.data);
        // Update notification status after a refresh.
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationAllowed(status === "granted");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load your shift assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    fetchUserShifts();
  }, []);

  const createMarkedDates = (shifts) => {
    if (!shifts || shifts.length === 0) return;

    const marked = {};

    shifts.forEach((userShift) => {
      const shiftDate = new Date(userShift.assignedDate).toISOString().split("T")[0];

      marked[shiftDate] = {
        ...marked[shiftDate],
        marked: true,
        dotColor: COLORS.primary,
        selected: shiftDate === selectedDate,
        selectedColor: `${COLORS.primary}20`,
        customStyles: {
          container: {
            backgroundColor: shiftDate === selectedDate ? `${COLORS.primary}20` : "transparent",
          },
          text: {
            color: "#334155",
            fontWeight: "bold",
          },
          dots: {
            backgroundColor: COLORS.primary,
          },
        },
      };
    });

    if (!marked[selectedDate]) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: `${COLORS.primary}20`,
      };
    }

    setMarkedDates(marked);
  };

  const handleDateSelect = (day) => {
    const selected = day.dateString;
    setSelectedDate(selected);

    const shiftsForDate = userShifts.filter((userShift) => {
      const shiftDate = new Date(userShift.assignedDate).toISOString().split("T")[0];
      return shiftDate === selected;
    });

    setSelectedShifts(shiftsForDate);
    updateSelectedDateInMarkedDates(selected);
  };

  const updateSelectedDateInMarkedDates = (selected) => {
    const updatedMarkedDates = { ...markedDates };

    Object.keys(updatedMarkedDates).forEach((date) => {
      if (updatedMarkedDates[date]) {
        if (updatedMarkedDates[date].customStyles) {
          updatedMarkedDates[date].customStyles.container.backgroundColor = "transparent";
          updatedMarkedDates[date].selected = false;
        } else {
          updatedMarkedDates[date].selected = false;
        }
      }
    });

    if (updatedMarkedDates[selected]) {
      updatedMarkedDates[selected] = {
        ...updatedMarkedDates[selected],
        selected: true,
        selectedColor: `${COLORS.primary}20`,
      };

      if (updatedMarkedDates[selected].customStyles) {
        updatedMarkedDates[selected].customStyles.container.backgroundColor = `${COLORS.primary}20`;
      }
    } else {
      updatedMarkedDates[selected] = {
        selected: true,
        selectedColor: `${COLORS.primary}20`,
      };
    }

    setMarkedDates(updatedMarkedDates);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserShifts();
    setRefreshing(false);
  };

  // Render each shift item (without the notification icon).
  const renderShiftItem = (shift) => (
    <View key={shift.id} className="mb-3 p-4 bg-slate-50 rounded-xl border border-slate-50">
      <View className="flex-row justify-between items-start">
        <View style={{ flex: 1 }}>
          <Text className="text-lg font-bold text-slate-800">{shift.shift.shiftName}</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text className="ml-1 text-slate-600 text-sm">
              {new Date(shift.shift.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
              {new Date(shift.shift.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
          {shift.assignedDate && <Text className="text-xs text-slate-500 mt-1">Assigned on: {new Date(shift.assignedDate).toLocaleDateString()}</Text>}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, paddingTop: topPadding }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-200">
          <View onTouchEnd={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#404040" />
          </View>
          <Text className="text-xl font-bold text-slate-700">My Shifts</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Title Row with Date and Notification Status */}
        <View className="px-4 py-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-slate-700">
            {selectedDate === new Date().toISOString().split("T")[0]
              ? "Today's Shifts"
              : `Shift(s) for ${new Date(selectedDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}`}
          </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            {notificationAllowed ? (
              <Ionicons name="notifications" size={22} color={"#fb923c"} />
            ) : (
              <Ionicons name="notifications-off" size={22} color={"#64748b"} />
            )}
          </TouchableOpacity>
        </View>

        {/* Modal for Notification Status Info */}
        <Modal transparent={true} animationType="fade" visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: COLORS.white,
                padding: 20,
                borderRadius: 8,
                alignItems: "center",
                width: "80%",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Notification {notificationAllowed ? "is enabled" : "is disabled"}</Text>
              <Text style={{ fontSize: 14, marginBottom: 20, textAlign: "center" }}>
                {notificationAllowed
                  ? "You will now receive a notification 30 minutes prior to your punch-in and punch-out schedule."
                  : "You won't now receive a notification 30 minutes prior to your punch-in and punch-out schedule."}
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={{ color: COLORS.primary, fontWeight: "bold" }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={"#cbd5e1"} />
            <Text className="mt-4 text-slate-500">Loading your shifts...</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={"#cbd5e1"} />}
          >
            <View className="p-4">
              {/* Calendar */}
              <View>
                <Calendar
                  markingType="custom"
                  markedDates={markedDates}
                  onDayPress={handleDateSelect}
                  enableSwipeMonths={true}
                  style={{
                    borderRadius: 16,
                    overflow: "hidden",
                    backgroundColor: "#f8fafc",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 2,
                    marginBottom: 8,
                  }}
                  theme={{
                    calendarBackground: "#f8fafc",
                    textSectionTitleColor: COLORS.textSecondary,
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: "#000000",
                    todayTextColor: COLORS.primary,
                    dayTextColor: COLORS.text,
                    textDisabledColor: COLORS.textLight,
                    dotColor: COLORS.primary,
                    selectedDotColor: "#ffffff",
                    arrowColor: "#94a3b8",
                    monthTextColor: COLORS.text,
                    indicatorColor: COLORS.primary,
                    textDayFontWeight: "500",
                    textMonthFontWeight: "600",
                    textDayHeaderFontWeight: "500",
                  }}
                />
              </View>

              {/* Shifts List */}
              <View className="mt-8">
                {selectedShifts.length > 0 ? (
                  <View>
                    {selectedShifts.map((shift, index) => (
                      <React.Fragment key={`shift-${shift.id}-${index}`}>{renderShiftItem(shift)}</React.Fragment>
                    ))}
                  </View>
                ) : (
                  <View className="bg-slate-50 rounded-xl p-6 items-center">
                    <Ionicons name="calendar-outline" size={36} color={COLORS.textLight} />
                    <Text className="text-slate-500 mt-3 text-center font-medium">No shifts scheduled for this date</Text>
                    <Text className="text-slate-400 text-sm text-center mt-1">Tap on a date with an orange border to view shifts</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default TimekeepingSchedule;
