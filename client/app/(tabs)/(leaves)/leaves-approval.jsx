// app/(tabs)/(leaves)/leaves-approval.jsx

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert as RNAlert,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../../config/constant";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

/**
 * Formats a DateTime string (e.g., "2025-03-17 08:00:32+08")
 * into a user-friendly local string with date AND time,
 * e.g. "Mar 17, 2025, 8:00 AM"
 */
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short", // e.g., "Mar"
    day: "numeric", // e.g., "17"
    year: "numeric", // e.g., "2025"
    hour: "2-digit", // e.g., "08"
    minute: "2-digit", // e.g., "00"
    hour12: true, // show AM/PM
  });
};

/**
 * A small sub-component to display a status badge with an icon.
 */
const LeaveStatusBadge = ({ status }) => {
  let bgColor, textColor, icon;

  switch (status.toLowerCase()) {
    case "approved":
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = "checkmark-circle";
      break;
    case "rejected":
      bgColor = "bg-red-100";
      textColor = "text-red-800";
      icon = "close-circle";
      break;
    case "pending":
      bgColor = "bg-amber-100";
      textColor = "text-amber-800";
      icon = "time";
      break;
    default:
      bgColor = "bg-slate-100";
      textColor = "text-slate-800";
      icon = "help-circle";
  }

  return (
    <View className={`flex-row items-center rounded-full px-3 py-1 ${bgColor}`}>
      <Ionicons name={icon} size={14} color={textColor.replace("text-", "")} style={{ marginRight: 4 }} />
      <Text className={`text-xs font-medium ${textColor}`}>{status}</Text>
    </View>
  );
};

/**
 * A small sub-component for the filter pill UI.
 */
const FilterOption = ({ label, isActive, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    animatePress();
    setTimeout(() => onPress(), 100);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} className={`px-4 py-2 rounded-full mr-2 ${isActive ? "bg-orange-500" : "bg-slate-100"}`}>
        <Text className={`text-sm font-medium ${isActive ? "text-white" : "text-slate-700"}`}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * A small sub-component for each sort option row.
 */
const SortOption = ({ label, icon, onPress, isActive }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    animatePress();
    setTimeout(() => onPress(), 100);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} className={`flex-row items-center p-4 ${isActive ? "bg-orange-50" : ""}`}>
        <Ionicons name={icon} size={20} color={isActive ? "#f97316" : "#6B7280"} style={{ marginRight: 12 }} />
        <Text className={`text-base ${isActive ? "text-orange-500 font-medium" : "text-slate-700"}`}>{label}</Text>
        {isActive && <Ionicons name="checkmark" size={20} color="#f97316" style={{ marginLeft: "auto" }} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * A small sub-component displayed when there's no data.
 */
const EmptyListComponent = ({ activeFilter }) => (
  <View className="flex-1 justify-center items-center py-10">
    <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
      <Ionicons name="calendar-outline" size={28} color="#9CA3AF" />
    </View>
    <Text className="text-slate-500 text-lg font-medium mb-1">No leave records</Text>
    <Text className="text-slate-400 text-center px-10">
      {activeFilter === "all"
        ? "You don't have any leave records yet. Submit a leave request to get started."
        : `No ${activeFilter} leave requests found.`}
    </Text>
  </View>
);

/**
 * Main LeavesApproval screen component.
 */
export default function LeavesApproval() {
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState("newest");
  const router = useRouter();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const sortButtonScale = useRef(new Animated.Value(1)).current;
  const modalBgAnim = useRef(new Animated.Value(0)).current;
  const sortModalAnim = useRef(new Animated.Value(height)).current;

  // Pan responder for the Sort Modal (allow swipe-down to close).
  const sortPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sortModalAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeSortModal();
        } else {
          Animated.spring(sortModalAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  /**
   * Fetches leaves for the currently logged-in user.
   */
  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        RNAlert.alert("Authentication Error", "You are not logged in. Please sign in again.", [
          { text: "OK", onPress: () => router.replace("(auth)/login-user") },
        ]);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/leaves/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLeaves(data.data);
        applyFiltersAndSort(data.data, activeFilter, sortOption);
      } else {
        RNAlert.alert("Error", data.message || "Failed to fetch leave logs.");
      }
    } catch (error) {
      console.error("Error fetching leave logs:", error);
      RNAlert.alert("Error", "An error occurred while fetching leave logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Filter and sort data based on active filter and sortOption.
   */
  const applyFiltersAndSort = useCallback((data, filter, sort) => {
    let result = [...data];

    // Filter
    if (filter !== "all") {
      result = result.filter((item) => item.status.toLowerCase() === filter.toLowerCase());
    }

    // Sort
    switch (sort) {
      case "newest":
        result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        break;
      case "type":
        result.sort((a, b) => a.leaveType.localeCompare(b.leaveType));
        break;
      case "status":
        result.sort((a, b) => a.status.localeCompare(b.status));
        break;
      default:
        break;
    }

    setFilteredLeaves(result);
  }, []);

  /**
   * On component mount, run initial animations and fetch data.
   */
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

    fetchLeaves();
  }, []);

  /**
   * Re-apply filters whenever leaves, activeFilter, or sortOption changes.
   */
  useEffect(() => {
    applyFiltersAndSort(leaves, activeFilter, sortOption);
  }, [leaves, activeFilter, sortOption, applyFiltersAndSort]);

  /**
   * For pull-to-refresh in the FlatList.
   */
  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaves();
  };

  /**
   * Opens the Sort Modal with a spring animation.
   */
  const openSortModal = () => {
    setSortModalVisible(true);
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(sortModalAnim, {
        toValue: 0,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Closes the Sort Modal with a fade + timing animation.
   */
  const closeSortModal = () => {
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(sortModalAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSortModalVisible(false);
    });
  };

  /**
   * Small bounce animation for the Sort button.
   */
  const animateButtonPress = (buttonRef) => {
    Animated.sequence([
      Animated.timing(buttonRef, {
        toValue: 0.92,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(buttonRef, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Chooses an icon for the leave type.
   */
  const getLeaveTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case "sick leave":
        return "medkit";
      case "vacation leave":
        return "airplane";
      case "emergency leave":
        return "alert-circle";
      case "maternity/paternity leave":
        return "people";
      case "casual leave":
        return "cafe";
      default:
        return "calendar";
    }
  };

  /**
   * Renders each leave entry.
   * Show separate rows for Start, End, Reason, and CreatedAt.
   */
  const renderItem = ({ item }) => {
    const itemScaleAnim = new Animated.Value(1);

    const animateItemPress = () => {
      Animated.sequence([
        Animated.timing(itemScaleAnim, {
          toValue: 0.97,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(itemScaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: itemScaleAnim }] }}>
        <TouchableOpacity onPress={animateItemPress} activeOpacity={0.9} className="mb-4 rounded-xl overflow-hidden bg-white" style={styles.cardShadow}>
          <View className="p-2 bg-slate-50 rounded-lg">
            {/* Row: Leave Type + Status Badge */}
            <View className="flex-row justify-between items-center pb-4 border-b border-slate-200">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-3">
                  <Ionicons name={getLeaveTypeIcon(item.leaveType)} size={20} color="#f97316" />
                </View>
                <Text className="text-lg font-semibold text-slate-800">{item.leaveType}</Text>
              </View>
              <LeaveStatusBadge status={item.status} />
            </View>

            {/* Row(s): Start, End, Reason, CreatedAt */}
            <View className="bg-slate-50 rounded-lg p-3 border-b border-slate-200">
              {/* CreatedAt */}
              <View className="flex-row items-center mb-1">
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text className="text-slate-600 text-sm ml-2">Submitted: {formatDateTime(item.createdAt)}</Text>
              </View>
              {/* Start Date/Time */}
              <View className="flex-row items-center mb-1">
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text className="text-slate-600 text-sm ml-2 ">Start: {formatDateTime(item.startDate)}</Text>
              </View>
              {/* End Date/Time */}
              <View className="flex-row items-center mb-1">
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text className="text-slate-600 text-sm ml-2">End: {formatDateTime(item.endDate)}</Text>
              </View>
              {/* Reason */}
              <View className="flex-row items-center">
                <Ionicons name="pencil-outline" size={16} color="#6B7280" />
                <Text className="text-slate-600 text-sm ml-2">Reason: {item.leaveReason ? item.leaveReason : "No reason"}</Text>
              </View>
            </View>

            {/* Approver (if any) */}
            {item.approver && item.approver.email && (
              <View className="bg-slate-50 rounded-lg p-3">
                <View className="flex-row items-center mb-1">
                  <Ionicons name="person-outline" size={16} color="#6B7280" />
                  <Text className="text-slate-600 text-sm ml-1">Approver: {item.approver.email}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="pencil-outline" size={16} color="#6B7280" />
                  <Text className="text-slate-600 text-sm ml-1">Comments: {item.approverComments}</Text>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: 70 }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View className="px-4 pb-2">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-2xl font-bold text-slate-800">Leave History</Text>
            <Animated.View style={{ transform: [{ scale: sortButtonScale }] }}>
              <TouchableOpacity
                onPress={() => {
                  animateButtonPress(sortButtonScale);
                  setTimeout(openSortModal, 100);
                }}
                activeOpacity={0.8}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center"
                style={styles.buttonShadow}
              >
                <Ionicons name="options-outline" size={20} color="#4B5563" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Text className="text-slate-500 mb-4">View all your leave requests and their status</Text>

          {/* Filter pills */}
          <View className="flex-row mb-4">
            <FilterOption label="All" isActive={activeFilter === "all"} onPress={() => setActiveFilter("all")} />
            <FilterOption label="Pending" isActive={activeFilter === "pending"} onPress={() => setActiveFilter("pending")} />
            <FilterOption label="Approved" isActive={activeFilter === "approved"} onPress={() => setActiveFilter("approved")} />
            <FilterOption label="Rejected" isActive={activeFilter === "rejected"} onPress={() => setActiveFilter("rejected")} />
          </View>
        </View>

        {/* Main content: list or loading */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#f97316" />
          </View>
        ) : (
          <FlatList
            data={filteredLeaves}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={[{ paddingHorizontal: 16, paddingBottom: 20 }, filteredLeaves.length === 0 && { flex: 1 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#f97316"]} tintColor="#f97316" />}
            ListEmptyComponent={<EmptyListComponent activeFilter={activeFilter} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* Sort Modal */}
      {sortModalVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0, 0, 0, 0.5)", opacity: modalBgAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSortModal} />
          </Animated.View>

          <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{
              transform: [{ translateY: sortModalAnim }],
              paddingBottom: Platform.OS === "ios" ? 30 : 20,
            }}
            {...sortPanResponder.panHandlers}
          >
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-slate-200 rounded-full" />
            </View>

            <View className="flex-row justify-between items-center px-5 pb-4 border-b border-slate-100">
              <Text className="text-lg font-bold text-slate-800">Sort By</Text>
              <TouchableOpacity onPress={closeSortModal}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <SortOption
              label="Newest First"
              icon="time-outline"
              isActive={sortOption === "newest"}
              onPress={() => {
                setSortOption("newest");
                closeSortModal();
              }}
            />

            <SortOption
              label="Oldest First"
              icon="calendar-outline"
              isActive={sortOption === "oldest"}
              onPress={() => {
                setSortOption("oldest");
                closeSortModal();
              }}
            />

            <SortOption
              label="Leave Type"
              icon="list-outline"
              isActive={sortOption === "type"}
              onPress={() => {
                setSortOption("type");
                closeSortModal();
              }}
            />

            <SortOption
              label="Status"
              icon="flag-outline"
              isActive={sortOption === "status"}
              onPress={() => {
                setSortOption("status");
                closeSortModal();
              }}
            />
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
});
