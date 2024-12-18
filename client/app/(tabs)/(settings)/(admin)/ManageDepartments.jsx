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
  ScrollView,
  RefreshControl,
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import useDepartmentsStore from '../../../../store/departmentsStore';
import useUsersStore from '../../../../store/usersStore';
import useUserStore from '../../../../store/userStore'; // Correct import
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

const ManageDepartments = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { 
    departments, 
    loading, 
    error, 
    fetchDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
  } = useDepartmentsStore();
  
  const { 
    users, 
    loading: usersLoading, 
    error: usersError, 
    fetchUsers 
  } = useUsersStore();

  // Retrieve current user
  const { user: currentUser } = useUserStore();

  // Modal states
  const [departmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);

  // Department form state
  const [deptName, setDeptName] = useState('');
  const [deptSupervisorId, setDeptSupervisorId] = useState(null);

  const [refreshing, setRefreshing] = useState(false);

  // Token state
  const [token, setToken] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUsers(storedToken); // Fetch users to ensure `currentUser` is set
      } else {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/signin');
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser && currentUser.companyId) {
        await fetchDepartments(token); // Fetch departments based on `currentUser.companyId` internally
      }
    };
    fetchData();
  }, [currentUser, token]);

  const onRefresh = async () => {
    if (token && currentUser && currentUser.companyId) {
      setRefreshing(true);
      await fetchDepartments(token);
      await fetchUsers(token);
      setRefreshing(false);
    }
  };

  const handleOpenAddDepartment = () => {
    setEditingDepartment(null);
    setDeptName('');
    setDeptSupervisorId(null);
    setDepartmentModalVisible(true);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setDeptName(department.name);
    setDeptSupervisorId(department.supervisorId);
    setDepartmentModalVisible(true);
  };

  const handleSaveDepartment = async () => {
    if (!deptName) {
      Alert.alert('Validation Error', 'Please provide a department name.');
      return;
    }

    const payload = {
      name: deptName,
      companyId: currentUser.companyId, // Automatically assign company
      supervisorId: deptSupervisorId,
    };

    try {
      if (editingDepartment) {
        await updateDepartment(token, editingDepartment.id, payload);
        Alert.alert('Success', 'Department updated successfully.');
      } else {
        await createDepartment(token, payload);
        Alert.alert('Success', 'Department created successfully.');
      }
      setDepartmentModalVisible(false);
    } catch (error) {
      console.error('Save Department Error:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving the department.');
    }
  };

  const handleDeleteDepartment = (departmentId) => {
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
              await deleteDepartment(token, departmentId);
              Alert.alert('Success', 'Department deleted successfully.');
            } catch (error) {
              console.error('Delete Department Error:', error);
              Alert.alert('Error', 'An unexpected error occurred while deleting the department.');
            }
          } 
        },
      ]
    );
  };

  const renderDepartmentItem = ({ item }) => (
    <View className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
      {/* Department Information */}
      <View className="flex-1">
        <Text className={`text-lg font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          {item.name}
        </Text>
        <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
          Company: {currentUser.companyName}
        </Text>
        <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
          Supervisor: {item.supervisor ? `${item.supervisor.firstName} ${item.supervisor.lastName}` : 'None'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row">
        <Pressable onPress={() => handleEditDepartment(item)} className="mr-2">
          <Ionicons name="create-outline" size={24} color="#10b981" />
        </Pressable>
        <Pressable onPress={() => handleDeleteDepartment(item.id)}>
          <Ionicons name="trash-outline" size={24} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );

  // If currentUser is not available yet
  if (!currentUser) {
    return (
      <View className={`flex-1 justify-center items-center ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          Manage Departments
        </Text>
      </View>

      {/* Add Department Button */}
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text className={`text-2xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          Departments
        </Text>
        <Pressable
          onPress={handleOpenAddDepartment}
          className={`p-2 rounded-full ${isLightTheme ? 'bg-slate-700' : 'bg-slate-600'}`}
          accessibilityLabel="Add Department"
          accessibilityHint="Opens a form to add a new department"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Department List */}
      {(loading || usersLoading) ? (
        <ActivityIndicator size="large" color="#475569" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={departments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDepartmentItem}
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
            <Text className={`text-center mt-12 text-lg ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              No departments found in your company.
            </Text>
          }
        />
      )}

      {/* Add/Edit Department Modal */}
      <Modal
        visible={departmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDepartmentModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center bg-black/50">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '90%' }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
              >
                <View
                  className={`p-4 ${isLightTheme ? 'bg-white' : 'bg-slate-800'} rounded-lg`}
                >
                  <Text className={`text-18 font-bold mb-4 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                    {editingDepartment ? 'Edit Department' : 'Add Department'}
                  </Text>

                  {/* Department Name */}
                  <Text className={`text-sm mb-1 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                    Department Name
                  </Text>
                  <TextInput
                    className={`w-full p-2 mb-4 rounded ${isLightTheme ? 'bg-slate-100 text-gray-800' : 'bg-slate-700 text-gray-100'}`}
                    value={deptName}
                    onChangeText={setDeptName}
                    placeholder="e.g., Human Resources"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Company Name (Read-Only) */}
                  <Text className={`text-sm mb-1 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                    Company
                  </Text>
                  <View className={`w-full p-2 mb-4 rounded ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'}`}>
                    <Text className={`text-gray-800 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                      {currentUser.companyName}
                    </Text>
                  </View>

                  {/* Supervisor Picker */}
                  <Text className={`text-sm mb-1 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                    Supervisor
                  </Text>
                  <View className={`w-full p-2 mb-4 rounded ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'}`}>
                    <Picker
                      selectedValue={deptSupervisorId === null ? 'null' : String(deptSupervisorId)}
                      onValueChange={(itemValue) => {
                        if (itemValue === 'null') {
                          setDeptSupervisorId(null);
                        } else {
                          setDeptSupervisorId(Number(itemValue));
                        }
                      }}
                      style={{ color: isLightTheme ? '#000' : '#fff' }}
                      mode="dropdown"
                    >
                      <Picker.Item label="Select a supervisor..." value="null" />
                      {users.filter((u) => u.role.toLowerCase() === 'supervisor').map((supervisor) => (
                        <Picker.Item 
                          key={supervisor.id} 
                          label={`${supervisor.firstName} ${supervisor.lastName}`} 
                          value={String(supervisor.id)} 
                        />
                      ))}
                    </Picker>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row justify-end">
                    <TouchableOpacity
                      onPress={() => setDepartmentModalVisible(false)}
                      className="mr-4"
                    >
                      <Text className={`text-sm font-semibold ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveDepartment}
                      className="bg-green-500 p-2 rounded"
                    >
                      <Text className="text-white text-sm font-semibold">
                        {editingDepartment ? 'Update' : 'Create'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageDepartments;
