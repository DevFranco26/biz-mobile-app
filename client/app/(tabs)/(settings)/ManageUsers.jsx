// File: app/(tabs)/(settings)/ManageUsers.jsx

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  RefreshControl, 
  Alert,
  Pressable 
} from 'react-native';
import useThemeStore from '../../../store/themeStore';
import useUserStore from '../../../store/userStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ManageUsers = () => {
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const isLightTheme = theme === 'light';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCompanyUsers();
  }, []);

  const fetchCompanyUsers = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/signin');
        return;
      }

      const response = await fetch('http://192.168.100.8:5000/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUsers(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch users.');
      }
    } catch (error) {
      console.error('Fetch Company Users Error:', error);
      Alert.alert('Error', 'An error occurred while fetching users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanyUsers();
  };

  const renderItem = ({ item }) => (
    <View style={[styles.userCard, { backgroundColor: isLightTheme ? '#f9f9f9' : '#1f2937' }]}>
      <View style={styles.userInfo}>
        <Ionicons name="person-circle" size={50} color={isLightTheme ? '#4b5563' : '#d1d5db'} />
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: isLightTheme ? '#111827' : '#f9fafb' }]}>
            {item.firstName} {item.middleName ? item.middleName + ' ' : ''}{item.lastName}
          </Text>
          <Text style={[styles.userEmail, { color: isLightTheme ? '#6b7280' : '#d1d5db' }]}>
            {item.email}
          </Text>
          <Text style={[styles.userRole, { color: isLightTheme ? '#6b7280' : '#d1d5db' }]}>
            Role: {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
          </Text>
          <Text style={[styles.userStatus, { color: item.status ? 'green' : 'red' }]}>
            Status: {item.status ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      {/* Optional: Add more actions like Edit or Delete */}
      <Pressable 
        onPress={() => handleUserAction(item)}
        style={styles.actionButton}
      >
        <Ionicons name="ellipsis-vertical" size={24} color={isLightTheme ? '#1f2937' : '#f9fafb'} />
      </Pressable>
    </View>
  );

  // Optional: Handle user actions like Edit or Delete
  const handleUserAction = (user) => {
    Alert.alert(
      'User Actions',
      `Choose an action for ${user.firstName} ${user.lastName}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => navigateToEditUser(user) },
        { text: 'Delete', onPress: () => confirmDeleteUser(user) },
      ]
    );
  };

  const navigateToEditUser = (user) => {
    router.push({ pathname: 'edit-user', params: { userId: user.id } });
  };

  const confirmDeleteUser = (user) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteUser(user.id) },
      ]
    );
  };

  const deleteUser = async (userId) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/signin');
        return;
      }

      const response = await fetch(`http://192.168.100.8:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message || 'User deleted successfully.');
        fetchCompanyUsers(); // Refresh the list
      } else {
        Alert.alert('Error', data.message || 'Failed to delete user.');
      }
    } catch (error) {
      console.error('Delete User Error:', error);
      Alert.alert('Error', 'An error occurred while deleting the user.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isLightTheme ? '#ffffff' : '#111827', paddingTop: insets.top + 20 }]}>
      <Text style={[styles.title, { color: isLightTheme ? '#1f2937' : '#f9fafb' }]}>
        Company Users
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0f766e" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0f766e']}
              tintColor={isLightTheme ? '#0f766e' : '#f9fafb'}
            />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: isLightTheme ? '#6b7280' : '#d1d5db' }]}>
              No users found in your company.
            </Text>
          }
        />
      )}
    </View>
  );
};

export default ManageUsers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    alignSelf: 'center',
  },
  loader: {
    marginTop: 50,
  },
  listContainer: {
    paddingBottom: 20,
  },
  userCard: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2, // For Android
    shadowColor: '#000', // For iOS
    shadowOffset: { width: 0, height: 1 }, // For iOS
    shadowOpacity: 0.2, // For iOS
    shadowRadius: 1, // For iOS
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  userRole: {
    fontSize: 14,
    marginTop: 2,
  },
  userStatus: {
    fontSize: 14,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  actionButton: {
    padding: 8,
  },
});
