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
  ActivityIndicator,
  Image,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import * as SecureStore from "expo-secure-store";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/userStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL, VERSION } from "../../config/constant";
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSignin = async (values) => {
    setIsLoading(true);
    try {
      const hasBiometricHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasBiometricHardware) {
        Alert.alert("Biometric Not Supported", "Your device does not support biometric authentication.");
        setIsLoading(false);
        return;
      }
      const isBiometricEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isBiometricEnrolled) {
        Alert.alert("Biometric Not Set Up", "No biometric credentials found. Please set up Fingerprint/Face ID on your device.");
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
        Alert.alert("Authentication Failed", "You could not be authenticated. Please try again.");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during biometric authentication.");
      setIsLoading(false);
      return;
    }
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
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={`flex-1 justify-center items-center px-6 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
          <View className="w-full max-w-md">
            <View className="items-center mb-10">
              <Text className={`text-4xl font-extrabold text-center ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Biz Buddy</Text>
              <Text className={`text-sm mt-2 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>v.{VERSION}</Text>
              <Text className={`text-sm mt-2 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>Your business management companion</Text>
            </View>

            <Formik initialValues={{ email: "", password: "" }} validationSchema={SigninSchema} onSubmit={handleSignin}>
              {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => (
                <>
                  <View className="mb-5 w-full">
                    <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Email</Text>
                    <View
                      className={`flex-row items-center rounded-xl overflow-hidden border ${
                        touched.email && errors.email ? "border-red-500" : isLightTheme ? "border-slate-200" : "border-slate-700"
                      }`}
                    >
                      <View className={`p-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                        <Ionicons name="mail-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                      </View>
                      <TextInput
                        className={`flex-1 p-3.5 ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                        keyboardType="email-address"
                        value={values.email}
                        onChangeText={handleChange("email")}
                        onBlur={handleBlur("email")}
                        placeholder="Enter your email"
                        placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                      />
                    </View>
                    {touched.email && errors.email && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.email}</Text>}
                  </View>

                  <View className="mb-6 w-full">
                    <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Password</Text>
                    <View
                      className={`flex-row items-center rounded-xl overflow-hidden border ${
                        touched.password && errors.password ? "border-red-500" : isLightTheme ? "border-slate-200" : "border-slate-700"
                      }`}
                    >
                      <View className={`p-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                        <Ionicons name="lock-closed-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                      </View>
                      <TextInput
                        className={`flex-1 p-3.5 ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                        secureTextEntry={!passwordVisible}
                        value={values.password}
                        onChangeText={handleChange("password")}
                        onBlur={handleBlur("password")}
                        placeholder="Enter your password"
                        placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                      />
                      <Pressable
                        onPress={() => setPasswordVisible(!passwordVisible)}
                        className={`px-3 rounded-full ${isLightTheme ? "bg-slate-50" : "bg-slate-800"}`}
                      >
                        <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                      </Pressable>
                    </View>
                    {touched.password && errors.password && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.password}</Text>}
                  </View>

                  <Pressable
                    className={`w-full py-4 rounded-xl mt-4 flex-row justify-center items-center ${isLoading ? "bg-orange-400/70" : "bg-orange-500"}`}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    style={{
                      shadowColor: "#f97316",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 10 }} />
                    ) : (
                      <Ionicons name="log-in-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    )}
                    <Text className="text-white text-center text-base font-semibold">Sign In</Text>
                  </Pressable>

                  <Pressable
                    className={`w-full py-4 rounded-xl mt-4 border-2 border-orange-500 flex-row justify-center items-center`}
                    onPress={() => router.push("(auth)/pricing")}
                  >
                    <Ionicons name="rocket-outline" size={20} color={isLightTheme ? "#f97316" : "#f97316"} style={{ marginRight: 8 }} />
                    <Text className="text-orange-500 text-center text-base font-semibold">Get Started</Text>
                  </Pressable>

                  <Pressable onPress={() => Alert.alert("Contact your administrator to reset your password")} className="mt-6 self-center">
                    <Text className={`text-sm ${isLightTheme ? "text-blue-600" : "text-blue-400"}`}>Forgot Password?</Text>
                  </Pressable>
                </>
              )}
            </Formik>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
