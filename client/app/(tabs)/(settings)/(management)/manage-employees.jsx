"use client";

// File: client/components/Employees.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import DropDownPicker from "react-native-dropdown-picker";
import { API_BASE_URL } from "../../../../config/constant";

// Get screen dimensions for modal sizing
const { height } = Dimensions.get("window");

// Define consistent colors
const COLORS = {
  primary: "#f97316", // orange-500
  primaryLight: "#ffedd5", // orange-50
  primaryDark: "#c2410c", // orange-700
  text: "#1e293b", // slate-800
  textSecondary: "#64748b", // slate-500
  textLight: "#94a3b8", // slate-400
  border: "#e2e8f0", // slate-200
  white: "#ffffff",
  background: "#ffffff",
  error: "#ef4444", // red-500
  success: "#10b981", // emerald-500
  card: "#f1f5f9", // slate-100
};

const Employees = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [companyDepartments, setCompanyDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Modal state for Create/Edit Employee
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Form state for employee fields
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [departmentId, setDepartmentId] = useState("");

  // Dropdown state for role selection
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleItems, setRoleItems] = useState([
    { label: "Employee", value: "employee" },
    { label: "Supervisor", value: "supervisor" },
    { label: "Admin", value: "admin" },
  ]);

  // Dropdown state for department selection
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptItems, setDeptItems] = useState([]);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  const buttonScale = React.useRef(new Animated.Value(1)).current;
  const modalY = React.useRef(new Animated.Value(Platform.OS === "ios" ? 700 : 500)).current;
  const modalBgAnim = useRef(new Animated.Value(0)).current;
  const deleteButtonScale = useRef(new Animated.Value(1)).current;
  const cancelButtonScale = useRef(new Animated.Value(1)).current;

  // Password validation function: at least 1 uppercase, 1 number, 1 symbol, min 6 characters
  const validatePassword = (pwd) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    return regex.test(pwd);
  };

  // Add PanResponder for the edit modal
  const modalPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow dragging down to close or up to expand
        if (gestureState.dy > 0) {
          // Dragging down - follow finger
          modalY.setValue(gestureState.dy);
        } else if (gestureState.dy < 0) {
          // Dragging up - expand modal (limit how far it can go up)
          const newPosition = Math.max(gestureState.dy, -300); // Limit upward movement
          modalY.setValue(newPosition);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // If dragged down more than 100, close the modal
          closeModal();
        } else if (gestureState.dy < -50) {
          // If dragged up more than 50, expand to full screen
          Animated.spring(modalY, {
            toValue: -300, // Expanded position
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        } else {
          // Otherwise snap back to original position
          Animated.spring(modalY, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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

    const initialize = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      if (!storedToken) {
        Alert.alert("Authentication Error", "Please sign in again.");
        router.replace("(auth)/signin");
        return;
      }
      setToken(storedToken);
      await fetchEmployees(storedToken);
      await fetchCompanyDepartments(storedToken);
    };
    initialize();
  }, []);

  const fetchEmployees = async (authToken) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/employee`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setEmployees(data.data);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch employees.");
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      Alert.alert("Error", "An unexpected error occurred while fetching employees.");
    }
    setLoading(false);
  };

  const fetchCompanyDepartments = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setCompanyDepartments(data.data);
        const items = data.data.map((dept) => ({
          label: dept.name,
          value: dept.id,
        }));
        setDeptItems(items);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch departments.");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      Alert.alert("Error", "An unexpected error occurred while fetching departments.");
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchEmployees(token);
    await fetchCompanyDepartments(token);
    setRefreshing(false);
  };

  const animateButtonPress = (scale) => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const openEditModal = (employee) => {
    if (employee) {
      setSelectedEmployee(employee);
      setUsername(employee.username || "");
      setFirstName(employee.profile.firstName || "");
      setLastName(employee.profile.lastName || "");
      setEmail(employee.email || "");
      setRole(employee.role || "employee");
      setDepartmentId(employee.department ? employee.department.id : "");
      setPassword(""); // leave blank to keep current password
    } else {
      setSelectedEmployee(null);
      setUsername("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("employee");
      setDepartmentId("");
      setPassword("");
    }

    setShowDeleteConfirmation(false);

    // Reset position before animation
    modalY.setValue(Platform.OS === "ios" ? 700 : 500);
    setEditModalVisible(true);

    // Animate modal sliding up and background fading in
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalY, {
        toValue: Platform.OS === "ios" ? 700 : 500,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setEditModalVisible(false);
      setShowDeleteConfirmation(false);
    });
  };

  const handleSaveEmployee = async () => {
    // Basic validations
    if (!username.trim() || !email.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert("Validation Error", "Username, Email, First Name, and Last Name are required.");
      return;
    }
    // If creating a new employee or changing password, validate it
    if (!selectedEmployee || password) {
      if (!validatePassword(password)) {
        Alert.alert(
          "Validation Error",
          "Password must be at least 6 characters long and include at least one uppercase letter, one number, and one symbol."
        );
        return;
      }
    }
    if (!token) return;
    try {
      let url, method;
      const payload = {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
        departmentId: departmentId || null,
      };
      if (password) {
        payload.password = password;
      }
      if (!selectedEmployee) {
        url = `${API_BASE_URL}/api/employee`;
        method = "POST";
      } else {
        url = `${API_BASE_URL}/api/employee/${selectedEmployee.id}`;
        method = "PUT";
      }
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", selectedEmployee ? "Employee updated successfully." : "Employee created successfully.");
        closeModal();
        fetchEmployees(token);
      } else {
        Alert.alert("Error", data.error || "Failed to save employee.");
      }
    } catch (error) {
      console.error("Error saving employee:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee || !token) return;

    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE_URL}/api/employee/${selectedEmployee.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", data.message || "Employee deleted successfully.");
        fetchEmployees(token);
      } else {
        Alert.alert("Error", data.error || "Failed to delete employee.");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setDeleting(false);
      closeModal();
    }
  };

  const renderEmployee = ({ item }) => {
    const fullName = `${item.profile.firstName || ""} ${item.profile.lastName || ""}`.trim();
    return (
      <View className="p-4 mb-3 rounded-lg flex-row justify-between items-center bg-slate-100">
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-800">
            {fullName} <Text className="text-slate-500">({item.username})</Text>
          </Text>
          <Text className="text-sm text-slate-600">{item.email}</Text>
          <View className="flex-row items-center mt-1">
            <View className="bg-orange-50 rounded-full px-2 py-0.5 mr-2">
              <Text className="text-xs text-orange-700 font-medium">{item.role}</Text>
            </View>
            {item.department && <Text className="text-xs text-slate-500">Dept: {item.department.name}</Text>}
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity onPress={() => openEditModal(item)} className="w-9 h-9 rounded-full bg-slate-200 items-center justify-center mr-2">
            <Feather name="edit-2" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        {/* Header */}
        <View className="px-4 py-3 flex-row items-center border-b border-slate-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800">Settings</Text>
        </View>

        {/* Title and Add Button */}
        <View className="px-4 py-4 flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-slate-800">Employee List</Text>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              onPress={() => {
                animateButtonPress(buttonScale);
                setTimeout(() => openEditModal(null), 100);
              }}
              className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center shadow-sm"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Employee List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="mt-4 text-slate-500">Loading employees...</Text>
          </View>
        ) : (
          <FlatList
            data={employees}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEmployee}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-16">
                <Ionicons name="people-outline" size={48} color={COLORS.textLight} />
                <Text className="mt-4 text-slate-500 text-center">No employees found.</Text>
                <Text className="text-slate-400 text-center">Add your first employee by tapping the + button.</Text>
              </View>
            }
          />
        )}

        {/* Create/Edit Employee Modal */}
        {editModalVisible && (
          <View className="absolute inset-0">
            <Animated.View className="absolute inset-0 bg-black/50" style={{ opacity: modalBgAnim }} onTouchEnd={closeModal} />
            <Animated.View
              style={{
                transform: [{ translateY: modalY }],
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "white",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                minHeight: height * 0.4, // Set minimum height to 40% of screen
                maxHeight: height * 0.75, // Set maximum height to 75% of screen
                paddingBottom: Platform.OS === "ios" ? 30 : 20,
              }}
            >
              <View className="items-center py-3" {...modalPanResponder.panHandlers}>
                <View className="w-10 h-1 bg-slate-200 rounded-full" />
              </View>

              <View className="flex-row justify-between items-center px-5 pb-4 border-b border-slate-100">
                <Text className="text-lg font-bold text-slate-800">{selectedEmployee ? "Edit Employee" : "Add Employee"}</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              {!showDeleteConfirmation ? (
                <ScrollView className="px-5 py-4">
                  {/* Form Fields */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-slate-600 mb-2">
                      Username <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3">
                      <Feather name="user" size={18} color="#9ca3af" />
                      <TextInput
                        className="flex-1 ml-2 text-slate-800"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-slate-600 mb-2">
                      First Name <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3">
                      <Feather name="user" size={18} color="#9ca3af" />
                      <TextInput
                        className="flex-1 ml-2 text-slate-800"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter first name"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-slate-600 mb-2">
                      Last Name <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3">
                      <Feather name="user" size={18} color="#9ca3af" />
                      <TextInput
                        className="flex-1 ml-2 text-slate-800"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter last name"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-slate-600 mb-2">
                      Email <Text className="text-red-500">*</Text>
                    </Text>
                    <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3">
                      <MaterialCommunityIcons name="email-outline" size={18} color="#9ca3af" />
                      <TextInput
                        className="flex-1 ml-2 text-slate-800"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter email address"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-slate-600 mb-2">
                      {selectedEmployee ? "New Password (optional)" : "Password"}
                      {!selectedEmployee && <Text className="text-red-500"> *</Text>}
                    </Text>
                    <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3">
                      <MaterialCommunityIcons name="lock-outline" size={18} color="#9ca3af" />
                      <TextInput
                        className="flex-1 ml-2 text-slate-800"
                        value={password}
                        onChangeText={setPassword}
                        placeholder={selectedEmployee ? "Leave blank to keep current" : "Enter password"}
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                      />
                    </View>
                    <Text className="text-xs text-slate-500 mt-1">Must contain at least 6 characters with 1 uppercase, 1 number, and 1 symbol.</Text>
                  </View>

                  {/* Fix for the VirtualizedList error - use listMode="SCROLLVIEW" */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-slate-600 mb-2">Role</Text>
                    <DropDownPicker
                      open={roleOpen}
                      value={role}
                      items={roleItems}
                      setOpen={setRoleOpen}
                      setValue={setRole}
                      setItems={setRoleItems}
                      placeholder="Select Role"
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                        minHeight: 48,
                        borderRadius: 12,
                      }}
                      dropDownContainerStyle={{
                        backgroundColor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                        borderRadius: 12,
                      }}
                      textStyle={{
                        fontSize: 14,
                        color: "#1E293B",
                      }}
                      placeholderStyle={{
                        color: "#9CA3AF",
                      }}
                      zIndex={3000}
                      zIndexInverse={1000}
                      listMode="SCROLLVIEW"
                      scrollViewProps={{
                        nestedScrollEnabled: true,
                      }}
                    />
                  </View>

                  <View className="mb-6">
                    <Text className="text-sm font-semibold text-slate-600 mb-2">Department</Text>
                    <DropDownPicker
                      open={deptOpen}
                      value={departmentId}
                      items={deptItems}
                      setOpen={setDeptOpen}
                      setValue={setDepartmentId}
                      setItems={setDeptItems}
                      placeholder="Select Department"
                      style={{
                        backgroundColor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                        minHeight: 48,
                        borderRadius: 12,
                      }}
                      dropDownContainerStyle={{
                        backgroundColor: "#F8FAFC",
                        borderColor: "#E2E8F0",
                        borderRadius: 12,
                      }}
                      textStyle={{
                        fontSize: 14,
                        color: "#1E293B",
                      }}
                      placeholderStyle={{
                        color: "#9CA3AF",
                      }}
                      zIndex={2000}
                      zIndexInverse={2000}
                      listMode="SCROLLVIEW"
                      scrollViewProps={{
                        nestedScrollEnabled: true,
                      }}
                    />
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row justify-around mt-4 ">
                    {selectedEmployee && (
                      <TouchableOpacity onPress={() => setShowDeleteConfirmation(true)} className="bg-neutral-400 py-3.5 px-8 rounded-xl ">
                        <Text className="text-white font-bold text-base">Delete Employee</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleSaveEmployee} className="bg-orange-500 py-3.5 px-8 rounded-xl">
                      <Text className="text-white font-bold text-base">Save Employee</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : (
                <View className="px-5 py-4 items-center">
                  <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
                    <Feather name="trash-2" size={28} color={COLORS.error} />
                  </View>

                  <Text className="text-xl font-bold text-slate-800 mb-2">Delete Employee</Text>
                  <Text className="text-slate-600 text-center mb-2">Are you sure you want to delete this employee?</Text>
                  <Text className="text-slate-500 text-center mb-6">
                    {selectedEmployee?.profile.firstName} {selectedEmployee?.profile.lastName}
                  </Text>

                  <View className="w-full">
                    {deleting ? (
                      <View className="items-center py-4">
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text className="text-slate-600 mt-3">Deleting employee...</Text>
                      </View>
                    ) : (
                      <>
                        <Animated.View style={{ transform: [{ scale: deleteButtonScale }] }}>
                          <TouchableOpacity
                            onPress={() => {
                              animateButtonPress(deleteButtonScale);
                              setTimeout(() => handleDeleteEmployee(), 100);
                            }}
                            className="bg-red-500 py-3.5 rounded-xl w-full items-center mb-3"
                          >
                            <Text className="text-white font-bold text-base">Yes, Delete Employee</Text>
                          </TouchableOpacity>
                        </Animated.View>

                        <Animated.View style={{ transform: [{ scale: cancelButtonScale }] }}>
                          <TouchableOpacity
                            onPress={() => {
                              animateButtonPress(cancelButtonScale);
                              setTimeout(() => setShowDeleteConfirmation(false), 100);
                            }}
                            className="py-3.5 rounded-xl w-full items-center border border-slate-200"
                          >
                            <Text className="text-slate-800 font-bold text-base">Cancel</Text>
                          </TouchableOpacity>
                        </Animated.View>
                      </>
                    )}
                  </View>
                </View>
              )}
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default Employees;
