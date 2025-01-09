// File: client/app/(tabs)/Profile.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import useUserStore from '../../store/userStore';
import useCompanyStore from '../../store/companyStore';
import useDepartmentStore from '../../store/departmentStore';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import 'nativewind';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const Profile = () => {
  const { theme } = useThemeStore();
  const { user, clearUser, setUser } = useUserStore();
  const router = useRouter();
  const isLightTheme = theme === 'light';

  // We'll define an orange accent color
  const accentColor = isLightTheme ? '#f97316' : '#f97316';

  const [presenceStatus, setPresenceStatus] = useState(user.presenceStatus || 'offline');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Edit Profile Modal
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user.firstName || '');
  const [editMiddleName, setEditMiddleName] = useState(user.middleName || '');
  const [editLastName, setEditLastName] = useState(user.lastName || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');

  // Change Password Modal
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Show/hide password toggles
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // For the presence icon dropdown
  const iconRef = useRef(null);
  const [iconLayout, setIconLayout] = useState({ x: 0, y: 0 });

  const presenceColors = {
    active: '#10b981',
    away: '#f97316',
    offline: '#64748b',
  };

  const presenceIcon = {
    active: 'checkmark-circle',
    away: 'time',
    offline: 'close-circle',
  }[presenceStatus];

  // Bring in company & department store logic
  const { fetchCompanyById, getCompanyName } = useCompanyStore();
  const { fetchDepartmentById, getDepartmentName } = useDepartmentStore();

  // Called once to fetch single company and dept if present
  useEffect(() => {
    const initFetch = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;

      if (user.companyId) {
        await fetchCompanyById(token, user.companyId);
      }
      if (user.departmentId) {
        await fetchDepartmentById(token, user.departmentId);
      }
    };
    initFetch();
  }, [user.companyId, user.departmentId, fetchCompanyById, fetchDepartmentById]);

  const getInitials = (name) => {
    const nameArray = name.trim().split(' ');
    if (nameArray.length === 1) {
      return nameArray[0][0].toUpperCase();
    }
    return (nameArray[0][0] + nameArray[nameArray.length - 1][0]).toUpperCase();
  };

  // Confirmation before logout
  const confirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => logout() },
      ],
      { cancelable: false }
    );
  };

  const logout = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const response = await fetch(`${API_BASE_URL}/auth/sign-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        clearUser();
        router.replace('(auth)/signin');
        Alert.alert('Success', 'You have been logged out successfully');
      } else {
        Alert.alert('Error', 'Failed to log out, please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'An error occurred while logging out.');
    }
  };

  const capitalizeFirst = (email) => {
    const [first, ...rest] = email.split('');
    return `${first.toUpperCase()}${rest.join('')}`;
  };
  

  const updatePresenceStatus = async (newStatus) => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/me/presence`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ presenceStatus: newStatus }),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.data);
        setPresenceStatus(data.data.presenceStatus);
      } else {
        Alert.alert('Error', data.message || 'Failed to update presence status.');
        setPresenceStatus(user.presenceStatus || 'offline');
      }
    } catch (error) {
      console.error('Update presence error:', error);
      Alert.alert('Error', 'An unexpected error occurred while updating your presence status.');
      setPresenceStatus(user.presenceStatus || 'offline');
    }
  };

  const handleStatusSelect = (status) => {
    updatePresenceStatus(status);
    setIsDropdownVisible(false);
  };

  const measureIconPosition = () => {
    if (iconRef.current) {
      iconRef.current.measureInWindow((x, y, width, height) => {
        setIconLayout({ x, y: y + height + 6 });
      });
    }
  };

  useEffect(() => {
    setTimeout(() => {
      measureIconPosition();
    }, 300);
  }, [isDropdownVisible, presenceStatus]);

  // Periodically re-fetch user data
  useEffect(() => {
    let intervalId;
    const startInterval = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.user) {
              setUser(data.user);
              setPresenceStatus(data.user.presenceStatus || 'offline');
              setEditFirstName(data.user.firstName || '');
              setEditMiddleName(data.user.middleName || '');
              setEditLastName(data.user.lastName || '');
              setEditPhone(data.user.phone || '');
            }
          }
        } catch (err) {
          console.error('Error fetching user data periodically:', err);
        }
      }, 60000);
    };
    startInterval();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [setUser]);

  // === Edit Profile ===
  const handleOpenEditProfile = () => {
    setEditFirstName(user.firstName || '');
    setEditMiddleName(user.middleName || '');
    setEditLastName(user.lastName || '');
    setEditPhone(user.phone || '');
    setEditProfileModalVisible(true);
  };

  const handleSaveProfileEdits = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    try {
      const payload = {
        firstName: editFirstName,
        middleName: editMiddleName,
        lastName: editLastName,
        phone: editPhone,
      };

      const response = await fetch(`${API_BASE_URL}/auth/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setUser(data.data);
        setPresenceStatus(data.data.presenceStatus || 'offline');
        setEditProfileModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully.');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  // === Change Password ===
  const handleOpenChangePassword = () => {
    // Reset fields each time we open the modal
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordModalVisible(true);
  };

  const handleChangePassword = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    try {
      const payload = {
        oldPassword,
        newPassword,
        confirmPassword,
      };

      const response = await fetch(`${API_BASE_URL}/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        setChangePasswordModalVisible(false);
        Alert.alert('Success', 'Password changed successfully.');
      } else {
        Alert.alert('Error', data.message || 'Failed to change password.');
      }
    } catch (error) {
      console.error('Change Password Error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Header */}
        <View
          className={`rounded-xl p-6 mb-6 flex-row items-center relative ${
            isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
          }`}
        >
          {user.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <View
              className={`w-20 h-20 rounded-full justify-center items-center ${
                isLightTheme ? 'bg-orange-500' : 'bg-orange-500'
              }`}
            >
              <Text className="text-white text-2xl font-bold tracking-widest">
                {getInitials(`${user.firstName} ${user.lastName}`)}
              </Text>
            </View>
          )}

          {/* Presence Icon + Text (top-right) */}
          <View className="absolute top-2.5 right-2.5 flex-row items-center space-x-1">
            <Pressable
              ref={iconRef}
              onPress={() => {
                setIsDropdownVisible(true);
                measureIconPosition();
              }}
              accessibilityLabel="Change Presence Status"
              className="flex-row items-center"
            >
              <Ionicons
                name={presenceIcon}
                size={24}
                color={presenceColors[presenceStatus]}
              />
              {/* Presence status text, e.g. "active", "away", etc. */}
              <Text
                className={`px-1 text-base capitalize ${
                  isLightTheme ? 'text-slate-800' : 'text-slate-200'
                }`}
              >
                {presenceStatus}
              </Text>
            </Pressable>
          </View>

          <View className="ml-4">
            <Text
              className={`text-2xl font-bold ${
                isLightTheme ? 'text-slate-800' : 'text-slate-100'
              }`}
            >
              {user.firstName} {user.lastName}
            </Text>
            <Text
              className={`${
                isLightTheme ? 'text-slate-600' : 'text-slate-300'
              }`}
            >
              {user.position || 'Software Engineer'}
            </Text>
          </View>
        </View>

        {/* Contact Information Card */}
        <View
          className={`rounded-lg p-6 mb-6 ${
            isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
          }`}
        >
          <Text
            className={`text-xl font-semibold mb-4 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-100'
            }`}
          >
            Contact Information
          </Text>
          {/* Email */}
          <View className="flex-row items-center mb-4">
            <Ionicons
              name="mail-outline"
              size={20}
              color={accentColor}
              className="mr-3"
            />
            <Text
              className={`text-base ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
               <Text className="font-semibold">Email:</Text>{' '}
               {user.email && capitalizeFirst(user.email)}
            </Text>
          </View>
          {/* Company */}
          <View className="flex-row items-center mb-4">
            <Ionicons
              name="id-card-outline"
              size={20}
              color={accentColor}
              className="mr-3"
            />
            <Text
              className={`text-base capitalize ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Text className="font-semibold">Company:</Text> {getCompanyName(user.companyId) || 'Bench'}
            </Text>
          </View>
          {/* Department */}
          <View className="flex-row items-center mb-4">
            <AntDesign
              name="team"
              size={20}
              color={accentColor}
              className="mr-3"
            />
            <Text
              className={`text-base capitalize ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Text className="font-semibold capitalize">Department:</Text>{' '}
              {getDepartmentName(user.departmentId) || 'Bench'}
            </Text>
          </View>
          {/* Role */}
          <View className="flex-row items-center mb-4">
            <Ionicons
              name="briefcase-outline"
              size={20}
              color={accentColor}
              className="mr-3"
            />
            <Text
              className={`text-base capitalize ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Text className="font-semibold">Role:</Text> {user.role}
            </Text>
          </View>
          {/* Phone */}
          <View className="flex-row items-center">
            <Ionicons
              name="call-outline"
              size={20}
              color={accentColor}
              className="mr-3"
            />
            <Text
              className={`text-base ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              <Text className="font-semibold">Phone:</Text> {user.phone}
            </Text>
          </View>
        </View>

        {/* Account Settings Card */}
        <View
          className={`rounded-lg p-6 ${
            isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
          }`}
        >
          <Text
            className={`text-xl font-semibold mb-6 ${
              isLightTheme ? 'text-slate-800' : 'text-slate-100'
            }`}
          >
            Account Settings
          </Text>

          {/* Change Password */}
          <Pressable
            className={`p-4 rounded-lg mb-4 ${
              isLightTheme ? 'bg-white' : 'bg-slate-700'
            }`}
            onPress={handleOpenChangePassword}
          >
            <Text
              className={`${
                isLightTheme ? 'text-slate-800' : 'text-slate-100'
              } font-medium text-center`}
            >
              Change Password
            </Text>
          </Pressable>

          {/* Edit Profile */}
          <Pressable
            className={`p-4 rounded-lg mb-4 ${
              isLightTheme ? 'bg-white' : 'bg-slate-700'
            }`}
            onPress={handleOpenEditProfile}
          >
            <Text
              className={`${
                isLightTheme ? 'text-slate-800' : 'text-slate-100'
              } font-medium text-center`}
            >
              Edit Profile
            </Text>
          </Pressable>

          {/* Logout */}
          <Pressable
            className={`p-4 rounded-lg ${
              isLightTheme ? 'bg-white' : 'bg-slate-700'
            }`}
            onPress={confirmLogout}
          >
            <Text
              className={`${
                isLightTheme ? 'text-slate-800' : 'text-slate-100'
              } font-medium text-center`}
            >
              Logout
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Presence Dropdown Modal - background forced to bg-slate-900 */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPressOut={() => setIsDropdownVisible(false)}
        >
          <View
            className={`absolute rounded-2xl shadow-md p-2 ${isLightTheme ? `bg-slate-200` : `bg-slate-800`} `}
            style={{
              width: 85,
              top: iconLayout.y,
              left: iconLayout.x - 7,
            }}
          >
            <TouchableOpacity
              onPress={() => handleStatusSelect('active')}
              className="flex-row items-center mb-2"
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={presenceColors.active}
                className="mr-2"
              />
              <Text className={`text-base ${isLightTheme ? `text-slate-700` : `text-slate-300`}`}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStatusSelect('away')}
              className="flex-row items-center mb-2"
            >
              <Ionicons
                name="time"
                size={20}
                color={presenceColors.away}
                className="mr-2"
              />
              <Text className={`text-base ${isLightTheme ? `text-slate-700` : `text-slate-300`}`}>Away</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStatusSelect('offline')}
              className="flex-row items-center"
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={presenceColors.offline}
                className="mr-2"
              />
              <Text className={`text-base ${isLightTheme ? `text-slate-700` : `text-slate-300`}`}>Offline</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal (unchanged) */}
      <Modal
        visible={editProfileModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setEditProfileModalVisible(false)}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? 'bg-slate-950/70' : 'bg-slate-950/70'}`}>
            <TouchableWithoutFeedback>
              <View className={`w-11/12 p-6 rounded-2xl shadow-md ${isLightTheme ? 'bg-white' : 'bg-slate-800'}`}>
                <View className="mb-2">
                  <Text className={`text-xl font-semibold ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
                    Edit Profile
                  </Text>
                </View>

                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
                >
                  <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* First Name */}
                    <Text
                      className={`text-sm mb-1 ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      First Name
                    </Text>
                    <TextInput
                      className={`w-full p-3 mb-2 rounded-lg ${
                        isLightTheme
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-slate-700 text-slate-300'
                      } text-sm`}
                      value={editFirstName}
                      onChangeText={setEditFirstName}
                      placeholder="e.g., John"
                      placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    />

                    {/* Middle Name */}
                    <Text
                      className={`text-sm mb-1 ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      Middle Name
                    </Text>
                    <TextInput
                      className={`w-full p-3 mb-2 rounded-lg ${
                        isLightTheme
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-slate-700 text-slate-300'
                      } text-sm`}
                      value={editMiddleName}
                      onChangeText={setEditMiddleName}
                      placeholder="e.g., A."
                      placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    />

                    {/* Last Name */}
                    <Text
                      className={`text-sm mb-1 ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      Last Name
                    </Text>
                    <TextInput
                      className={`w-full p-3 mb-2 rounded-lg ${
                        isLightTheme
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-slate-700 text-slate-300'
                      } text-sm`}
                      value={editLastName}
                      onChangeText={setEditLastName}
                      placeholder="e.g., Doe"
                      placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    />

                    {/* Phone */}
                    <Text
                      className={`text-sm mb-1 ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      Phone
                    </Text>
                    <TextInput
                      className={`w-full p-3 mb-2 rounded-lg ${
                        isLightTheme
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-slate-700 text-slate-300'
                      } text-sm`}
                      value={editPhone}
                      onChangeText={setEditPhone}
                      placeholder="e.g., +1 234 567 890"
                      keyboardType="phone-pad"
                      placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                    />

                    {/* Buttons row: Cancel (left) and Confirm (right) */}
                    <View className="flex-row justify-end mt-4">
                      <Pressable
                        onPress={() => setEditProfileModalVisible(false)}
                        className="p-4 rounded-lg mr-2"
                      >
                        <Text className={`text-center font-semibold ${isLightTheme ? `text-slate-700` : `text-slate-300`}`}>Cancel</Text>
                      </Pressable>

                      <Pressable
                        onPress={handleSaveProfileEdits}
                        className="p-4 rounded-lg bg-orange-500"
                      >
                        <Text className="text-white text-center font-semibold">Confirm</Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Change Password Modal (unchanged aside from the relevant fixes) */}
      <Modal
        visible={changePasswordModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setChangePasswordModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setChangePasswordModalVisible(false)}>
          <View className={`flex-1 justify-center items-center ${isLightTheme ? 'bg-slate-950/70' : 'bg-slate-950/70'}`}>
            <TouchableWithoutFeedback>
              <View className={`w-11/12 p-6 rounded-2xl shadow-md ${isLightTheme ? 'bg-white' : 'bg-slate-800'}`}>
                <View className="mb-2">
                  <Text className={`text-xl font-semibold ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
                    Change Password
                  </Text>
                </View>

                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
                >
                  <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                  >
                    {/* Old Password */}
                    <Text
                      className={`text-sm mb-1 ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      Old Password
                    </Text>
                    <View
                      className={`flex-row items-center mb-2 rounded-lg ${
                        isLightTheme
                          ? 'bg-slate-100'
                          : 'bg-slate-700'
                      } h-12`}
                    >
                      <TextInput
                        className={`flex-1 px-3 text-sm ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-300'
                        }`}
                        value={oldPassword}
                        onChangeText={setOldPassword}
                        placeholder="Enter old password"
                        secureTextEntry={!showOldPassword}
                        placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                      />
                      <Pressable
                        onPress={() => setShowOldPassword(!showOldPassword)}
                        className="pr-3"
                      >
                        <Ionicons
                          name={showOldPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={isLightTheme ? '#374151' : '#9ca3af'}
                        />
                      </Pressable>
                    </View>

                    {/* New Password */}
                    <Text
                      className={`text-sm mb-1 ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      New Password
                    </Text>
                    <View
                      className={`flex-row items-center mb-2 rounded-lg ${
                        isLightTheme
                          ? 'bg-slate-100'
                          : 'bg-slate-700'
                      } h-12`}
                    >
                      <TextInput
                        className={`flex-1 px-3 text-sm ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-300'
                        }`}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password"
                        secureTextEntry={!showNewPassword}
                        placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                      />
                      <Pressable
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        className="pr-3"
                      >
                        <Ionicons
                          name={showNewPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={isLightTheme ? '#374151' : '#9ca3af'}
                        />
                      </Pressable>
                    </View>

                    {/* Confirm Password */}
                    <Text
                      className={`text-sm mb-1 ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-300'
                      }`}
                    >
                      Confirm New Password
                    </Text>
                    <View
                      className={`flex-row items-center mb-2 rounded-lg ${
                        isLightTheme
                          ? 'bg-slate-100'
                          : 'bg-slate-700'
                      } h-12`}
                    >
                      <TextInput
                        className={`flex-1 px-3 text-sm ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-300'
                        }`}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                      />
                      <Pressable
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="pr-3"
                      >
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color={isLightTheme ? '#374151' : '#9ca3af'}
                        />
                      </Pressable>
                    </View>

                    {/* Buttons row: Cancel & Confirm */}
                    <View className="flex-row justify-end mt-4">
                      <Pressable
                        onPress={() => setChangePasswordModalVisible(false)}
                        className="p-4 rounded-lg mr-2 "
                      >
                        <Text className={`text-center font-semibold ${isLightTheme ? `text-slate-700` : `text-slate-300`}`}>Cancel</Text>
                      </Pressable>

                      <Pressable
                        onPress={handleChangePassword}
                        className="p-4 rounded-lg bg-orange-500"
                      >
                        <Text className="text-white text-center font-semibold">Confirm</Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </KeyboardAvoidingView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
