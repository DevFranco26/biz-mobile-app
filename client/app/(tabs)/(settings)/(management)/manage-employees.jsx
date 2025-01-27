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
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import useThemeStore from '../../../../store/themeStore';
import useUserStore from '../../../../store/userStore';
import useUsersStore from '../../../../store/usersStore';
import useLocationsStore from '../../../../store/locationsStore';
import useSubscriptionStore from '../../../../store/subscriptionStore';
import useCompanyStore from '../../../../store/companyStore';
import { API_BASE_URL } from '../../../../config/constant';


// Utility Functions
const getMaxUsersFromRange = (rangeOfUsers) => {
  if (!rangeOfUsers || typeof rangeOfUsers !== 'string') {
    return 999999;
  }
  if (rangeOfUsers.includes('+')) {
    return 999999;
  }
  if (rangeOfUsers.includes('-')) {
    const parts = rangeOfUsers.split('-');
    if (parts.length === 2) {
      const maxPart = parts[1].trim();
      const parsedMax = parseInt(maxPart, 10);
      return isNaN(parsedMax) ? 999999 : parsedMax;
    }
  }
  const singleVal = parseInt(rangeOfUsers, 10);
  return isNaN(singleVal) ? 999999 : singleVal;
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const getRoleColor = (role) => {
  switch (role.toLowerCase()) {
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
  switch (role.toLowerCase()) {
    case 'admin':
      return 'shield-checkmark-outline';
    case 'supervisor':
      return 'briefcase-outline';
    case 'user':
    default:
      return 'person-outline';
  }
};

const getPresenceIconInfo = (presenceStatus) => {
  switch (presenceStatus) {
    case 'active':
      return { icon: 'ellipse', color: '#10b981' };
    case 'away':
      return { icon: 'ellipse', color: '#f97316' };
    case 'offline':
    default:
      return { icon: 'ellipse-outline', color: '#d1d5db' };
  }
};

// Custom Radio Button Component with nativewind
const RadioButton = ({ label, value, selected, onPress, isLightTheme }) => {
  return (
    <TouchableOpacity
      className="flex-row items-center mb-3"
      onPress={() => onPress(value)}
    >
      <View
        className={`h-5 w-5 rounded-full border-2 mr-2 flex items-center justify-center ${
          selected ? 'border-orange-500' : 'border-slate-400'
        }`}
      >
        {selected && (
          <View
            className={`h-2.5 w-2.5 rounded-full ${
              selected ? 'bg-orange-500' : ''
            }`}
          />
        )}
      </View>
      <Text className={`${isLightTheme ? 'text-slate-800' : 'text-slate-300'} text-base`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const Employees = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const { user } = useUserStore();
  const { currentSubscription } = useSubscriptionStore();
  const { users, loading, fetchUsers } = useUsersStore();
  const { locations, fetchLocations } = useLocationsStore();
  const { companyUserCounts, fetchCompanyUserCount } = useCompanyStore();
  const [userSettingsByUserId, setUserSettingsByUserId] = useState({});
  const [editUserModalVisible, setEditUserModalVisible] = useState(false);
  const [userSettingsModalVisible, setUserSettingsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editMiddleName, setEditMiddleName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('user'); // Default role
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState(false);
  const [restrictionEnabled, setRestrictionEnabled] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [userSettingsLoading, setUserSettingsLoading] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationItems, setLocationItems] = useState([]);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUsers(storedToken);
        await fetchLocations(storedToken);
        if (user?.companyId) {
          await fetchCompanyUserCount(storedToken, user.companyId);
        }
      } else {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/login-user');
      }
    };
    initialize();
  }, [user?.companyId]);

  useEffect(() => {
    const fetchSettingsIfNeeded = async () => {
      if (token && users.length > 0) {
        await fetchAllUserSettings(token);
      }
    };
    fetchSettingsIfNeeded();
  }, [users, token]);

  useEffect(() => {
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
      if (user?.companyId) {
        await fetchCompanyUserCount(token, user.companyId);
      }
      await fetchAllUserSettings(token);
      setRefreshing(false);
    }
  };

  const fetchAllUserSettings = async (authToken) => {
    if (!authToken) return;
    const results = {};
    for (let u of users) {
      try {
        const res = await fetch(`${API_BASE_URL}/usersettings/all?userId=${u.id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (res.ok && data.data && data.data.length > 0) {
          const setting = data.data[0];
          results[u.id] = {
            restrictionEnabled: setting.restrictionEnabled,
            locationLabel: setting.location?.label || '-',
          };
        } else {
          results[u.id] = {
            restrictionEnabled: false,
            locationLabel: '-',
          };
        }
      } catch (err) {
        console.error('Error fetching user settings:', err);
        results[u.id] = { restrictionEnabled: false, locationLabel: '-' };
      }
    }
    setUserSettingsByUserId(results);
  };

  const handleEditUser = (userObj) => {
    setSelectedUser(userObj);
    setEditFirstName(userObj.firstName || '');
    setEditMiddleName(userObj.middleName || '');
    setEditLastName(userObj.lastName || '');
    setEditPhone(userObj.phone || '');
    setEditRole(userObj.role.toLowerCase()); // Ensure role is in lowercase
    setEditEmail(userObj.email || '');
    setEditPassword('');
    setEditStatus(userObj.status || false);
    setEditUserModalVisible(true);
  };

  const handleAddUser = () => {
    const rangeStr = currentSubscription?.plan?.rangeOfUsers || '';
    const maxUsers = getMaxUsersFromRange(rangeStr);
    const userCount = companyUserCounts[user?.companyId] || 0;
    if (userCount >= maxUsers) {
      Alert.alert(
        'User Limit Reached',
        `Your current subscription plan only allows up to ${maxUsers} users.\n\n` +
          `You already have ${userCount} user(s) in your company.\n\n` +
          `Please upgrade your subscription to add more users.`
      );
      return;
    }
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
    console.log('Current editRole:', editRole); // Debugging statement
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/login-user');
      return;
    }
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
      role: editRole, // Ensure role is sent
      firstName: editFirstName,
      middleName: editMiddleName,
      lastName: editLastName,
      phone: editPhone,
      status: editStatus,
    };
    if (editPassword) {
      payload.password = editPassword;
    }

    try {
      let res, data;
      if (selectedUser) {
        res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      } else {
        res = await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      }
      if (res.ok) {
        Alert.alert('Success', selectedUser ? 'User updated successfully.' : 'User created successfully.');
        setEditUserModalVisible(false);
        await fetchUsers(token);
        if (user?.companyId) {
          await fetchCompanyUserCount(token, user.companyId);
        }
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
      router.replace('(auth)/login-user');
      return;
    }
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok) {
              Alert.alert('Success', 'User deleted successfully.');
              await fetchUsers(token);
              if (user?.companyId) {
                await fetchCompanyUserCount(token, user.companyId);
              }
              await fetchAllUserSettings(token);
            } else {
              Alert.alert('Error', data.message || 'Failed to delete user.');
            }
          } catch (err) {
            console.error('Error deleting user:', err);
            Alert.alert('Error', 'An unexpected error occurred.');
          }
        },
      },
    ]);
  };

  const openUserSettingsModal = async (userObj) => {
    setUserSettingsLoading(true);
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/login-user');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/usersettings/all?userId=${userObj.id}`, {
        headers: { Authorization: `Bearer ${token}` },
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
    setSelectedUser(userObj);
    setUserSettingsModalVisible(true);
  };

  const handleSaveUserSettings = async () => {
    if (!selectedUser) return;
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/login-user');
      return;
    }
    if (restrictionEnabled && !selectedLocationId) {
      Alert.alert('Validation Error', 'Please select a location if restriction is enabled.');
      return;
    }
    const payload = {
      userId: selectedUser.id,
      restrictionEnabled,
      locationId: restrictionEnabled ? selectedLocationId : null,
    };
    try {
      const res = await fetch(`${API_BASE_URL}/usersettings/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
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

  // Updated handleUserAction to remove 'Location Restriction'
  const handleUserAction = (userObj) => {
    Alert.alert(
      'User Actions',
      `Choose an action for "${userObj.firstName} ${userObj.lastName}".`,
      [
        { text: 'Edit', onPress: () => handleEditUser(userObj) },
        { text: 'Delete', onPress: () => handleDeleteUser(userObj.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // 
  const renderItem = ({ item }) => {
    const userSettings = userSettingsByUserId[item.id];
    const restrictionText = userSettings?.restrictionEnabled ? userSettings.locationLabel : null;
    const { icon: presenceIcon, color: presenceColor } = getPresenceIconInfo(item.presenceStatus);
    const presenceTooltip = item.presenceTooltip;
    const isOnline = item.status;
    return (
      <View
        className={`p-3 mb-3 rounded-lg flex-row justify-between items-center ${
          isLightTheme ? 'bg-slate-50' : 'bg-slate-800'
        }`}
      >
        <View className="flex-row items-center flex-1">
          <Ionicons name="person-circle" size={50} color={isLightTheme ? '#4b5563' : '#d1d5db'} />
          <View className="ml-3 flex-1">
            {/* Removed Location Name and Icon below the role */}
            <View className="flex-row items-center">
              <Text className={`text-lg font-semibold ${isLightTheme ? 'text-slate-800' : 'text-slate-300'} capitalize`}>
                {item.firstName} {item.middleName ? `${item.middleName} ` : ''}{item.lastName}
              </Text>
              <Ionicons name={presenceIcon} size={12} color={presenceColor} className="ml-1" />
            </View>
            {presenceTooltip && (
              <Text className={`text-xs mt-1 ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
                {presenceTooltip}
              </Text>
            )}
            <View className="flex-row items-center mt-1">
              <Ionicons name="mail-outline" size={16} color={isLightTheme ? '#4b5563' : '#d1d5db'} className="mr-1" />
              <Text className={` ${isLightTheme ? 'text-slate-700' : 'text-slate-300'} text-sm`}>
                {capitalizeFirstLetter(item.email)}
              </Text>
            </View>
            <View className="flex-row items-center mt-1">
              <Ionicons name={getRoleIcon(item.role)} size={16} color={getRoleColor(item.role)} className="mr-1" />
              <Text className={` ${isLightTheme ? 'text-slate-700' : 'text-slate-300'} text-sm`}>
                {capitalizeFirstLetter(item.role)}
              </Text>
            </View>
            {/* Removed the previous location restriction below the role */}
            <View className="flex-row items-center mt-1">
              <Ionicons
                name={isOnline ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isOnline ? '#10b981' : '#d1d5db'}
                className="mr-1"
              />
              <Text className={` ${isLightTheme ? 'text-slate-700' : 'text-slate-300'} text-sm`}>
                {isOnline ? 'Punched In' : 'Punched Out'}
              </Text>
            </View>
          </View>
        </View>
        {/* Updated Location Icon Pressable with Location Name Above */}
        <View className="flex-row items-center">
          <View className="flex-col items-center ">
            {restrictionEnabled && restrictionText && (
              <Text className="text-xs text-orange-500 mb-1">
                {restrictionText}
              </Text>
            )}
            <Pressable onPress={() => openUserSettingsModal(item)} className="p-1">
              <Ionicons
                name="location-outline"
                size={20}
                color={userSettings?.restrictionEnabled ? '#f97316' : (isLightTheme ? '#1f2937' : '#f9fafb')}
              />
            </Pressable>
          </View>
          <Pressable onPress={() => handleUserAction(item)} className="p-1">
            <Ionicons name="ellipsis-vertical" size={24} color={isLightTheme ? '#1f2937' : '#f9fafb'} />
          </Pressable>
        </View>
      </View>
    );
  };

  const userCount = companyUserCounts[user?.companyId] || 0;
  const planRange = currentSubscription?.plan?.rangeOfUsers || '';
  const planMaxUsers = getMaxUsersFromRange(planRange);

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333333' : '#ffffff'}
          />
        </Pressable>
        <Text className={`text-lg font-bold ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
          Employees
        </Text>
      </View>

      {/* Users Count and Add Button */}
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text className={`text-xl font-bold ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
          {`Users (${userCount} of ${planMaxUsers === 999999 ? '∞' : planMaxUsers})`}
        </Text>
        <Pressable
          onPress={handleAddUser}
          className={`p-2 rounded-full ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
        >
          <Ionicons name="add" size={24} color={isLightTheme ? '#1e293b' : '#cbd5e1'} />
        </Pressable>
      </View>

      {/* Users List */}
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
            <Text className={`text-center mt-12 text-lg ${isLightTheme ? 'text-slate-600' : 'text-slate-300'}`}>
              No users found in your company.
            </Text>
          }
        />
      )}

      {/* Edit/Add User Modal */}
      <Modal
        visible={editUserModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditUserModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center bg-slate-950/70">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
              className="w-11/12"
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}
            >
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className={`p-6 rounded-3xl ${isLightTheme ? 'bg-white' : 'bg-slate-800'}`}>
                  {/* Modal Title */}
                  <Text className={`text-xl font-bold mb-4 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    {selectedUser ? 'Edit User' : 'Add User'}
                  </Text>

                  {/* Role Selection */}
                  <Text className={`text-sm font-medium mb-2 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    Role <Text className="text-red-500">*</Text>
                  </Text>
                  <RadioButton
                    label="Admin"
                    value="admin"
                    selected={editRole === 'admin'}
                    onPress={setEditRole}
                    isLightTheme={isLightTheme}
                  />
                  <RadioButton
                    label="Supervisor"
                    value="supervisor"
                    selected={editRole === 'supervisor'}
                    onPress={setEditRole}
                    isLightTheme={isLightTheme}
                  />
                  <RadioButton
                    label="User"
                    value="user"
                    selected={editRole === 'user'}
                    onPress={setEditRole}
                    isLightTheme={isLightTheme}
                  />

                  {/* Email Input */}
                  <Text className={`text-sm font-medium mt-4 mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    Email <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className={`w-full p-3 mb-4 rounded-lg border ${isLightTheme ? 'border-slate-100 bg-slate-100 text-slate-800' : 'border-slate-700 bg-slate-700 text-slate-300'}`}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="e.g., user@example.com"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  {/* Password Input */}
                  <Text className={`text-sm font-medium mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    {selectedUser ? 'New Password (leave blank to keep current)' : 'Password'}
                  </Text>
                  <TextInput
                    className={`w-full p-3 mb-4 rounded-lg border ${isLightTheme ? 'border-slate-100 bg-slate-100 text-slate-800' : 'border-slate-700 bg-slate-700 text-slate-300'}`}
                    value={editPassword}
                    onChangeText={setEditPassword}
                    placeholder={selectedUser ? 'Enter new password' : 'Enter password'}
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    secureTextEntry
                  />

                  {/* First Name Input */}
                  <Text className={`text-sm font-medium mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    First Name <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className={`w-full p-3 mb-4 rounded-lg border ${isLightTheme ? 'border-slate-100 bg-slate-100 text-slate-800' : 'border-slate-700 bg-slate-700 text-slate-300'}`}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="e.g., John"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Middle Name Input */}
                  <Text className={`text-sm font-medium mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    Middle Name
                  </Text>
                  <TextInput
                    className={`w-full p-3 mb-4 rounded-lg border ${isLightTheme ? 'border-slate-100 bg-slate-100 text-slate-800' : 'border-slate-700 bg-slate-700 text-slate-300'}`}
                    value={editMiddleName}
                    onChangeText={setEditMiddleName}
                    placeholder="e.g., A."
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Last Name Input */}
                  <Text className={`text-sm font-medium mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    Last Name <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className={`w-full p-3 mb-4 rounded-lg border ${isLightTheme ? 'border-slate-100 bg-slate-100 text-slate-800' : 'border-slate-700 bg-slate-700 text-slate-300'}`}
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="e.g., Doe"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Phone Input */}
                  <Text className={`text-sm font-medium mb-1 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    Phone <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className={`w-full p-3 mb-6 rounded-lg border ${isLightTheme ? 'border-slate-100 bg-slate-100 text-slate-800' : 'border-slate-700 bg-slate-700 text-slate-300'}`}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="e.g., +1 234 567 890"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    keyboardType="phone-pad"
                  />

                  {/* Modal Actions */}
                  <View className="flex-row justify-end">
                    <TouchableOpacity
                      onPress={() => setEditUserModalVisible(false)}
                      className="mr-4"
                    >
                      <Text className={`text-base font-semibold ${isLightTheme ? 'text-slate-600' : 'text-slate-300'} my-auto`}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveUserEdits}
                      className="bg-orange-500 py-3 px-6 rounded-lg"
                    >
                      <Text className="text-white text-base font-semibold">
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
        animationType="fade"
        transparent={true}
        onRequestClose={() => setUserSettingsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center bg-slate-950/70">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
              className="w-11/12"
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 40}
            >
              <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View className={`p-6 rounded-3xl ${isLightTheme ? 'bg-white' : 'bg-slate-800'}`}>
                  {/* Modal Title */}
                  <Text className={`text-2xl font-bold mb-4 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                    User Location Restriction
                  </Text>

                  {/* Loading Indicator */}
                  {userSettingsLoading ? (
                    <ActivityIndicator size="large" color="#10b981" className="mt-6" />
                  ) : (
                    <>
                      {/* Restriction Toggle */}
                      <View className="flex-row items-center justify-between mb-4">
                        <Text className={`text-base ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                          Restrict user {selectedUser?.firstName} {selectedUser?.lastName} to a location?
                        </Text>
                        <Switch
                          value={restrictionEnabled}
                          onValueChange={setRestrictionEnabled}
                          trackColor={{ true: '#f1f5f9', false: '#f1f5f9' }}
                          thumbColor={
                            restrictionEnabled
                              ? isLightTheme
                                ? '#f97316'
                                : '#f97316'
                              : isLightTheme
                              ? '#f97316'
                              : '#f97316'
                          }
                        />
                      </View>

                      {/* Location Selection (Conditional) */}
                      {restrictionEnabled && (
                        <>
                          <Text className={`text-base mb-2 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
                            Select a Location <Text className="text-red-500">*</Text>
                          </Text>
                          <View className={` rounded-lg mb-4 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'} z-40`}>
                            {/* Custom Picker */}
                            <TouchableOpacity
                              onPress={() => setLocationOpen(!locationOpen)}
                              className={`p-3 rounded-lg flex-row justify-between items-center ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'}`}
                            >
                              <Text className={`text-base ${selectedLocationId ? 'text-slate-800' : 'text-slate-500'}`}>
                                {selectedLocationId
                                  ? locations.find(loc => loc.id === selectedLocationId)?.label
                                  : 'Select Location'}
                              </Text>
                              <Ionicons
                                name="chevron-down"
                                size={20}
                                color="#6b7280"
                              />
                            </TouchableOpacity>
                            {/* Dropdown Options */}
                            {locationOpen && (
                              <View className={`rounded-lg mt-1 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700' }`}>
                                {locations.map(loc => (
                                  <TouchableOpacity
                                    key={loc.id}
                                    onPress={() => {
                                      setSelectedLocationId(loc.id);
                                      setLocationOpen(false);
                                    }}
                                    className="p-3 rounded-lg"
                                  >
                                    <Text className="text-base text-slate-800">
                                      {loc.label}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        </>
                      )}

                      {/* Modal Actions */}
                      <View className="flex-row justify-end">
                        <TouchableOpacity
                          onPress={() => setUserSettingsModalVisible(false)}
                          className="mr-4"
                        >
                          <Text className={`text-base font-semibold ${isLightTheme ? 'text-slate-600' : 'text-slate-300'} my-auto`}>
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
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default Employees;
