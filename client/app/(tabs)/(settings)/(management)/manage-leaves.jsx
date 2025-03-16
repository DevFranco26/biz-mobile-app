// app/(tabs)/(settings)/(management)/manage-leaves.jsx

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "../../../../config/constant";

const { height } = Dimensions.get("window");

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
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
      icon = "help-circle";
  }

  return (
    <View className={`flex-row items-center rounded-full px-3 py-1 ${bgColor}`}>
      <Ionicons name={icon} size={14} color={textColor.replace("text-", "")} style={{ marginRight: 4 }} />
      <Text className={`text-xs font-medium ${textColor}`}>{status}</Text>
    </View>
  );
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const FilterOption = ({ label, isActive, onPress }) => {
  // Button animation
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
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} className={`px-4 py-2 rounded-full mr-2 ${isActive ? "bg-orange-500" : "bg-gray-100"}`}>
        <Text className={`text-sm font-medium ${isActive ? "text-white" : "text-gray-700"}`}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const SortOption = ({ label, icon, onPress, isActive }) => {
  // Button animation
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
        <Text className={`text-base ${isActive ? "text-orange-500 font-medium" : "text-gray-700"}`}>{label}</Text>
        {isActive && <Ionicons name="checkmark" size={20} color="#f97316" style={{ marginLeft: "auto" }} />}
      </TouchableOpacity>
    </Animated.View>
  );
};

const EmptyListComponent = ({ activeFilter }) => (
  <View className="flex-1 justify-center items-center py-10">
    <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
      <Ionicons name="document-text-outline" size={28} color="#9CA3AF" />
    </View>
    <Text className="text-gray-500 text-lg font-medium mb-1">No leave requests</Text>
    <Text className="text-gray-400 text-center px-10">
      {activeFilter === "all" ? "You don't have any leave requests to manage at the moment." : `No ${activeFilter} leave requests found.`}
    </Text>
  </View>
);

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

const ManageLeaves = () => {
  const [approverLeaves, setApproverLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState("newest");
  const [processingLeaves, setProcessingLeaves] = useState({});
  const router = useRouter();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const sortButtonScale = useRef(new Animated.Value(1)).current;
  const modalBgAnim = useRef(new Animated.Value(0)).current;
  const sortModalAnim = useRef(new Animated.Value(height)).current;

  // Pan responder for sort modal
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
          // Close the modal if dragged down enough
          closeSortModal();
        } else {
          // Snap back to original position
          Animated.spring(sortModalAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const fetchApproverLeaves = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        RNAlert.alert("Authentication Error", "You are not logged in. Please sign in again.", [
          { text: "OK", onPress: () => router.replace("(auth)/login-user") },
        ]);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/leaves/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setApproverLeaves(data.data);
        applyFiltersAndSort(data.data, activeFilter, sortOption);
      } else {
        RNAlert.alert("Error", data.message || "Failed to fetch leaves.");
      }
    } catch (error) {
      console.error("Error fetching leaves:", error);
      RNAlert.alert("Error", "An error occurred while fetching leaves.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSort = useCallback((data, filter, sort) => {
    // First apply filter
    let result = [...data];

    if (filter !== "all") {
      result = result.filter((item) => item.status.toLowerCase() === filter.toLowerCase());
    }

    // Then apply sort
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
      case "requester":
        result.sort((a, b) => {
          const nameA = a.requester?.username || "";
          const nameB = b.requester?.username || "";
          return nameA.localeCompare(nameB);
        });
        break;
      default:
        break;
    }

    setFilteredLeaves(result);
  }, []);

  useEffect(() => {
    // Initial animations
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

    fetchApproverLeaves();
  }, []);

  useEffect(() => {
    applyFiltersAndSort(approverLeaves, activeFilter, sortOption);
  }, [approverLeaves, activeFilter, sortOption, applyFiltersAndSort]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApproverLeaves();
  };

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

  const handleApprove = async (leaveId) => {
    setProcessingLeaves((prev) => ({ ...prev, [leaveId]: "approving" }));
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE_URL}/api/leaves/${leaveId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        RNAlert.alert("Success", "Leave approved successfully.");
        fetchApproverLeaves();
      } else {
        RNAlert.alert("Error", data.message || "Failed to approve leave.");
      }
    } catch (error) {
      console.error("Error approving leave:", error);
      RNAlert.alert("Error", "An error occurred while approving the leave.");
    } finally {
      setProcessingLeaves((prev) => ({ ...prev, [leaveId]: null }));
    }
  };

  const handleRejectConfirm = (leaveId) => {
    RNAlert.alert("Reject Leave", "Are you sure you want to reject this leave request?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => handleReject(leaveId),
      },
    ]);
  };

  const handleReject = async (leaveId) => {
    setProcessingLeaves((prev) => ({ ...prev, [leaveId]: "rejecting" }));
    try {
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${API_BASE_URL}/api/leaves/${leaveId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Sending an empty object since rejection reasons are no longer required
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        RNAlert.alert("Success", "Leave rejected successfully.");
        fetchApproverLeaves();
      } else {
        RNAlert.alert("Error", data.message || "Failed to reject leave.");
      }
    } catch (error) {
      console.error("Error rejecting leave:", error);
      RNAlert.alert("Error", "An error occurred while rejecting the leave.");
    } finally {
      setProcessingLeaves((prev) => ({ ...prev, [leaveId]: null }));
    }
  };

  const renderItem = ({ item }) => {
    // Create a new animated value for each item
    const itemScaleAnim = new Animated.Value(1);
    const approveButtonScale = new Animated.Value(1);
    const rejectButtonScale = new Animated.Value(1);

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

    const isProcessing = processingLeaves[item.id];

    return (
      <Animated.View style={{ transform: [{ scale: itemScaleAnim }] }}>
        <TouchableOpacity onPress={animateItemPress} activeOpacity={0.9} className="mb-4 rounded-xl overflow-hidden bg-white" style={styles.cardShadow}>
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-3">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mr-3">
                  <Ionicons name={getLeaveTypeIcon(item.leaveType)} size={20} color="#f97316" />
                </View>
                <Text className="text-lg font-semibold text-gray-800">{item.leaveType}</Text>
              </View>
              <LeaveStatusBadge status={item.status} />
            </View>

            <View className="bg-gray-50 rounded-lg p-3 mb-3">
              <View className="flex-row items-center mb-2">
                <Ionicons name="person-outline" size={16} color="#6B7280" className="mr-2" />
                <Text className="text-gray-600 text-sm font-medium">{item.requester ? item.requester.username : "N/A"}</Text>
              </View>

              <View className="flex-row items-center mb-2">
                <Ionicons name="calendar-outline" size={16} color="#6B7280" className="mr-2" />
                <Text className="text-gray-600 text-sm">
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </Text>
              </View>

              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={16} color="#6B7280" className="mr-2" />
                <Text className="text-gray-600 text-sm">
                  {formatTime(item.startDate)} - {formatTime(item.endDate)}
                </Text>
              </View>
            </View>

            {item.status === "pending" && (
              <View className="flex-row justify-between mt-2">
                <Animated.View style={{ flex: 1, marginRight: 8, transform: [{ scale: approveButtonScale }] }}>
                  <TouchableOpacity
                    onPress={() => {
                      Animated.sequence([
                        Animated.timing(approveButtonScale, {
                          toValue: 0.92,
                          duration: 70,
                          useNativeDriver: true,
                        }),
                        Animated.spring(approveButtonScale, {
                          toValue: 1,
                          friction: 3,
                          tension: 40,
                          useNativeDriver: true,
                        }),
                      ]).start();
                      setTimeout(() => handleApprove(item.id), 100);
                    }}
                    disabled={!!isProcessing}
                    activeOpacity={0.8}
                    className="py-3 rounded-lg bg-green-500 items-center justify-center"
                  >
                    {isProcessing === "approving" ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View className="flex-row items-center">
                        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text className="text-white font-semibold">Approve</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ flex: 1, transform: [{ scale: rejectButtonScale }] }}>
                  <TouchableOpacity
                    onPress={() => {
                      Animated.sequence([
                        Animated.timing(rejectButtonScale, {
                          toValue: 0.92,
                          duration: 70,
                          useNativeDriver: true,
                        }),
                        Animated.spring(rejectButtonScale, {
                          toValue: 1,
                          friction: 3,
                          tension: 40,
                          useNativeDriver: true,
                        }),
                      ]).start();
                      setTimeout(() => handleRejectConfirm(item.id), 100);
                    }}
                    disabled={!!isProcessing}
                    activeOpacity={0.8}
                    className="py-3 rounded-lg bg-red-500 items-center justify-center"
                  >
                    {isProcessing === "rejecting" ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <View className="flex-row items-center">
                        <Ionicons name="close-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text className="text-white font-semibold">Reject</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header with back button and title */}
      <View className="px-4 py-3 flex-row items-center border-b border-slate-200 mb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800">Settings</Text>
      </View>

      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View className="px-4 pb-2">
          <Text className="text-2xl font-bold text-gray-800">Manage Leaves</Text>
          <Text className="text-gray-500 mb-4">Review and manage leave requests from your team</Text>

          {/* Filter options */}
          <View className="flex-row mb-4">
            <FilterOption label="All" isActive={activeFilter === "all"} onPress={() => setActiveFilter("all")} />
            <FilterOption label="Pending" isActive={activeFilter === "pending"} onPress={() => setActiveFilter("pending")} />
            <FilterOption label="Approved" isActive={activeFilter === "approved"} onPress={() => setActiveFilter("approved")} />
            <FilterOption label="Rejected" isActive={activeFilter === "rejected"} onPress={() => setActiveFilter("rejected")} />
          </View>
        </View>

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
            >
              <View className="items-center py-3" {...sortPanResponder.panHandlers}>
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

              <SortOption
                label="Requester Name"
                icon="person-outline"
                isActive={sortOption === "requester"}
                onPress={() => {
                  setSortOption("requester");
                  closeSortModal();
                }}
              />
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

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
});

export default ManageLeaves;
