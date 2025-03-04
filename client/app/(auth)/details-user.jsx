import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useThemeStore from "../../store/themeStore";
import useOnboardingStore from "../../store/globalOnboardingStore";
import { API_BASE_URL } from "../../config/constant";

const StepOneSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name cannot exceed 50 characters")
    .matches(/^[A-Za-z]+$/, "First name must contain only letters")
    .required("First name is required"),
  middleName: Yup.string().max(50, "Middle name cannot exceed 50 characters"),
  lastName: Yup.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .matches(/^[A-Za-z]+$/, "Last name must contain only letters")
    .required("Last name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^\d+$/, "Phone number must contain only digits")
    .min(5, "Phone number must be at least 5 digits"),
  password: Yup.string()
    .min(6, "Min 6 chars")
    .matches(/[a-z]/, "At least one lowercase")
    .matches(/[A-Z]/, "At least one uppercase")
    .matches(/\d/, "At least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

export default function RegistrationUser() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { step1Data, setStep1Data } = useOnboardingStore();
  const isLightTheme = theme === "light";
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Real-time email check function
  const checkEmailExists = async (email, setFieldError) => {
    if (!email) return;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (data.exists) {
        setFieldError("email", "Email already exists");
      }
    } catch (error) {
      console.error("Error checking email:", error);
    }
  };

  const handleNext = (values) => {
    setStep1Data(values);
    router.push("(auth)/details-company");
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}
      style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
    >
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView className="flex-grow" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="flex-1 items-center px-6 py-6">
              <View className="w-full max-w-md">
                <View className="items-center mb-6">
                  <View className={`w-16 h-16 rounded-full mb-3 items-center justify-center ${isLightTheme ? "bg-orange-100" : "bg-orange-900"}`}>
                    <Ionicons name="person-add" size={30} color={isLightTheme ? "#f97316" : "#fdba74"} />
                  </View>
                  <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Create Account</Text>
                  <Text className={`text-sm mt-1 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>Enter your personal information</Text>
                </View>

                <Formik initialValues={step1Data} validationSchema={StepOneSchema} onSubmit={handleNext} validateOnMount>
                  {({ values, handleChange, handleBlur, handleSubmit, errors, touched, setFieldError, isValid, dirty }) => (
                    <>
                      {/* First Name */}
                      <View className="mb-4 w-full">
                        <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          First Name <Text className="text-red-500">*</Text>
                        </Text>
                        <View
                          className={`flex-row items-center rounded-xl overflow-hidden border ${
                            touched.firstName && errors.firstName ? "border-red-500" : isLightTheme ? "border-slate-200" : "border-slate-700"
                          }`}
                        >
                          <View className={`p-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                            <Ionicons name="person-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                          </View>
                          <TextInput
                            className={`flex-1 p-3.5 ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                            placeholder="Enter your first name"
                            placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                            value={values.firstName}
                            onChangeText={handleChange("firstName")}
                            onBlur={(e) => handleBlur("firstName")(e)}
                          />
                        </View>
                        {touched.firstName && errors.firstName && <Text className="text-red-500 text-xs mt-1">{errors.firstName}</Text>}
                      </View>

                      {/* Middle Name */}
                      <View className="mb-4 w-full">
                        <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Middle Name</Text>
                        <View
                          className={`flex-row items-center rounded-xl overflow-hidden border ${
                            touched.middleName && errors.middleName ? "border-red-500" : isLightTheme ? "border-slate-200" : "border-slate-700"
                          }`}
                        >
                          <View className={`p-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                            <Ionicons name="person-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                          </View>
                          <TextInput
                            className={`flex-1 p-3.5 ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                            placeholder="Enter your middle name (optional)"
                            placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                            value={values.middleName}
                            onChangeText={handleChange("middleName")}
                            onBlur={(e) => handleBlur("middleName")(e)}
                          />
                        </View>
                        {touched.middleName && errors.middleName && <Text className="text-red-500 text-xs mt-1">{errors.middleName}</Text>}
                      </View>

                      {/* Last Name */}
                      <View className="mb-4 w-full">
                        <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          Last Name <Text className="text-red-500">*</Text>
                        </Text>
                        <View
                          className={`flex-row items-center rounded-xl overflow-hidden border ${
                            touched.lastName && errors.lastName ? "border-red-500" : isLightTheme ? "border-slate-200" : "border-slate-700"
                          }`}
                        >
                          <View className={`p-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                            <Ionicons name="person-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                          </View>
                          <TextInput
                            className={`flex-1 p-3.5 ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                            placeholder="Enter your last name"
                            placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                            value={values.lastName}
                            onChangeText={handleChange("lastName")}
                            onBlur={(e) => handleBlur("lastName")(e)}
                          />
                        </View>
                        {touched.lastName && errors.lastName && <Text className="text-red-500 text-xs mt-1">{errors.lastName}</Text>}
                      </View>

                      {/* Email */}
                      <View className="mb-4 w-full">
                        <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          Email <Text className="text-red-500">*</Text>
                        </Text>
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
                            placeholder="Enter your email"
                            placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                            keyboardType="email-address"
                            value={values.email}
                            onChangeText={handleChange("email")}
                            onBlur={(e) => {
                              handleBlur("email")(e);
                              checkEmailExists(values.email, setFieldError);
                            }}
                          />
                        </View>
                        {touched.email && errors.email && <Text className="text-red-500 text-xs mt-1">{errors.email}</Text>}
                      </View>

                      {/* Phone Number */}
                      <View className="mb-4 w-full">
                        <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          Phone Number <Text className="text-red-500">*</Text>
                        </Text>
                        <View
                          className={`flex-row items-center rounded-xl overflow-hidden border ${
                            touched.phone && errors.phone ? "border-red-500" : isLightTheme ? "border-slate-200" : "border-slate-700"
                          }`}
                        >
                          <View className={`p-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                            <Ionicons name="call-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                          </View>
                          <TextInput
                            className={`flex-1 p-3.5 ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                            placeholder="Enter your phone number"
                            placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                            keyboardType="phone-pad"
                            value={values.phone}
                            onChangeText={handleChange("phone")}
                            onBlur={(e) => handleBlur("phone")(e)}
                          />
                        </View>
                        {touched.phone && errors.phone && <Text className="text-red-500 text-xs mt-1">{errors.phone}</Text>}
                      </View>

                      {/* Password */}
                      <View className="mb-4 w-full">
                        <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          Password <Text className="text-red-500">*</Text>
                        </Text>
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
                            placeholder="Enter your password"
                            placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                            secureTextEntry={!passwordVisible}
                            value={values.password}
                            onChangeText={handleChange("password")}
                            onBlur={(e) => handleBlur("password")(e)}
                          />
                          <Pressable
                            onPress={() => setPasswordVisible(!passwordVisible)}
                            className={`px-3 ${isLightTheme ? "bg-slate-50" : "bg-slate-800"}`}
                          >
                            <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                          </Pressable>
                        </View>
                        {touched.password && errors.password && <Text className="text-red-500 text-xs mt-1">{errors.password}</Text>}
                      </View>

                      {/* Confirm Password */}
                      <View className="mb-6 w-full">
                        <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          Confirm Password <Text className="text-red-500">*</Text>
                        </Text>
                        <View
                          className={`flex-row items-center rounded-xl overflow-hidden border ${
                            touched.confirmPassword && errors.confirmPassword ? "border-red-500" : isLightTheme ? "border-slate-200" : "border-slate-700"
                          }`}
                        >
                          <View className={`p-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                            <Ionicons name="lock-closed-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                          </View>
                          <TextInput
                            className={`flex-1 p-3.5 ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                            placeholder="Confirm your password"
                            placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                            secureTextEntry={!confirmPasswordVisible}
                            value={values.confirmPassword}
                            onChangeText={handleChange("confirmPassword")}
                            onBlur={(e) => handleBlur("confirmPassword")(e)}
                          />
                          <Pressable
                            onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                            className={`px-3 ${isLightTheme ? "bg-slate-50" : "bg-slate-800"}`}
                          >
                            <Ionicons
                              name={confirmPasswordVisible ? "eye-off-outline" : "eye-outline"}
                              size={22}
                              color={isLightTheme ? "#64748b" : "#94a3b8"}
                            />
                          </Pressable>
                        </View>
                        {touched.confirmPassword && errors.confirmPassword && <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword}</Text>}
                      </View>

                      {/* Continue Button */}
                      <Pressable
                        onPress={handleSubmit}
                        disabled={!isValid || !dirty}
                        className={`w-full py-4 rounded-xl mt-2 flex-row justify-center items-center ${
                          !isValid || !dirty ? "bg-gray-400" : "bg-orange-500"
                        }`}
                        style={{
                          shadowColor: "#f97316",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                      >
                        <Text className="text-white text-center text-base font-semibold mr-2">Continue</Text>
                        <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                      </Pressable>
                    </>
                  )}
                </Formik>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
