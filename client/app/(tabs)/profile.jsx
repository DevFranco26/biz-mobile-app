"use client";

// app/(tabs)/profile.jsx
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import useAuthStore from "../../store/useAuthStore";
import usePresenceStore from "../../store/presenceStore";
import { API_BASE_URL } from "../../config/constant";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

const formatAwayDuration = (lastActiveAt, status) => {
  if (status !== "away" || !lastActiveAt) return "";
  const lastActive = new Date(lastActiveAt);
  const now = new Date();
  const diffMs = now - lastActive;
  const diffMinutes = diffMs / 60000;
  if (diffMinutes < 60) {
    return `Away for ${Math.floor(diffMinutes)} minutes`;
  }
  const diffHours = diffMinutes / 60;
  if (diffHours < 24) {
    return `Away for ${Math.floor(diffHours)} hours`;
  }
  return `Last active at ${lastActive.toLocaleString()}`;
};

const getStatusColor = (status) => {
  switch (status) {
    case "available":
      return "#0d9488";
    case "away":
      return "#f59e0b";
    case "offline":
      return "#94a3b8";
    default:
      return "#94a3b8";
  }
};

const Profile = () => {
  const { token, logout } = useAuthStore();
  const { presenceStatus, lastActiveAt } = usePresenceStore();

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isPassModalVisible, setIsPassModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passUpdating, setPassUpdating] = useState(false);
  const [passError, setPassError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Individual button animations for better control
  const editButtonScale = useRef(new Animated.Value(1)).current;
  const passButtonScale = useRef(new Animated.Value(1)).current;
  const signOutButtonScale = useRef(new Animated.Value(1)).current;
  const saveButtonScale = useRef(new Animated.Value(1)).current;
  const updatePassButtonScale = useRef(new Animated.Value(1)).current;
  const confirmSignOutButtonScale = useRef(new Animated.Value(1)).current;

  // Modal animations
  const editModalAnim = useRef(new Animated.Value(height)).current;
  const passModalAnim = useRef(new Animated.Value(height)).current;
  const signOutModalAnim = useRef(new Animated.Value(height)).current;
  const modalBgAnim = useRef(new Animated.Value(0)).current;

  // Pan responder for edit modal
  const editPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          editModalAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Close the modal if dragged down enough
          closeEditModal();
        } else {
          // Snap back to original position
          Animated.spring(editModalAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Pan responder for password modal
  const passPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          passModalAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Close the modal if dragged down enough
          closePassModal();
        } else {
          // Snap back to original position
          Animated.spring(passModalAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Pan responder for sign out modal
  const signOutPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          signOutModalAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Close the modal if dragged down enough
          closeSignOutModal();
        } else {
          // Snap back to original position
          Animated.spring(signOutModalAnim, {
            toValue: 0,
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

    fetchProfile();
  }, []);

  const openEditModal = () => {
    if (profile && profile.user && profile.profile) {
      setUsername(profile.user.username || "");
      setEmail(profile.user.email || "");
      setFirstName(profile.profile.firstName || "");
      setLastName(profile.profile.lastName || "");
      setPhoneNumber(profile.profile.phoneNumber || "");
    }
    setIsEditModalVisible(true);
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(editModalAnim, {
        toValue: 0,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeEditModal = () => {
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(editModalAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsEditModalVisible(false);
    });
  };

  const openPassModal = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPassError("");
    setIsPassModalVisible(true);
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(passModalAnim, {
        toValue: 0,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closePassModal = () => {
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(passModalAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsPassModalVisible(false);
    });
  };

  const openSignOutModal = () => {
    setIsSignOutModalVisible(true);
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(signOutModalAnim, {
        toValue: 0,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSignOutModal = () => {
    Animated.parallel([
      Animated.timing(modalBgAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(signOutModalAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSignOutModalVisible(false);
    });
  };

  // Enhanced button animation with better bounce
  const animateButtonPress = (buttonRef) => {
    // Create a sequence for more natural bounce
    Animated.sequence([
      // First quickly shrink
      Animated.timing(buttonRef, {
        toValue: 0.92,
        duration: 70,
        useNativeDriver: true,
      }),
      // Then bounce back with spring for natural feel
      Animated.spring(buttonRef, {
        toValue: 1,
        friction: 3, // Lower friction = more bounce
        tension: 40, // Lower tension = softer spring
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const currentToken = token || (await SecureStore.getItemAsync("token"));
      if (!currentToken) {
        Alert.alert("Session expired", "Please sign in again.");
        router.replace("(auth)/signin");
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/account/profile`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.data);
      } else {
        Alert.alert("Error", data.message || "Failed to fetch profile.");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "An unexpected error occurred while fetching your profile.");
    } finally {
      setLoading(false);
    }
  };

  const updatePresenceToOffline = async () => {
    const currentToken = token || (await SecureStore.getItemAsync("token"));
    if (!currentToken) return;
    try {
      await fetch(`${API_BASE_URL}/api/presence`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          presenceStatus: "offline",
          lastActiveAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error("Error updating presence to offline:", error);
    }
  };

  const handleUpdateProfile = async () => {
    animateButtonPress(saveButtonScale);
    setUpdating(true);
    setUpdateError("");
    try {
      const currentToken = token || (await SecureStore.getItemAsync("token"));
      if (!currentToken) {
        Alert.alert("Session expired", "Please sign in again.");
        router.replace("(auth)/signin");
        return;
      }
      const payload = { username, email, firstName, lastName, phoneNumber };
      const response = await fetch(`${API_BASE_URL}/api/account/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Profile updated successfully.", [
          {
            text: "OK",
            onPress: () => {
              closeEditModal();
              fetchProfile();
            },
          },
        ]);
      } else {
        setUpdateError(data.message || "Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateError("An unexpected error occurred while updating profile.");
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    animateButtonPress(updatePassButtonScale);
    setPassUpdating(true);
    setPassError("");
    try {
      const currentToken = token || (await SecureStore.getItemAsync("token"));
      if (!currentToken) {
        Alert.alert("Session expired", "Please sign in again.");
        router.replace("(auth)/signin");
        return;
      }
      const payload = { oldPassword, newPassword, confirmPassword };
      const response = await fetch(`${API_BASE_URL}/api/account/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Password changed successfully.", [
          {
            text: "OK",
            onPress: async () => {
              await SecureStore.deleteItemAsync("token");
              await logout();
              router.replace("(auth)/signin");
            },
          },
        ]);
      } else {
        setPassError(data.message || "Failed to change password.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPassError("An unexpected error occurred while changing password.");
    } finally {
      setPassUpdating(false);
    }
  };

  const handleSignOut = async () => {
    animateButtonPress(confirmSignOutButtonScale);
    setSigningOut(true);
    try {
      await updatePresenceToOffline();
      const currentToken = token || (await SecureStore.getItemAsync("token"));
      const response = await fetch(`${API_BASE_URL}/api/account/sign-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (response.ok) {
        await logout();
        router.replace("(auth)/signin");
      } else {
        const data = await response.json();
        Alert.alert("Error", data.message || "Failed to sign out.");
      }
    } catch (error) {
      console.error("Sign-out error:", error);
      Alert.alert("Error", "An error occurred during sign out.");
    } finally {
      setSigningOut(false);
      closeSignOutModal();
    }
  };

  const getInitials = () => {
    if (!profile || !profile.profile) return "?";
    const first = profile.profile.firstName ? profile.profile.firstName.charAt(0) : "";
    const last = profile.profile.lastName ? profile.profile.lastName.charAt(0) : "";
    return (first + last).toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
          <Text className="mt-3 text-slate-600 font-medium">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 py-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-slate-800">My Profile</Text>
              <TouchableOpacity
                onPress={fetchProfile}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 items-center justify-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Feather name="refresh-cw" size={18} color="#f97316" />
              </TouchableOpacity>
            </View>

            {profile && profile.user && profile.profile ? (
              <>
                {/* Profile Card */}
                <View
                  className="bg-white rounded-2xl border border-slate-200 p-5 mb-6"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4.65,
                    elevation: 6,
                  }}
                >
                  <View className="flex-row items-center mb-4">
                    <View className="w-[70px] h-[70px] rounded-full bg-orange-500 items-center justify-center mr-4">
                      <Text className="text-white text-2xl font-bold">{getInitials()}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-bold text-slate-800">
                        {profile.profile.firstName} {profile.profile.lastName}
                      </Text>
                      <Text className="text-slate-600 text-base">@{profile.user.username}</Text>

                      <View className="flex-row items-center mt-2">
                        <View
                          className={`px-3 py-1 rounded-full flex-row items-center ${
                            presenceStatus === "available" ? "bg-teal-500/20" : "bg-orange-500/20"
                          }`}
                        >
                          <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: getStatusColor(presenceStatus) }} />
                          <Text className={`${presenceStatus === "available" ? "text-teal-500" : "text-orange-500"} text-xs font-bold`}>
                            {presenceStatus ? presenceStatus.toUpperCase() : "Offline"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {presenceStatus === "away" && lastActiveAt && (
                    <Text className="text-slate-600 text-sm italic mb-3">{formatAwayDuration(lastActiveAt, presenceStatus)}</Text>
                  )}

                  <View className="h-px bg-slate-100 my-4" />

                  {/* Contact Info */}
                  <View>
                    <View className="flex-row items-center mb-4">
                      <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                        <MaterialCommunityIcons name="email-outline" size={20} color="#f97316" />
                      </View>
                      <View>
                        <Text className="text-slate-600 text-xs font-medium mb-1">Email</Text>
                        <Text className="text-slate-800 font-medium">{profile.user.email}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mb-4">
                      <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                        <MaterialCommunityIcons name="phone-outline" size={20} color="#f97316" />
                      </View>
                      <View>
                        <Text className="text-slate-600 text-xs font-medium mb-1">Phone</Text>
                        <Text className="text-slate-800 font-medium">{profile.profile.phoneNumber || "Not provided"}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                        <FontAwesome5 name="building" size={18} color="#f97316" />
                      </View>
                      <View>
                        <Text className="text-slate-600 text-xs font-medium mb-1">Company</Text>
                        <Text className="text-slate-800 font-medium">
                          {profile.company && profile.company.name ? profile.company.name : "Not assigned"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="mt-4">
                  <Animated.View style={{ transform: [{ scale: editButtonScale }] }}>
                    <TouchableOpacity
                      onPress={() => {
                        animateButtonPress(editButtonScale);
                        setTimeout(openEditModal, 100);
                      }}
                      className="flex-row items-center bg-white border border-slate-200 rounded-xl p-4 mb-4"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                      activeOpacity={0.8}
                    >
                      <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                        <Feather name="edit-2" size={18} color="#f97316" />
                      </View>
                      <Text className="text-slate-800 font-bold text-base flex-1">Edit Profile</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={{ transform: [{ scale: passButtonScale }] }}>
                    <TouchableOpacity
                      onPress={() => {
                        animateButtonPress(passButtonScale);
                        setTimeout(openPassModal, 100);
                      }}
                      className="flex-row items-center bg-white border border-slate-200 rounded-xl p-4 mb-4"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                      activeOpacity={0.8}
                    >
                      <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                        <Feather name="lock" size={18} color="#f97316" />
                      </View>
                      <Text className="text-slate-800 font-bold text-base flex-1">Change Password</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={{ transform: [{ scale: signOutButtonScale }] }}>
                    <TouchableOpacity
                      onPress={() => {
                        animateButtonPress(signOutButtonScale);
                        setTimeout(openSignOutModal, 100);
                      }}
                      className="flex-row items-center bg-white border border-slate-200 rounded-xl p-4"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                      activeOpacity={0.8}
                    >
                      <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                        <Feather name="log-out" size={18} color="#f97316" />
                      </View>
                      <Text className="text-slate-800 font-bold text-base flex-1">Sign Out</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </>
            ) : (
              <View className="items-center justify-center py-10">
                <Feather name="user-x" size={60} color="#d1d5db" />
                <Text className="text-slate-800 text-lg font-bold mt-4">No profile data available</Text>
                <Text className="text-slate-600 text-center mt-2">We couldn't load your profile information</Text>
                <TouchableOpacity onPress={fetchProfile} className="bg-orange-500 py-3 px-6 rounded-xl mt-6" activeOpacity={0.8}>
                  <Text className="text-white font-bold">Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Edit Profile Modal */}
      {isEditModalVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0, 0, 0, 0.5)", opacity: modalBgAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeEditModal} />
          </Animated.View>

          <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{
              transform: [{ translateY: editModalAnim }],
              maxHeight: "80%",
              paddingBottom: Platform.OS === "ios" ? 30 : 20,
            }}
          >
            <View className="items-center py-3" {...editPanResponder.panHandlers}>
              <View className="w-10 h-1 bg-slate-200 rounded-full" />
            </View>

            <View className="flex-row justify-between items-center px-5 pb-4 border-b border-slate-100">
              <Text className="text-lg font-bold text-slate-800">Edit Profile</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-4">
              {updateError ? (
                <View className="p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
                  <Text className="text-red-600 font-medium">{updateError}</Text>
                </View>
              ) : null}

              <Text className="text-sm font-semibold text-slate-600 mb-2">Username</Text>
              <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3 mb-4">
                <Feather name="user" size={18} color="#9ca3af" className="mr-2" />
                <TextInput className="flex-1 text-slate-800" value={username} onChangeText={setUsername} placeholderTextColor="#9ca3af" />
              </View>

              <Text className="text-sm font-semibold text-slate-600 mb-2">Email</Text>
              <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3 mb-4">
                <MaterialCommunityIcons name="email-outline" size={18} color="#9ca3af" className="mr-2" />
                <TextInput
                  className="flex-1 text-slate-800"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <Text className="text-sm font-semibold text-slate-600 mb-2">First Name</Text>
              <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3 mb-4">
                <Feather name="user" size={18} color="#9ca3af" className="mr-2" />
                <TextInput className="flex-1 text-slate-800" value={firstName} onChangeText={setFirstName} placeholderTextColor="#9ca3af" />
              </View>

              <Text className="text-sm font-semibold text-slate-600 mb-2">Last Name</Text>
              <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3 mb-4">
                <Feather name="user" size={18} color="#9ca3af" className="mr-2" />
                <TextInput className="flex-1 text-slate-800" value={lastName} onChangeText={setLastName} placeholderTextColor="#9ca3af" />
              </View>

              <Text className="text-sm font-semibold text-slate-600 mb-2">Phone Number</Text>
              <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3 mb-4">
                <MaterialCommunityIcons name="phone-outline" size={18} color="#9ca3af" className="mr-2" />
                <TextInput
                  className="flex-1 text-slate-800"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="flex-row justify-end mt-4">
                {updating ? (
                  <ActivityIndicator size="small" color="#f97316" />
                ) : (
                  <View className="flex-row">
                    <TouchableOpacity onPress={closeEditModal} className="py-3 px-5 rounded-xl border border-slate-200 mr-3" activeOpacity={0.8}>
                      <Text className="text-slate-800 font-semibold">Cancel</Text>
                    </TouchableOpacity>
                    <Animated.View style={{ transform: [{ scale: saveButtonScale }] }}>
                      <TouchableOpacity onPress={handleUpdateProfile} className="bg-orange-500 py-3 px-5 rounded-xl" activeOpacity={0.8}>
                        <Text className="text-white font-semibold">Save Changes</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* Change Password Modal */}
      {isPassModalVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0, 0, 0, 0.5)", opacity: modalBgAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closePassModal} />
          </Animated.View>

          <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{
              transform: [{ translateY: passModalAnim }],
              maxHeight: "80%",
              paddingBottom: Platform.OS === "ios" ? 30 : 20,
            }}
          >
            <View className="items-center py-3" {...passPanResponder.panHandlers}>
              <View className="w-10 h-1 bg-slate-200 rounded-full" />
            </View>

            <View className="flex-row justify-between items-center px-5 pb-4 border-b border-slate-100">
              <Text className="text-lg font-bold text-slate-800">Change Password</Text>
              <TouchableOpacity onPress={closePassModal}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-4">
              {passError ? (
                <View className="p-4 bg-red-50 border border-red-200 rounded-xl mb-5">
                  <Text className="text-red-600 font-medium">{passError}</Text>
                </View>
              ) : null}

              <Text className="text-sm font-semibold text-slate-600 mb-2">Current Password</Text>
              <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3 mb-4">
                <MaterialCommunityIcons name="lock-outline" size={18} color="#9ca3af" className="mr-2" />
                <TextInput
                  secureTextEntry
                  className="flex-1 text-slate-800"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <Text className="text-sm font-semibold text-slate-600 mb-2">New Password</Text>
              <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3 mb-4">
                <MaterialCommunityIcons name="lock-outline" size={18} color="#9ca3af" className="mr-2" />
                <TextInput
                  secureTextEntry
                  className="flex-1 text-slate-800"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <Text className="text-sm font-semibold text-slate-600 mb-2">Confirm New Password</Text>
              <View className="flex-row items-center border border-slate-200 bg-white rounded-xl px-4 py-3 mb-4">
                <MaterialCommunityIcons name="lock-outline" size={18} color="#9ca3af" className="mr-2" />
                <TextInput
                  secureTextEntry
                  className="flex-1 text-slate-800"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View className="flex-row justify-end mt-4">
                {passUpdating ? (
                  <ActivityIndicator size="small" color="#f97316" />
                ) : (
                  <View className="flex-row">
                    <TouchableOpacity onPress={closePassModal} className="py-3 px-5 rounded-xl border border-slate-200 mr-3" activeOpacity={0.8}>
                      <Text className="text-slate-800 font-semibold">Cancel</Text>
                    </TouchableOpacity>
                    <Animated.View style={{ transform: [{ scale: updatePassButtonScale }] }}>
                      <TouchableOpacity onPress={handleChangePassword} className="bg-orange-500 py-3 px-5 rounded-xl" activeOpacity={0.8}>
                        <Text className="text-white font-semibold">Update Password</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* Sign Out Confirmation Modal */}
      {isSignOutModalVisible && (
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0, 0, 0, 0.5)", opacity: modalBgAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeSignOutModal} />
          </Animated.View>

          <Animated.View
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl"
            style={{
              transform: [{ translateY: signOutModalAnim }],
              paddingBottom: Platform.OS === "ios" ? 30 : 20,
            }}
          >
            <View className="items-center py-3" {...signOutPanResponder.panHandlers}>
              <View className="w-10 h-1 bg-slate-200 rounded-full" />
            </View>

            <View className="px-5 py-4 items-center">
              <View className="w-16 h-16 rounded-full bg-orange-50 items-center justify-center mb-4">
                <Feather name="log-out" size={28} color="#f97316" />
              </View>

              <Text className="text-xl font-bold text-slate-800 mb-2">Sign Out</Text>
              <Text className="text-slate-600 text-center mb-6">Are you sure you want to sign out of your account?</Text>

              <View className="w-full">
                {signingOut ? (
                  <View className="items-center py-4">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-slate-600 mt-3">Signing out...</Text>
                  </View>
                ) : (
                  <>
                    <Animated.View style={{ transform: [{ scale: confirmSignOutButtonScale }] }}>
                      <TouchableOpacity onPress={handleSignOut} className="bg-orange-500 py-3.5 rounded-xl w-full items-center mb-3" activeOpacity={0.8}>
                        <Text className="text-white font-bold text-base">Yes, Sign Out</Text>
                      </TouchableOpacity>
                    </Animated.View>

                    <TouchableOpacity
                      onPress={closeSignOutModal}
                      className="py-3.5 rounded-xl w-full items-center border border-slate-200"
                      activeOpacity={0.8}
                    >
                      <Text className="text-slate-800 font-bold text-base">Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default Profile;
