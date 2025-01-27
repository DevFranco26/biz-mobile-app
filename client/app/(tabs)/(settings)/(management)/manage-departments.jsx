// File: client/components/Departments.jsx

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
  RefreshControl,
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import useDepartmentStore from '../../../../store/departmentStore';
import useUsersStore from '../../../../store/usersStore';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../../../../config/constant';
import DropDownPicker from 'react-native-dropdown-picker';

const Departments = () => {
  // Theme management
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  // Navigation
  const router = useRouter();

  // Department store
  const { departments, loading, error, fetchDepartments } = useDepartmentStore();

  // Users store
  const { users, fetchUsers: fetchAllUsers } = useUsersStore();

  // Local state
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [editDeptModalVisible, setEditDeptModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(null);

  // States for Assign User Modal
  const [assignUserModalVisible, setAssignUserModalVisible] = useState(false);
  const [currentUsers, setCurrentUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([]);

  // Initialize token and fetch data
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
      await fetchAllUsers(storedToken);
    };
    initialize();
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchDepartments(token);
    await fetchAllUsers(token);
    setRefreshing(false);
  };

  // Add Department Handler
  const handleAddDepartment = () => {
    setSelectedDepartment(null);
    setDeptName('');
    setEditDeptModalVisible(true);
  };

  // Edit Department Handler
  const handleEditDepartment = (dept) => {
    setSelectedDepartment(dept);
    setDeptName(dept.name);
    setEditDeptModalVisible(true);
  };

  // Delete Department Handler
  const handleDeleteDepartment = async (departmentId) => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this department?', [
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
              await fetchAllUsers(token);
            } else {
              Alert.alert('Error', data.message || 'Failed to delete department.');
            }
          } catch (err) {
            console.error('Error deleting department:', err);
            Alert.alert('Error', 'An unexpected error occurred.');
          }
        },
      },
    ]);
  };

  // Department Action Handler (Edit/Delete)
  const handleDepartmentAction = (dept) => {
    Alert.alert('Department Actions', `Choose an action for "${dept.name}".`, [
      { text: 'Edit', onPress: () => handleEditDepartment(dept) },
      { text: 'Delete', onPress: () => handleDeleteDepartment(dept.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Save Department Handler
  const handleSaveDepartmentEdits = async () => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }
    if (!deptName.trim()) {
      Alert.alert('Validation Error', 'Department name is required.');
      return;
    }
    try {
      let res, data;
      if (selectedDepartment) {
        const url = `${API_BASE_URL}/departments/update/${selectedDepartment.id}`;
        res = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: deptName }),
        });
        data = await res.json();
      } else {
        const url = `${API_BASE_URL}/departments/create`;
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: deptName }),
        });
        data = await res.json();
      }
      if (res.ok) {
        Alert.alert(
          'Success',
          selectedDepartment ? 'Department updated successfully.' : 'Department created successfully.'
        );
        setEditDeptModalVisible(false);
        await fetchDepartments(token);
        await fetchAllUsers(token);
      } else {
        Alert.alert('Error', data.message || 'Failed to save department.');
      }
    } catch (err) {
      console.error('Error saving department:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // Open Assign User Modal Handler
  const openAssignUserModal = (department) => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }
    setSelectedDepartment(department);
    setAssignUserModalVisible(true);
    loadUsersForDepartment(department.id);
  };

  // Load Users for Selected Department
  const loadUsersForDepartment = (departmentId) => {
    // Assuming users have a 'departmentId' field
    const current = users.filter((user) => user.departmentId === departmentId);
    const available = users.filter((user) => user.departmentId !== departmentId && user.role !== 'superAdmin');
    setCurrentUsers(current);
    setAvailableUsers(available);
    const dropdownData = available.map((user) => ({
      label: user.email,
      value: user.id,
    }));
    setDropdownItems(dropdownData);
    setSelectedUserId(null); // Reset selected user
  };

  // Add User to Department Handler
  const handleAddUserToDepartment = async () => {
    if (selectedUserId === null) {
      Alert.alert('Validation Error', 'Please select a user to add.');
      return;
    }
    try {
      const url = `${API_BASE_URL}/departments/${selectedDepartment.id}/assign-users`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: [selectedUserId] }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'User added to department successfully.');
        setAssignUserModalVisible(false);
        await fetchDepartments(token);
        await fetchAllUsers(token);
      } else {
        Alert.alert('Error', data.message || 'Failed to add user to department.');
      }
    } catch (error) {
      console.error('Error adding user to department:', error);
      Alert.alert('Error', 'An unexpected error occurred while adding user to department.');
    }
  };

  // Render Each Department Item
  const renderItem = ({ item }) => {
    return (
      <View
        className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${
          isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
        }`}
      >
        <View className="flex-row items-center flex-1">
          <View>
            <Text
              className={`text-lg font-semibold ${
                isLightTheme ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              {item.name}
            </Text>
            {item.Supervisor && (
              <Text
                className={`text-sm ${
                  isLightTheme ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                Supervisor: {item.Supervisor.firstName} {item.Supervisor.lastName}
              </Text>
            )}
          </View>
        </View>
        <View className="flex-row">
          <Pressable onPress={() => openAssignUserModal(item)} className="my-auto">
            <FontAwesome5
              name="user-edit"
              size={20}
              color={isLightTheme ? '#1e293b' : '#cbd5e1'}
            />
          </Pressable>
          <Pressable onPress={() => handleDepartmentAction(item)} className="p-2">
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={isLightTheme ? '#1f2937' : '#f9fafb'}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  // Render Assigned User Item
  const renderAssignedUserItem = ({ item }) => {
    return (
      <View className="flex-row items-center mb-3">
        <Ionicons
          name="person-circle-outline"
          size={24}
          color={isLightTheme ? '#1e293b' : '#cbd5e1'}
          className="mr-2"
        />
        <View style={{ flex: 1 }}>
          <Text
            className={`font-semibold ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            {item.firstName} {item.middleName} {item.lastName}
          </Text>
          <Text
            className={`text-sm ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            ID: {item.id} | {item.UserShiftAssignment?.recurrence || 'N/A'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            handleDeleteUserFromDepartment(
              selectedDepartment.id,
              item.id,
              `${item.firstName} ${item.lastName}`
            )
          }
          className="ml-2"
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={isLightTheme ? '#EF4444' : '#EF4444'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Handle Deleting User from Department
  const handleDeleteUserFromDepartment = (departmentId, userId, userName) => {
    Alert.alert(
      'Confirm Removal',
      `Are you sure you want to remove ${userName} from this department?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const url = `${API_BASE_URL}/departments/${departmentId}/remove-user`;
              const res = await fetch(url, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Success', data.message || 'User removed from department successfully.');
                await fetchDepartments(token);
                await fetchAllUsers(token);
              } else {
                Alert.alert('Error', data.message || 'Failed to remove user from department.');
              }
            } catch (error) {
              console.error('Error removing user from department:', error);
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          },
        },
      ]
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
          Departments
        </Text>
      </View>

      {/* Title and Add Button */}
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

      {/* Departments List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={isLightTheme ? '#475569' : '#f9fafb'}
          style={{ marginTop: 48 }}
        />
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

      {/* Edit/Add Department Modal */}
      <Modal
        visible={editDeptModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditDeptModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            className={`flex-1 justify-center items-center ${
              isLightTheme ? 'bg-slate-950/70' : 'bg-slate-950/70'
            }`}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-11/12"
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
            >
              <View
                className={`p-6 rounded-2xl w-full ${
                  isLightTheme ? 'bg-white' : 'bg-slate-900'
                }`}
                style={{ maxHeight: '80%' }} // Limit modal height
              >
                <Text
                  className={`text-xl font-bold mb-4 ${
                    isLightTheme ? 'text-slate-900' : 'text-slate-300'
                  }`}
                >
                  {selectedDepartment ? 'Edit Department' : 'Add Department'}
                </Text>
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

      {/* Assign User Modal */}
      <Modal
        visible={assignUserModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssignUserModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAssignUserModalVisible(false)}>
          <View
            className={`flex-1 justify-center items-center ${
              isLightTheme ? 'bg-black/50' : 'bg-black/50'
            }`}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-11/12"
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                  className={`p-6 rounded-2xl w-full ${
                    isLightTheme ? 'bg-white' : 'bg-slate-900'
                  }`}
                  style={{ maxHeight: '100%' }} 
                >
                  <Text
                    className={`text-xl font-bold mb-4 ${
                      isLightTheme ? 'text-slate-900' : 'text-slate-300'
                    }`}
                  >
                    Manage Users in {selectedDepartment?.name}
                  </Text>
                  <Text
                    className={`text-sm font-medium mb-2 ${
                      isLightTheme ? 'text-slate-800' : 'text-slate-300'
                    }`}
                  >
                    Current Users:
                  </Text>
                  {currentUsers.length > 0 ? (
                    <FlatList
                      data={currentUsers}
                      keyExtractor={(user) => user.id.toString()}
                      renderItem={({ item }) => (
                        <Text
                          className={`text-sm mb-1 ${
                            isLightTheme ? 'text-slate-700' : 'text-slate-400'
                          }`}
                        >
                          {item.email}
                        </Text>
                      )}
                      style={{ maxHeight: 100, marginBottom: 10 }}
                      ListEmptyComponent={
                        <Text
                          className={`text-sm mb-1 ${
                            isLightTheme ? 'text-slate-700' : 'text-slate-400'
                          }`}
                        >
                          No users assigned to this department.
                        </Text>
                      }
                    />
                  ) : (
                    <Text
                      className={`text-sm mb-1 ${
                        isLightTheme ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      No users assigned to this department.
                    </Text>
                  )}
                  <Text
                    className={`text-sm font-medium mt-4 mb-2 ${
                      isLightTheme ? 'text-slate-800' : 'text-slate-300'
                    }`}
                  >
                    Add User:
                  </Text>
                  <DropDownPicker
                    open={dropdownOpen}
                    value={selectedUserId}
                    items={dropdownItems}
                    setOpen={setDropdownOpen}
                    setValue={setSelectedUserId}
                    setItems={setDropdownItems}
                    placeholder="Select User"
                    textStyle={{
                      color: isLightTheme ? '#374151' : '#E5E7EB',
                    }}
                    style={{
                      borderWidth: 0,
                      backgroundColor: isLightTheme ? '#F1F5F9' : '#1E293B',
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      marginBottom: 20,
                    }}
                    dropDownContainerStyle={{
                      borderColor: isLightTheme ? '#F1F5F9' : '#1E293B',
                      backgroundColor: isLightTheme ? '#F1F5F9' : '#1E293B',
                    }}
                    placeholderStyle={{
                      color: isLightTheme ? '#6B7280' : '#9CA3AF',
                    }}
                    arrowIconStyle={{
                      tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
                    }}
                    tickIconStyle={{
                      tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
                    }}
                    zIndex={10000} // Ensure dropdown appears above other components
                    zIndexInverse={1000}
                    dropDownDirection="BOTTOM"
                    ListItemComponent={({ item }) => (
                      <Text
                        className={`text-base ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-300'
                        }`}
                      >
                        {item.label}
                      </Text>
                    )}
                    Icon={() => (
                      <Ionicons
                        name="chevron-down"
                        size={20}
                        color={isLightTheme ? '#374151' : '#E5E7EB'}
                      />
                    )}
                  />
                  <View className="flex-row justify-end">
                    <TouchableOpacity
                      onPress={() => setAssignUserModalVisible(false)}
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
                      onPress={handleAddUserToDepartment}
                      className="bg-orange-500 py-3 px-6 rounded-lg"
                    >
                      <Text className="text-white text-base font-semibold">
                        Add User
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default Departments;
