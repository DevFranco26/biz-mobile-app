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
  Switch
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import useUsersStore from '../../../../store/usersStore';
import useLocationsStore from '../../../../store/locationsStore'; 
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker'; // Importing DropDownPicker

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
      return { icon: 'ellipse-outline', color: '#d1d5db' }; // slate
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

  // DropDownPicker state for Role
  const [roleOpen, setRoleOpen] = useState(false);
  const [roleItems, setRoleItems] = useState([
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' },
    { label: 'Supervisor', value: 'supervisor' },
  ]);

  // Fields for user settings modal
  const [restrictionEnabled, setRestrictionEnabled] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [userSettingsLoading, setUserSettingsLoading] = useState(false);

  // DropDownPicker state for Location
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationItems, setLocationItems] = useState([]);

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

  useEffect(() => {
    // Update locationItems when locations data changes
    if (locations.length > 0) {
      const formattedLocations = locations.map((loc) => ({
        label: loc.label,
        value: loc.id,
      }));
      setLocationItems(formattedLocations);
    } else {
      setLocationItems([]);
    }
  }, [locations]);

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

    // Validate required fields
    if (!editEmail || !editFirstName || !editLastName || !editPhone || !editRole) {
      Alert.alert('Validation Error', 'Please fill in all required fields marked with *.');
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
              <Text className={`text-lg font-semibold ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                {item.firstName} {item.middleName ? `${item.middleName} ` : ''}{item.lastName}
              </Text>
              {/* Presence status icon */}
              <Ionicons
                name={presenceIcon}
                size={12}
                color={presenceColor}
                className="ml-1.5"
              />
            </View>

            {/* Display tooltip */}
            {presenceTooltip && (
              <Text className={`my-auto text-sm mt-1 ${isLightTheme ? 'text-slate-600' : 'text-slate-300'}`}>
                {presenceTooltip}
              </Text>
            )}
            {/* Email */}
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name="mail-outline" 
                size={16} 
                color={isLightTheme ? '#4b5563' : '#d1d5db'} 
                className="mr-1"
              />
              <Text className={`${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                {capitalizeFirstLetter(item.email)}
              </Text>
            </View>

            {/* Role */}
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name={getRoleIcon(item.role)} 
                size={16} 
                color={getRoleColor(item.role)} 
                className="mr-1"
              />
              <Text style={{ color: getRoleColor(item.role) }} className="font-semibold">
                {capitalizeFirstLetter(item.role)}
              </Text>
            </View>

            {/* Location Restriction */}
            <View className="flex-row items-center mt-1">
              <Ionicons 
                name="location-outline" 
                size={16} 
                color={userSettings?.restrictionEnabled ? '#f97316' : '#6b7280'} 
                className="mr-1"
              />
              <Text className={`${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                {restrictionText}
              </Text>
            </View>

            {/* Punch In/Out Status */}
            <View className="flex-row items-center mt-1">
              <Ionicons
                name={isOnline ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isOnline ? '#10b981' : '#d1d5db'}
                className="mr-1"
              />
              <Text className={`${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
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
        <Text className={`text-lg font-bold ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
          Manage Users
        </Text>
      </View>
      
      {/* Add User Button */}
      <View className="flex-row justify-between items-center px-4 mb-4 z-50">
        <Text className={`text-2xl font-bold ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
          Users
        </Text>
        <Pressable
          onPress={handleAddUser}
          className={`p-2 rounded-full ${
            isLightTheme ? 'bg-white' : 'bg-slate-900'
          }`}
        >
          <Ionicons name="add" size={24} color={isLightTheme? `#1e293b` : `#cbd5e1`} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#475569" className="mt-12" />
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
            <Text className={`text-center mt-12 text-lg ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
              No users found in your company.
            </Text>
          }
        />
      )}

      {/* Add/Edit User Modal */}
<Modal
  visible={editUserModalVisible}
  animationType="fade"
  transparent={true}
  onRequestClose={() => setEditUserModalVisible(false)}
>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View className={`flex-1 justify-center items-center  ${isLightTheme ? 'bg-slate-950/70' : 'bg-slate-950/70'}`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="w-11/12"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
      >
        <View
          className={`p-6 rounded-2xl w-full ${isLightTheme ? 'bg-white' : 'bg-slate-900'} `}
        >
          {/* Modal Title */}
          <Text
            className={`text-xl font-bold mb-4 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            {selectedUser ? 'Edit User' : 'Add User'}
          </Text>

          {/* Role */}
          <Text
            className={`text-sm font-medium mb-1 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Role <Text className="text-red-500">*</Text>
          </Text>
          <View
            className={`border rounded-lg mb-4 ${
              isLightTheme
                ? 'border-slate-100 bg-slate-100'
                : 'border-slate-800 bg-slate-800'
            }`}
          >
            <DropDownPicker
              open={roleOpen}
              value={editRole}
              items={roleItems}
              setOpen={setRoleOpen}
              setValue={setEditRole}
              setItems={setRoleItems}
              placeholder="Select Role"
              textStyle={{
                color: isLightTheme ? '#374151' : '#E5E7EB',
              }}
              style={{
                borderWidth: 0, 
                backgroundColor: isLightTheme ? '#F1F5F9' : '#1E293B',
                paddingVertical: 12,
                paddingHorizontal: 10,
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
              zIndex={9999}
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
          </View>

          {/* Email */}
          <Text
            className={`text-sm font-medium mb-1 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Email <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`w-full p-3 mb-4 rounded-lg border ${
              isLightTheme
                ? 'border-slate-100 bg-slate-100 text-slate-800'
                : 'border-slate-800 bg-slate-800 text-slate-300'
            }`}
            value={editEmail}
            onChangeText={setEditEmail}
            placeholder="e.g., user@example.com"
            placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <Text
            className={`text-sm font-medium mb-1 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            {selectedUser
              ? 'New Password (leave blank to keep current)'
              : 'Password'}
          </Text>
          <TextInput
            className={`w-full p-3 mb-4 rounded-lg border ${
              isLightTheme
                ? 'border-slate-100 bg-slate-100 text-slate-800'
                : 'border-slate-800 bg-slate-800 text-slate-300'
            }`}
            value={editPassword}
            onChangeText={setEditPassword}
            placeholder={
              selectedUser ? 'Enter new password' : 'Enter password'
            }
            placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
            secureTextEntry
          />

          {/* First Name */}
          <Text
            className={`text-sm font-medium mb-1 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            First Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`w-full p-3 mb-4 rounded-lg border ${
              isLightTheme
                ? 'border-slate-100 bg-slate-100 text-slate-800'
                : 'border-slate-800 bg-slate-800 text-slate-300'
            }`}
            value={editFirstName}
            onChangeText={setEditFirstName}
            placeholder="e.g., John"
            placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
          />

          {/* Middle Name */}
          <Text
            className={`text-sm font-medium mb-1 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Middle Name
          </Text>
          <TextInput
            className={`w-full p-3 mb-4 rounded-lg border ${
              isLightTheme
                ? 'border-slate-100 bg-slate-100 text-slate-800'
                : 'border-slate-800 bg-slate-800 text-slate-300'
            }`}
            value={editMiddleName}
            onChangeText={setEditMiddleName}
            placeholder="e.g., A."
            placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
          />

          {/* Last Name */}
          <Text
            className={`text-sm font-medium mb-1 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Last Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`w-full p-3 mb-4 rounded-lg border ${
              isLightTheme
                ? 'border-slate-100 bg-slate-100 text-slate-800'
                : 'border-slate-800 bg-slate-800 text-slate-300'
            }`}
            value={editLastName}
            onChangeText={setEditLastName}
            placeholder="e.g., Doe"
            placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
          />

          {/* Phone */}
          <Text
            className={`text-sm font-medium mb-1 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-300'
            }`}
          >
            Phone <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`w-full p-3 mb-6 rounded-lg border ${
              isLightTheme
                ? 'border-slate-100 bg-slate-100 text-slate-800'
                : 'border-slate-800 bg-slate-800 text-slate-300'
            }`}
            value={editPhone}
            onChangeText={setEditPhone}
            placeholder="e.g., +1 234 567 890"
            placeholderTextColor={isLightTheme ? '#9CA3AF' : '#6B7280'}
            keyboardType="phone-pad"
          />

          {/* Action Buttons */}
          <View className="flex-row justify-end">
            <TouchableOpacity
              onPress={() => setEditUserModalVisible(false)}
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
              onPress={handleSaveUserEdits}
              className="bg-orange-500 py-3 px-6 rounded-lg"
            >
              <Text className="text-white text-base font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  </TouchableWithoutFeedback>
</Modal>

{/* User Settings Modal */}
<Modal
  visible={userSettingsModalVisible}
  animationType="fade"
  transparent={true}
  onRequestClose={() => setUserSettingsModalVisible(false)}
>
  <View className={`flex-1 justify-center items-center  ${isLightTheme ? 'bg-slate-950/70' : 'bg-slate-950/70'}`}>
    <View className={`w-11/12 p-6 rounded-lg ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
      <Text className={`text-2xl font-bold mb-4 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
        User Location Restriction
      </Text>
      {userSettingsLoading ? (
        <ActivityIndicator size="large" color="#10b981" className="mt-6" />
      ) : (
        <>
          <View className="flex-row items-center mb-4">
            <Text className={`flex-1 text-base ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
              Restrict user {selectedUser?.firstName} {selectedUser?.lastName} to a location?
            </Text>
            <Switch
              value={restrictionEnabled}
              onValueChange={setRestrictionEnabled}
              trackColor={{ true: '#f97316', false: '#9ca3af' }}
              thumbColor={restrictionEnabled ? (isLightTheme ? '#1e293b' : '#f4f4f5') : (isLightTheme ? '#f4f4f5' : '#1e293b')}
            />
          </View>

          {restrictionEnabled && (
            <>
              <Text className={`text-base mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                Select a Location <Text className="text-red-500">*</Text>
              </Text>
              <View className={`border rounded-lg mb-4 z-40 ${isLightTheme ? 'border-slate-100 bg-slate-100' : 'border-slate-800 bg-slate-800'}`}>
                <DropDownPicker
                  open={locationOpen}
                  value={selectedLocationId}
                  items={locationItems}
                  setOpen={setLocationOpen}
                  setValue={setSelectedLocationId}
                  setItems={setLocationItems}
                  placeholder="Select Location"
                  arrowIconStyle={{
                    tintColor: isLightTheme ? '#1e293b' : '#cbd5e1', 
                  }}
                  tickIconStyle={{
                    tintColor: isLightTheme ? '#1e293b' : '#cbd5e1', 
                  }}
                  /* Text color for the items in the picker */
                  textStyle={{
                    color: isLightTheme ? '#374151' : '#F1F5F9',
                    fontSize: 16,
                  }}

                  /* Main style for the dropdown button */
                  style={{
                    borderWidth: 1,
                    borderColor: isLightTheme ? '#F1F5F9' : '#1e293b',
                    backgroundColor: isLightTheme ? '#F1F5F9' : '#1e293b', 
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                  }}

                  /* Style for the container that appears when the dropdown is expanded */
                  dropDownContainerStyle={{
                    borderWidth: 1,
                    borderColor: isLightTheme ? '#F1F5F9' : '#1e293b',
                    backgroundColor: isLightTheme ? '#F1F5F9' : '#1e293b',
                    borderRadius: 8,
                  }}

                  /* Customize placeholder text color */
                  placeholderStyle={{
                    color: isLightTheme ? '#9CA3AF' : '#6B7280', // slate-400 vs. slate-600
                  }}

                  /* Example of customizing each item’s label rendering */
                  ListItemComponent={({ item }) => (
                    <Text
                      style={{
                        color: isLightTheme ? '#374151' : '#F1F5F9',
                        fontSize: 16,
                      }}
                    >
                      {item.label}
                    </Text>
                  )}

                  /* Use this if you want an icon, e.g., a chevron-down */
                  Icon={() => (
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={isLightTheme ? '#6B7280' : '#D1D5DB'}
                    />
                  )}
                />
              </View>
            </>
          )}

          <View className="flex-row justify-end mt-6">
            <TouchableOpacity
              onPress={() => setUserSettingsModalVisible(false)}
              className="mr-4"
            >
              <Text className={`text-base font-semibold my-auto ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`} >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveUserSettings}
              className="bg-orange-500 py-3 px-6 rounded-lg"
            >
              <Text className="text-white text-base font-semibold">
                Save
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
