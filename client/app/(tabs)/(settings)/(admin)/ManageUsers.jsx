// File: app/(tabs)/(settings)/(admin)/ManageUsers.jsx

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Alert, 
  Pressable, 
  RefreshControl,
  Modal,
  TouchableOpacity,
  Switch,
  Platform
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import useUsersStore from '../../../../store/usersStore';
import useLocationsStore from '../../../../store/locationsStore'; 
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

const ManageUsers = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const { users, loading, error, fetchUsers, deleteUser } = useUsersStore();
  const { locations, fetchLocations } = useLocationsStore();

  const [refreshing, setRefreshing] = useState(false);

  // State to store user settings: { userId: { restrictionEnabled: boolean, locationLabel: string|null } }
  const [userSettingsByUserId, setUserSettingsByUserId] = useState({});

  // Modal states for user settings
  const [userSettingsModalVisible, setUserSettingsModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [restrictionEnabled, setRestrictionEnabled] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [userSettingsLoading, setUserSettingsLoading] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetchUsers(token);
        await fetchLocations(token);
        await fetchAllUserSettings(token);
      } else {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/signin');
      }
    };
    initialize();
  }, []);

  const onRefresh = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      setRefreshing(true);
      await fetchUsers(token);
      await fetchLocations(token);
      await fetchAllUserSettings(token);
      setRefreshing(false);
    }
  };

  const fetchAllUserSettings = async (token) => {
    const results = {};
    for (let user of users) {
      try {
        const res = await fetch(`http://192.168.100.8:5000/api/usersettings/all?userId=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok && data.data && data.data.length > 0) {
          const setting = data.data[0];
          // Use setting.restrictionEnabled (camelCase)
          results[user.id] = {
            restrictionEnabled: setting.restrictionEnabled,
            locationLabel: setting.location?.label || null
          };
        } else {
          // No settings or error
          results[user.id] = {
            restrictionEnabled: false,
            locationLabel: null
          };
        }
      } catch (err) {
        console.error('Error fetching user settings:', err);
        // Default to disabled if error
        results[user.id] = {
          restrictionEnabled: false,
          locationLabel: null
        };
      }
    }
    setUserSettingsByUserId(results);
  };

  const handleUserAction = (user) => {
    Alert.alert(
      'User Actions',
      `Choose an action for ${user.firstName} ${user.lastName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditUser(user) },
        { text: 'Delete', onPress: () => handleDeleteUser(user.id) },
        { text: 'Location Restriction', onPress: () => openUserSettingsModal(user) },
      ]
    );
  };

  const handleEditUser = (user) => {
    router.push({ pathname: 'edit-user', params: { userId: user.id } });
  };

  const handleDeleteUser = async (userId) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      const result = await deleteUser(userId, token);
      if (result.success) {
        await fetchAllUserSettings(token); // Refresh settings after deletion if needed
      }
    } else {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
    }
  };

  const openUserSettingsModal = async (user) => {
    setSelectedUser(user);
    setUserSettingsLoading(true);
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    try {
      const res = await fetch(`http://192.168.100.8:5000/api/usersettings/all?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data && data.data.length > 0) {
        const setting = data.data[0];
        // Use setting.restrictionEnabled (camelCase)
        setRestrictionEnabled(setting.restrictionEnabled);
        setSelectedLocationId(setting.locationId);
      } else {
        // If no settings found, defaults apply
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
    setUserSettingsModalVisible(true);
  };

  const handleSaveUserSettings = async () => {
    if (!selectedUser) return;
    const token = await SecureStore.getItemAsync('token');
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
      locationId: selectedLocationId
    };

    try {
      const res = await fetch('http://192.168.100.8:5000/api/usersettings/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'User settings updated successfully.');
        setUserSettingsModalVisible(false);
        // Refresh settings in the list
        await fetchAllUserSettings(token);
      } else {
        Alert.alert('Error', data.message || 'Failed to update user settings.');
      }
    } catch (err) {
      console.error('Error updating user settings:', err);
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const renderItem = ({ item }) => {
    const userSettings = userSettingsByUserId[item.id];
    let restrictionText = 'Restriction: Disabled';
    if (userSettings?.restrictionEnabled) {
      restrictionText = `Restriction: Enabled (Location: ${userSettings.locationLabel || 'Unknown'})`;
    }

    return (
      <View className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}>
        <View className="flex-row items-center flex-1">
          <Ionicons name="person-circle" size={50} color={isLightTheme ? '#4b5563' : '#d1d5db'} />
          <View className="ml-3 flex-1">
            <Text className={`text-lg font-semibold ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
              {item.firstName} {item.middleName ? `${item.middleName} ` : ''}{item.lastName}
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              {item.email}
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              Role: {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Text>
            <Text className={`${item.status ? 'text-green-400/80' : 'text-red-400/80'}`}>
              Status: {item.status ? 'Active' : 'Inactive'}
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              {restrictionText}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => handleUserAction(item)} className="p-2">
          <Ionicons name="ellipsis-vertical" size={24} color={isLightTheme ? '#1f2937' : '#f9fafb'} />
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`} edges={['top']}>
      {/* Custom Header */}
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
            <Text className={`text-center mt-12 text-lg ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              No users found in your company.
            </Text>
          }
        />
      )}

      {/* User Settings Modal */}
      <Modal
        visible={userSettingsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUserSettingsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className={`w-11/12 p-6 rounded-lg ${isLightTheme ? 'bg-white' : 'bg-gray-800'}`}>
            <Text className={`text-xl font-bold mb-4 ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
              User Location Restriction
            </Text>
            {userSettingsLoading ? (
              <ActivityIndicator size="large" color="#475569" className="mt-12" />
            ) : (
              <>
                <Text className={`text-base mb-2 ${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>
                  Restrict user {selectedUser?.firstName} {selectedUser?.lastName} to a location?
                </Text>
                <View className="flex-row items-center mb-4">
                  <Text className={`mr-2 ${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>
                    Location Restriction:
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
                    <Text className={`text-base mb-2 ${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>
                      Select a Location
                    </Text>
                    <View className={`mb-4 border rounded-lg ${isLightTheme ? 'border-gray-300' : 'border-gray-700'}`}>
                      <Picker
                        selectedValue={selectedLocationId === null ? 'null' : String(selectedLocationId)}
                        onValueChange={(itemValue) => {
                          if (itemValue === 'null') {
                            setSelectedLocationId(null);
                          } else {
                            setSelectedLocationId(Number(itemValue));
                          }
                        }}
                      >
                        <Picker.Item label="Select a location..." value="null" />
                        {locations.map((loc) => (
                          <Picker.Item key={loc.id} label={loc.label} value={String(loc.id)} />
                        ))}
                      </Picker>
                    </View>
                  </>
                )}

                <View className="flex-row justify-end">
                  <TouchableOpacity onPress={() => setUserSettingsModalVisible(false)} className="mr-4 my-auto">
                    <Text className={`text-base font-semibold ${isLightTheme ? 'text-slate-700' : 'text-slate-400'}`}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveUserSettings}
                    className="bg-orange-500/90 px-4 py-3 rounded-lg"
                  >
                    <Text className="text-white font-semibold">Confirm</Text>
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
