// File: app/(auth)/signin.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Linking,
  Image,
  Animated,
  StatusBar,
  SafeAreaView,
  Switch,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import * as SecureStore from "expo-secure-store";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/userStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL, VERSION, WEBSITE_URL } from "../../config/constant";
import * as LocalAuthentication from "expo-local-authentication";
import { useFocusEffect } from "@react-navigation/native";

// Validation schema with more helpful error messages
const SigninSchema = Yup.object().shape({
  email: Yup.string().email("Please enter a valid email address").required("Email address is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

export default function Login() {
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();
  const isLightTheme = theme === "light";
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [savePassword, setSavePassword] = useState(false);

  // Animation values for the main content
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // Animation value for the logo section
  const logoOpacity = useRef(new Animated.Value(1)).current;

  // Load saved credentials (if the user has opted in) to prefill the form
  const [savedCredentials, setSavedCredentials] = useState({ email: "", password: "" });
  useEffect(() => {
    const loadSavedCredentials = async () => {
      const savedEmail = await SecureStore.getItemAsync("savedEmail");
      const savedPassword = await SecureStore.getItemAsync("savedPassword");
      if (savedEmail && savedPassword) {
        setSavedCredentials({ email: savedEmail, password: savedPassword });
      }
    };
    loadSavedCredentials();
  }, []);

  // Check if biometric authentication is available
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const hasBiometricHardware = await LocalAuthentication.hasHardwareAsync();
        const isBiometricEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasBiometricHardware && isBiometricEnrolled);
      } catch (error) {
        console.log("Biometric check error:", error);
        setBiometricAvailable(false);
      }
    };

    checkBiometric();

    // Keyboard listeners with animations for the logo only
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });

    // Entrance animation for the whole form
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Reset form when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setIsLoading(false);
      };
    }, [])
  );

  const handleBiometricAuth = async (handleSubmit, values) => {
    try {
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to sign in",
        fallbackEnabled: true,
        fallbackTitle: "Use Password",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (biometricResult.success) {
        // Use saved credentials if available; otherwise, use the current form values.
        const credentials = savedCredentials.email && savedCredentials.password ? savedCredentials : values;
        handleSignin(credentials);
      }
    } catch (error) {
      Alert.alert("Authentication Error", "There was a problem with biometric authentication. Please try again or use your password.", [{ text: "OK" }]);
    }
  };

  const handleSignin = async (values) => {
    setIsLoading(true);
    const { email, password } = values;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token && data.user) {
          // Success animation
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0.5,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();

          await SecureStore.setItemAsync("token", data.token);
          await SecureStore.setItemAsync("user", JSON.stringify(data.user));

          // Save credentials if the switch is toggled
          if (savePassword) {
            await SecureStore.setItemAsync("savedEmail", email);
            await SecureStore.setItemAsync("savedPassword", password);
          }

          setUser(data.user);
          router.replace("(tabs)/profile");
        } else {
          Alert.alert("Sign In Error", "Missing authentication data. Please try again.", [{ text: "OK" }]);
        }
      } else {
        // Error animation and feedback
        Animated.sequence([
          Animated.timing(slideAnim, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        Alert.alert("Sign In Failed", data.message || "Invalid email or password. Please check your credentials and try again.", [{ text: "OK" }]);
      }
    } catch (error) {
      Alert.alert("Connection Error", "Unable to connect to the server. Please check your internet connection and try again.", [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenWebsite = () => {
    Linking.openURL(WEBSITE_URL);
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} backgroundColor={isLightTheme ? "#ffffff" : "#0f172a"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className={`flex-1 justify-center items-center px-6 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
            <View className="w-full max-w-md">
              {/* Logo Section */}
              <Animated.View className={`items-center ${keyboardVisible ? "h-0 mb-0 overflow-hidden" : "h-auto mb-10"}`} style={{ opacity: logoOpacity }}>
                <View className="flex-row items-center justify-center">
                  <Image source={require("../../assets/images/icon.png")} className="w-12 h-12 mb-3" resizeMode="contain" />
                  <Text className="text-5xl font-extrabold text-orange-500">BizBuddy</Text>
                </View>
                <Text className={`text-sm mt-2 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>{VERSION}</Text>
                <Text className={`text-sm mt-1 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>Your business management companion</Text>
              </Animated.View>

              <Formik
                initialValues={{ email: savedCredentials.email || "", password: savedCredentials.password || "" }}
                validationSchema={SigninSchema}
                onSubmit={handleSignin}
              >
                {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => (
                  <Animated.View className="w-full" style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {/* Email Field */}
                    <View className="mb-5 w-full">
                      <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Email</Text>
                      <View
                        className={`flex-row items-center rounded-xl overflow-hidden border h-[52px] ${
                          touched.email && errors.email ? "border-red-500" : isLightTheme ? "border-slate-100" : "border-slate-800"
                        }`}
                      >
                        <View className={`p-3 h-full justify-center ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                          <Ionicons name="mail-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                        </View>
                        <TextInput
                          className={`flex-1 p-3.5 h-full ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          autoCorrect={false}
                          value={values.email}
                          onChangeText={handleChange("email")}
                          onBlur={handleBlur("email")}
                          placeholder="Enter your email"
                          placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                          accessibilityLabel="Email input field"
                        />
                      </View>
                      {touched.email && errors.email && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.email}</Text>}
                    </View>

                    {/* Password Field */}
                    <View className="mb-6 w-full">
                      <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Password</Text>
                      <View
                        className={`flex-row items-center rounded-xl overflow-hidden border h-[52px] ${
                          touched.password && errors.password ? "border-red-500" : isLightTheme ? "border-slate-100" : "border-slate-800"
                        }`}
                      >
                        <View className={`p-3 h-full justify-center ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                          <Ionicons name="lock-closed-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                        </View>
                        <TextInput
                          className={`flex-1 p-3.5 h-full ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                          secureTextEntry={!passwordVisible}
                          value={values.password}
                          onChangeText={handleChange("password")}
                          onBlur={handleBlur("password")}
                          placeholder="Enter your password"
                          placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                          accessibilityLabel="Password input field"
                        />
                        <Pressable
                          onPress={() => setPasswordVisible(!passwordVisible)}
                          className={`h-full px-4 py-4 ${isLightTheme ? "bg-slate-50" : "bg-slate-800"}`}
                          accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                          accessibilityRole="button"
                        >
                          <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                        </Pressable>
                      </View>
                      {touched.password && errors.password && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.password}</Text>}
                    </View>

                    {/* Save Password Switch */}
                    <View className="flex-row items-center justify-between mb-6">
                      <Text className={`text-base ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Save Password</Text>
                      <Switch
                        trackColor={{
                          false: isLightTheme ? "#cbd5e1" : "#475569",
                          true: "#f97316",
                        }}
                        thumbColor={isLightTheme ? "#ffffff" : "#e2e8f0"}
                        ios_backgroundColor={isLightTheme ? "#cbd5e1" : "#475569"}
                        onValueChange={setSavePassword}
                        value={savePassword}
                        accessibilityLabel="Save password toggle"
                        accessibilityRole="switch"
                      />
                    </View>

                    {/* Sign In Button */}
                    <Pressable
                      className={`w-full py-4 rounded-xl flex-row justify-center items-center ${isLoading ? "bg-orange-400/70" : "bg-orange-500"}`}
                      onPress={handleSubmit}
                      disabled={isLoading}
                      accessibilityLabel="Sign in button"
                      accessibilityRole="button"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 6,
                      }}
                    >
                      {isLoading ? <ActivityIndicator color="#ffffff" size="small" /> : <Ionicons name="log-in-outline" size={20} color="#ffffff" />}
                      <Text className="text-white ml-2 font-semibold text-base">Sign In</Text>
                    </Pressable>

                    {/* Biometric Authentication Button */}
                    {biometricAvailable && (
                      <Pressable
                        className={`w-full py-4 mt-3 rounded-xl flex-row justify-center items-center border ${
                          isLightTheme ? "border-slate-200" : "border-slate-700"
                        }`}
                        onPress={() => handleBiometricAuth(handleSubmit, values)}
                        disabled={isLoading}
                        accessibilityLabel="Sign in with biometrics"
                        accessibilityRole="button"
                      >
                        <Ionicons name="finger-print-outline" size={20} color={isLightTheme ? "#1e293b" : "#e2e8f0"} />
                        <Text className={`ml-2 font-medium text-base ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>Sign In with Biometrics</Text>
                      </Pressable>
                    )}

                    {/* Link to website */}
                    <Pressable onPress={handleOpenWebsite} className="mt-6 self-center p-2" accessibilityLabel="Visit website" accessibilityRole="link">
                      <Text className={`text-sm text-center ${isLightTheme ? "text-blue-600" : "text-blue-400"}`}>Need help? Visit our website</Text>
                    </Pressable>
                  </Animated.View>
                )}
              </Formik>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
