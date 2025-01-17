// File: app/(tabs)/(settings)/(admin)/ManageDepartments.jsx

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
import useDepartmentStore from '../../../../store/departmentStore';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const ManageDepartments = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { departments, loading, error, fetchDepartments } = useDepartmentStore();

  const [selectedDepartment, setSelectedDepartment] = useState(null);

  // Fields for add/edit department modal
  const [deptName, setDeptName] = useState('');

  const [editDeptModalVisible, setEditDeptModalVisible] = useState(false);

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
      await fetchDepartments(storedToken);
    };
    initialize();
  }, []);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchDepartments(token);
    setRefreshing(false);
  };

  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setDeptName('');
    setEditDeptModalVisible(true);
  };

  const handleEditDepartment = (dept) => {
    setSelectedDepartment(dept);
    setDeptName(dept.name);
    setEditDeptModalVisible(true);
  };

  const handleDeleteDepartment = async (departmentId) => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this department?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const url = `${API_BASE_URL}/departments/delete/${departmentId}`;
              const res = await fetch(url, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Success', data.message || 'Department deleted successfully.');
                await fetchDepartments(token);
              } else {
                Alert.alert('Error', data.message || 'Failed to delete department.');
              }
            } catch (err) {
              console.error('Error deleting department:', err);
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          },
        },
      ]
    );
  };

  const handleDepartmentAction = (dept) => {
    Alert.alert(
      'Department Actions',
      `Choose an action for "${dept.name}".`,
      [
        { text: 'Edit', onPress: () => handleEditDepartment(dept) },
        {
          text: 'Delete',
          onPress: () => handleDeleteDepartment(dept.id),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSaveDepartmentEdits = async () => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }
    if (!deptName) {
      Alert.alert('Validation Error', 'Department name is required.');
      return;
    }

    try {
      let res, data;
      if (selectedDepartment) {
        // Update existing department
        const url = `${API_BASE_URL}/departments/update/${selectedDepartment.id}`;
        res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: deptName,
          }),
        });
        data = await res.json();
      } else {
        // Create a new department
        const url = `${API_BASE_URL}/departments/create`;
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: deptName,
          }),
        });
        data = await res.json();
      }

      if (res.ok) {
        Alert.alert('Success', selectedDepartment ? 'Department updated successfully.' : 'Department created successfully.');
        setEditDeptModalVisible(false);
        await fetchDepartments(token);
      } else {
        Alert.alert('Error', data.message || 'Failed to save department.');
      }
    } catch (err) {
      console.error('Error saving department:', err);
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
        </View>

        <Pressable onPress={() => handleDepartmentAction(item)} className="p-2">
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
          Manage Departments
        </Text>
      </View>

      {/* Title + Add Button */}
      <View className="flex-row justify-between items-center px-4 mb-4 z-50">
        <Text
          className={`text-2xl font-bold ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          Departments
        </Text>
        <Pressable
          onPress={handleAddDepartment}
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
          data={departments}
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
              No departments found.
            </Text>
          }
        />
      )}

      {/* Add/Edit Department Modal */}
      <Modal
        visible={editDeptModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditDeptModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? 'bg-slate-950/70' : 'bg-slate-950/70'}`}>
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
                  {selectedDepartment ? 'Edit Department' : 'Add Department'}
                </Text>

                {/* Department Name */}
                <Text
                  className={`text-sm font-medium mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Department Name <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  className={`w-full p-3 mb-6 rounded-lg border ${
                    isLightTheme
                      ? 'border-slate-100 bg-slate-100 text-slate-800'
                      : 'border-slate-800 bg-slate-800 text-slate-300'
                  }`}
                  value={deptName}
                  onChangeText={setDeptName}
                  placeholder="e.g., Sales"
                  placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
                />

                {/* Action Buttons */}
                <View className="flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => setEditDeptModalVisible(false)}
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
                    onPress={handleSaveDepartmentEdits}
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

export default ManageDepartments;
