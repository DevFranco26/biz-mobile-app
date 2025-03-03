// File: app/(tabs)/Payroll.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import usePayrollStore from "../../store/payrollStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as SecureStore from "expo-secure-store";
import "nativewind";
import useThemeStore from "../../store/themeStore";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";

const Payroll = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";

  const { myPayrollRecords, fetchMyPayroll, loading } = usePayrollStore();
  const insets = useSafeAreaInsets();

  // Initialize filterValue and sortValue with default values to prevent null issues
  const [sortValue, setSortValue] = useState("date_desc");
  const [filterValue, setFilterValue] = useState("all");

  // Separate state variables for Sort and Filter modals
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Sort and Filter Items
  const [sortItems] = useState([
    { label: "Date (Newest)", value: "date_desc" },
    { label: "Date (Oldest)", value: "date_asc" },
    { label: "Net Pay (High to Low)", value: "netPay_desc" },
    { label: "Net Pay (Low to High)", value: "netPay_asc" },
  ]);

  const [filterItems] = useState([
    { label: "All", value: "all" },
    { label: "Monthly", value: "monthly" },
    { label: "Weekly", value: "weekly" },
    { label: "Daily", value: "daily" },
  ]);

  const [isFetching, setIsFetching] = useState(false);

  // Fetch Token and Payroll Records
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        if (!storedToken) {
          Alert.alert("Authentication Error", "Please sign in again.");
          // Optionally navigate to sign-in screen
          return;
        }
        setIsFetching(true);
        await fetchMyPayroll(storedToken);
        setIsFetching(false);
      } catch (error) {
        console.error("Error initializing Payroll component:", error);
        Alert.alert("Error", "Failed to load payroll records.");
        setIsFetching(false);
      }
    };
    initialize();
  }, [fetchMyPayroll]);

  // Handle Refresh
  const onRefresh = useCallback(() => {
    const refreshPayroll = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync("token");
        if (storedToken) {
          setIsFetching(true);
          await fetchMyPayroll(storedToken);
          setIsFetching(false);
        } else {
          Alert.alert("Authentication Error", "Please sign in again.");
        }
      } catch (error) {
        console.error("Error refreshing payroll records:", error);
        Alert.alert("Error", "Failed to refresh payroll records.");
        setIsFetching(false);
      }
    };
    refreshPayroll();
  }, [fetchMyPayroll]);

  // Sorting Function
  const sortedPayrollRecords = () => {
    let sorted = [...myPayrollRecords];
    switch (sortValue) {
      case "date_desc":
        sorted.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        break;
      case "date_asc":
        sorted.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        break;
      case "netPay_desc":
        sorted.sort((a, b) => parseFloat(b.netPay) - parseFloat(a.netPay));
        break;
      case "netPay_asc":
        sorted.sort((a, b) => parseFloat(a.netPay) - parseFloat(b.netPay));
        break;
      default:
        break;
    }
    return sorted;
  };

  // Filtering Function
  const filteredPayrollRecords = () => {
    let filtered = sortedPayrollRecords();
    if (filterValue === "monthly") {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.startDate);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
      });
    } else if (filterValue === "weekly") {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.startDate);
        return recordDate >= startOfWeek && recordDate <= endOfWeek;
      });
    } else if (filterValue === "daily") {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      filtered = filtered.filter((record) => {
        const recordDate = new Date(record.startDate);
        return recordDate >= startOfDay && recordDate <= endOfDay;
      });
    }
    return filtered;
  };

  const generateHtmlContent = (record) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payroll Record #${record.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .header img {
            width: 150px;
          }
          .title {
            text-align: center;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          table, th, td {
            border: 1px solid #ddd;
          }
          th, td {
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .total {
            font-weight: bold;
          }
          .footer {
            position: fixed;
            bottom: 30px;
            width: 100%;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 10px;
            font-size: 12px;
            color: #aaa;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://yourcompany.com/logo.png" alt="Company Logo" />
          <h2>Payroll Summary</h2>
        </div>
        
        <div class="title">
          <h1>Payroll Record #${record.id}</h1>
        </div>
        
        <table>
          <tr>
            <th>User ID</th>
            <td>${record.userId}</td>
          </tr>
          <tr>
            <th>Period</th>
            <td>${format(new Date(record.startDate), "MMMM d, yyyy")} ~ ${format(new Date(record.endDate), "MMMM d, yyyy")}</td>
          </tr>
          <tr>
            <th>Pay Type</th>
            <td>${record.payType}</td>
          </tr>
          <tr>
            <th>Hours Worked</th>
            <td>${record.hoursWorked}</td>
          </tr>
          <tr>
            <th>Overtime Hours</th>
            <td>${record.overtimeHours}</td>
          </tr>
          <tr>
            <th>Overtime Pay</th>
            <td>${record.overtimePay}</td>
          </tr>
          <tr>
            <th>Gross Pay</th>
            <td>${record.grossPay}</td>
          </tr>
          <tr>
            <th>Deductions</th>
            <td>${record.deductions}</td>
          </tr>
          <tr class="total">
            <th>Net Pay</th>
            <td>${record.netPay}</td>
          </tr>
        </table>
        
        <div class="footer">
          &copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.
        </div>
      </body>
      </html>
    `;
  };

  // Handle Download PDF with Preview
  const handleDownloadPDF = async (record) => {
    try {
      const htmlContent = generateHtmlContent(record);

      // Generate PDF and get URI
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      console.log("PDF file created at:", uri);

      // Open Print Preview
      await Print.printAsync({ uri });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF.");
    }
  };

  // Render Payroll Item
  const renderPayrollItem = ({ item }) => (
    <View className={`p-4 mb-4 rounded-lg ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`} style={{ width: "100%" }}>
      <View className="mb-2">
        <Text className={`text-lg font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>
          {format(new Date(item.startDate), "MMMM d, yyyy")} - {format(new Date(item.endDate), "MMMM d, yyyy")}
        </Text>
      </View>
      <View className="mb-1">
        <Text className={`text-md ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
          <Text className="font-semibold">Pay Type:</Text> {item.payType}
        </Text>
      </View>
      <View className="mb-1">
        <Text className={`text-md ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
          <Text className="font-semibold">Hours worked:</Text> {item.hoursWorked}
        </Text>
      </View>
      <View className="mb-1">
        <Text className={`text-md ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
          <Text className="font-semibold">Overtime Hours:</Text> ${item.overtimeHours}
        </Text>
      </View>
      <View className="mb-1">
        <Text className={`text-md ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
          <Text className="font-semibold">Overtime Pay:</Text> ${item.overtimePay}
        </Text>
      </View>
      <View className="mb-1">
        <Text className={`text-md ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
          <Text className="font-semibold">Gross Pay:</Text> ${item.grossPay}
        </Text>
      </View>
      <View className="mb-1">
        <Text className={`text-md ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
          <Text className="font-semibold">Deductions:</Text> ${item.deductions}
        </Text>
      </View>
      <View className="mb-3">
        <Text className={`text-md ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
          <Text className="font-semibold">Net Pay:</Text> ${item.netPay}
        </Text>
      </View>
      <View className="flex-row justify-center">
        <Pressable className="bg-orange-500 px-4 py-2 rounded" onPress={() => handleDownloadPDF(item)}>
          <Text className="text-white text-center font-semibold">Download PDF</Text>
        </Pressable>
      </View>
    </View>
  );

  // Function to open Sort Modal
  const openSortModal = () => {
    setIsSortModalVisible(true);
  };

  // Function to handle filter selection
  const handleFilterSelection = (value) => {
    setFilterValue(value);
  };

  // Function to handle sort selection
  const handleSortSelection = (value) => {
    setSortValue(value);
    setIsSortModalVisible(false);
  };

  // Function to remove a specific filter or sort
  const removeFilter = (type) => {
    if (type === "filter") {
      setFilterValue("all");
    } else if (type === "sort") {
      setSortValue("date_desc");
    }
  };

  return (
    <View className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`} style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row justify-center items-center px-4 py-4">
        <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>My Payroll</Text>
      </View>

      {/* Active Filters and Sorts with Icons on the Right */}
      <View className="flex-row items-center px-4 mb-2">
        <View className="flex-1 flex-row flex-wrap">
          {filterValue !== "all" && (
            <View
              className={`
              flex-row items-center px-2 py-1 rounded-full mr-2 mb-1
              ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}
            `}
            >
              <Text
                className={`
                text-sm mr-1
                ${isLightTheme ? "text-slate-800" : "text-slate-300"}
              `}
              >
                {filterValue.charAt(0).toUpperCase() + filterValue.slice(1)}
              </Text>
              <Pressable onPress={() => removeFilter("filter")}>
                <Ionicons name="close-circle" size={16} color={isLightTheme ? "#4b5563" : "#d1d5db"} />
              </Pressable>
            </View>
          )}
          {sortValue && (
            <View
              className={`
              flex-row items-center px-2 py-1 rounded-full mr-2 mb-1
              ${isLightTheme ? "bg-slate-200" : "bg-slate-700"}
            `}
            >
              <Text
                className={`
                text-sm mr-1
                ${isLightTheme ? "text-slate-800" : "text-slate-300"}
              `}
              >
                {sortValue === "date_desc" && "Date Desc"}
                {sortValue === "date_asc" && "Date Asc"}
                {sortValue === "netPay_desc" && "Net Pay Desc"}
                {sortValue === "netPay_asc" && "Net Pay Asc"}
              </Text>
              <Pressable onPress={() => removeFilter("sort")}>
                <Ionicons name="close-circle" size={16} color={isLightTheme ? "#4b5563" : "#d1d5db"} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Sort and Filter Icons Positioned on the Right */}
        <View className="flex-row">
          {/* Sort Icon */}
          <Pressable onPress={openSortModal} className="mr-4" accessibilityLabel="Open Sort Options">
            <MaterialIcons name="sort" size={24} color={isLightTheme ? "#374151" : "#9ca3af"} />
          </Pressable>

          {/* Filter Icon */}
          <Pressable onPress={() => setIsFilterModalVisible(true)} accessibilityLabel="Open Filter Options">
            <Ionicons name="filter" size={24} color={isLightTheme ? "#374151" : "#9ca3af"} />
          </Pressable>
        </View>
      </View>

      {/* Sort Modal */}
      <Modal
        visible={isSortModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsSortModalVisible(false)}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? `bg-slate-950/70` : `bg-slate-950/70`}`}>
            <TouchableWithoutFeedback>
              <View className={`w-11/12 p-6 rounded-2xl shadow-md ${isLightTheme ? "bg-white" : "bg-slate-800"}`}>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className={`text-xl font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                    Sort Options
                  </Text>
                  <Pressable onPress={() => setIsSortModalVisible(false)}>
                    <Ionicons name="close" size={24} color={isLightTheme ? "#374151" : "#9ca3af"} />
                  </Pressable>
                </View>

                <FlatList
                  data={sortItems}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleSortSelection(item.value)}
                      className={`flex-row items-center p-2 rounded-lg mb-2 ${
                        sortValue === item.value
                          ? isLightTheme
                            ? "bg-slate-200"
                            : "bg-slate-700"
                          : isLightTheme
                          ? "bg-white"
                          : "bg-slate-800"
                      }`}
                      android_ripple={{
                        color: isLightTheme ? "#e5e7eb" : "#4b5563",
                      }}
                    >
                      <Text className={`text-lg ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>{item.label}</Text>
                    </Pressable>
                  )}
                />

                {/* Confirm Button */}
                <Pressable
                  onPress={() => setIsSortModalVisible(false)}
                  className={`mt-4 p-4 rounded-lg ${isLightTheme ? "bg-orange-500" : "bg-orange-500"}`}
                >
                  <Text className="text-white text-center font-semibold">Confirm</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterModalVisible(false)}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? `bg-slate-950/60` : `bg-slate-950/60`}`}>
            <TouchableWithoutFeedback>
              <View className={`w-11/12 p-6 rounded-2xl shadow-md ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className={`text-xl font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
                    Filter Options
                  </Text>
                  <Pressable onPress={() => setIsFilterModalVisible(false)}>
                    <Ionicons name="close" size={24} color={isLightTheme ? "#374151" : "#9ca3af"} />
                  </Pressable>
                </View>

                <FlatList
                  data={filterItems}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handleFilterSelection(item.value)}
                      className={`flex-row items-center p-2 rounded-lg mb-2 ${
                        filterValue === item.value
                          ? isLightTheme
                            ? "bg-slate-200"
                            : "bg-slate-700"
                          : isLightTheme
                          ? "bg-white"
                          : "bg-slate-800"
                      }`}
                      android_ripple={{
                        color: isLightTheme ? "#e5e7eb" : "#4b5563",
                      }}
                    >
                      <Text className={`text-lg ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>{item.label}</Text>
                    </Pressable>
                  )}
                />

                {/* Confirm Button */}
                <Pressable
                  onPress={() => setIsFilterModalVisible(false)}
                  className={`mt-4 p-4 rounded-lg ${isLightTheme ? "bg-orange-500" : "bg-orange-500"}`}
                >
                  <Text className="text-white text-center font-semibold">Confirm</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Payroll Records List */}
      <FlatList
        data={filteredPayrollRecords()}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={renderPayrollItem}
        ListEmptyComponent={
          !loading &&
          !isFetching && (
            <Text className={`text-center mt-8 text-lg ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>
              No payroll records found.
            </Text>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={onRefresh}
            colors={["#475569"]}
            tintColor={isLightTheme ? "#475569" : "#94a3b8"}
          />
        }
      />

      {/* Loading Indicator */}
      {(loading || isFetching) && (
        <View className={`absolute inset-0 justify-center items-center bg-black/10`}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text className={`mt-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Loading payroll...</Text>
        </View>
      )}
    </View>
  );
};

export default Payroll;
