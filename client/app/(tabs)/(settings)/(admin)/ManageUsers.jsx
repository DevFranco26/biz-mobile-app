// File: app/(tabs)/(settings)/(admin)/ManageUsers.jsx

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
  ScrollView,
  Switch
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import useUsersStore from '../../../../store/usersStore';
import useLocationsStore from '../../../../store/locationsStore'; 
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getRoleColor = (role) => {
  switch(role.toLowerCase()) {
    case 'admin':
      return '#ef4444'; 
    case 'supervisor':
      return '#10b981'; 
    case 'user':
    default:
      return '#3b82f6'; 
  }
};

const getRoleIcon = (role) => {
  switch(role.toLowerCase()) {
    case 'admin':
      return 'shield-checkmark-outline';
    case 'supervisor':
      return 'briefcase-outline';
    case 'user':
    default:
      return 'person-outline';
  }
};

// Determine the icon and color based on final presence status
const getPresenceIconInfo = (presenceStatus) => {
  switch (presenceStatus) {
    case 'active':
      return { icon: 'ellipse', color: '#10b981' }; // green
    case 'away':
      return { icon: 'ellipse', color: '#f97316' }; // orange
    case 'offline':
    default:
      return { icon: 'ellipse-outline', color: '#d1d5db' }; // gray
  }
};

const ManageUsers = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { users, loading, error, fetchUsers, deleteUser } = useUsersStore();
  const { locations, fetchLocations } = useLocationsStore();

  const [userSettingsByUserId, setUserSettingsByUserId] = useState({});
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [userSettingsModalVisible, setUserSettingsModalVisible] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // Fields for add/edit user modal
  const [editFirstName, setEditFirstName] = useState('');
  const [editMiddleName, setEditMiddleName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState(false);

  // Fields for user settings modal
  const [restrictionEnabled, setRestrictionEnabled] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [userSettingsLoading, setUserSettingsLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUsers(storedToken);
        await fetchLocations(storedToken);
      } else {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/signin');
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const fetchSettingsIfNeeded = async () => {
      if (token && users.length > 0) {
        await fetchAllUserSettings(token);
      }
    };
    fetchSettingsIfNeeded();
  }, [users, token]);

  const onRefresh = async () => {
    if (token) {
      setRefreshing(true);
      await fetchUsers(token);
      await fetchLocations(token);
      await fetchAllUserSettings(token);
      setRefreshing(false);
    }
  };

  const fetchAllUserSettings = async (authToken) => {
    if (!authToken) return;
    const results = {};
    for (let user of users) {
      try {
        const res = await fetch(`${API_BASE_URL}/usersettings/all?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();

        if (res.ok && data.data && data.data.length > 0) {
          const setting = data.data[0];
          results[user.id] = {
            restrictionEnabled: setting.restrictionEnabled,
            locationLabel: setting.location?.label || '-'
          };
        } else {
          results[user.id] = {
            restrictionEnabled: false,
            locationLabel: '-'
          };
        }
      } catch (err) {
        console.error('Error fetching user settings:', err);
        results[user.id] = { restrictionEnabled: false, locationLabel: '-' };
      }
    }
    setUserSettingsByUserId(results);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFirstName(user.firstName || '');
    setEditMiddleName(user.middleName || '');
    setEditLastName(user.lastName || '');
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditEmail(user.email || '');
    setEditPassword('');
    setEditStatus(user.status || false);
    setEditUserModalVisible(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setEditFirstName('');
    setEditMiddleName('');
    setEditLastName('');
    setEditPhone('');
    setEditRole('user');
    setEditEmail('');
    setEditPassword('');
    setEditStatus(false);
    setEditUserModalVisible(true);
  };

  const handleSaveUserEdits = async () => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    if (!editEmail) {
      Alert.alert('Validation Error', 'Email is required.');
      return;
    }

    if (!selectedUser && !editPassword) {
      Alert.alert('Validation Error', 'Password is required for new users.');
      return;
    }

    const payload = {
      email: editEmail,
      role: editRole,
      firstName: editFirstName,
      middleName: editMiddleName,
      lastName: editLastName,
      phone: editPhone,
      status: editStatus
    };

    if (editPassword) {
      payload.password = editPassword;
    }

    try {
      let res, data;
      if (selectedUser) {
        // Editing existing user
        res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        data = await res.json();
      } else {
        // Creating new user
        res = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        data = await res.json();
      }

      if (res.ok) {
        Alert.alert('Success', selectedUser ? 'User updated successfully.' : 'User created successfully.');
        setEditUserModalVisible(false);
        await fetchUsers(token);
        await fetchAllUserSettings(token);
      } else {
        Alert.alert('Error', data.message || 'Failed to save user.');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Success', 'User deleted successfully.');
                await fetchUsers(token);
                await fetchAllUserSettings(token);
              } else {
                Alert.alert('Error', data.message || 'Failed to delete user.');
              }
            } catch (err) {
              console.error('Error deleting user:', err);
              Alert.alert('Error', 'An unexpected error occurred.');
            }
          } 
        },
      ]
    );
  };

  const openUserSettingsModal = async (user) => {
    setUserSettingsLoading(true);
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/usersettings/all?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data && data.data.length > 0) {
        const setting = data.data[0];
        setRestrictionEnabled(setting.restrictionEnabled);
        setSelectedLocationId(setting.locationId);
      } else {
        setRestrictionEnabled(false);
        setSelectedLocationId(null);
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
      Alert.alert('Error', 'Could not load user settings.');
      setRestrictionEnabled(false);
      setSelectedLocationId(null);
    }

    setUserSettingsLoading(false);
    setSelectedUser(user);
    setUserSettingsModalVisible(true);
  };

  const handleSaveUserSettings = async () => {
    if (!selectedUser) return;
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    if (restrictionEnabled && !selectedLocationId) {
      Alert.alert('Validation Error', 'Please select a location if restriction is enabled.');
      return;
    }

    const payload = {
      userId: selectedUser.id,
      restrictionEnabled,
      locationId: restrictionEnabled ? selectedLocationId : null
    };

    try {
      const res = await fetch(`${API_BASE_URL}/usersettings/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', restrictionEnabled ? 'User settings updated successfully.' : 'User settings disabled successfully.');
        setUserSettingsModalVisible(false);
        await fetchAllUserSettings(token);
      } else {
        Alert.alert('Error', data.message || 'Failed to update user settings.');
      }
    } catch (err) {
      console.error('Error updating user settings:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const handleUserAction = (user) => {
    Alert.alert(
      'User Actions',
      `Choose an action for "${user.firstName} ${user.lastName}".`,
      [
        { text: 'Edit', onPress: () => handleEditUser(user) },
        { text: 'Delete', onPress: () => handleDeleteUser(user.id) },
        { text: 'Location Restriction', onPress: () => openUserSettingsModal(user) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const userSettings = userSettingsByUserId[item.id];
    let restrictionText = 'Disabled';
    if (userSettings?.restrictionEnabled) {
      restrictionText = `${userSettings.locationLabel}`;
    }

    // item.presenceStatus and item.presenceTooltip are now precomputed by the backend
    const { icon: presenceIcon, color: presenceColor } = getPresenceIconInfo(item.presenceStatus);
    const presenceTooltip = item.presenceTooltip; // Provided by the backend

    const isOnline = item.status;

    return (
      <View className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
        <View className="flex-row items-center flex-1">
          <Ionicons name="person-circle" size={50} color={isLightTheme ? '#4b5563' : '#d1d5db'} />

          <View className="ml-3 flex-1">
            <View className="flex-row items-center gap-1">
              <Text className={`text-lg font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
                {item.firstName} {item.middleName ? `${item.middleName} ` : ''}{item.lastName}
              </Text>
              {/* Presence status icon */}
              <Ionicons
                name={presenceIcon}
                size={12}
                color={presenceColor}
                style={{ marginLeft: 6 }}
              />
            </View>


              {/* Display tooltip */}
              {presenceTooltip && (
                <Text className={`my-auto text-sm mt-1 ${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
                  {presenceTooltip}
                </Text>
              )}
            {/* Email */}
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name="mail-outline" 
                size={16} 
                color={isLightTheme ? '#4b5563' : '#d1d5db'} 
                style={{ marginRight: 4 }}
              />
              <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                {capitalizeFirstLetter(item.email)}
              </Text>
            </View>

            {/* Role */}
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name={getRoleIcon(item.role)} 
                size={16} 
                color={getRoleColor(item.role)} 
                style={{ marginRight: 4 }}
              />
              <Text style={{ color: getRoleColor(item.role), fontWeight: '600' }}>
                {capitalizeFirstLetter(item.role)}
              </Text>
            </View>

            {/* Location Restriction */}
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name="location-outline" 
                size={16} 
                color={userSettings?.restrictionEnabled ? '#f97316' : '#6b7280'} 
                style={{ marginRight: 4 }}
              />
              <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                {restrictionText}
              </Text>
            </View>

            {/* Punch In/Out Status */}
            <View className="flex-row items-center mt-1">
              <Ionicons
                name={isOnline ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isOnline ? '#10b981' : '#d1d5db'}
                style={{ marginRight: 4 }}
              />
              <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
                {isOnline ? 'Punched In' : 'Punched Out'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable onPress={() => handleUserAction(item)} className="p-2">
          <Ionicons name="ellipsis-vertical" size={24} color={isLightTheme ? '#1f2937' : '#f9fafb'} />
        </Pressable>
      </View>
    );
  };

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
          Manage Users
        </Text>
      </View>
      
      {/* Add User Button */}
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text className={`text-2xl font-bold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
          Users
        </Text>
        <Pressable
          onPress={handleAddUser}
          className={`p-2 rounded-full ${isLightTheme ? 'bg-slate-700' : 'bg-slate-600'}`}
          accessibilityLabel="Add User"
          accessibilityHint="Opens a form to add a new user"
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#475569" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={users}
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
            <Text className={`text-center mt-12 text-lg ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              No users found in your company.
            </Text>
          }
        />
      )}

      {/* Add/Edit User Modal */}
      <Modal
        visible={editUserModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditUserModalVisible(false)}
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
                  style={{
                    padding: 16,
                    backgroundColor: isLightTheme ? '#fff' : '#1f2937',
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: isLightTheme ? '#1f2937' : '#fff' }}>
                    {selectedUser ? 'Edit User' : 'Add User'}
                  </Text>

                  {/* Email */}
                  <Text style={{ fontSize: 14, marginBottom: 2, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                    Email
                  </Text>
                  <TextInput
                    style={{
                      width: '100%',
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: isLightTheme ? '#f3f4f6' : '#374151',
                      color: isLightTheme ? '#1f2937' : '#d1d5db',
                      fontSize: 14,
                    }}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="e.g., user@example.com"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  {/* Password */}
                  <Text style={{ fontSize: 14, marginBottom: 2, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                    {selectedUser ? 'New Password (leave blank to keep current)' : 'Password'}
                  </Text>
                  <TextInput
                    style={{
                      width: '100%',
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: isLightTheme ? '#f3f4f6' : '#374151',
                      color: isLightTheme ? '#1f2937' : '#d1d5db',
                      fontSize: 14,
                    }}
                    value={editPassword}
                    onChangeText={setEditPassword}
                    placeholder={selectedUser ? 'Enter new password' : 'Enter password'}
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    secureTextEntry
                  />

                  {/* First Name */}
                  <Text style={{ fontSize: 14, marginBottom: 2, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                    First Name
                  </Text>
                  <TextInput
                    style={{
                      width: '100%',
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: isLightTheme ? '#f3f4f6' : '#374151',
                      color: isLightTheme ? '#1f2937' : '#d1d5db',
                      fontSize: 14,
                    }}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="e.g., John"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Middle Name */}
                  <Text style={{ fontSize: 14, marginBottom: 2, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                    Middle Name
                  </Text>
                  <TextInput
                    style={{
                      width: '100%',
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: isLightTheme ? '#f3f4f6' : '#374151',
                      color: isLightTheme ? '#1f2937' : '#d1d5db',
                      fontSize: 14,
                    }}
                    value={editMiddleName}
                    onChangeText={setEditMiddleName}
                    placeholder="e.g., A."
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Last Name */}
                  <Text style={{ fontSize: 14, marginBottom: 2, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                    Last Name
                  </Text>
                  <TextInput
                    style={{
                      width: '100%',
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: isLightTheme ? '#f3f4f6' : '#374151',
                      color: isLightTheme ? '#1f2937' : '#d1d5db',
                      fontSize: 14,
                    }}
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="e.g., Doe"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Phone */}
                  <Text style={{ fontSize: 14, marginBottom: 2, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                    Phone
                  </Text>
                  <TextInput
                    style={{
                      width: '100%',
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: isLightTheme ? '#f3f4f6' : '#374151',
                      color: isLightTheme ? '#1f2937' : '#d1d5db',
                      fontSize: 14,
                    }}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="e.g., +1 234 567 890"
                    keyboardType="phone-pad"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Role */}
                  <Text style={{ fontSize: 14, marginBottom: 2, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                    Role
                  </Text>
                  <View style={{
                    borderWidth: 1,
                    borderColor: isLightTheme ? '#d1d5db' : '#4b5563',
                    borderRadius: 8,
                    marginBottom: 8, 
                    backgroundColor: isLightTheme ? '#f3f4f6' : '#374151',
                  }}>
                    <Picker
                      selectedValue={editRole}
                      onValueChange={(value) => setEditRole(value)}
                      style={{ color: isLightTheme ? '#000' : '#fff' }}
                    >
                      <Picker.Item label="User" value="user" />
                      <Picker.Item label="Admin" value="admin" />
                      <Picker.Item label="Supervisor" value="supervisor" />
                    </Picker>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                      onPress={() => setEditUserModalVisible(false)}
                      style={{ marginRight: 12 }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '600', color: isLightTheme ? '#374151' : '#d1d5db' }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveUserEdits}
                      style={{
                        backgroundColor: '#10b981',
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                        Save
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* User Settings Modal */}
      <Modal
        visible={userSettingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUserSettingsModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{
            width: '90%',
            padding: 24,
            backgroundColor: isLightTheme ? '#fff' : '#1f2937',
            borderRadius: 12,
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: isLightTheme ? '#1f2937' : '#fff' }}>
              User Location Restriction
            </Text>
            {userSettingsLoading ? (
              <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 24 }} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ flex: 1, fontSize: 16, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                    Restrict user {selectedUser?.firstName} {selectedUser?.lastName} to a location?
                  </Text>
                  <Switch
                    value={restrictionEnabled}
                    onValueChange={setRestrictionEnabled}
                    trackColor={{ true: '#f97316', false: '#9ca3af' }}
                    thumbColor={restrictionEnabled ? '#1e293b' : (isLightTheme ? '#f4f4f5' : '#1e293b')}
                  />
                </View>

                {restrictionEnabled && (
                  <>
                    <Text style={{ fontSize: 16, marginBottom: 4, color: isLightTheme ? '#1f2937' : '#d1d5db' }}>
                      Select a Location
                    </Text>
                    <View style={{
                      borderWidth: 1,
                      borderColor: isLightTheme ? '#d1d5db' : '#4b5563',
                      borderRadius: 8,
                      marginBottom: 16,
                      backgroundColor: isLightTheme ? '#f3f4f6' : '#374151',
                    }}>
                      <Picker
                        selectedValue={selectedLocationId === null ? 'null' : String(selectedLocationId)}
                        onValueChange={(itemValue) => {
                          if (itemValue === 'null') {
                            setSelectedLocationId(null);
                          } else {
                            setSelectedLocationId(Number(itemValue));
                          }
                        }}
                        style={{ color: isLightTheme ? '#000' : '#fff' }}
                      >
                        <Picker.Item label="Select a location..." value="null" />
                        {locations.map((loc) => (
                          <Picker.Item key={loc.id} label={loc.label} value={String(loc.id)} />
                        ))}
                      </Picker>
                    </View>
                  </>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => setUserSettingsModalVisible(false)}
                    style={{ marginRight: 16 }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: isLightTheme ? '#374151' : '#d1d5db' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveUserSettings}
                    style={{
                      backgroundColor: '#f97316',
                      paddingVertical: 12,
                      paddingHorizontal: 24,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                      Confirm
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageUsers;
