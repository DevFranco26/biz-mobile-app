import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/userStore";
import useOnboardingStore from "../../store/globalOnboardingStore";
import { API_BASE_URL } from "../../config/constant";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";

const StepTwoSchema = Yup.object().shape({
  companyName: Yup.string()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters")
    .required("Company name is required"),
  country: Yup.string().required("Country is required"),
  currency: Yup.string().required("Currency is required"),
  language: Yup.string().required("Language is required"),
});

const validateCompanyName = async (name) => {
  if (!name || !name.trim()) return "Company name is required";
  const normalizedName = name.trim().toLowerCase();
  try {
    const response = await fetch(`${API_BASE_URL}/auth/check?name=${encodeURIComponent(normalizedName)}`);
    const data = await response.json();
    if (data.exists) return "Company already exists";
  } catch (error) {
    console.error("Error validating company name:", error);
    return "Error checking company name";
  }
  return undefined;
};

export default function RegistrationCompany() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const { setUser } = useUserStore();
  const { step1Data, step2Data, setStep2Data, resetOnboardingData, selectedPlan } = useOnboardingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for dropdown pickers
  const [openCountry, setOpenCountry] = useState(false);
  const [openCurrency, setOpenCurrency] = useState(false);
  const [openLanguage, setOpenLanguage] = useState(false);

  // Prevent multiple dropdowns from being open simultaneously
  const onCountryOpen = useCallback(() => {
    setOpenCurrency(false);
    setOpenLanguage(false);
  }, []);
  const onCurrencyOpen = useCallback(() => {
    setOpenCountry(false);
    setOpenLanguage(false);
  }, []);
  const onLanguageOpen = useCallback(() => {
    setOpenCountry(false);
    setOpenCurrency(false);
  }, []);

  const [countryItems, setCountryItems] = useState([
    { label: "United States", value: "USA" },
    { label: "Canada", value: "Canada" },
    { label: "United Kingdom", value: "UK" },
    { label: "Germany", value: "Germany" },
    { label: "France", value: "France" },
    { label: "Philippines", value: "Philippines" },
  ]);
  const [countryValue, setCountryValue] = useState(step2Data.country || "USA");

  const [currencyItems, setCurrencyItems] = useState([
    { label: "USD - US Dollar", value: "USD" },
    { label: "CAD - Canadian Dollar", value: "CAD" },
    { label: "EUR - Euro", value: "EUR" },
    { label: "GBP - British Pound", value: "GBP" },
    { label: "JPY - Japanese Yen", value: "JPY" },
    { label: "PHP - Philippine Peso", value: "PHP" },
  ]);
  const [currencyValue, setCurrencyValue] = useState(step2Data.currency || "USD");

  const [languageItems, setLanguageItems] = useState([
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
    { label: "Japanese", value: "ja" },
  ]);
  const [languageValue, setLanguageValue] = useState(step2Data.language || "en");

  const handleSignup = async (values) => {
    setIsSubmitting(true);
    const payload = {
      firstName: step1Data.firstName,
      middleName: step1Data.middleName,
      lastName: step1Data.lastName,
      email: step1Data.email,
      password: step1Data.password,
      phone: step1Data.phone,
      companyName: values.companyName,
      pax: "1",
      subscriptionPlanId: selectedPlan ? selectedPlan.id : "1",
      paymentMethod: selectedPlan ? "stripe" : "stripe",
      country: values.country,
      currency: values.currency,
      language: values.language,
    };

    console.log("Payload sent to get-started:", payload);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/get-started`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token && data.user) {
          await SecureStore.setItemAsync("token", data.token);
          await SecureStore.setItemAsync("user", JSON.stringify(data.user));
          setUser(data.user);

          Alert.alert("Success", "Account and Company created successfully!", [
            {
              text: "OK",
              onPress: () => {
                resetOnboardingData();
                router.replace("(auth)/login-user");
              },
            },
          ]);
        } else {
          Alert.alert("Error", "Missing token or user data in response.");
        }
      } else {
        Alert.alert("Error", data.message || "Failed to create account.");
      }
    } catch (error) {
      console.error("Registration Company Error:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`}
      style={{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }}
    >
      <StatusBar barStyle={isLightTheme ? "dark-content" : "light-content"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 px-6 py-6">
            <View className="items-center mb-6">
              <View className={`w-16 h-16 rounded-full mb-3 items-center justify-center ${isLightTheme ? "bg-orange-100" : "bg-orange-900"}`}>
                <Ionicons name="business" size={30} color={isLightTheme ? "#f97316" : "#fdba74"} />
              </View>
              <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Company Details</Text>
              <Text className={`text-sm mt-1 ${isLightTheme ? "text-slate-500" : "text-slate-400"}`}>Set up your business information</Text>
            </View>

            <Formik
              initialValues={{
                companyName: step2Data.companyName || "",
                country: step2Data.country || "USA",
                currency: step2Data.currency || "USD",
                language: step2Data.language || "en",
              }}
              validationSchema={StepTwoSchema}
              validate={async (values) => {
                const errors = {};
                const errorMsg = await validateCompanyName(values.companyName);
                if (errorMsg) errors.companyName = errorMsg;
                return errors;
              }}
              onSubmit={(values) => {
                setStep2Data(values);
                handleSignup(values);
              }}
              validateOnMount
            >
              {({ values, handleChange, handleBlur, handleSubmit, errors, touched, setFieldValue, isValid, dirty }) => (
                <View className="flex-1">
                  <View className="w-full mb-5">
                    <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                      Company Name <Text className="text-red-500">*</Text>
                    </Text>
                    <View
                      className={`flex-row items-center rounded-xl overflow-hidden border ${
                        touched.companyName && errors.companyName ? "border-red-500" : isLightTheme ? "border-slate-200" : "border-slate-700"
                      }`}
                    >
                      <View className={`p-3 ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                        <Ionicons name="business-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                      </View>
                      <TextInput
                        className={`flex-1 p-3.5 ${isLightTheme ? "bg-slate-50 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                        placeholder="Enter your company name"
                        placeholderTextColor={isLightTheme ? "#94a3b8" : "#64748b"}
                        value={values.companyName}
                        onChangeText={handleChange("companyName")}
                        onBlur={handleBlur("companyName")}
                      />
                    </View>
                    {touched.companyName && errors.companyName && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.companyName}</Text>}
                  </View>

                  {/* Country Dropdown */}
                  <View className="w-full mb-5" style={{ zIndex: 3000 }}>
                    <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                      Country <Text className="text-red-500">*</Text>
                    </Text>
                    <View className={`flex-row items-center mb-1 ${touched.country && errors.country ? "border-red-500" : ""}`}>
                      <View className={`p-3 rounded-l-xl ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                        <Ionicons name="globe-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                      </View>
                      <View className="flex-1">
                        <DropDownPicker
                          open={openCountry}
                          value={countryValue}
                          items={countryItems}
                          setOpen={setOpenCountry}
                          onOpen={onCountryOpen}
                          setValue={(callback) => {
                            const value = callback(countryValue);
                            setCountryValue(value);
                            setFieldValue("country", value);
                          }}
                          setItems={setCountryItems}
                          placeholder="Select Country"
                          containerStyle={{ height: 50 }}
                          style={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderColor: isLightTheme ? "#e2e8f0" : "#334155",
                            backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b",
                          }}
                          dropDownContainerStyle={{
                            borderColor: isLightTheme ? "#e2e8f0" : "#334155",
                            backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b",
                          }}
                          arrowIconStyle={{ tintColor: isLightTheme ? "#64748b" : "#94a3b8" }}
                          tickIconStyle={{ tintColor: isLightTheme ? "#f97316" : "#fdba74" }}
                          labelStyle={{ color: isLightTheme ? "#334155" : "#e2e8f0" }}
                          listItemContainerStyle={{ backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b" }}
                          listItemLabelStyle={{ color: isLightTheme ? "#334155" : "#e2e8f0" }}
                          selectedItemLabelStyle={{ color: isLightTheme ? "#f97316" : "#fdba74", fontWeight: "bold" }}
                          zIndex={3000}
                          zIndexInverse={1000}
                          maxHeight={200}
                          listMode="SCROLLVIEW"
                        />
                      </View>
                    </View>
                    {touched.country && errors.country && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.country}</Text>}
                  </View>

                  {/* Currency Dropdown */}
                  <View className="w-full mb-5" style={{ zIndex: 2000 }}>
                    <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                      Currency <Text className="text-red-500">*</Text>
                    </Text>
                    <View className={`flex-row items-center mb-1 ${touched.currency && errors.currency ? "border-red-500" : ""}`}>
                      <View className={`p-3 rounded-l-xl ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                        <Ionicons name="cash-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                      </View>
                      <View className="flex-1">
                        <DropDownPicker
                          open={openCurrency}
                          value={currencyValue}
                          items={currencyItems}
                          setOpen={setOpenCurrency}
                          onOpen={onCurrencyOpen}
                          setValue={(callback) => {
                            const value = callback(currencyValue);
                            setCurrencyValue(value);
                            setFieldValue("currency", value);
                          }}
                          setItems={setCurrencyItems}
                          placeholder="Select Currency"
                          containerStyle={{ height: 50 }}
                          style={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderColor: isLightTheme ? "#e2e8f0" : "#334155",
                            backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b",
                          }}
                          dropDownContainerStyle={{
                            borderColor: isLightTheme ? "#e2e8f0" : "#334155",
                            backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b",
                          }}
                          arrowIconStyle={{ tintColor: isLightTheme ? "#64748b" : "#94a3b8" }}
                          tickIconStyle={{ tintColor: isLightTheme ? "#f97316" : "#fdba74" }}
                          labelStyle={{ color: isLightTheme ? "#334155" : "#e2e8f0" }}
                          listItemContainerStyle={{ backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b" }}
                          listItemLabelStyle={{ color: isLightTheme ? "#334155" : "#e2e8f0" }}
                          selectedItemLabelStyle={{ color: isLightTheme ? "#f97316" : "#fdba74", fontWeight: "bold" }}
                          zIndex={2000}
                          zIndexInverse={2000}
                          maxHeight={200}
                          listMode="SCROLLVIEW"
                        />
                      </View>
                    </View>
                    {touched.currency && errors.currency && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.currency}</Text>}
                  </View>

                  {/* Language Dropdown */}
                  <View className="w-full mb-6" style={{ zIndex: 1000 }}>
                    <Text className={`text-base font-medium mb-1 ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                      Language <Text className="text-red-500">*</Text>
                    </Text>
                    <View className={`flex-row items-center mb-1 ${touched.language && errors.language ? "border-red-500" : ""}`}>
                      <View className={`p-3 rounded-l-xl ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
                        <Ionicons name="language-outline" size={22} color={isLightTheme ? "#64748b" : "#94a3b8"} />
                      </View>
                      <View className="flex-1">
                        <DropDownPicker
                          open={openLanguage}
                          value={languageValue}
                          items={languageItems}
                          setOpen={setOpenLanguage}
                          onOpen={onLanguageOpen}
                          setValue={(callback) => {
                            const value = callback(languageValue);
                            setLanguageValue(value);
                            setFieldValue("language", value);
                          }}
                          setItems={setLanguageItems}
                          placeholder="Select Language"
                          containerStyle={{ height: 50 }}
                          style={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderColor: isLightTheme ? "#e2e8f0" : "#334155",
                            backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b",
                          }}
                          dropDownContainerStyle={{
                            borderColor: isLightTheme ? "#e2e8f0" : "#334155",
                            backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b",
                          }}
                          arrowIconStyle={{ tintColor: isLightTheme ? "#64748b" : "#94a3b8" }}
                          tickIconStyle={{ tintColor: isLightTheme ? "#f97316" : "#fdba74" }}
                          labelStyle={{ color: isLightTheme ? "#334155" : "#e2e8f0" }}
                          listItemContainerStyle={{ backgroundColor: isLightTheme ? "#f8fafc" : "#1e293b" }}
                          listItemLabelStyle={{ color: isLightTheme ? "#334155" : "#e2e8f0" }}
                          selectedItemLabelStyle={{ color: isLightTheme ? "#f97316" : "#fdba74", fontWeight: "bold" }}
                          zIndex={1000}
                          zIndexInverse={3000}
                          maxHeight={200}
                          listMode="SCROLLVIEW"
                        />
                      </View>
                    </View>
                    {touched.language && errors.language && <Text className="text-red-500 text-xs mt-1 ml-1">{errors.language}</Text>}
                  </View>

                  {/* Selected Plan Summary */}
                  {selectedPlan && (
                    <View className={`p-4 rounded-xl mb-6 ${isLightTheme ? "bg-orange-50" : "bg-orange-900/20"}`}>
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="checkmark-circle" size={20} color={isLightTheme ? "#f97316" : "#fdba74"} />
                        <Text className={`ml-2 font-medium ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>
                          Selected Plan: {selectedPlan.planName}
                        </Text>
                      </View>
                      <Text className={`${isLightTheme ? "text-slate-600" : "text-slate-400"} text-sm`}>
                        {selectedPlan.rangeOfUsers} - ${selectedPlan.price}/month
                      </Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View className="mt-auto">
                    <Pressable
                      onPress={handleSubmit}
                      disabled={!isValid || isSubmitting}
                      className={`w-full py-4 rounded-xl flex-row justify-center items-center ${
                        !isValid || isSubmitting ? "bg-gray-400" : "bg-orange-500"
                      }`}
                      style={{
                        shadowColor: "#f97316",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
                      ) : (
                        <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                      )}
                      <Text className="text-white text-center text-base font-semibold">
                        {isSubmitting ? "Creating Account..." : "Complete Registration"}
                      </Text>
                    </Pressable>

                    <Pressable
                      className="w-full py-4 rounded-xl mt-4 border-2 border-slate-300 flex-row justify-center items-center"
                      onPress={() => router.back()}
                      disabled={isSubmitting}
                    >
                      <Ionicons name="arrow-back" size={20} color={isLightTheme ? "#64748b" : "#94a3b8"} style={{ marginRight: 8 }} />
                      <Text className={`text-center text-base font-semibold ${isLightTheme ? "text-slate-600" : "text-slate-400"}`}>
                        Back to Personal Details
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
