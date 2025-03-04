// File: client/app/(tabs)/(shifts)/timekeeping-timecard.jsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  RefreshControl,
  ScrollView,
  Platform as RNPlatform,
} from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import useThemeStore from "../../../store/themeStore";
import useUserStore from "../../../store/userStore";
import axios from "axios";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfDay, endOfDay } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import DropDownPicker from "react-native-dropdown-picker";
import { API_BASE_URL } from "../../../config/constant";
import { formatTime, formatTotalDuration } from "../../../utils/timeUtils";

function decimalHoursToHHMM(decimalVal) {
  if (!decimalVal && decimalVal !== 0) return "0h 00m";
  const hours = Math.floor(decimalVal);
  const minDecimal = decimalVal - hours;
  const minutes = Math.round(minDecimal * 60);
  return `${hours}h ${minutes < 10 ? "0" : ""}${minutes}m`;
}

const TimeCard = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const insets = useSafeAreaInsets();
  const [shiftLogs, setShiftLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [rangeType, setRangeType] = useState("Monthly");
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [currentPicker, setCurrentPicker] = useState(null);
  const [tempStartDate, setTempStartDate] = useState(customStartDate);
  const [tempEndDate, setTempEndDate] = useState(customEndDate);
  const [openRangeType, setOpenRangeType] = useState(false);
  const [rangeTypeItems, setRangeTypeItems] = useState([
    { label: "Monthly", value: "Monthly" },
    { label: "Bi-Monthly", value: "Bi-Monthly" },
    { label: "Weekly", value: "Weekly" },
    { label: "Custom Range", value: "Custom" },
  ]);
  const [grandTotalHours, setGrandTotalHours] = useState(0);

  useEffect(() => {
    fetchTimeLogs();
  }, [rangeType, selectedDate, customStartDate, customEndDate]);

  useEffect(() => {
    const sum = shiftLogs.reduce((acc, log) => acc + (parseFloat(log.totalHours) || 0), 0);
    setGrandTotalHours(sum);
  }, [shiftLogs]);

  const fetchTimeLogs = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRangeBounds();
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Authentication Error", "You are not logged in. Please sign in again.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/timelogs/range`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        },
      });
      const sortedLogs = (response.data.data || []).sort((a, b) => b.id - a.id);
      setShiftLogs(sortedLogs);
    } catch (error) {
      console.error("Error fetching time logs:", error);
      Alert.alert("Error", "Failed to fetch time logs. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTimeLogs();
  };

  const getDateRangeBounds = () => {
    let startDate, endDate;
    switch (rangeType) {
      case "Monthly":
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
        break;
      case "Bi-Monthly": {
        if (selectedDate.getDate() <= 15) {
          startDate = startOfMonth(selectedDate);
          endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 15);
        } else {
          startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 16);
          endDate = endOfMonth(selectedDate);
        }
        break;
      }
      case "Weekly":
        startDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
        endDate = endOfWeek(selectedDate, { weekStartsOn: 0 });
        break;
      case "Custom":
        startDate = startOfDay(customStartDate);
        endDate = endOfDay(customEndDate);
        break;
      default:
        startDate = startOfMonth(selectedDate);
        endDate = endOfMonth(selectedDate);
    }
    return { startDate, endDate };
  };

  const getDateRangeLabel = () => {
    const { startDate, endDate } = getDateRangeBounds();
    return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
  };

  const handlePrev = () => {
    if (rangeType === "Monthly") {
      setSelectedDate(subMonths(selectedDate, 1));
    } else if (rangeType === "Bi-Monthly") {
      const day = selectedDate.getDate();
      if (day <= 15) {
        const prevMonth = subMonths(selectedDate, 1);
        setSelectedDate(new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 16));
      } else {
        setSelectedDate(startOfMonth(selectedDate));
      }
    } else if (rangeType === "Weekly") {
      setSelectedDate(subWeeks(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (rangeType === "Monthly") {
      setSelectedDate(addMonths(selectedDate, 1));
    } else if (rangeType === "Bi-Monthly") {
      const day = selectedDate.getDate();
      if (day <= 15) {
        setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 16));
      } else {
        const nextMonth = addMonths(selectedDate, 1);
        setSelectedDate(startOfMonth(nextMonth));
      }
    } else if (rangeType === "Weekly") {
      setSelectedDate(addWeeks(selectedDate, 1));
    }
  };

  const renderIOSPickerModal = () => {
    if (!currentPicker || RNPlatform.OS !== "ios") return null;
    return (
      <Modal visible={!!currentPicker} transparent animationType="fade" onRequestClose={() => setCurrentPicker(null)}>
        <TouchableWithoutFeedback onPress={() => setCurrentPicker(null)}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? "bg-slate-950/70" : "bg-slate-950/70"}`}>
            <TouchableWithoutFeedback>
              <View className={`w-11/12 p-5 rounded-lg ${isLightTheme ? "bg-white" : "bg-slate-800"}`}>
                <DateTimePicker
                  value={currentPicker === "startDate" ? tempStartDate : tempEndDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, pickedDate) => {
                    if (event.type === "set") {
                      if (currentPicker === "startDate") {
                        const newStart = pickedDate || tempStartDate;
                        if (newStart > customEndDate) {
                          Alert.alert("Invalid Date", "Start Date cannot be after End Date.");
                          setCustomEndDate(newStart);
                        }
                        setTempStartDate(newStart);
                      } else {
                        const newEnd = pickedDate || tempEndDate;
                        if (newEnd < customStartDate) {
                          Alert.alert("Invalid Date", "End Date cannot be before Start Date.");
                          setCustomStartDate(newEnd);
                        }
                        setTempEndDate(newEnd);
                      }
                    }
                  }}
                  textColor={isLightTheme ? "#000" : "#FFF"}
                />
                <View className="flex-row justify-end mt-5">
                  <Pressable
                    onPress={() => setCurrentPicker(null)}
                    className={`py-2 px-5 mr-2 rounded-md ${isLightTheme ? "bg-slate-200" : "bg-slate-600"}`}
                  >
                    <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (currentPicker === "startDate") {
                        setCustomStartDate(tempStartDate);
                        if (tempStartDate > customEndDate) {
                          setCustomEndDate(tempStartDate);
                        }
                      } else {
                        setCustomEndDate(tempEndDate);
                        if (tempEndDate < customStartDate) {
                          setCustomStartDate(tempEndDate);
                        }
                      }
                      setCurrentPicker(null);
                    }}
                    className="py-2 px-5 rounded-md bg-orange-500"
                  >
                    <Text className="text-white">Confirm</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const renderAndroidPicker = () => {
    if (!currentPicker || RNPlatform.OS !== "android") return null;
    return (
      <DateTimePicker
        value={currentPicker === "startDate" ? customStartDate : customEndDate}
        mode="date"
        display="default"
        onChange={(event, pickedDate) => {
          if (event.type === "set") {
            if (currentPicker === "startDate") {
              if (pickedDate > customEndDate) {
                Alert.alert("Invalid Date", "Start Date cannot be after End Date.");
                setCustomEndDate(pickedDate);
              }
              setCustomStartDate(pickedDate || customStartDate);
            } else {
              if (pickedDate < customStartDate) {
                Alert.alert("Invalid Date", "End Date cannot be before Start Date.");
                setCustomStartDate(pickedDate);
              }
              setCustomEndDate(pickedDate || customEndDate);
            }
          }
          setCurrentPicker(null);
        }}
        textColor={isLightTheme ? "#000" : "#FFF"}
      />
    );
  };

  const openPicker = (pickerType) => {
    setCurrentPicker(pickerType);
    if (RNPlatform.OS !== "android") {
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isLightTheme ? "#FFFFFF" : "#0f172a",
        paddingTop: insets.top + 60,
      }}
    >
      <View className="px-4 py-2">
        <Text className={`text-base mb-2 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Select Range:</Text>
        <View className="mb-4 z-30">
          <DropDownPicker
            open={openRangeType}
            value={rangeType}
            items={rangeTypeItems}
            setOpen={setOpenRangeType}
            setValue={setRangeType}
            setItems={setRangeTypeItems}
            placeholder="Select Range"
            containerStyle={{ zIndex: 1000 }}
            style={{
              borderColor: isLightTheme ? "#f1f5f9" : "#1E293B",
              backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B",
            }}
            dropDownContainerStyle={{
              borderColor: isLightTheme ? "#f1f5f9" : "#1E293B",
              backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B",
            }}
            textStyle={{ color: isLightTheme ? "#374151" : "#9CA3AF" }}
            placeholderStyle={{ color: isLightTheme ? "#6B7280" : "#9CA3AF" }}
            arrowIconStyle={{ tintColor: isLightTheme ? "#1e293b" : "#cbd5e1" }}
            tickIconStyle={{ tintColor: isLightTheme ? "#1e293b" : "#cbd5e1" }}
          />
        </View>
        {rangeType === "Custom" && (
          <View className="mb-6">
            <Pressable onPress={() => openPicker("startDate")} className={`py-4 px-4 mb-3 rounded-lg ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
              <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Start Date: {format(customStartDate, "MMMM d, yyyy")}</Text>
            </Pressable>
            <Pressable onPress={() => openPicker("endDate")} className={`py-4 px-4 rounded-lg ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
              <Text className={`${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>End Date: {format(customEndDate, "MMMM d, yyyy")}</Text>
            </Pressable>
          </View>
        )}
        {rangeType !== "Custom" && (
          <View className="flex-row items-center my-2">
            <Text className={`text-base font-semibold ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{getDateRangeLabel()}</Text>
            <View className="flex-row items-center ml-auto space-x-3">
              <Pressable onPress={handlePrev} className={`p-2 rounded-full ${isLightTheme ? "bg-white" : "bg-slate-800"}`}>
                <FontAwesome5 name="arrow-left" size={20} color={isLightTheme ? "#374151" : "#CBD5E1"} />
              </Pressable>
              <Pressable onPress={handleNext} className={`p-2 rounded-full ${isLightTheme ? "bg-white" : "bg-slate-800"}`}>
                <FontAwesome5 name="arrow-right" size={20} color={isLightTheme ? "#374151" : "#CBD5E1"} />
              </Pressable>
            </View>
          </View>
        )}
        {rangeType === "Custom" && (
          <View className="mb-4">
            <Text className={`text-base font-semibold ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{getDateRangeLabel()}</Text>
          </View>
        )}
        <View className={`p-4 rounded-lg mb-1 flex-row justify-between items-center ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
          <Text className={`font-medium ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Total Hours:</Text>
          <Text className={`text-llg font-semibold ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>{decimalHoursToHHMM(grandTotalHours)}</Text>
        </View>
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#475569"]} tintColor={isLightTheme ? "#475569" : "#94a3b8"} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#475569" className="mt-12" />
        ) : shiftLogs.length > 0 ? (
          shiftLogs.map((log, index) => {
            const timeInAt = log.timeInAt ? new Date(log.timeInAt) : null;
            const timeOutAt = log.timeOutAt ? new Date(log.timeOutAt) : null;
            let coffee1Ms = 0;
            if (log.coffeeBreakStart && log.coffeeBreakEnd) {
              coffee1Ms = new Date(log.coffeeBreakEnd) - new Date(log.coffeeBreakStart);
            }
            let coffee2Ms = 0;
            if (log.coffeeBreak2Start && log.coffeeBreak2End) {
              coffee2Ms = new Date(log.coffeeBreak2End) - new Date(log.coffeeBreak2Start);
            }
            let lunchMs = 0;
            if (log.lunchBreakStart && log.lunchBreakEnd) {
              lunchMs = new Date(log.lunchBreakEnd) - new Date(log.lunchBreakStart);
            }
            const coffeeTotal = coffee1Ms + coffee2Ms;
            const totalHours = log.totalHours ? parseFloat(log.totalHours) : 0;
            return (
              <View key={index} className={`p-4 rounded-lg mb-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                <Text className={`text-lg font-semibold ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                  {timeInAt ? format(timeInAt, "MMM d, yyyy (EEE)") : "No Date"}
                </Text>
                <Text className="text-md text-slate-500">
                  {timeInAt ? format(timeInAt, "hh:mm:ss aaa") : "--:--:--"} - {timeOutAt ? format(timeOutAt, "hh:mm:ss aaa") : "--:--:--"}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Ionicons name="cafe" size={16} color={isLightTheme ? "#0EA5E9" : "#38BDF8"} />
                  <Text className={`ml-2 text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                    Coffee Break: {formatTotalDuration(coffeeTotal)}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="fast-food" size={16} color={isLightTheme ? "#FBBF24" : "#FCD34D"} />
                  <Text className={`ml-2 text-sm ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>Lunch Break: {formatTotalDuration(lunchMs)}</Text>
                </View>
                <Text className={`text-sm text-right mt-2 ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                  Shift Hours: {decimalHoursToHHMM(totalHours)}
                </Text>
              </View>
            );
          })
        ) : (
          <Text className={`text-center mt-12 text-md ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>No logs available for this range.</Text>
        )}
      </ScrollView>
      {renderIOSPickerModal()}
      {renderAndroidPicker()}
    </View>
  );
};

export default TimeCard;
