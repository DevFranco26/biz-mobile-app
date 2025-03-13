"use client";

import { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Linking,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, WEBSITE_URL } from "../../../config/constant";
import { MaterialIcons, Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import io from "socket.io-client";

const { height } = Dimensions.get("window");

// Define consistent colors to ensure they look the same on both platforms
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
};

const Settings = () => {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation for slide-up modal
  const modalY = useRef(new Animated.Value(height)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Animation for option press
  const [pressedOption, setPressedOption] = useState(null);

  // Animation for page load
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Button animations
  const primaryButtonScale = useRef(new Animated.Value(1)).current;
  const secondaryButtonScale = useRef(new Animated.Value(1)).current;
  const refreshButtonScale = useRef(new Animated.Value(1)).current;
  const retryButtonScale = useRef(new Animated.Value(1)).current;

  // Individual option button animations
  const optionScales = useRef({}).current;

  // Pan responder for draggable modal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          modalY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // If dragged down more than 100, close the modal
          closeModal();
        } else {
          // Otherwise snap back to original position
          Animated.spring(modalY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 8,
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

  const openModal = () => {
    // Reset position before animation
    modalY.setValue(height);
    setShowLockedModal(true);

    // Animate modal sliding up
    Animated.parallel([
      Animated.timing(modalY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalY, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLockedModal(false);
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
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Session expired", "Please sign in again.");
        router.replace("(auth)/signin");
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/account/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setProfile(data.data);
      } else {
        setError(data.message || "Failed to fetch profile.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    animateButtonPress(refreshButtonScale);
    setRefreshing(true);
    fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Socket.IO integration: listen for real-time subscription updates.
  useEffect(() => {
    const socket = io(API_BASE_URL, { transports: ["websocket"] });
    socket.on("connect", () => {
      console.log("Connected to socket server:", socket.id);
    });
    socket.on("subscriptionUpdated", (data) => {
      console.log("Subscription update event received:", data);
      fetchProfile();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // Extract needed values from the profile.
  const userName = profile?.profile?.firstName || "User";
  const userRole = (profile?.user?.role || "user").toLowerCase();
  const companyName = profile?.company?.name || "Unknown Company";
  const subscriptionPlan = profile?.subscription?.plan?.name || "No Subscription";
  const planLower = subscriptionPlan.toLowerCase();

  // Improved option configuration with better grouping
  const optionsConfig = [
    // Admin Management Group
    {
      title: "Companies",
      route: "./superadmin-companies",
      roles: ["superadmin"],
      icon: "business",
      iconType: "ionicons",
      group: "Administration",
    },
    {
      title: "Subscribers",
      route: "./superadmin-subscribers",
      roles: ["superadmin"],
      icon: "people",
      iconType: "ionicons",
      group: "Administration",
    },
    {
      title: "Subscription Plans",
      route: "./superadmin-subscription-plans",
      roles: ["superadmin"],
      icon: "card",
      iconType: "ionicons",
      group: "Administration",
    },

    // Team Management Group
    {
      title: "Departments",
      route: "./manage-departments",
      roles: ["admin", "superadmin"],
      icon: "git-branch",
      iconType: "feather",
      group: "Team Management",
    },
    {
      title: "Employees",
      route: "./manage-employees",
      roles: ["supervisor", "admin", "superadmin"],
      icon: "users",
      iconType: "feather",
      group: "Team Management",
    },

    // Schedule Management Group
    {
      title: "Shift Schedules",
      route: "./manage-schedules",
      roles: ["admin", "superadmin"],
      icon: "calendar",
      iconType: "feather",
      group: "Schedule Management",
    },
    {
      title: "Punch Locations",
      route: "./manage-locations",
      roles: ["admin", "superadmin"],
      lockSubs: ["basic", "free"],
      icon: "map-pin",
      iconType: "feather",
      group: "Schedule Management",
    },
    {
      title: "Leave Requests",
      route: "./manage-leaves",
      roles: ["admin", "superadmin"],
      icon: "calendar-outline",
      iconType: "ionicons",
      group: "Schedule Management",
    },

    // Payroll Group
    {
      title: "Payroll Settings",
      route: "./payroll-payroll-settings",
      roles: ["admin", "superadmin"],
      icon: "settings",
      iconType: "feather",
      group: "Payroll",
    },
    {
      title: "Payrate Settings",
      route: "./payroll-payrate-settings",
      roles: ["admin", "superadmin"],
      icon: "dollar-sign",
      iconType: "feather",
      group: "Payroll",
    },
    {
      title: "Payroll Records",
      route: "./payroll-payroll-records",
      roles: ["admin", "superadmin"],
      icon: "file-text",
      iconType: "feather",
      group: "Payroll",
    },
    {
      title: "Generate Payroll",
      route: "./payroll-generate-payroll",
      roles: ["admin", "superadmin"],
      icon: "calculator",
      iconType: "ionicons", // Changed from "feather" to "ionicons"
      group: "Payroll",
    },
  ];

  // Filter options based on role.
  let filteredOptions = [];
  if (userRole === "employee") {
    filteredOptions = []; // Employees see no administrative options.
  } else if (userRole === "supervisor") {
    filteredOptions = optionsConfig.filter((option) => option.roles.includes("supervisor"));
  } else if (userRole === "admin") {
    filteredOptions = optionsConfig.filter((option) => option.roles.includes("admin"));
  } else if (userRole === "superadmin") {
    filteredOptions = optionsConfig;
  }

  // Determine if an option should be locked based on subscription.
  const isOptionLocked = (option) => {
    if (planLower === "free") return true;
    if (option.lockSubs && option.lockSubs.includes(planLower)) return true;
    return false;
  };

  // Group options by their defined group
  const groupOptions = (options) => {
    const grouped = {};

    options.forEach((option) => {
      const group = option.group || "Other";
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(option);
    });

    return grouped;
  };

  const groupedOptions = groupOptions(filteredOptions);

  // Get the appropriate icon component based on type
  const getIconComponent = (icon, iconType) => {
    switch (iconType) {
      case "feather":
        return <Feather name={icon} size={18} color={COLORS.primary} />;
      case "fontawesome5":
        return <FontAwesome5 name={icon} size={18} color={COLORS.primary} />;
      case "ionicons":
      default:
        return <Ionicons name={icon} size={18} color={COLORS.primary} />;
    }
  };

  // OptionRow component with enhanced animation
  const OptionRow = ({ option, index }) => {
    const { title, route, icon, iconType } = option;
    const locked = isOptionLocked(option) || false;

    // Create animation value for this option if it doesn't exist
    if (!optionScales[index]) {
      optionScales[index] = new Animated.Value(1);
    }

    const handlePress = () => {
      // Animate the button press
      animateButtonPress(optionScales[index]);

      // Navigate or show locked modal after animation
      setTimeout(() => {
        if (locked) {
          openModal();
        } else {
          router.push(route);
        }
      }, 100);
    };

    return (
      <Animated.View style={{ transform: [{ scale: optionScales[index] }] }}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.8}
          style={[
            styles.optionButton,
            {
              opacity: locked ? 0.7 : 1,
            },
          ]}
        >
          <View style={styles.iconContainer}>{getIconComponent(icon, iconType)}</View>
          <Text style={styles.optionText}>{title}</Text>
          {locked ? (
            <View style={styles.lockIconContainer}>
              <MaterialIcons name="lock" size={16} color={COLORS.primary} />
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={{
            flex: 1,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Settings</Text>

              <Animated.View style={{ transform: [{ scale: refreshButtonScale }] }}>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                  <Feather name="refresh-cw" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileInfo}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
                </View>

                <View>
                  <Text style={styles.userName}>Hi, {userName}</Text>
                  <View style={styles.userMetaRow}>
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Text>
                    </View>
                    <Text style={styles.companyText}>{companyName}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.subscriptionBanner}>
                <Ionicons name="star" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.subscriptionText}>
                  Subscription: <Text style={styles.subscriptionPlan}>{subscriptionPlan}</Text>
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL(WEBSITE_URL)}>
                  <Text style={styles.websiteLink}>Website</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
              <Animated.View style={{ transform: [{ scale: retryButtonScale }] }}>
                <TouchableOpacity
                  onPress={() => {
                    animateButtonPress(retryButtonScale);
                    setTimeout(fetchProfile, 100);
                  }}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          ) : filteredOptions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image source={require("../../../assets/images/icon.png")} style={styles.emptyIcon} resizeMode="contain" />
              <Text style={styles.emptyTitle}>No Administrative Access</Text>
              <Text style={styles.emptyDescription}>
                {userRole === "employee"
                  ? "You don't have access to administrative features."
                  : userRole === "supervisor"
                  ? "Only employee management is available for supervisors."
                  : "No options available for your role."}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
              {/* Render each group of options */}
              {Object.keys(groupedOptions).map((groupName, groupIndex) => (
                <View key={groupIndex} style={styles.optionGroup}>
                  <Text style={styles.groupTitle}>{groupName}</Text>
                  {groupedOptions[groupName].map((option, index) => (
                    <OptionRow key={index} option={option} index={`${groupName}-${index}`} />
                  ))}
                </View>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </SafeAreaView>

      {/* Slide-up Modal for Locked Features */}
      <Modal transparent visible={showLockedModal} onRequestClose={closeModal} animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]} onTouchEnd={closeModal}>
          <Animated.View style={[styles.modalContainer, { transform: [{ translateY: modalY }] }]} {...panResponder.panHandlers}>
            {/* Drag handle */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

            <View style={styles.modalContent}>
              <View style={styles.lockIconCircle}>
                <Ionicons name="lock-closed" size={32} color={COLORS.primary} />
              </View>

              <Text style={styles.modalTitle}>Feature Locked</Text>

              <Text style={styles.modalDescription}>This feature is not available for {subscriptionPlan} plan</Text>
            </View>

            <Animated.View style={{ transform: [{ scale: primaryButtonScale }] }}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  animateButtonPress(primaryButtonScale);
                  setTimeout(() => {
                    closeModal();
                    Linking.openURL(WEBSITE_URL);
                  }, 100);
                }}
              >
                <Text style={styles.primaryButtonText}>Visit Website</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ transform: [{ scale: secondaryButtonScale }] }}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  animateButtonPress(secondaryButtonScale);
                  setTimeout(closeModal, 100);
                }}
              >
                <Text style={styles.secondaryButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
};

// Explicit styles to ensure consistency across platforms
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  userMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: "500",
  },
  companyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  subscriptionBanner: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    flexDirection: "row",
    alignItems: "center",
  },
  subscriptionText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    flex: 1,
  },
  subscriptionPlan: {
    fontWeight: "bold",
  },
  websiteLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
    color: COLORS.text,
  },
  emptyDescription: {
    textAlign: "center",
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  optionGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  lockIconContainer: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
  },
  dragHandleContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  modalContent: {
    alignItems: "center",
    marginBottom: 24,
  },
  lockIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.text,
  },
  modalDescription: {
    textAlign: "center",
    color: COLORS.textSecondary,
    paddingHorizontal: 16,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryButtonText: {
    color: COLORS.white,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.text,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default Settings;
