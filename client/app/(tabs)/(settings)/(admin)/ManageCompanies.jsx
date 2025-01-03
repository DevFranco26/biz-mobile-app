// File: app/(tabs)/(settings)/(admin)/ManageCompanies.jsx

import React, { useEffect, useState } from 'react';
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
  RefreshControl
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import useCompanyStore from '../../../../store/companyStore';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const ManageCompanies = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { companies, loading, error, fetchCompanies, deleteCompany } = useCompanyStore();

  const [selectedCompany, setSelectedCompany] = useState(null);

  // Fields for add/edit company modal
  const [companyName, setCompanyName] = useState('');
  const [companyDomain, setCompanyDomain] = useState('');

  const [editCompanyModalVisible, setEditCompanyModalVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (!storedToken) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/signin');
        return;
      }
      setToken(storedToken);
      await fetchCompanies(storedToken);
    };
    initialize();
  }, []);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchCompanies(token);
    setRefreshing(false);
  };

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setCompanyName('');
    setCompanyDomain('');
    setEditCompanyModalVisible(true);
  };

  const handleEditCompany = (company) => {
    setSelectedCompany(company);
    setCompanyName(company.name);
    setCompanyDomain(company.domain);
    setEditCompanyModalVisible(true);
  };

  const handleDeleteCompany = async (companyId) => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this company?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCompany(companyId, token);
            await fetchCompanies(token);
          }
        },
      ]
    );
  };

  const handleCompanyAction = (company) => {
    Alert.alert(
      'Company Actions',
      `Choose an action for "${company.name}".`,
      [
        { text: 'Edit', onPress: () => handleEditCompany(company) },
        {
          text: 'Delete',
          onPress: () => handleDeleteCompany(company.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveCompanyEdits = async () => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }
    if (!companyName || !companyDomain) {
      Alert.alert('Validation Error', 'Name and Domain are required fields.');
      return;
    }

    try {
      let res, data;
      if (selectedCompany) {
        // Update existing company
        const url = `${API_BASE_URL}/companies/update/${selectedCompany.id}`;
        res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: companyName,
            domain: companyDomain,
          }),
        });
        data = await res.json();
      } else {
        // Create a new company
        const url = `${API_BASE_URL}/companies/create`;
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: companyName,
            domain: companyDomain,
          }),
        });
        data = await res.json();
      }

      if (res.ok) {
        Alert.alert('Success', selectedCompany ? 'Company updated successfully.' : 'Company created successfully.');
        setEditCompanyModalVisible(false);
        await fetchCompanies(token);
      } else {
        Alert.alert('Error', data.message || 'Failed to save company.');
      }
    } catch (err) {
      console.error('Error saving company:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const renderItem = ({ item }) => {
    return (
      <View
        className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${
          isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
        }`}
      >
        <View className="flex-1">
          <Text
            className={`text-lg font-semibold ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            {item.name}
          </Text>
          <Text
            className={`mt-1 text-base ${
              isLightTheme ? 'text-slate-600' : 'text-slate-300'
            }`}
          >
            Domain: {item.domain}
          </Text>
        </View>

        <Pressable onPress={() => handleCompanyAction(item)} className="p-2">
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={isLightTheme ? '#1f2937' : '#f9fafb'}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      edges={['top']}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text
          className={`text-lg font-bold ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          Manage Companies
        </Text>
      </View>

      {/* Title + Add Button */}
      <View className="flex-row justify-between items-center px-4 mb-4 z-50">
        <Text
          className={`text-2xl font-bold ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          Companies
        </Text>
        <Pressable
          onPress={handleAddCompany}
          className={`p-2 rounded-full ${
            isLightTheme ? 'bg-white' : 'bg-slate-900'
          }`}
        >
          <Ionicons
            name="add"
            size={24}
            color={isLightTheme ? '#1e293b' : '#cbd5e1'}
          />
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#475569']}
              tintColor={isLightTheme ? '#475569' : '#f9fafb'}
            />
          }
          ListEmptyComponent={
            <Text
              className={`text-center mt-12 text-lg ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              No companies found.
            </Text>
          }
        />
      )}

      {/* Add/Edit Company Modal */}
      <Modal
        visible={editCompanyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditCompanyModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? 'bg-white'  : 'bg-slate-900'}`}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-11/12"
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
            >
              <View
                className={`p-6 rounded-2xl w-full ${
                  isLightTheme ? 'bg-white' : 'bg-slate-900'
                }`}
              >
                <Text
                  className={`text-xl font-bold mb-4 ${
                    isLightTheme ? 'text-slate-900' : 'text-slate-300'
                  }`}
                >
                  {selectedCompany ? 'Edit Company' : 'Add Company'}
                </Text>

                {/* Company Name */}
                <Text
                  className={`text-sm font-medium mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Company Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-4 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-100 bg-slate-100 text-slate-800'
                      : 'border-slate-800 bg-slate-800 text-slate-300'
                  }`}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="e.g., ACME Inc."
                  placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
                />

                {/* Company Domain */}
                <Text
                  className={`text-sm font-medium mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Domain <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-6 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-100 bg-slate-100 text-slate-800'
                      : 'border-slate-800 bg-slate-800 text-slate-300'
                  }`}
                  value={companyDomain}
                  onChangeText={setCompanyDomain}
                  placeholder="e.g., acme.com"
                  placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
                  autoCapitalize="none"
                />

                {/* Action Buttons */}
                <View className="flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => setEditCompanyModalVisible(false)}
                    className="mr-4"
                  >
                    <Text
                      className={`text-base font-semibold my-auto ${
                        isLightTheme ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveCompanyEdits}
                    className="bg-orange-500 py-3 px-6 rounded-lg"
                  >
                    <Text className="text-white text-base font-semibold">
                      Save
                    </Text>
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

export default ManageCompanies;
