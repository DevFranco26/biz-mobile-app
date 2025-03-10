import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/userStore";
import useCompanyStore from "../../store/companyStore";
import useDepartmentStore from "../../store/departmentStore";
import { API_BASE_URL } from "../../config/constant";
import "nativewind";

const Profile = () => {
  const { theme } = useThemeStore();
  const { user, clearUser, setUser } = useUserStore();
  const { getCompanyName } = useCompanyStore();
  const { fetchDepartmentById, getDepartmentName } = useDepartmentStore();
  const router = useRouter();
  const isLightTheme = theme === "light";
  const accentColor = "#f97316";

  // Use safe defaults if user is null
  const initialPresence = user && user.presenceStatus ? user.presenceStatus : "offline";
  const [presenceStatus, setPresenceStatus] = useState(initialPresence);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Local state for profile edits (using safe defaults)
  const [editFirstName, setEditFirstName] = useState(user && user.firstName ? user.firstName : "");
  const [editMiddleName, setEditMiddleName] = useState(user && user.middleName ? user.middleName : "");
  const [editLastName, setEditLastName] = useState(user && user.lastName ? user.lastName : "");
  const [editPhone, setEditPhone] = useState(user && user.phone ? user.phone : "");

  // Ref for presence dropdown positioning
  const iconRef = useRef(null);
  const [iconLayout, setIconLayout] = useState({ x: 0, y: 0 });

  // Colors for presence and corresponding icons
  const presenceColors = {
    active: "#10b981",
    away: "#f97316",
    offline: "#64748b",
  };
  const presenceIcon =
    user && user.presenceStatus
      ? {
          active: "checkmark-circle",
          away: "time",
          offline: "close-circle",
        }[user.presenceStatus] || "close-circle"
      : "close-circle";

  // Helper: safely get initials from a name string
  const getInitials = (name = "") => {
    if (!name) return "";
    const nameArray = name.trim().split(" ");
    if (nameArray.length === 0) return "";
    if (nameArray.length === 1) {
      return nameArray[0][0].toUpperCase();
    }
    return (nameArray[0][0] + nameArray[nameArray.length - 1][0]).toUpperCase();
  };

  // Helper: capitalize first letter of an email
  const capitalizeFirst = (email = "") => {
    if (!email) return "";
    const [first, ...rest] = email.split("");
    return `${first.toUpperCase()}${rest.join("")}`;
  };

  // Update presence status on backend
  const updatePresenceStatus = async (newStatus) => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      Alert.alert("Authentication Error", "Please sign in again.");
      router.replace("(auth)/signin");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/presence`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ presenceStatus: newStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.data);
        setPresenceStatus(data.data.presenceStatus);
      } else {
        Alert.alert("Error", data.message || "Failed to update presence status.");
        setPresenceStatus(user && user.presenceStatus ? user.presenceStatus : "offline");
      }
    } catch (error) {
      console.error("Update presence error:", error);
      Alert.alert("Error", "An unexpected error occurred while updating your presence status.");
      setPresenceStatus(user && user.presenceStatus ? user.presenceStatus : "offline");
    }
  };

  const handleStatusSelect = (status) => {
    updatePresenceStatus(status);
    setIsDropdownVisible(false);
  };

  const measureIconPosition = () => {
    if (iconRef.current) {
      iconRef.current.measureInWindow((x, y, width, height) => {
        setIconLayout({ x, y: y + height + 6 });
      });
    }
  };

  useEffect(() => {
    setTimeout(() => {
      measureIconPosition();
    }, 300);
  }, [isDropdownVisible, presenceStatus]);

  // Periodically refresh user data every 60 seconds
  useEffect(() => {
    let intervalId;
    const startInterval = async () => {
      const token = await SecureStore.getItemAsync("token");
      if (!token) return;
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.user) {
              setUser(data.user);
              setPresenceStatus(data.user.presenceStatus || "offline");
              setEditFirstName(data.user.firstName || "");
              setEditMiddleName(data.user.middleName || "");
              setEditLastName(data.user.lastName || "");
              setEditPhone(data.user.phone || "");
            }
          }
        } catch (err) {
          console.error("Error fetching user data periodically:", err);
        }
      }, 60000);
    };
    startInterval();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [setUser]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      setRefreshing(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.user) {
          setUser(data.user);
          setPresenceStatus(data.user.presenceStatus || "offline");
          setEditFirstName(data.user.firstName || "");
          setEditMiddleName(data.user.middleName || "");
          setEditLastName(data.user.lastName || "");
          setEditPhone(data.user.phone || "");
        }
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Updated Logout function for Scenario 2
  // We do NOT delete saved credentials on logout
  const confirmLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: () => logout() },
      ],
      { cancelable: false }
    );
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`${API_BASE_URL}/auth/sign-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        // Only delete token and user data.
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("user");
        // Do not delete savedEmail or savedPassword so biometric sign‑in can use them.
        clearUser();
        router.replace("(auth)/signin");
        Alert.alert("Success", "You have been logged out successfully");
      } else {
        Alert.alert("Error", "Failed to log out, please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "An error occurred while logging out.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handlers for editing profile and changing password (unchanged)
  const handleOpenEditProfile = () => {
    setEditFirstName(user && user.firstName ? user.firstName : "");
    setEditMiddleName(user && user.middleName ? user.middleName : "");
    setEditLastName(user && user.lastName ? user.lastName : "");
    setEditPhone(user && user.phone ? user.phone : "");
    setEditProfileModalVisible(true);
  };

  const handleSaveProfileEdits = async () => {
    setIsSavingProfile(true);
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      Alert.alert("Authentication Error", "Please sign in again.");
      router.replace("(auth)/signin");
      setIsSavingProfile(false);
      return;
    }
    try {
      const payload = {
        firstName: editFirstName,
        middleName: editMiddleName,
        lastName: editLastName,
        phone: editPhone,
      };
      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.data);
        setPresenceStatus(data.data.presenceStatus || "offline");
        setEditProfileModalVisible(false);
        Alert.alert("Success", "Profile updated successfully.");
      } else {
        Alert.alert("Error", data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenChangePassword = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setChangePasswordModalVisible(true);
  };

  const handleChangePassword = async () => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      Alert.alert("Authentication Error", "Please sign in again.");
      router.replace("(auth)/signin");
      return;
    }
    try {
      const payload = { oldPassword, newPassword, confirmPassword };
      const response = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        setChangePasswordModalVisible(false);
        Alert.alert("Success", "Password changed successfully.");
      } else {
        Alert.alert("Error", data.message || "Failed to change password.");
      }
    } catch (error) {
      console.error("Change Password Error:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View className={`rounded-xl p-6 mb-6 flex-row items-center relative ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
          {user && user.profileImage ? (
            <Image source={{ uri: user.profileImage }} className="w-20 h-20 rounded-full" />
          ) : (
            <View className="w-20 h-20 rounded-full justify-center items-center bg-orange-500">
              <Text className="text-white text-2xl font-bold tracking-widest">{getInitials(user ? `${user.firstName} ${user.lastName}` : "")}</Text>
            </View>
          )}
          <View className="absolute top-2.5 right-2.5 flex-row items-center space-x-1">
            <Pressable
              ref={iconRef}
              onPress={() => {
                setIsDropdownVisible(true);
                measureIconPosition();
              }}
              accessibilityLabel="Change Presence Status"
              className="flex-row items-center"
            >
              <Ionicons name={presenceIcon} size={24} color={presenceColors[presenceStatus]} />
              <Text className={`px-1 text-base capitalize ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>{presenceStatus}</Text>
            </Pressable>
          </View>
          <View className="ml-4">
            <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>
              {user ? `${user.firstName} ${user.lastName}` : "Guest"}
            </Text>
            <Text className={`${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>
              {user && user.position ? user.position : getCompanyName(user ? user.companyId : "") || "Unknown"}
            </Text>
          </View>
        </View>

        {/* Contact Information Section */}
        <View className={`rounded-lg p-6 mb-6 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
          <Text className={`text-xl font-semibold mb-4 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Contact Information</Text>
          <View className="flex-row items-center mb-4">
            <Ionicons name="mail-outline" size={20} color={accentColor} className="mr-3" />
            <Text className={`text-base ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
              <Text className="font-semibold">Email:</Text> {user && user.email ? capitalizeFirst(user.email) : "N/A"}
            </Text>
          </View>
          <View className="flex-row items-center mb-4">
            <Ionicons name="id-card-outline" size={20} color={accentColor} className="mr-3" />
            <Text className={`text-base capitalize ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
              <Text className="font-semibold">Company:</Text> {user && user.companyId ? getCompanyName(user.companyId) || "Unknown" : "Unknown"}
            </Text>
          </View>
          <View className="flex-row items-center mb-4">
            <AntDesign name="team" size={20} color={accentColor} className="mr-3" />
            <Text className={`text-base capitalize ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
              <Text className="font-semibold capitalize">Department:</Text>{" "}
              {user && user.departmentId ? getDepartmentName(user.departmentId) || "Unknown" : "Unknown"}
            </Text>
          </View>
          <View className="flex-row items-center mb-4">
            <Ionicons name="briefcase-outline" size={20} color={accentColor} className="mr-3" />
            <Text className={`text-base capitalize ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
              <Text className="font-semibold">Role:</Text> {user ? user.role : "N/A"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={20} color={accentColor} className="mr-3" />
            <Text className={`text-base ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
              <Text className="font-semibold">Phone:</Text> {user && user.phone ? user.phone : "N/A"}
            </Text>
          </View>
        </View>

        {/* Account Settings Section */}
        <View className={`rounded-lg p-6 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
          <Text className={`text-xl font-semibold mb-6 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Account Settings</Text>
          <Pressable className={`p-4 rounded-lg mb-4 ${isLightTheme ? "bg-white" : "bg-slate-700"}`} onPress={handleOpenChangePassword}>
            <Text className={`${isLightTheme ? "text-slate-800" : "text-slate-100"} font-medium text-center`}>Change Password</Text>
          </Pressable>
          <Pressable className={`p-4 rounded-lg mb-4 ${isLightTheme ? "bg-white" : "bg-slate-700"}`} onPress={handleOpenEditProfile}>
            <Text className={`${isLightTheme ? "text-slate-800" : "text-slate-100"} font-medium text-center`}>Edit Profile</Text>
          </Pressable>
          <Pressable className={`p-4 rounded-lg ${isLightTheme ? "bg-white" : "bg-slate-700"}`} onPress={confirmLogout} disabled={isLoggingOut}>
            <Text className={`${isLightTheme ? "text-slate-800" : "text-slate-100"} font-medium text-center`}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Dropdown Modal for Presence Status */}
      <Modal visible={isDropdownVisible} transparent={true} animationType="fade" onRequestClose={() => setIsDropdownVisible(false)}>
        <TouchableOpacity className="flex-1" activeOpacity={1} onPressOut={() => setIsDropdownVisible(false)}>
          <View
            className={`absolute rounded-2xl shadow-md p-2 ${isLightTheme ? "bg-slate-200" : "bg-slate-800"}`}
            style={{ width: 85, top: iconLayout.y, left: iconLayout.x - 7 }}
          >
            <TouchableOpacity onPress={() => handleStatusSelect("active")} className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle" size={20} color={presenceColors.active} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 16, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleStatusSelect("away")} className="flex-row items-center mb-2">
              <Ionicons name="time" size={20} color={presenceColors.away} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 16, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Away</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleStatusSelect("offline")} className="flex-row items-center">
              <Ionicons name="close-circle" size={20} color={presenceColors.offline} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 16, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Offline</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={editProfileModalVisible} transparent={true} animationType="none" onRequestClose={() => setEditProfileModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setEditProfileModalVisible(false)}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? "bg-slate-950/70" : "bg-slate-950/70"}`}>
            <TouchableWithoutFeedback>
              <View className={`w-11/12 p-6 rounded-2xl shadow-md ${isLightTheme ? "bg-white" : "bg-slate-800"}`}>
                <View className="mb-2">
                  <Text className={`text-xl font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Edit Profile</Text>
                </View>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}>
                  <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <Text style={{ fontSize: 14, marginBottom: 4, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>First Name</Text>
                    <TextInput
                      style={{
                        width: "100%",
                        padding: 12,
                        marginBottom: 8,
                        borderRadius: 8,
                        backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
                        color: isLightTheme ? "#1f2937" : "#f1f5f9",
                        fontSize: 14,
                      }}
                      value={editFirstName}
                      onChangeText={setEditFirstName}
                      placeholder="e.g., John"
                      placeholderTextColor={isLightTheme ? "#9ca3af" : "#6b7280"}
                    />
                    <Text style={{ fontSize: 14, marginBottom: 4, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Middle Name</Text>
                    <TextInput
                      style={{
                        width: "100%",
                        padding: 12,
                        marginBottom: 8,
                        borderRadius: 8,
                        backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
                        color: isLightTheme ? "#1f2937" : "#f1f5f9",
                        fontSize: 14,
                      }}
                      value={editMiddleName}
                      onChangeText={setEditMiddleName}
                      placeholder="e.g., A."
                      placeholderTextColor={isLightTheme ? "#9ca3af" : "#6b7280"}
                    />
                    <Text style={{ fontSize: 14, marginBottom: 4, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Last Name</Text>
                    <TextInput
                      style={{
                        width: "100%",
                        padding: 12,
                        marginBottom: 8,
                        borderRadius: 8,
                        backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
                        color: isLightTheme ? "#1f2937" : "#f1f5f9",
                        fontSize: 14,
                      }}
                      value={editLastName}
                      onChangeText={setEditLastName}
                      placeholder="e.g., Doe"
                      placeholderTextColor={isLightTheme ? "#9ca3af" : "#6b7280"}
                    />
                    <Text style={{ fontSize: 14, marginBottom: 4, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Phone</Text>
                    <TextInput
                      style={{
                        width: "100%",
                        padding: 12,
                        marginBottom: 8,
                        borderRadius: 8,
                        backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
                        color: isLightTheme ? "#1f2937" : "#f1f5f9",
                        fontSize: 14,
                      }}
                      value={editPhone}
                      onChangeText={setEditPhone}
                      placeholder="e.g., +1 234 567 890"
                      keyboardType="phone-pad"
                      placeholderTextColor={isLightTheme ? "#9ca3af" : "#6b7280"}
                    />
                    <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 16 }}>
                      <Pressable onPress={() => setEditProfileModalVisible(false)} style={{ padding: 12, marginRight: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleSaveProfileEdits}
                        style={{ backgroundColor: "#f97316", padding: 12, borderRadius: 8, flexDirection: "row", alignItems: "center" }}
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePasswordModalVisible} transparent={true} animationType="none" onRequestClose={() => setChangePasswordModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setChangePasswordModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.7)" }}>
            <TouchableWithoutFeedback>
              <View
                style={{
                  width: "90%",
                  padding: 24,
                  backgroundColor: isLightTheme ? "#FFFFFF" : "#1e293b",
                  borderRadius: 12,
                  shadowColor: "#000",
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                }}
              >
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: "600", color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Change Password</Text>
                </View>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}>
                  <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                    <Text style={{ fontSize: 14, marginBottom: 4, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Old Password</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        borderRadius: 8,
                        backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
                        height: 48,
                      }}
                    >
                      <TextInput
                        style={{ flex: 1, paddingHorizontal: 12, fontSize: 14, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        placeholder="Enter old password"
                        secureTextEntry={!showOldPassword}
                        placeholderTextColor={isLightTheme ? "#9ca3af" : "#6b7280"}
                      />
                      <Pressable onPress={() => setShowOldPassword(!showOldPassword)} style={{ paddingRight: 12 }}>
                        <Ionicons name={showOldPassword ? "eye-off" : "eye"} size={20} color={isLightTheme ? "#374151" : "#9ca3af"} />
                      </Pressable>
                    </View>
                    <Text style={{ fontSize: 14, marginBottom: 4, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>New Password</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        borderRadius: 8,
                        backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
                        height: 48,
                      }}
                    >
                      <TextInput
                        style={{ flex: 1, paddingHorizontal: 12, fontSize: 14, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        secureTextEntry={!showNewPassword}
                        placeholderTextColor={isLightTheme ? "#9ca3af" : "#6b7280"}
                      />
                      <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={{ paddingRight: 12 }}>
                        <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color={isLightTheme ? "#374151" : "#9ca3af"} />
                      </Pressable>
                    </View>
                    <Text style={{ fontSize: 14, marginBottom: 4, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Confirm New Password</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                        borderRadius: 8,
                        backgroundColor: isLightTheme ? "#f1f5f9" : "#1e293b",
                        height: 48,
                      }}
                    >
                      <TextInput
                        style={{ flex: 1, paddingHorizontal: 12, fontSize: 14, color: isLightTheme ? "#1f2937" : "#f1f5f9" }}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={isLightTheme ? "#9ca3af" : "#6b7280"}
                      />
                      <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ paddingRight: 12 }}>
                        <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={isLightTheme ? "#374151" : "#9ca3af"} />
                      </Pressable>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 16 }}>
                      <Pressable onPress={() => setChangePasswordModalVisible(false)} style={{ padding: 12, marginRight: 8 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: isLightTheme ? "#1f2937" : "#f1f5f9" }}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleChangePassword}
                        style={{ backgroundColor: "#f97316", padding: 12, borderRadius: 8, flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>Save</Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {isLoggingOut && (
        <Modal visible={isLoggingOut} transparent={true} animationType="fade" onRequestClose={() => {}}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View style={{ backgroundColor: "#FFFFFF", padding: 16, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator size="large" color="#f97316" style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#1f2937" }}>Logging Out...</Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default Profile;
