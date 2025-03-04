// File: app/(tabs)/(leaves)/leaves-approval.jsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useThemeStore from "../../../store/themeStore";
import useLeaveStore from "../../../store/leaveStore";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, AntDesign, FontAwesome5 } from "@expo/vector-icons";
import useUsersStore from "../../../store/usersStore";

const ApprovalLeaves = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const router = useRouter();
  const { userLeaves, fetchUserLeaves, loadingUserLeaves, errorUserLeaves } = useLeaveStore();
  const { fetchUserById } = useUsersStore();
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilterOption, setSelectedFilterOption] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [approverEmails, setApproverEmails] = useState({});
  const [requesterEmails, setRequesterEmails] = useState({});
  const windowWidth = Dimensions.get("window").width;
  const isTablet = windowWidth >= 768;

  const getTypeIcon = (type) => {
    switch (type) {
      case "Sick Leave":
        return "bandage-outline";
      case "Vacation Leave":
        return "airplane-outline";
      case "Emergency Leave":
        return "warning-outline";
      case "Maternity/Paternity Leave":
        return "woman-outline";
      case "Casual Leave":
        return "beer-outline";
      default:
        return "layers-outline";
    }
  };

  // Helper function for Status icons using Ionicons
  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return "time-outline";
      case "Approved":
        return "checkmark-circle-outline";
      case "Rejected":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Authentication Error", "You are not logged in. Please sign in again.", [
          { text: "OK", onPress: () => router.replace("(auth)/login-user") },
        ]);
        return;
      }
      await fetchUserLeaves(token);
    };
    initialize();
  }, [fetchUserLeaves, router]);

  const onRefresh = useCallback(async () => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      setRefreshing(true);
      await fetchUserLeaves(token);
      setRefreshing(false);
    }
  }, [fetchUserLeaves]);

  useEffect(() => {
    (async () => {
      if (!Array.isArray(userLeaves)) return;
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;
      const uniqueApproverIds = [...new Set(userLeaves.map((l) => l.approverId).filter(Boolean))];
      for (const approverId of uniqueApproverIds) {
        if (!approverEmails[approverId]) {
          const userData = await fetchUserById(approverId, token);
          if (userData?.email) {
            setApproverEmails((prev) => ({ ...prev, [approverId]: userData.email }));
          }
        }
      }
    })();
  }, [userLeaves, approverEmails, fetchUserById]);

  useEffect(() => {
    (async () => {
      if (!Array.isArray(userLeaves)) return;
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;
      const uniqueRequesterIds = [...new Set(userLeaves.map((l) => l.userId).filter(Boolean))];
      for (const userId of uniqueRequesterIds) {
        if (!requesterEmails[userId]) {
          const userData = await fetchUserById(userId, token);
          if (userData?.email) {
            setRequesterEmails((prev) => ({ ...prev, [userId]: userData.email }));
          }
        }
      }
    })();
  }, [userLeaves, requesterEmails, fetchUserById]);

  const getFilteredAndSortedLeaves = () => {
    let filtered = Array.isArray(userLeaves) ? [...userLeaves] : [];

    if (filterStatus !== "ALL") {
      filtered = filtered.filter((leave) => leave.status === filterStatus);
    }
    if (filterType !== "ALL") {
      filtered = filtered.filter((leave) => leave.type === filterType);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.fromDate);
      const dateB = new Date(b.fromDate);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return isLightTheme ? "bg-yellow-100 text-yellow-800" : "bg-yellow-900/30 text-yellow-400";
      case "Approved":
        return isLightTheme ? "bg-green-100 text-green-800" : "bg-green-900/30 text-green-400";
      case "Rejected":
        return isLightTheme ? "bg-red-100 text-red-800" : "bg-red-900/30 text-red-400";
      default:
        return isLightTheme ? "bg-slate-100 text-slate-800" : "bg-slate-800/50 text-slate-400";
    }
  };

  const getStatusIconColor = (status) => {
    switch (status) {
      case "Pending":
        return "#eab308";
      case "Approved":
        return "#22c55e";
      case "Rejected":
        return "#ef4444";
      default:
        return isLightTheme ? "#64748b" : "#94a3b8";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "Sick Leave":
        return isLightTheme ? "bg-blue-100" : "bg-blue-900/30";
      case "Vacation Leave":
        return isLightTheme ? "bg-purple-100" : "bg-purple-900/30";
      case "Emergency Leave":
        return isLightTheme ? "bg-red-100" : "bg-red-900/30";
      case "Maternity/Paternity Leave":
        return isLightTheme ? "bg-pink-100" : "bg-pink-900/30";
      case "Casual Leave":
        return isLightTheme ? "bg-orange-100" : "bg-orange-900/30";
      default:
        return isLightTheme ? "bg-slate-100" : "bg-slate-800/50";
    }
  };

  const getTypeTextColor = (type) => {
    switch (type) {
      case "Sick Leave":
        return isLightTheme ? "text-blue-800" : "text-blue-400";
      case "Vacation Leave":
        return isLightTheme ? "text-purple-800" : "text-purple-400";
      case "Emergency Leave":
        return isLightTheme ? "text-red-800" : "text-red-400";
      case "Maternity/Paternity Leave":
        return isLightTheme ? "text-pink-800" : "text-pink-400";
      case "Casual Leave":
        return isLightTheme ? "text-orange-800" : "text-orange-400";
      default:
        return isLightTheme ? "text-slate-800" : "text-slate-400";
    }
  };

  const getTypeIconColor = (type) => {
    switch (type) {
      case "Sick Leave":
        return isLightTheme ? "#1e40af" : "#60a5fa";
      case "Vacation Leave":
        return isLightTheme ? "#6b21a8" : "#c084fc";
      case "Emergency Leave":
        return isLightTheme ? "#b91c1c" : "#f87171";
      case "Maternity/Paternity Leave":
        return isLightTheme ? "#9d174d" : "#f472b6";
      case "Casual Leave":
        return isLightTheme ? "#c2410c" : "#fb923c";
      default:
        return isLightTheme ? "#334155" : "#94a3b8";
    }
  };

  const renderLeaveItem = ({ item }) => (
    <View
      className={`rounded-xl mb-4 overflow-hidden ${isLightTheme ? "bg-white" : "bg-slate-800"}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View className={`px-4 py-3 flex-row justify-between items-center ${getTypeColor(item.type)}`}>
        <View className="flex-row items-center">
          <Ionicons name={getTypeIcon(item.type)} size={20} color={getTypeIconColor(item.type)} />
          <Text className={`ml-2 font-bold ${getTypeTextColor(item.type)}`}>{item.type}</Text>
        </View>
        <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
          <Text className="text-xs font-medium">{item.status}</Text>
        </View>
      </View>

      <View className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <FontAwesome5 name="calendar-alt" size={16} color={isLightTheme ? "#64748b" : "#94a3b8"} />
            <Text className={`ml-2 text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
              {new Date(item.fromDate).toLocaleDateString()} - {new Date(item.toDate).toLocaleDateString()}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name={getStatusIcon(item.status)} size={16} color={getStatusIconColor(item.status)} />
            <Text className={`ml-1 text-xs ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {item.userId && (
          <View className="mb-2 flex-row items-start">
            <FontAwesome5 name="user-alt" size={16} color={isLightTheme ? "#64748b" : "#94a3b8"} style={{ marginTop: 2 }} />
            <View className="ml-2 flex-1">
              <Text className={`text-xs ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>Requester</Text>
              <Text className={`text-sm ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{requesterEmails[item.userId] || "Loading..."}</Text>
            </View>
          </View>
        )}

        {item.approverId && (
          <View className="mb-2 flex-row items-start">
            <FontAwesome5 name="user-check" size={16} color={isLightTheme ? "#64748b" : "#94a3b8"} style={{ marginTop: 2 }} />
            <View className="ml-2 flex-1">
              <Text className={`text-xs ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>Approver</Text>
              <Text className={`text-sm ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{approverEmails[item.approverId] || "Loading..."}</Text>
            </View>
          </View>
        )}

        <View className="flex-row mb-2">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center">
              <FontAwesome5 name="calendar-plus" size={16} color={isLightTheme ? "#64748b" : "#94a3b8"} />
              <Text className={`ml-2 text-xs ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>From</Text>
            </View>
            <Text className={`text-sm mt-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{formatDateTime(item.fromDate)}</Text>
          </View>

          <View className="flex-1">
            <View className="flex-row items-center">
              <FontAwesome5 name="calendar-minus" size={16} color={isLightTheme ? "#64748b" : "#94a3b8"} />
              <Text className={`ml-2 text-xs ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>To</Text>
            </View>
            <Text className={`text-sm mt-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{formatDateTime(item.toDate)}</Text>
          </View>
        </View>

        {item.reason && (
          <View className={`mt-2 p-3 rounded-lg ${isLightTheme ? "bg-slate-50" : "bg-slate-700/50"}`}>
            <Text className={`text-xs mb-1 ${isLightTheme ? "text-slate-500" : "text-slate-500"}`}>Reason</Text>
            <Text className={`text-sm ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{item.reason}</Text>
          </View>
        )}

        {item.status === "Rejected" && item.rejectionReason && (
          <View className={`mt-2 p-3 rounded-lg ${isLightTheme ? "bg-red-50" : "bg-red-900/20"}`}>
            <View className="flex-row items-center mb-1">
              <AntDesign name="exclamationcircle" size={14} color="#ef4444" />
              <Text className="text-xs ml-1 text-red-500">Rejection Reason</Text>
            </View>
            <Text className={`text-sm ${isLightTheme ? "text-red-700" : "text-red-300"}`}>{item.rejectionReason}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const handleFilterOption = (option) => setSelectedFilterOption(option);

  const handleStatusSelection = (status) => {
    setFilterStatus(status);
    setIsFilterModalVisible(false);
    setSelectedFilterOption(null);
  };

  const handleTypeSelection = (type) => {
    setFilterType(type);
    setIsFilterModalVisible(false);
    setSelectedFilterOption(null);
  };

  const removeFilter = (filterTypeToRemove) => {
    if (filterTypeToRemove === "status") setFilterStatus("ALL");
    else if (filterTypeToRemove === "type") setFilterType("ALL");
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "white" : "bg-slate-900"}`} edges={["right", "left", "bottom"]} style={{ paddingTop: 120 }}>
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} />

      <View className="flex-row justify-end items-center px-4 py-2">
        <Pressable
          onPress={toggleSortOrder}
          className={`mr-3 p-2 rounded-full ${isLightTheme ? "bg-white" : "bg-slate-800"}`}
          accessibilityLabel="Sort by Date"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <MaterialIcons name={sortOrder === "desc" ? "sort-by-alpha" : "sort-by-alpha"} size={20} color={isLightTheme ? "#64748b" : "#94a3b8"} />
        </Pressable>
        <Pressable
          onPress={() => setIsFilterModalVisible(true)}
          className={`p-2 rounded-full ${isLightTheme ? "bg-white" : "bg-slate-800"}`}
          accessibilityLabel="Filter Options"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Ionicons name="filter" size={20} color={isLightTheme ? "#64748b" : "#94a3b8"} />
        </Pressable>
      </View>

      {/* Active Filters */}
      {(filterStatus !== "ALL" || filterType !== "ALL") && (
        <View className="flex-row flex-wrap px-4 py-2">
          {filterStatus !== "ALL" && (
            <View className={`flex-row items-center px-3 py-1.5 rounded-full mr-2 mb-1 ${getStatusColor(filterStatus)}`}>
              <Ionicons name={getStatusIcon(filterStatus)} size={14} color={getStatusIconColor(filterStatus)} style={{ marginRight: 4 }} />
              <Text className={`text-xs mr-1 font-medium ${getStatusColor(filterStatus)}`}>{filterStatus}</Text>
              <Pressable onPress={() => removeFilter("status")}>
                <Ionicons name="close-circle" size={16} color={getStatusIconColor(filterStatus)} />
              </Pressable>
            </View>
          )}
          {filterType !== "ALL" && (
            <View className={`flex-row items-center px-3 py-1.5 rounded-full mr-2 mb-1 ${getTypeColor(filterType)}`}>
              <Ionicons name={getTypeIcon(filterType)} size={14} color={getTypeIconColor(filterType)} style={{ marginRight: 4 }} />
              <Text className={`text-xs mr-1 font-medium ${getTypeTextColor(filterType)}`}>{filterType}</Text>
              <Pressable onPress={() => removeFilter("type")}>
                <Ionicons name="close-circle" size={16} color={getTypeIconColor(filterType)} />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsFilterModalVisible(false);
          setSelectedFilterOption(null);
        }}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center"
          activeOpacity={1}
          onPressOut={() => {
            setIsFilterModalVisible(false);
            setSelectedFilterOption(null);
          }}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.7)" }}
        >
          <View
            className={`w-11/12 max-h-3/4 rounded-2xl overflow-hidden ${isLightTheme ? "bg-white" : "bg-slate-800"}`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
              maxWidth: isTablet ? 500 : "92%",
            }}
          >
            <View className={`px-5 py-4 border-b ${isLightTheme ? "border-slate-200" : "border-slate-700"}`}>
              <View className="flex-row justify-between items-center">
                <Text className={`text-xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                  {selectedFilterOption === "status" ? "Filter by Status" : selectedFilterOption === "type" ? "Filter by Leave Type" : "Filter Options"}
                </Text>
                <Pressable
                  onPress={() => {
                    setIsFilterModalVisible(false);
                    setSelectedFilterOption(null);
                  }}
                  className={`p-1 rounded-full ${isLightTheme ? "bg-slate-100" : "bg-slate-700"}`}
                >
                  <Ionicons name="close" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                </Pressable>
              </View>
            </View>

            <View className="p-5">
              {!selectedFilterOption && (
                <View>
                  <Pressable
                    className={`flex-row items-center mb-4 p-4 rounded-xl ${isLightTheme ? "bg-slate-50" : "bg-slate-700"}`}
                    android_ripple={{ color: isLightTheme ? "#e5e7eb" : "#4b5563" }}
                    onPress={() => handleFilterOption("status")}
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isLightTheme ? "bg-blue-100" : "bg-blue-900/30"}`}>
                      <Ionicons name="options-outline" size={20} color={isLightTheme ? "#3b82f6" : "#60a5fa"} />
                    </View>
                    <View>
                      <Text className={`text-base font-medium ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Filter by Status</Text>
                      <Text className={`text-xs ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>Pending, Approved, Rejected</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    className={`flex-row items-center p-4 rounded-xl ${isLightTheme ? "bg-slate-50" : "bg-slate-700"}`}
                    android_ripple={{ color: isLightTheme ? "#e5e7eb" : "#4b5563" }}
                    onPress={() => handleFilterOption("type")}
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isLightTheme ? "bg-purple-100" : "bg-purple-900/30"}`}>
                      <Ionicons name="list-outline" size={20} color={isLightTheme ? "#8b5cf6" : "#a78bfa"} />
                    </View>
                    <View>
                      <Text className={`text-base font-medium ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Filter by Leave Type</Text>
                      <Text className={`text-xs ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>Sick, Vacation, Emergency, etc.</Text>
                    </View>
                  </Pressable>
                </View>
              )}

              {selectedFilterOption === "status" && (
                <View>
                  <Pressable
                    className={`flex-row items-center mb-3 p-3 rounded-xl ${
                      filterStatus === "ALL" ? (isLightTheme ? "bg-slate-200" : "bg-slate-600") : isLightTheme ? "bg-slate-50" : "bg-slate-700"
                    }`}
                    onPress={() => handleStatusSelection("ALL")}
                    android_ripple={{ color: isLightTheme ? "#e5e7eb" : "#4b5563" }}
                  >
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isLightTheme ? "bg-slate-300" : "bg-slate-600"}`}>
                      <Ionicons name="apps-outline" size={18} color={isLightTheme ? "#475569" : "#cbd5e1"} />
                    </View>
                    <Text className={`text-base ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>All Statuses</Text>
                  </Pressable>

                  {["Pending", "Approved", "Rejected"].map((status) => (
                    <Pressable
                      key={status}
                      className={`flex-row items-center mb-3 p-3 rounded-xl ${
                        filterStatus === status ? (isLightTheme ? "bg-slate-200" : "bg-slate-600") : isLightTheme ? "bg-slate-50" : "bg-slate-700"
                      }`}
                      onPress={() => handleStatusSelection(status)}
                      android_ripple={{ color: isLightTheme ? "#e5e7eb" : "#4b5563" }}
                    >
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${getStatusColor(status)}`}>
                        <Ionicons name={getStatusIcon(status)} size={18} color={getStatusIconColor(status)} />
                      </View>
                      <Text className={`text-base ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>{status}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {selectedFilterOption === "type" && (
                <View>
                  <Pressable
                    className={`flex-row items-center mb-3 p-3 rounded-xl ${
                      filterType === "ALL" ? (isLightTheme ? "bg-slate-200" : "bg-slate-600") : isLightTheme ? "bg-slate-50" : "bg-slate-700"
                    }`}
                    onPress={() => handleTypeSelection("ALL")}
                    android_ripple={{ color: isLightTheme ? "#e5e7eb" : "#4b5563" }}
                  >
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isLightTheme ? "bg-slate-300" : "bg-slate-600"}`}>
                      <Ionicons name="apps-outline" size={18} color={isLightTheme ? "#475569" : "#cbd5e1"} />
                    </View>
                    <Text className={`text-base ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>All Leave Types</Text>
                  </Pressable>

                  {["Sick Leave", "Vacation Leave", "Emergency Leave", "Maternity/Paternity Leave", "Casual Leave"].map((type) => (
                    <Pressable
                      key={type}
                      className={`flex-row items-center mb-3 p-3 rounded-xl ${
                        filterType === type ? (isLightTheme ? "bg-slate-200" : "bg-slate-600") : isLightTheme ? "bg-slate-50" : "bg-slate-700"
                      }`}
                      onPress={() => handleTypeSelection(type)}
                      android_ripple={{ color: isLightTheme ? "#e5e7eb" : "#4b5563" }}
                    >
                      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${getTypeColor(type)}`}>
                        <Ionicons name={getTypeIcon(type)} size={18} color={getTypeIconColor(type)} />
                      </View>
                      <Text className={`text-base ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Content */}
      <View className="flex-1 px-4 pt-2">
        {loadingUserLeaves && !refreshing ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={isLightTheme ? "#f97316" : "#fdba74"} />
            <Text className={`mt-4 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Loading leave requests...</Text>
          </View>
        ) : errorUserLeaves ? (
          <View className="flex-1 justify-center items-center">
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text className={`text-center mt-4 text-base ${isLightTheme ? "text-red-700" : "text-red-300"}`}>{errorUserLeaves}</Text>
            <Pressable onPress={onRefresh} className="mt-6 py-3 px-6 rounded-full bg-orange-500">
              <Text className="text-white font-medium">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={getFilteredAndSortedLeaves()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderLeaveItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              getFilteredAndSortedLeaves().length === 0
                ? { flexGrow: 1, justifyContent: "center", alignItems: "center", paddingVertical: 20 }
                : { paddingVertical: 12, paddingBottom: isTablet ? 40 : 20 }
            }
            ListEmptyComponent={
              <View className="items-center px-6">
                <Ionicons name="calendar-outline" size={64} color={isLightTheme ? "#cbd5e1" : "#475569"} style={{ marginBottom: 16 }} />
                <Text className={`text-center text-base font-medium mb-2 ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                  No leave requests found
                </Text>
                <Text className={`text-center text-sm ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
                  {filterStatus !== "ALL" || filterType !== "ALL"
                    ? "Try changing your filters to see more results"
                    : "You have not submitted any leave requests yet"}
                </Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[isLightTheme ? "#f97316" : "#fdba74"]}
                tintColor={isLightTheme ? "#f97316" : "#fdba74"}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default ApprovalLeaves;
