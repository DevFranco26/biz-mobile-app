// app/(tabs)/(leaves)/ApprovalLeaves.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';
import useLeaveStore from '../../../store/leaveStore';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import 'nativewind';

const ApprovalLeaves = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    userLeaves,
    fetchUserLeaves,
    loadingUserLeaves,
    errorUserLeaves,
  } = useLeaveStore();

  const [sortOrder, setSortOrder] = useState('desc'); 
  const [filterStatus, setFilterStatus] = useState('ALL'); 
  const [filterType, setFilterType] = useState('ALL');

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilterOption, setSelectedFilterOption] = useState(null); 

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert(
          'Authentication Error',
          'You are not logged in. Please sign in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('(auth)/signin');
              },
            },
          ]
        );
        return;
      }
      await fetchUserLeaves(token);
    };
    initialize();
  }, [fetchUserLeaves, router]);

  const onRefresh = useCallback(async () => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      setRefreshing(true);
      await fetchUserLeaves(token);
      setRefreshing(false);
    }
  }, [fetchUserLeaves]);

  const getFilteredAndSortedLeaves = () => {
    let filtered = Array.isArray(userLeaves) ? [...userLeaves] : [];

    if (filterStatus && filterStatus !== 'ALL') {
      filtered = filtered.filter((leave) => leave.status === filterStatus);
    }

    if (filterType && filterType !== 'ALL') {
      filtered = filtered.filter((leave) => leave.type === filterType);
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.fromDate);
      const dateB = new Date(b.fromDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'text-yellow-500';
      case 'Approved':
        return 'text-green-500';
      case 'Rejected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const renderLeaveItem = ({ item }) => (
    <View className={`
      p-4 rounded-lg mb-4 
      ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}
    `}>
      <View className="flex-row justify-between items-center mb-2">
        <Text className={`text-lg font-semibold ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
          {item.type}
        </Text>
        <Text className={`font-semibold ${getStatusColor(item.status)}`}>
          {item.status}
        </Text>
      </View>

      {/* From Date (separate row, single icon) */}
      <View className="flex-row items-center mt-2">
        <Ionicons
          name="arrow-up-circle-outline"
          size={20}
          color={isLightTheme ? '#374151' : '#9ca3af'}
          style={{ marginRight: 4 }}
        />
        <Text className={`text-sm font-medium ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
          From: {formatDateTime(item.fromDate)}
        </Text>
      </View>

      {/* To Date (separate row, single icon) */}
      <View className="flex-row items-center mt-2">
        <Ionicons
          name="arrow-down-circle-outline"
          size={20}
          color={isLightTheme ? '#374151' : '#9ca3af'}
          style={{ marginRight: 4 }}
        />
        <Text className={`text-sm font-medium ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
          To: {formatDateTime(item.toDate)}
        </Text>
      </View>

      {/* Reason Section */}
      {item.reason ? (
        <View className="mt-3 flex-row items-start">
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={isLightTheme ? '#374151' : '#9ca3af'}
            style={{ marginRight: 8, marginTop: 2 }}
          />
          <Text className={`text-sm ${isLightTheme ? 'text-gray-700' : 'text-gray-300'} flex-1`}>
            {item.reason}
          </Text>
        </View>
      ) : null}

      {/* If Rejected, show rejection reason */}
      {item.status === 'Rejected' && item.rejectionReason && (
        <View className="mt-3 flex-row items-start">
          <Ionicons
            name="close-circle"
            size={18}
            color={'#ef4444'}
            style={{ marginRight: 8, marginTop: 2 }}
          />
          <Text className="text-sm text-red-500 flex-1">
            {`Rejection Reason: ${item.rejectionReason}`}
          </Text>
        </View>
      )}
    </View>
  );

  const toggleSortOrder = () => {
    setSortOrder((prevOrder) => (prevOrder === 'desc' ? 'asc' : 'desc'));
  };

  const handleFilterOption = (option) => {
    setSelectedFilterOption(option);
  };

  const handleStatusSelection = (status) => {
    setFilterStatus(status);
    setIsFilterModalVisible(false);
    setSelectedFilterOption(null);
  };

  const handleTypeSelection = (type) => {
    setFilterType(type);
    setIsFilterModalVisible(false);
    setSelectedFilterOption(null);
  };

  const removeFilter = (filterTypeToRemove) => {
    if (filterTypeToRemove === 'status') {
      setFilterStatus('ALL');
    } else if (filterTypeToRemove === 'type') {
      setFilterType('ALL');
    }
  };

  const statusIcons = {
    'All': 'layers-outline',
    'Pending': 'time-outline',
    'Approved': 'checkmark-circle-outline',
    'Rejected': 'close-circle-outline',
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Sick Leave':
        return 'medkit';
      case 'Vacation Leave':
        return 'umbrella';
      case 'Emergency Leave':
        return 'exclamation-triangle';
      case 'Maternity/Paternity Leave':
        return 'baby';
      case 'Casual Leave':
        return 'coffee';
      default:
        return 'file-alt';
    }
  };

  return (
    <SafeAreaView className={`flex-1 px-4 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`} style={{ paddingTop: insets.top }}>
      {/* Header with Active Filters and Sort/Filter Icons */}
      <View className="flex-row justify-between items-center mb-4">
        {/* Active Filters */}
        <View className="flex-row flex-wrap">
          {filterStatus !== 'ALL' && (
            <View className={`
              flex-row items-center px-2 py-1 rounded-full mr-2 mb-1
              ${isLightTheme ? 'bg-sky-100' : 'bg-slate-700'}
            `}>
              <Text className={`
                text-sm mr-1
                ${isLightTheme ? 'text-blue-900' : 'text-sky-300'}
              `}>
                {filterStatus}
              </Text>
              <Pressable onPress={() => removeFilter('status')}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={isLightTheme ? '#374151' : '#9ca3af'}
                  style={{ marginLeft: 4 }}
                />
              </Pressable>
            </View>
          )}

          {filterType !== 'ALL' && (
            <View className={`
              flex-row items-center px-2 py-1 rounded-full mr-2 mb-1
              ${isLightTheme ? 'bg-sky-100' : 'bg-slate-700'}
            `}>
              <Text className={`
                text-sm mr-1
                ${isLightTheme ? 'text-blue-900' : 'text-sky-300'}
              `}>
                {filterType}
              </Text>
              <Pressable onPress={() => removeFilter('type')}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={isLightTheme ? '#374151' : '#9ca3af'}
                  style={{ marginLeft: 4 }}
                />
              </Pressable>
            </View>
          )}
        </View>

        {/* Sort and Filter Icons */}
        <View className="flex-row">
          <Pressable
            onPress={toggleSortOrder}
            className="mr-4"
            accessibilityLabel="Sort by Date"
          >
            <MaterialIcons
              name="sort"
              size={24}
              color={
                sortOrder === 'asc'
                  ? '#f97316'
                  : isLightTheme
                    ? '#374151'
                    : '#9ca3af'
              }
            />
          </Pressable>

          <Pressable
            onPress={() => setIsFilterModalVisible(true)}
            className="mr-4"
            accessibilityLabel="Filter Options"
          >
            <Ionicons
              name="filter"
              size={24}
              color={isLightTheme ? '#374151' : '#9ca3af'}
            />
          </Pressable>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsFilterModalVisible(false);
          setSelectedFilterOption(null);
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => {
            setIsFilterModalVisible(false);
            setSelectedFilterOption(null);
          }}
        >
          <View className={`
            w-11/12 max-h-3/4 p-6 rounded-lg
            ${isLightTheme ? 'bg-white' : 'bg-slate-800'}
          `}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-xl font-semibold ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                {selectedFilterOption === 'status'
                  ? 'Filter by Status'
                  : selectedFilterOption === 'type'
                  ? 'Filter by Leave Type'
                  : 'Filter Options'}
              </Text>
              <Pressable
                onPress={() => {
                  setIsFilterModalVisible(false);
                  setSelectedFilterOption(null);
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isLightTheme ? '#374151' : '#9ca3af'}
                />
              </Pressable>
            </View>

            {!selectedFilterOption && (
              <View>
                <Pressable
                  className="flex-row items-center mb-4 p-2 rounded-lg"
                  android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                  onPress={() => handleFilterOption('status')}
                >
                  <Ionicons
                    name="time"
                    size={24}
                    color={isLightTheme ? '#374151' : '#9ca3af'}
                    style={{ marginRight: 12 }}
                  />
                  <Text className={`text-lg ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                    Filter by Status
                  </Text>
                </Pressable>

                <Pressable
                  className="flex-row items-center p-2 rounded-lg"
                  android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                  onPress={() => handleFilterOption('type')}
                >
                  <Ionicons
                    name="document-text"
                    size={24}
                    color={isLightTheme ? '#374151' : '#9ca3af'}
                    style={{ marginRight: 12 }}
                  />
                  <Text className={`text-lg ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                    Filter by Leave Type
                  </Text>
                </Pressable>
              </View>
            )}

            {selectedFilterOption === 'status' && (
              <View>
                {[
                  { label: 'All', value: 'ALL', icon: 'layers-outline' },
                  { label: 'Pending', value: 'Pending', icon: 'time-outline' },
                  { label: 'Approved', value: 'Approved', icon: 'checkmark-circle-outline' },
                  { label: 'Rejected', value: 'Rejected', icon: 'close-circle-outline' },
                ].map((status) => (
                  <Pressable
                    key={status.value}
                    className={`flex-row items-center mb-3 p-2 rounded-lg ${filterStatus === status.value ? 'bg-blue-200' : ''}`}
                    onPress={() => handleStatusSelection(status.value)}
                    android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                  >
                    <Ionicons
                      name={status.icon}
                      size={24}
                      color={filterStatus === status.value ? '#1e3a8a' : (isLightTheme ? '#374151' : '#9ca3af')}
                      style={{ marginRight: 12 }}
                    />
                    <Text className={`text-lg ${filterStatus === status.value ? 'text-blue-900' : (isLightTheme ? 'text-gray-800' : 'text-gray-100')}`}>
                      {status.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {selectedFilterOption === 'type' && (
              <View>
                {[
                  { label: 'All', value: 'ALL' },
                  { label: 'Sick Leave', value: 'Sick Leave' },
                  { label: 'Vacation Leave', value: 'Vacation Leave' },
                  { label: 'Emergency Leave', value: 'Emergency Leave' },
                  { label: 'Maternity/Paternity Leave', value: 'Maternity/Paternity Leave' },
                  { label: 'Casual Leave', value: 'Casual Leave' },
                ].map((type) => (
                  <Pressable
                    key={type.value}
                    className={`flex-row items-center mb-3 p-2 rounded-lg ${filterType === type.value ? 'bg-blue-200' : ''}`}
                    onPress={() => handleTypeSelection(type.value)}
                    android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                  >
                    <FontAwesome5
                      name={getTypeIcon(type.value)}
                      size={24}
                      color={filterType === type.value ? '#1e3a8a' : (isLightTheme ? '#374151' : '#9ca3af')}
                      style={{ marginRight: 12 }}
                    />
                    <Text className={`text-lg ${filterType === type.value ? 'text-blue-900' : (isLightTheme ? 'text-gray-800' : 'text-gray-100')}`}>
                      {type.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {loadingUserLeaves && !refreshing ? (
        <ActivityIndicator size="large" color="#10B981" style={styles.activityIndicator} />
      ) : errorUserLeaves ? (
        <Text className={`text-center mt-10 text-base ${isLightTheme ? 'text-red-700' : 'text-red-300'}`}>
          {errorUserLeaves}
        </Text>
      ) : (
        <FlatList
          data={getFilteredAndSortedLeaves()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLeaveItem}
          showsVerticalScrollIndicator={true}  // Ensures scrollbar is visible on the right
          contentContainerStyle={
            getFilteredAndSortedLeaves().length === 0
              ? { flexGrow: 1, justifyContent: 'center', alignItems: 'center' }
              : { paddingBottom: 40 }
          }
          ListEmptyComponent={
            <Text className={`text-center mt-10 text-base ${isLightTheme ? 'text-gray-800' : 'text-white'}`}>
              You have not submitted any leave requests.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#10B981']}
              tintColor={isLightTheme ? '#10B981' : '#ffffff'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  activityIndicator: {
    marginTop: 40,
  },
});

export default ApprovalLeaves;
