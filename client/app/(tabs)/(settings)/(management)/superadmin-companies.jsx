// File: app/(tabs)/(settings)/(management)/superadmin-companies.jsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  RefreshControl,
} from "react-native";
import useThemeStore from "../../../../store/themeStore";
import useCompanyStore from "../../../../store/companyStore";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../../../../config/constant";
import DropDownPicker from "react-native-dropdown-picker"; // Import DropDownPicker

const Companies = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === "light";
  const router = useRouter();
  const { companies, loading, error, fetchCompanies, deleteCompany, fetchCompanyUserCount, companyUserCounts } = useCompanyStore();

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");
  const [companyCurrency, setCompanyCurrency] = useState("");
  const [companyLanguage, setCompanyLanguage] = useState("");
  const [editCompanyModalVisible, setEditCompanyModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(null);

  // Dropdown States
  const [openCountry, setOpenCountry] = useState(false);
  const [countryItems, setCountryItems] = useState([
    { label: "Select Country", value: "" },
    { label: "United States", value: "USA" },
    { label: "Canada", value: "Canada" },
    { label: "United Kingdom", value: "UK" },
    { label: "Germany", value: "Germany" },
    { label: "France", value: "France" },
    // Add more countries as needed
  ]);

  const [openCurrency, setOpenCurrency] = useState(false);
  const [currencyItems, setCurrencyItems] = useState([
    { label: "Select Currency", value: "" },
    { label: "USD - US Dollar", value: "USD" },
    { label: "CAD - Canadian Dollar", value: "CAD" },
    { label: "EUR - Euro", value: "EUR" },
    { label: "GBP - British Pound", value: "GBP" },
    { label: "JPY - Japanese Yen", value: "JPY" },
    // Add more currencies as needed
  ]);

  const [openLanguage, setOpenLanguage] = useState(false);
  const [languageItems, setLanguageItems] = useState([
    { label: "Select Language", value: "" },
    { label: "English", value: "English" },
    { label: "Spanish", value: "Spanish" },
    { label: "French", value: "French" },
    { label: "German", value: "German" },
    { label: "Japanese", value: "Japanese" },
    // Add more languages as needed
  ]);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      if (!storedToken) {
        Alert.alert("Authentication Error", "Please sign in again.");
        router.replace("(auth)/login-user");
        return;
      }
      setToken(storedToken);
      await fetchCompanies(storedToken);
    };
    initialize();
  }, [fetchCompanies, router]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchCompanies(token);
    setRefreshing(false);
  };

  useEffect(() => {
    const fetchCounts = async () => {
      if (!token) return;
      for (let c of companies) {
        await fetchCompanyUserCount(token, c.id);
      }
    };
    if (companies.length > 0) {
      fetchCounts();
    }
  }, [companies, token, fetchCompanyUserCount]);

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setCompanyName("");
    setCompanyDomain("");
    setCompanyCountry("");
    setCompanyCurrency("");
    setCompanyLanguage("");
    setEditCompanyModalVisible(true);
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setCompanyName(company.name);
    setCompanyDomain(company.domain);
    setCompanyCountry(company.country);
    setCompanyCurrency(company.currency);
    setCompanyLanguage(company.language);
    setEditCompanyModalVisible(true);
  };

  const handleDeleteCompany = async (companyId) => {
    if (!token) {
      Alert.alert("Authentication Error", "Please sign in again.");
      router.replace("(auth)/login-user");
      return;
    }
    Alert.alert("Confirm Deletion", "Are you sure you want to delete this company?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteCompany(companyId, token);
          await fetchCompanies(token);
        },
      },
    ]);
  };

  const handleCompanyAction = (company) => {
    Alert.alert("Company Actions", `Choose an action for "${company.name}".`, [
      { text: "Edit", onPress: () => handleEditCompany(company) },
      { text: "Delete", onPress: () => handleDeleteCompany(company.id) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSaveCompanyEdits = async () => {
    if (!token) {
      Alert.alert("Authentication Error", "Please sign in again.");
      router.replace("(auth)/login-user");
      return;
    }
    if (!companyName || !companyDomain || !companyCountry || !companyCurrency || !companyLanguage) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }
    try {
      let res, data;
      if (selectedCompany) {
        const url = `${API_BASE_URL}/companies/update/${selectedCompany.id}`;
        res = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: companyName,
            domain: companyDomain,
            country: companyCountry,
            currency: companyCurrency,
            language: companyLanguage,
          }),
        });
        data = await res.json();
      } else {
        const url = `${API_BASE_URL}/companies/create`;
        res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: companyName,
            domain: companyDomain,
            country: companyCountry,
            currency: companyCurrency,
            language: companyLanguage,
          }),
        });
        data = await res.json();
      }
      if (res.ok) {
        Alert.alert("Success", selectedCompany ? "Company updated successfully." : "Company created successfully.");
        setEditCompanyModalVisible(false);
        await fetchCompanies(token);
      } else {
        Alert.alert("Error", data.message || "Failed to save company.");
      }
    } catch (err) {
      console.error("Error saving company:", err);
      Alert.alert("Error", "An unexpected error occurred.");
    }
  };

  const renderItem = ({ item }) => {
    const userCount = companyUserCounts[item.id] || 0;
    return (
      <View className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${isLightTheme ? "bg-slate-100" : "bg-slate-800"}`}>
        <View className="flex-1">
          <Text className={`text-lg font-semibold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>{item.name}</Text>
          <Text className={`text-base ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>Domain: {item.domain}</Text>
          <Text className={`text-base ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>Country: {item.country}</Text>
          <Text className={`text-base ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>Currency: {item.currency}</Text>
          <Text className={`text-base ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>Language: {item.language}</Text>
          <Text className={`text-sm ${isLightTheme ? "text-slate-600" : "text-slate-300"}`}>Users: {userCount}</Text>
        </View>
        <Pressable onPress={() => handleCompanyAction(item)} className="p-2">
          <Ionicons name="ellipsis-vertical" size={24} color={isLightTheme ? "#1f2937" : "#f9fafb"} />
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? "bg-white" : "bg-slate-900"}`} edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons name="chevron-back-outline" size={24} color={isLightTheme ? "#333" : "#fff"} />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Companies</Text>
      </View>
      <View className="flex-row justify-between items-center px-4 mb-4 z-50">
        <Text className={`text-2xl font-bold ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>Companies</Text>
        <Pressable onPress={handleAddCompany} className={`p-2 rounded-full ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
          <Ionicons name="add" size={24} color={isLightTheme ? "#1e293b" : "#cbd5e1"} />
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#475569" className="mt-12" />
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#475569"]} tintColor={isLightTheme ? "#475569" : "#f9fafb"} />
          }
          ListEmptyComponent={<Text className={`text-center mt-12 text-lg ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>No companies found.</Text>}
        />
      )}
      <Modal visible={editCompanyModalVisible} animationType="fade" transparent onRequestClose={() => setEditCompanyModalVisible(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? "bg-slate-950/70" : "bg-slate-950/70"}`}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="w-11/12"
              keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
            >
              <View className={`p-6 rounded-2xl shadow-md w-full ${isLightTheme ? "bg-white" : "bg-slate-900"}`}>
                <Text className={`text-xl font-bold mb-4 ${isLightTheme ? "text-slate-900" : "text-slate-300"}`}>
                  {selectedCompany ? "Edit Company" : "Add Company"}
                </Text>

                {/* Company Name Input */}
                <Text className={`text-sm font-medium mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>
                  Company Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-4 rounded-lg border ${
                    isLightTheme ? "border-slate-100 bg-slate-100 text-slate-800" : "border-slate-800 bg-slate-800 text-slate-300"
                  }`}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g., ACME Inc."
                  placeholderTextColor={isLightTheme ? "#9CA3AF" : "#6B7280"}
                />

                {/* Company Domain Input */}
                <Text className={`text-sm font-medium mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>
                  Domain <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-4 rounded-lg border ${
                    isLightTheme ? "border-slate-100 bg-slate-100 text-slate-800" : "border-slate-800 bg-slate-800 text-slate-300"
                  }`}
                  value={companyDomain}
                  onChangeText={setCompanyDomain}
                  placeholder="e.g., acme.com"
                  placeholderTextColor={isLightTheme ? "#9CA3AF" : "#6B7280"}
                  autoCapitalize="none"
                />

                {/* Country Dropdown */}
                <Text className={`text-sm font-medium mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>
                  Country <Text className="text-red-500">*</Text>
                </Text>
                <DropDownPicker
                  open={openCountry}
                  value={companyCountry}
                  items={countryItems}
                  setOpen={setOpenCountry}
                  setValue={setCompanyCountry}
                  setItems={setCountryItems}
                  placeholder="Select Country"
                  containerStyle={{ height: 50, marginBottom: 16 }}
                  style={{
                    borderColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                    backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                  }}
                  dropDownContainerStyle={{
                    borderColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                    backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                  }}
                  arrowIconStyle={{
                    tintColor: isLightTheme ? "#1e293b" : "#cbd5e1",
                  }}
                  tickIconStyle={{
                    tintColor: isLightTheme ? "#1e293b" : "#cbd5e1",
                  }}
                  zIndex={3000}
                  zIndexInverse={3000}
                  placeholderStyle={{
                    color: isLightTheme ? "#6B7280" : "#9CA3AF",
                  }}
                  onChangeValue={(value) => {
                    setCompanyCountry(value);
                  }}
                />
                {/* If you want to add validation messages, you can uncomment the following */}
                {/* {selectedCompany && !companyCountry && (
                  <Text className="text-red-500 text-sm mb-4">
                    Country is required.
                  </Text>
                )} */}

                {/* Currency Dropdown */}
                <Text className={`text-sm font-medium mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>
                  Currency <Text className="text-red-500">*</Text>
                </Text>
                <DropDownPicker
                  open={openCurrency}
                  value={companyCurrency}
                  items={currencyItems}
                  setOpen={setOpenCurrency}
                  setValue={setCompanyCurrency}
                  setItems={setCurrencyItems}
                  placeholder="Select Currency"
                  containerStyle={{ height: 50, marginBottom: 16 }}
                  style={{
                    borderColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                    backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                  }}
                  dropDownContainerStyle={{
                    borderColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                    backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                  }}
                  arrowIconStyle={{
                    tintColor: isLightTheme ? "#1e293b" : "#cbd5e1",
                  }}
                  tickIconStyle={{
                    tintColor: isLightTheme ? "#1e293b" : "#cbd5e1",
                  }}
                  zIndex={2000}
                  zIndexInverse={2000}
                  placeholderStyle={{
                    color: isLightTheme ? "#6B7280" : "#9CA3AF",
                  }}
                  onChangeValue={(value) => {
                    setCompanyCurrency(value);
                  }}
                />
                {/* {selectedCompany && !companyCurrency && (
                  <Text className="text-red-500 text-sm mb-4">
                    Currency is required.
                  </Text>
                )} */}

                {/* Language Dropdown */}
                <Text className={`text-sm font-medium mb-1 ${isLightTheme ? "text-slate-800" : "text-slate-300"}`}>
                  Language <Text className="text-red-500">*</Text>
                </Text>
                <DropDownPicker
                  open={openLanguage}
                  value={companyLanguage}
                  items={languageItems}
                  setOpen={setOpenLanguage}
                  setValue={setCompanyLanguage}
                  setItems={setLanguageItems}
                  placeholder="Select Language"
                  containerStyle={{ height: 50, marginBottom: 16 }}
                  style={{
                    borderColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                    backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                  }}
                  dropDownContainerStyle={{
                    borderColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                    backgroundColor: isLightTheme ? "#f1f5f9" : "#1E293B",
                  }}
                  arrowIconStyle={{
                    tintColor: isLightTheme ? "#1e293b" : "#cbd5e1",
                  }}
                  tickIconStyle={{
                    tintColor: isLightTheme ? "#1e293b" : "#cbd5e1",
                  }}
                  zIndex={1000}
                  zIndexInverse={1000}
                  placeholderStyle={{
                    color: isLightTheme ? "#6B7280" : "#9CA3AF",
                  }}
                  onChangeValue={(value) => {
                    setCompanyLanguage(value);
                  }}
                />
                {/* {selectedCompany && !companyLanguage && (
                  <Text className="text-red-500 text-sm mb-4">
                    Language is required.
                  </Text>
                )} */}

                {/* Save and Cancel Buttons */}
                <View className="flex-row justify-end">
                  <TouchableOpacity onPress={() => setEditCompanyModalVisible(false)} className="mr-4">
                    <Text className={`text-base font-semibold my-auto ${isLightTheme ? "text-slate-700" : "text-slate-300"}`}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveCompanyEdits} className="bg-orange-500 py-3 px-6 rounded-lg">
                    <Text className="text-white text-base font-semibold">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default Companies;
