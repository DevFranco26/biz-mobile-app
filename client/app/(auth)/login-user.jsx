// File: app/(auth)/login-user.jsx

import React, { useState } from "react";
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
  ActivityIndicator, // <-- Import ActivityIndicator
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import * as SecureStore from "expo-secure-store";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/userStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../../config/constant";

// 1) IMPORT EXPO BIOMETRIC AUTH:
import * as LocalAuthentication from "expo-local-authentication";

const SigninSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Min 6 chars").required("Password is required"),
});

export default function Login() {
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();
  const isLightTheme = theme === "light";
  const router = useRouter();

  const [passwordVisible, setPasswordVisible] = useState(false);

  const [isLoading, setIsLoading] = useState(false); // <-- Add loading state

  const handleSignin = async (values) => {
    setIsLoading(true); // <-- Start loading

    // 2) BIOMETRIC AUTH CHECK BEFORE PROCEEDING:
    try {
      const hasBiometricHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasBiometricHardware) {
        Alert.alert(
          "Biometric Not Supported",
          "Your device does not support biometric authentication."
        );
        setIsLoading(false);
        return;
      }

      const isBiometricEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isBiometricEnrolled) {
        Alert.alert(
          "Biometric Not Set Up",
          "No biometric credentials found. Please set up Fingerprint/Face ID on your device."
        );
        setIsLoading(false);
        return;
      }

      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to proceed",
        fallbackEnabled: true,
        fallbackTitle: "Use Passcode",
        cancelLabel: "Cancel",
      });

      if (!biometricResult.success) {
        Alert.alert(
          "Authentication Failed",
          "You could not be authenticated. Please try again."
        );
        setIsLoading(false);
        return;
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred during biometric authentication."
      );
      setIsLoading(false);
      return;
    }

    // 3) IF BIOMETRICS SUCCESS, PROCEED WITH YOUR EXISTING LOGIN LOGIC:
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
          await SecureStore.setItemAsync("token", data.token);
          await SecureStore.setItemAsync("user", JSON.stringify(data.user));
          setUser(data.user);
          router.replace("(tabs)/profile");
        } else {
          Alert.alert("Error", "Missing token or user data in response.");
        }
      } else {
        Alert.alert("Error", data.message || "Invalid credentials");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred. Try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          className={`flex-1 justify-center items-center px-6 ${
            isLightTheme ? "bg-white" : "bg-slate-900"
          }`}
        >
          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={SigninSchema}
            onSubmit={handleSignin}
          >
            {({
              values,
              handleChange,
              handleBlur,
              handleSubmit,
              errors,
              touched,
            }) => (
              <>
                <Text
                  className={`text-5xl font-extrabold text-center mb-12 ${
                    isLightTheme ? "text-slate-800" : "text-slate-100"
                  }`}
                >
                  Biz Buddy
                </Text>

                {/* Email Input */}
                <View className="mb-4 w-full">
                  <Text
                    className={`text-lg ${
                      isLightTheme ? "text-slate-800" : "text-slate-100"
                    } text-left`}
                  >
                    Email
                  </Text>
                  <TextInput
                    className={`w-full p-4 my-2 rounded-lg ${
                      isLightTheme
                        ? "bg-slate-100 text-slate-800"
                        : "bg-slate-800 text-slate-100"
                    }`}
                    keyboardType="email-address"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    placeholder="Enter your email"
                    placeholderTextColor={isLightTheme ? "#6b7280" : "#9ca3af"}
                  />
                  {touched.email && errors.email && (
                    <Text className="text-red-500 text-sm">{errors.email}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View className="mb-6 w-full">
                  <Text
                    className={`text-lg ${
                      isLightTheme ? "text-slate-800" : "text-slate-100"
                    } text-left`}
                  >
                    Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      className={`w-full p-4 my-2 rounded-lg ${
                        isLightTheme
                          ? "bg-slate-100 text-slate-800"
                          : "bg-slate-800 text-slate-100"
                      }`}
                      secureTextEntry={!passwordVisible}
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      placeholder="Enter your password"
                      placeholderTextColor={
                        isLightTheme ? "#6b7280" : "#9ca3af"
                      }
                    />
                    <Pressable
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      style={{
                        position: "absolute",
                        right: 10,
                        top: "40%",
                        transform: [{ translateY: -12 }],
                      }}
                    >
                      <Ionicons
                        name={passwordVisible ? "eye-off" : "eye"}
                        size={35}
                        color={isLightTheme ? "#6b7280" : "#9ca3af"}
                      />
                    </Pressable>
                  </View>
                  {touched.password && errors.password && (
                    <Text className="text-red-500 text-sm">
                      {errors.password}
                    </Text>
                  )}
                </View>

                {/* Sign In Button */}
                <Pressable
                  className={`w-full py-4 rounded-lg mt-7 flex-row justify-center items-center ${
                    isLoading ? "bg-orange-300" : "bg-orange-500/90"
                  }`}
                  onPress={handleSubmit}
                  disabled={isLoading} // <-- Disable button while loading
                >
                  {isLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#ffffff"
                      style={{ marginRight: 10 }}
                    />
                  )}
                  <Text className="text-white text-center text-lg font-medium">
                    Sign In
                  </Text>
                </Pressable>

                {/* Some "Get Started" button */}
                <Pressable
                  className="w-full py-4 rounded-lg mt-4 border-2 border-orange-500/90"
                  onPress={() => router.push("(auth)/registration-user")}
                >
                  <Text className="text-orange-500/90 text-center text-lg font-medium">
                    Get Started
                  </Text>
                </Pressable>

                {/* Forgot Password? (optional) */}
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      "Contact your administrator to reset your password"
                    )
                  }
                >
                  <Text
                    className={`text-blue-500 text-sm mt-4 text-center ${
                      isLightTheme ? "text-blue-700" : "text-blue-400"
                    }`}
                  >
                    Forgot Password?
                  </Text>
                </Pressable>
              </>
            )}
          </Formik>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
