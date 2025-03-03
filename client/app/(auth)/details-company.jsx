// File: app/(auth)/details-company.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
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
  const [openCountry, setOpenCountry] = useState(false);
  const [countryItems, setCountryItems] = useState([
    { label: "United States", value: "USA" },
    { label: "Canada", value: "Canada" },
    { label: "United Kingdom", value: "UK" },
    { label: "Germany", value: "Germany" },
    { label: "France", value: "France" },
    { label: "Philippines", value: "Philippines" },
  ]);
  const [countryValue, setCountryValue] = useState("USA");
  const [openCurrency, setOpenCurrency] = useState(false);
  const [currencyItems, setCurrencyItems] = useState([
    { label: "USD - US Dollar", value: "USD" },
    { label: "CAD - Canadian Dollar", value: "CAD" },
    { label: "EUR - Euro", value: "EUR" },
    { label: "GBP - British Pound", value: "GBP" },
    { label: "JPY - Japanese Yen", value: "JPY" },
    { label: "PHP - Philippine Peso", value: "PHP" },
  ]);
  const [currencyValue, setCurrencyValue] = useState("USD");
  const [openLanguage, setOpenLanguage] = useState(false);
  const [languageItems, setLanguageItems] = useState([
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
    { label: "German", value: "de" },
    { label: "Japanese", value: "ja" },
  ]);
  const [languageValue, setLanguageValue] = useState("en");
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
                router.replace("(tabs)/profile");
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
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 items-center px-6 pb-10">
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
            >
              {({ values, handleChange, handleBlur, handleSubmit, errors, touched, setFieldValue }) => (
                <>
                  <Text className={`text-2xl font-extrabold text-center mb-6 ${isLightTheme ? "text-slate-800" : "text-slate-100"}`}>Company Details</Text>
                  <View className="w-full mb-4">
                    <Text className={`text-base mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                      Company Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`w-full p-4 rounded-lg ${isLightTheme ? "bg-slate-100 text-slate-800" : "bg-slate-800 text-slate-100"}`}
                      placeholder="Enter your company name"
                      placeholderTextColor={isLightTheme ? "#6b7280" : "#9ca3af"}
                      value={values.companyName}
                      onChangeText={handleChange("companyName")}
                      onBlur={handleBlur("companyName")}
                    />
                    {touched.companyName && errors.companyName && <Text className="text-red-500 text-sm">{errors.companyName}</Text>}
                  </View>
                  <View className="w-full mb-4" style={{ zIndex: 3000 }}>
                    <Text className={`text-base mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                      Country <Text className="text-red-500">*</Text>
                    </Text>
                    <DropDownPicker
                      open={openCountry}
                      value={countryValue}
                      items={countryItems}
                      setOpen={setOpenCountry}
                      setValue={(callback) => {
                        const value = callback(countryValue);
                        setCountryValue(value);
                        setFieldValue("country", value);
                      }}
                      setItems={setCountryItems}
                      placeholder="Select Country"
                      containerStyle={{ height: 50 }}
                      style={{ borderColor: isLightTheme ? "#f1f5f9" : "#1E293B", backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      dropDownContainerStyle={{ borderColor: isLightTheme ? "#f1f5f9" : "#1E293B", backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      arrowIconStyle={{ tintColor: isLightTheme ? "#1e293b" : "#cbd5e1" }}
                      tickIconStyle={{ tintColor: isLightTheme ? "#1e293b" : "#cbd5e1" }}
                      labelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff" }}
                      listItemContainerStyle={{ backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      listItemLabelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff" }}
                      selectedItemLabelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff", fontWeight: "bold" }}
                      zIndex={3000}
                      zIndexInverse={3000}
                    />
                    {touched.country && errors.country && <Text className="text-red-500 text-sm">{errors.country}</Text>}
                  </View>
                  <View className="w-full mb-4" style={{ zIndex: 2000 }}>
                    <Text className={`text-base mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                      Currency <Text className="text-red-500">*</Text>
                    </Text>
                    <DropDownPicker
                      open={openCurrency}
                      value={currencyValue}
                      items={currencyItems}
                      setOpen={setOpenCurrency}
                      setValue={(callback) => {
                        const value = callback(currencyValue);
                        setCurrencyValue(value);
                        setFieldValue("currency", value);
                      }}
                      setItems={setCurrencyItems}
                      placeholder="Select Currency"
                      containerStyle={{ height: 50 }}
                      style={{ borderColor: isLightTheme ? "#f1f5f9" : "#1E293B", backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      dropDownContainerStyle={{ borderColor: isLightTheme ? "#f1f5f9" : "#1E293B", backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      arrowIconStyle={{ tintColor: isLightTheme ? "#1e293b" : "#cbd5e1" }}
                      tickIconStyle={{ tintColor: isLightTheme ? "#1e293b" : "#cbd5e1" }}
                      labelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff" }}
                      listItemContainerStyle={{ backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      listItemLabelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff" }}
                      selectedItemLabelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff", fontWeight: "bold" }}
                      zIndex={2000}
                      zIndexInverse={2000}
                    />
                    {touched.currency && errors.currency && <Text className="text-red-500 text-sm">{errors.currency}</Text>}
                  </View>
                  <View className="w-full mb-4" style={{ zIndex: 1000 }}>
                    <Text className={`text-base mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-200"}`}>
                      Language <Text className="text-red-500">*</Text>
                    </Text>
                    <DropDownPicker
                      open={openLanguage}
                      value={languageValue}
                      items={languageItems}
                      setOpen={setOpenLanguage}
                      setValue={(callback) => {
                        const value = callback(languageValue);
                        setLanguageValue(value);
                        setFieldValue("language", value);
                      }}
                      setItems={setLanguageItems}
                      placeholder="Select Language"
                      containerStyle={{ height: 50 }}
                      style={{ borderColor: isLightTheme ? "#f1f5f9" : "#1E293B", backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      dropDownContainerStyle={{ borderColor: isLightTheme ? "#f1f5f9" : "#1E293B", backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      arrowIconStyle={{ tintColor: isLightTheme ? "#1e293b" : "#cbd5e1" }}
                      tickIconStyle={{ tintColor: isLightTheme ? "#1e293b" : "#cbd5e1" }}
                      labelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff" }}
                      listItemContainerStyle={{ backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B" }}
                      listItemLabelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff" }}
                      selectedItemLabelStyle={{ color: isLightTheme ? "#1e293b" : "#ffffff", fontWeight: "bold" }}
                      zIndex={1000}
                      zIndexInverse={1000}
                    />
                    {touched.language && errors.language && <Text className="text-red-500 text-sm">{errors.language}</Text>}
                  </View>
                  <Pressable className="w-full py-4 rounded-lg mt-6 bg-orange-500/90" onPress={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white text-center text-base font-semibold">Subscribe</Text>
                    )}
                  </Pressable>
                  <Pressable className="w-full py-4 rounded-lg border-orange-500 border mt-4" onPress={() => router.back()} disabled={isSubmitting}>
                    <Text className="text-orange-500 text-center text-base font-semibold">Back to Create Account</Text>
                  </Pressable>
                </>
              )}
            </Formik>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
