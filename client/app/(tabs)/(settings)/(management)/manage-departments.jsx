// app/(tabs)(settings)/(management)/Departments.jsx
import { useEffect, useState, useRef } from "react";
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
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons, Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
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

const Departments = () => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // States for creating/editing a department
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [deptName, setDeptName] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");

  // States for assigning users (regular members)
  const [currentUsers, setCurrentUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([]);

  // State for expanded sections in the actions modal
  const [expandedSection, setExpandedSection] = useState(null); // 'edit', 'delete', 'members'
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [actionsDepartment, setActionsDepartment] = useState(null);
  const actionsModalY = useRef(new Animated.Value(Platform.OS === "ios" ? 700 : 500)).current;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const cardScales = useRef({}).current;
  const modalBgAnim = useRef(new Animated.Value(0)).current;
  const deleteButtonScale = useRef(new Animated.Value(1)).current;
  const cancelButtonScale = useRef(new Animated.Value(1)).current;

  // Regular expression validation: only alphanumeric characters and spaces
  const validateDeptName = (name) => {
    const regex = /^[a-zA-Z0-9 ]+$/;
    return regex.test(name);
  };

  // Open the actions modal for a department
  const openActionsModal = (dept) => {
    setActionsDepartment(dept);
    setDeptName(dept.name);
    setSelectedSupervisorId(dept.supervisor ? dept.supervisor.id : "");
    setExpandedSection(null);

    // Reset position before animation
    actionsModalY.setValue(Platform.OS === "ios" ? 700 : 500);
    setActionsModalVisible(true);

    // Animate modal sliding up and background fading in
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(actionsModalY, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Load users for the department if needed
    if (dept) {
      loadUsersForDepartment(dept);
    }
  };

  // Close the actions modal
  const closeActionsModal = () => {
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(actionsModalY, {
        toValue: Platform.OS === "ios" ? 700 : 500,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActionsModalVisible(false);
      setExpandedSection(null);
    });
  };

  // PanResponder for the actions modal
  const actionsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          actionsModalY.setValue(gestureState.dy);
        } else if (gestureState.dy < 0) {
          const newPosition = Math.max(gestureState.dy, -300);
          actionsModalY.setValue(newPosition);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          closeActionsModal();
        } else if (gestureState.dy < -50) {
          Animated.spring(actionsModalY, {
            toValue: -300,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(actionsModalY, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Recalculate current members when users or actionsDepartment change
  useEffect(() => {
    if (actionsDepartment) {
      loadUsersForDepartment(actionsDepartment);
    }
  }, [users, actionsDepartment]);

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
      await fetchDepartments(storedToken);
      await fetchUsers(storedToken);
    };
    initialize();
  }, []);

  const fetchDepartments = async (authToken) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setDepartments(data.data);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch departments.");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      Alert.alert("Error", "An unexpected error occurred while fetching departments.");
    }
    setLoading(false);
  };

  const fetchUsers = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/employee`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setUsers(data.data);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch users.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      Alert.alert("Error", "An unexpected error occurred while fetching users.");
    }
  };

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchDepartments(token);
    await fetchUsers(token);
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

  // Save department (create or update) including supervisor assignment.
  const handleSaveDepartment = async () => {
    if (!deptName.trim()) {
      Alert.alert("Validation Error", "Department name is required.");
      return;
    }
    if (!validateDeptName(deptName.trim())) {
      Alert.alert("Validation Error", "Department name must be alphanumeric (spaces allowed).");
      return;
    }
    if (!token) return;
    try {
      let url, method;
      const body = { name: deptName.trim(), supervisorId: selectedSupervisorId || null };
      if (actionsDepartment) {
        url = `${API_BASE_URL}/api/departments/update/${actionsDepartment.id}`;
        method = "PUT";
      } else {
        url = `${API_BASE_URL}/api/departments/create`;
        method = "POST";
      }
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", actionsDepartment ? "Department updated successfully." : "Department created successfully.");
        closeActionsModal();
        fetchDepartments(token);
        fetchUsers(token);
      } else {
        Alert.alert("Error", data.error || "Failed to save department.");
      }
    } catch (error) {
      console.error("Error saving department:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  // Delete a department
  const handleDeleteDepartment = async () => {
    if (!actionsDepartment || !token) return;
    try {
      setDeleting(true);
      const res = await fetch(`${API_BASE_URL}/api/departments/delete/${actionsDepartment.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", data.message || "Department deleted successfully.");
        fetchDepartments(token);
        fetchUsers(token);
      } else {
        Alert.alert("Error", data.error || "Failed to delete department.");
      }
    } catch (error) {
      console.error("Error deleting department:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setDeleting(false);
      closeActionsModal();
    }
  };

  // --- Load current members and available users for a department ---
  const loadUsersForDepartment = (dept) => {
    // Compare using dept.id against user.department.id
    const current = users.filter((user) => user.department && user.department.id === dept.id);
    // Available users: those who do NOT have a department or whose department id is different, and not superadmin
    const available = users.filter((user) => (!user.department || user.department.id !== dept.id) && user.role !== "superadmin");
    setCurrentUsers(current);
    setAvailableUsers(available);
    const dropdownData = available.map((user) => ({
      label: user.email,
      value: user.id,
    }));
    setDropdownItems(dropdownData);
    setSelectedUserId(null);
  };

  const handleAssignUser = async () => {
    if (selectedUserId === null) {
      Alert.alert("Validation Error", "Please select a user to add.");
      return;
    }
    try {
      const url = `${API_BASE_URL}/api/departments/${actionsDepartment.id}/assign-users`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: [selectedUserId] }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", "User added to department successfully.");
        await fetchDepartments(token);
        await fetchUsers(token);
        loadUsersForDepartment(actionsDepartment);
      } else {
        Alert.alert("Error", data.error || "Failed to add user.");
      }
    } catch (error) {
      console.error("Error assigning user:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const handleRemoveUser = async (userId, userEmail) => {
    try {
      const url = `${API_BASE_URL}/api/departments/${actionsDepartment.id}/remove-users`;
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: [userId] }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert("Success", data.message || "User removed successfully.");
        fetchDepartments(token);
        fetchUsers(token);
        loadUsersForDepartment(actionsDepartment);
      } else {
        Alert.alert("Error", data.error || "Failed to remove user.");
      }
    } catch (error) {
      console.error("Error removing user:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  // --- Render Department Item ---
  const renderDepartment = ({ item, index }) => {
    if (!cardScales[index]) {
      cardScales[index] = new Animated.Value(1);
    }
    // Compute member count directly from the users array
    const memberCount = users.filter((user) => user.department && user.department.id === item.id).length;
    return (
      <Animated.View style={{ transform: [{ scale: cardScales[index] }] }}>
        <View className="p-4 mb-3 rounded-lg bg-slate-100">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-slate-800">{item.name}</Text>
              {item.supervisor ? (
                <View className="flex-row items-center mt-1">
                  <View className="bg-orange-50 rounded-full px-2 py-0.5 mr-2">
                    <Text className="text-xs text-orange-700">Supervisor</Text>
                  </View>
                  <Text className="text-sm text-slate-600">
                    {item.supervisor.profile.firstName} {item.supervisor.profile.lastName}
                  </Text>
                </View>
              ) : (
                <Text className="text-sm text-slate-500 italic mt-1">No supervisor assigned</Text>
              )}
            </View>
            <View className="flex-row">
              <TouchableOpacity
                onPress={() => {
                  animateButtonPress(cardScales[index]);
                  setTimeout(() => openActionsModal(item), 100);
                }}
                className="w-9 h-9 rounded-full bg-slate-200 items-center justify-center"
              >
                <Feather name="more-vertical" size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Show member count computed from users */}
          <View className="mt-2 flex-row items-center">
            <Feather name="user" size={14} color={COLORS.textSecondary} />
            <Text className="ml-1 text-xs text-slate-500">{memberCount} members</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // --- Supervisor Options for the Edit Modal ---
  const supervisorOptions = [
    { label: "No Supervisor", value: "" },
    ...users
      .filter((user) => user.role.toLowerCase() === "supervisor")
      .map((user) => ({
        label: `${user.profile.firstName} ${user.profile.lastName} (${user.email})`,
        value: user.id,
      })),
  ];

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
          <Text className="text-2xl font-bold text-slate-800">Department List</Text>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              onPress={() => {
                animateButtonPress(buttonScale);
                setTimeout(() => {
                  setActionsDepartment(null);
                  setDeptName("");
                  setSelectedSupervisorId("");
                  setExpandedSection("edit");
                  openActionsModal({ name: "", id: null });
                }, 100);
              }}
              className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center shadow-sm"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Department List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text className="mt-4 text-slate-500">Loading departments...</Text>
          </View>
        ) : (
          <FlatList
            data={departments}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderDepartment}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-16">
                <Ionicons name="git-branch-outline" size={48} color={COLORS.textLight} />
                <Text className="mt-4 text-slate-500 text-center">No departments found.</Text>
                <Text className="text-slate-400 text-center">Add your first department by tapping the + button.</Text>
              </View>
            }
          />
        )}

        {/* Department Actions Modal with Collapsible Sections */}
        {actionsModalVisible && (
          <View className="absolute inset-0">
            <Animated.View className="absolute inset-0 bg-black/50" style={{ opacity: modalBgAnim }} onTouchEnd={closeActionsModal} />
            <Animated.View
              style={{
                transform: [{ translateY: actionsModalY }],
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: "white",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: height * 0.85,
                paddingBottom: Platform.OS === "ios" ? 30 : 20,
              }}
            >
              <View className="items-center py-3" {...actionsPanResponder.panHandlers}>
                <View className="w-10 h-1 bg-slate-200 rounded-full" />
              </View>
              <View className="flex-row justify-between items-center px-5 pb-4 border-b border-slate-100">
                <Text className="text-lg font-bold text-slate-800">{actionsDepartment?.id ? "Department Actions" : "Add Department"}</Text>
                <TouchableOpacity onPress={closeActionsModal}>
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              <ScrollView className="px-5 py-4">
                {actionsDepartment?.id && <Text className="text-slate-500 mb-6">{actionsDepartment?.name}</Text>}

                {/* Edit Department Section */}
                {actionsDepartment?.id ? (
                  <TouchableOpacity
                    onPress={() => setExpandedSection(expandedSection === "edit" ? null : "edit")}
                    className="flex-row items-center justify-between p-4 mb-3 bg-slate-50 rounded-xl"
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                        <Feather name="edit-2" size={18} color={COLORS.primary} />
                      </View>
                      <Text className="text-slate-800 font-medium">Edit Department</Text>
                    </View>
                    <MaterialIcons
                      name={expandedSection === "edit" ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                      size={24}
                      color={COLORS.textSecondary}
                    />
                  </TouchableOpacity>
                ) : null}

                {/* Edit Department Expanded Content */}
                {(expandedSection === "edit" || !actionsDepartment?.id) && (
                  <View className="bg-white rounded-xl p-4 mb-4 border border-slate-100">
                    <View className="mb-4">
                      <Text className="text-sm font-semibold text-slate-600 mb-2">
                        Department Name <Text className="text-red-500">*</Text>
                      </Text>
                      <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3">
                        <FontAwesome5 name="building" size={18} color="#9ca3af" />
                        <TextInput
                          className="flex-1 ml-2 text-slate-800"
                          value={deptName}
                          onChangeText={setDeptName}
                          placeholder="e.g., Sales, Marketing, IT"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <Text className="text-xs text-slate-500 mt-1">Only alphanumeric characters and spaces are allowed.</Text>
                    </View>

                    <View className="mb-6">
                      <Text className="text-sm font-semibold text-slate-600 mb-2">Assign Supervisor:</Text>
                      <DropDownPicker
                        open={dropdownOpen}
                        value={selectedSupervisorId}
                        items={supervisorOptions}
                        setOpen={setDropdownOpen}
                        setValue={setSelectedSupervisorId}
                        setItems={() => {}}
                        placeholder="Select Supervisor"
                        style={{
                          backgroundColor: "#F8FAFC",
                          borderColor: "#E2E8F0",
                          minHeight: 48,
                          borderWidth: 1,
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
                        zIndex={11000}
                        zIndexInverse={1000}
                        dropDownDirection="BOTTOM"
                        listMode="SCROLLVIEW"
                        scrollViewProps={{ nestedScrollEnabled: true }}
                        ListItemComponent={({ item }) => <Text className="text-base">{item.label}</Text>}
                        Icon={() => <Ionicons name="chevron-down" size={20} color="#374151" />}
                      />
                    </View>

                    {/* Action Button */}
                    <View className="flex-row justify-center mt-4">
                      <TouchableOpacity onPress={handleSaveDepartment} className="bg-orange-500 py-3.5 px-8 rounded-xl">
                        <Text className="text-white font-bold text-base">{actionsDepartment?.id ? "Save Changes" : "Create Department"}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Manage Members Section */}
                {actionsDepartment?.id && (
                  <>
                    <TouchableOpacity
                      onPress={() => setExpandedSection(expandedSection === "members" ? null : "members")}
                      className="flex-row items-center justify-between p-4 mb-3 bg-slate-50 rounded-xl"
                    >
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                          <Feather name="users" size={18} color={COLORS.primary} />
                        </View>
                        <Text className="text-slate-800 font-medium">Manage Members</Text>
                      </View>
                      <MaterialIcons
                        name={expandedSection === "members" ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                        size={24}
                        color={COLORS.textSecondary}
                      />
                    </TouchableOpacity>

                    {/* Manage Members Expanded Content */}
                    {expandedSection === "members" && (
                      <View className="bg-white rounded-xl p-4 mb-4 border border-slate-100">
                        {/* Current Users Section */}
                        <Text className="text-sm font-semibold text-slate-600 mb-2">Current Members:</Text>
                        {currentUsers.length > 0 ? (
                          <View className="bg-slate-50 rounded-lg p-2 mb-6">
                            {currentUsers.map((user) => (
                              <View key={user.id} className="flex-row items-center justify-between py-2 px-2 border-b border-slate-100">
                                <View className="flex-row items-center flex-1">
                                  <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center mr-3">
                                    <Text className="text-orange-700 font-medium">{user.profile.firstName.charAt(0)}</Text>
                                  </View>
                                  <View className="flex-1">
                                    <Text className="text-slate-800 font-medium">
                                      {user.profile.firstName} {user.profile.lastName}
                                    </Text>
                                    <Text className="text-xs text-slate-500">{user.email}</Text>
                                  </View>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveUser(user.id, user.email)} className="p-2">
                                  <Feather name="x-circle" size={18} color={COLORS.error} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        ) : (
                          <View className="bg-slate-50 rounded-lg p-4 items-center mb-6">
                            <Text className="text-slate-500">No members assigned to this department.</Text>
                          </View>
                        )}

                        {/* Add Member Section */}
                        <Text className="text-sm font-semibold text-slate-600 mb-2">Add Member:</Text>
                        <View className="mb-6">
                          <DropDownPicker
                            open={dropdownOpen}
                            value={selectedUserId}
                            items={dropdownItems}
                            setOpen={setDropdownOpen}
                            setValue={setSelectedUserId}
                            setItems={setDropdownItems}
                            placeholder="Select User"
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
                            ListEmptyComponent={() => (
                              <View className="p-3 items-center">
                                <Text className="text-slate-500">No available users to add</Text>
                              </View>
                            )}
                          />
                        </View>

                        {/* Action Button */}
                        <View className="flex-row justify-center mt-4">
                          <TouchableOpacity
                            onPress={handleAssignUser}
                            className="bg-orange-500 py-3.5 px-8 rounded-xl"
                            disabled={!selectedUserId}
                            style={{ opacity: selectedUserId ? 1 : 0.6 }}
                          >
                            <Text className="text-white font-bold text-base">Add Member</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}

                {/* Delete Department Section */}
                {actionsDepartment?.id && (
                  <>
                    <TouchableOpacity
                      onPress={() => setExpandedSection(expandedSection === "delete" ? null : "delete")}
                      className="flex-row items-center justify-between p-4 mb-3 bg-red-50 rounded-xl"
                    >
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                          <Feather name="trash-2" size={18} color={COLORS.error} />
                        </View>
                        <Text className="text-red-600 font-medium">Delete Department</Text>
                      </View>
                      <MaterialIcons name={expandedSection === "delete" ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={24} color={COLORS.error} />
                    </TouchableOpacity>

                    {/* Delete Department Expanded Content */}
                    {expandedSection === "delete" && (
                      <View className="bg-white rounded-xl p-4 mb-4 border border-red-100">
                        <View className="items-center py-4">
                          <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
                            <Feather name="trash-2" size={28} color={COLORS.error} />
                          </View>
                          <Text className="text-xl font-bold text-slate-800 mb-2">Delete Department</Text>
                          <Text className="text-slate-600 text-center mb-2">Are you sure you want to delete this department?</Text>
                          <Text className="text-slate-500 text-center mb-6">{actionsDepartment?.name}</Text>
                          <View className="w-full">
                            {deleting ? (
                              <View className="items-center py-4">
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text className="text-slate-600 mt-3">Deleting department...</Text>
                              </View>
                            ) : (
                              <>
                                <Animated.View style={{ transform: [{ scale: deleteButtonScale }] }}>
                                  <TouchableOpacity
                                    onPress={() => {
                                      animateButtonPress(deleteButtonScale);
                                      setTimeout(() => handleDeleteDepartment(), 100);
                                    }}
                                    className="bg-red-500 py-3.5 rounded-xl w-full items-center mb-3"
                                  >
                                    <Text className="text-white font-bold text-base">Yes, Delete Department</Text>
                                  </TouchableOpacity>
                                </Animated.View>
                                <Animated.View style={{ transform: [{ scale: cancelButtonScale }] }}>
                                  <TouchableOpacity
                                    onPress={() => {
                                      animateButtonPress(cancelButtonScale);
                                      setTimeout(() => setExpandedSection(null), 100);
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
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            </Animated.View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default Departments;
