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
import { Ionicons } from '@expo/vector-icons';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

const Profile = () => {
  const { theme } = useThemeStore();
  const { user, clearUser, setUser } = useUserStore();
  const router = useRouter();
  const isLightTheme = theme === 'light';

  const [presenceStatus, setPresenceStatus] = useState(user.presenceStatus || 'offline');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Profile edit modal states
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user.firstName || '');
  const [editMiddleName, setEditMiddleName] = useState(user.middleName || '');
  const [editLastName, setEditLastName] = useState(user.lastName || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');

  const iconRef = useRef(null);
  const [iconLayout, setIconLayout] = useState({ x: 0, y: 0 });

  const presenceColors = {
    active: '#10b981',
    away: '#f97316', // orange-500
    offline: '#d1d5db',
  };

  const presenceIcon = {
    active: 'checkmark-circle',
    away: 'time',
    offline: 'close-circle',
  }[presenceStatus];

  const getInitials = (name) => {
    const nameArray = name.split(' ');
    return nameArray.map((n) => n[0]).join('').toUpperCase();
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
        // Revert if fail
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
        setIconLayout({ x, y: y + height });
      });
    }
  };

  useEffect(() => {
    setTimeout(() => {
      measureIconPosition();
    }, 300);
  }, [isDropdownVisible, presenceStatus]);

  // Periodically re-fetch user data to update presence and details
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
              // Update edit fields if user changed their profile elsewhere
              setEditFirstName(data.user.firstName || '');
              setEditMiddleName(data.user.middleName || '');
              setEditLastName(data.user.lastName || '');
              setEditPhone(data.user.phone || '');
            }
          }
        } catch (err) {
          console.error('Error fetching user data periodically:', err);
        }
      }, 60000); // every 60 seconds
    };
    startInterval();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [setUser]);

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

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Profile Header */}
        <View className="bg-slate-800 rounded-xl p-6 mb-6 flex-row items-center relative">
          {user.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <View className="w-20 h-20 rounded-full bg-slate-900 justify-center items-center">
              <Text className="text-white text-2xl font-bold tracking-widest">
                {getInitials(`${user.firstName} ${user.lastName}`)}
              </Text>
            </View>
          )}

          {/* Presence Icon at the top-right of avatar */}
          <View className="absolute top-2.5 right-2.5">
            <Pressable
              ref={iconRef}
              onPress={() => {
                setIsDropdownVisible(true);
                measureIconPosition();
              }}
            >
              <Ionicons
                name={presenceIcon}
                size={24}
                color={presenceColors[presenceStatus]}
              />
            </Pressable>
          </View>

          <View className="ml-4">
            <Text className="text-2xl font-bold text-white">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="text-white">{user.position || 'Software Engineer'}</Text>
          </View>
        </View>

        {/* Contact Information */}
        <View className={`rounded-lg p-6 mb-6 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
          <Text className={`text-xl font-semibold mb-4 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
            Contact Information
          </Text>
          <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
            Company ID: {user.companyId + 1000}
          </Text>
          <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
            Email: {user.email}
          </Text>
          <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
            Role: {user.role}
          </Text>
          <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'} mb-2`}>
            Phone: {user.phone}
          </Text>
        </View>

        {/* Account Settings */}
        <View className={`rounded-lg p-6 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
          <Text className={`text-xl font-semibold mb-6 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
            Account Settings
          </Text>
          <Pressable
            className={`p-4 rounded-lg mb-4 ${isLightTheme ? 'bg-white' : 'bg-slate-700'}`}
            onPress={() => Alert.alert('Change Password feature: ongoing')}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-100'} font-medium text-center`}>
              Change Password
            </Text>
          </Pressable>
          <Pressable
            className={`p-4 rounded-lg mb-4 ${isLightTheme ? 'bg-white' : 'bg-slate-700'}`}
            onPress={handleOpenEditProfile}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-100'} font-medium text-center`}>
              Edit Profile
            </Text>
          </Pressable>
          <Pressable
            className={`p-4 rounded-lg ${isLightTheme ? 'bg-white' : 'bg-slate-700'}`}
            onPress={logout}
          >
            <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-100'} font-medium text-center`}>
              Logout
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Presence Dropdown Modal */}
      <Modal
        visible={isDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-slate-200/70 "
          activeOpacity={1}
          onPressOut={() => setIsDropdownVisible(false)}
        >
          <View
            style={{
              position: 'absolute',
              top: iconLayout.y,
              left: iconLayout.x - 90,
              backgroundColor: isLightTheme ? '#fff' : '#374151',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              width: 110,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <TouchableOpacity
              onPress={() => handleStatusSelect('active')}
              className="flex-row items-center mb-2"
            >
              <Ionicons name="checkmark-circle" size={20} color={presenceColors.active} className="mr-2" />
              <Text className={`text-base ${isLightTheme ? 'text-black' : 'text-white'}`}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStatusSelect('away')}
              className="flex-row items-center mb-2"
            >
              <Ionicons name="time" size={20} color={presenceColors.away} className="mr-2" />
              <Text className={`text-base ${isLightTheme ? 'text-black' : 'text-white'}`}>Away</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStatusSelect('offline')}
              className="flex-row items-center"
            >
              <Ionicons name="close-circle" size={20} color={presenceColors.offline} className="mr-2" />
              <Text className={`text-base ${isLightTheme ? 'text-black' : 'text-white'}`}>Offline</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-center items-center bg-slate-950/95">
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="w-11/12"
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
            >
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
              >
                <View
                  className={`p-4 rounded-3xl ${
                    isLightTheme ? 'bg-white' : 'bg-slate-800'
                  }`}
                >
                  <Text
                    className={`text-lg font-bold mb-3 ${
                      isLightTheme ? 'text-slate-800' : 'text-white'
                    }`}
                  >
                    Edit Profile
                  </Text>

                  {/* First Name */}
                  <Text
                    className={`text-sm mb-1 ${
                      isLightTheme ? 'text-slate-800' : 'text-gray-300'
                    }`}
                  >
                    First Name
                  </Text>
                  <TextInput
                    className={`w-full p-2 mb-2 rounded-lg ${
                      isLightTheme ? 'bg-slate-100 text-slate-800' : 'bg-slate-700 text-gray-300'
                    } text-sm`}
                    value={editFirstName}
                    onChangeText={setEditFirstName}
                    placeholder="e.g., John"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Middle Name */}
                  <Text
                    className={`text-sm mb-1 ${
                      isLightTheme ? 'text-slate-800' : 'text-gray-300'
                    }`}
                  >
                    Middle Name
                  </Text>
                  <TextInput
                    className={`w-full p-2 mb-2 rounded-lg ${
                      isLightTheme ? 'bg-slate-100 text-slate-800' : 'bg-slate-700 text-gray-300'
                    } text-sm`}
                    value={editMiddleName}
                    onChangeText={setEditMiddleName}
                    placeholder="e.g., A."
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Last Name */}
                  <Text
                    className={`text-sm mb-1 ${
                      isLightTheme ? 'text-slate-800' : 'text-gray-300'
                    }`}
                  >
                    Last Name
                  </Text>
                  <TextInput
                    className={`w-full p-2 mb-2 rounded-lg ${
                      isLightTheme ? 'bg-slate-100 text-slate-800' : 'bg-slate-700 text-gray-300'
                    } text-sm`}
                    value={editLastName}
                    onChangeText={setEditLastName}
                    placeholder="e.g., Doe"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  {/* Phone */}
                  <Text
                    className={`text-sm mb-1 ${
                      isLightTheme ? 'text-slate-800' : 'text-gray-300'
                    }`}
                  >
                    Phone
                  </Text>
                  <TextInput
                    className={`w-full p-2 mb-2 rounded-lg ${
                      isLightTheme ? 'bg-slate-100 text-slate-800' : 'bg-slate-700 text-gray-300'
                    } text-sm`}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="e.g., +1 234 567 890"
                    keyboardType="phone-pad"
                    placeholderTextColor={isLightTheme ? '#9ca3af' : '#6b7280'}
                  />

                  <View className="flex-row justify-end mt-3">
                    <TouchableOpacity
                      onPress={() => setEditProfileModalVisible(false)}
                      className="mr-3"
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          isLightTheme ? 'text-slate-700' : 'text-gray-300'
                        }`}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveProfileEdits}
                      className="bg-orange-500 py-2 px-4 rounded-lg"
                    >
                      <Text className="text-white text-sm font-semibold">Save</Text>
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

export default Profile;
