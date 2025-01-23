// File: app/(tabs)/(settings)/(management)/manage-leaves.jsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../../store/themeStore';
import useLeaveStore from '../../../../store/leaveStore';
import useUsersStore from '../../../../store/usersStore';

const Leaves = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const {
    leaves,
    loadingLeaves,
    errorLeaves,
    fetchLeaves,
    approveLeave,
    rejectLeave,
    filterStatus,
    setFilterStatus,
  } = useLeaveStore();

  const {
    users,
    fetchUsers,
    loading: loadingUsers,
    error: errorUsers,
  } = useUsersStore();

  // Sorting and Filtering States
  const [sortOrder, setSortOrder] = useState('desc'); 
  const [localFilterStatus, setLocalFilterStatus] = useState('Pending'); 
  const [filterUserEmail, setFilterUserEmail] = useState('ALL'); // Filter by user email

  // State for combined leaves when "All" is selected
  const [allLeaves, setAllLeaves] = useState([]);

  // States for Modals
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilterOption, setSelectedFilterOption] = useState(null); // 'status' or 'user'

  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Refreshing state for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);

  // Sync filter status in store with local state
  useEffect(() => {
    setFilterStatus(localFilterStatus);
  }, [localFilterStatus]);

  const fetchAllStatuses = async (token) => {
    const statuses = ['Pending', 'Approved', 'Rejected'];
    let combined = [];
    for (const status of statuses) {
      await fetchLeaves(token, status);
      const fetchedLeaves = useLeaveStore.getState().leaves;
      combined = [...combined, ...fetchedLeaves];
    }

    // Remove duplicates by ID
    const uniqueLeaves = Array.from(new Set(combined.map(l => l.id))).map(id =>
      combined.find(l => l.id === id)
    );
    setAllLeaves(uniqueLeaves);
  };

  const fetchLeavesBasedOnFilter = async (token, status) => {
    try {
      if (status === 'All') {
        await fetchAllStatuses(token);
      } else {
        await fetchLeaves(token, status);
        setAllLeaves(useLeaveStore.getState().leaves);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    }
  };

  // Fetch leaves and users on mount
  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/login-user');
        return;
      }
      try {
        // Fetch Leaves
        await fetchLeavesBasedOnFilter(token, localFilterStatus);
        // Fetch Users
        await fetchUsers(token);
      } catch (error) {
        console.error('Error initializing ManageLeaves:', error);
      }
    };
    initialize();
  }, [localFilterStatus, fetchUsers]);

  const onRefresh = useCallback(async () => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      setRefreshing(true);
      await fetchLeavesBasedOnFilter(token, localFilterStatus);
      await fetchUsers(token);
      setRefreshing(false);
    }
  }, [localFilterStatus, fetchUsers]);

  // Apply Sorting and User Email Filtering
  const getSortedAndFilteredLeaves = () => {
    const dataToSort = localFilterStatus === 'All' ? allLeaves : leaves;
    let filteredLeaves = Array.isArray(dataToSort) ? [...dataToSort] : [];

    // Filter by User Email
    if (filterUserEmail !== 'ALL') {
      filteredLeaves = filteredLeaves.filter(leave => leave.requester.dataValues.email === filterUserEmail);
    }

    // Apply Sorting
    filteredLeaves.sort((a, b) => {
      const dateA = new Date(a.fromDate);
      const dateB = new Date(b.fromDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filteredLeaves;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(); 
  };

  // Handle Approve Action
  const handleApprove = async (leaveId) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      const result = await approveLeave(leaveId, token);
      if (result.success) {
        Alert.alert('Success', result.message);
        await fetchLeavesBasedOnFilter(token, localFilterStatus);
      } else {
        Alert.alert('Error', result.message);
      }
    } else {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/login-user');
    }
  };

  // Handle Reject Action (with Reason)
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Validation Error', 'Rejection reason is mandatory.');
      return;
    }

    const token = await SecureStore.getItemAsync('token');
    if (token && selectedLeave) {
      const result = await rejectLeave(selectedLeave.id, rejectionReason, token);
      if (result.success) {
        Alert.alert('Success', result.message);
        setIsRejectModalVisible(false);
        setSelectedLeave(null);
        setRejectionReason('');
        await fetchLeavesBasedOnFilter(token, localFilterStatus);
      } else {
        Alert.alert('Error', result.message);
      }
    } else {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/login-user');
    }
  };

  // Handle Leave Action Selection
  const handleLeaveAction = (leave) => {
    Alert.alert(
      'Leave Actions',
      `Choose an action for ${leave.requester.firstName}'s leave request.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => handleApprove(leave.id) },
        {
          text: 'Reject', onPress: () => {
            setSelectedLeave(leave);
            setIsRejectModalVisible(true);
          }
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View className={`
      px-4 py-4 mb-3 rounded-xl flex-col 
      ${isLightTheme ? 'bg-slate-200' : 'bg-slate-800'}
    `}>
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center flex-1">
          <Ionicons
            name="calendar-outline"
            size={40}
            color={isLightTheme ? '#4b5563' : '#d1d5db'}
          />
          <View className="ml-3 flex-1">
            <Text className={`text-base font-semibold ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
              {item.requester.name}
            </Text>
            <Text className={`text-sm ${isLightTheme ? 'text-slate-600' : 'text-slate-300'}`}>
              Email: {item.requester.dataValues.email}
            </Text>
            <Text className={`
              text-sm font-medium mt-1
              ${item.status === 'Approved' ? 'text-green-500' : ''}
              ${item.status === 'Pending' ? 'text-yellow-500' : ''}
              ${item.status === 'Rejected' ? 'text-red-500' : ''}
            `}>
              {item.status}
            </Text>
          </View>
        </View>
        {item.status === 'Pending' && (
          <Pressable onPress={() => handleLeaveAction(item)} className="p-2">
            <Ionicons
              name="ellipsis-vertical"
              size={24}
              color={isLightTheme ? '#1f2937' : '#f9fafb'}
            />
          </Pressable>
        )}
      </View>
      
      {item.reason && item.reason.trim() !== '' && (
        <Text className={`text-sm mt-1 ${isLightTheme ? 'text-slate-700' : 'text-slate-200'}`}>
          Reason: {item.reason}
        </Text>
      )}

      {/* From Date */}
      <View className="flex-row items-center mt-2">
        <Ionicons
          name="arrow-up-circle-outline"
          size={20}
          color={isLightTheme ? '#374151' : '#9ca3af'}
          style={{ marginRight: 4 }}
        />
        <Text className={`text-sm font-medium ${isLightTheme ? 'text-slate-700' : 'text-slate-200'}`}>
          From: {formatDate(item.fromDate)}
        </Text>
      </View>

      {/* To Date */}
      <View className="flex-row items-center mt-2">
        <Ionicons
          name="arrow-down-circle-outline"
          size={20}
          color={isLightTheme ? '#374151' : '#9ca3af'}
          style={{ marginRight: 4 }}
        />
        <Text className={`text-sm font-medium ${isLightTheme ? 'text-slate-700' : 'text-slate-200'}`}>
          To: {formatDate(item.toDate)}
        </Text>
      </View>

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

  // Icons for filter statuses
  const statusIcons = {
    'All': 'layers-outline',
    'Pending': 'time-outline',
    'Approved': 'checkmark-circle-outline',
    'Rejected': 'close-circle-outline',
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`} edges={['top']}>
      {/* Custom Header */}
      <View className="flex-row items-center p-4">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text className={`text-xl font-bold ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
          Manage Leaves
        </Text>
      </View>

      {/* Sorting and Filtering UI */}
      <View className="flex-row justify-between items-center mx-4 mb-2">
        {/* Active Filters */}
        <View className="flex-row flex-wrap">
          {localFilterStatus !== 'All' && (
            <View className={`
              flex-row items-center px-2 py-1 rounded-full mr-2 mb-1
              ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'}
            `}>
              <Text className={`
                text-sm mr-1
                ${isLightTheme ? 'text-slate-900' : 'text-slate-300'}
              `}>
                {localFilterStatus}
              </Text>
              <Pressable onPress={() => setLocalFilterStatus('All')}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={isLightTheme ? '#374151' : '#9ca3af'}
                  style={{ marginLeft: 4 }}
                />
              </Pressable>
            </View>
          )}

          {filterUserEmail !== 'ALL' && (
            <View className={`
              flex-row items-center px-2 py-1 rounded-full mr-2 mb-1
              ${isLightTheme ? 'bg-slate-100' : 'bg-slate-700'}
            `}>
              <Text className={`
                text-sm mr-1
                ${isLightTheme ? 'text-slate-900' : 'text-slate-300'}
              `}>
                {filterUserEmail}
              </Text>
              <Pressable onPress={() => setFilterUserEmail('ALL')}>
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
          {/* Sort Icon */}
          <Pressable
            onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="ml-2"
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

          {/* Filter Icon */}
          <Pressable
            onPress={() => {
              setSelectedFilterOption(null); // Reset selected filter option
              setIsFilterModalVisible(true);
            }}
            className="ml-2"
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

      {/* Leaves List */}
      {loadingLeaves && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#64748B"
          style={{ marginTop: 40 }}
        />
      ) : errorLeaves ? (
        <Text className={`text-center mt-10 text-base ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
          {errorLeaves}
        </Text>
      ) : (
        <FlatList
          data={getSortedAndFilteredLeaves()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={getSortedAndFilteredLeaves().length === 0 ? { flexGrow: 1, justifyContent: 'center', alignItems: 'center' } : { paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={
            <Text className={`text-center mt-10 text-base ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
              No leave requests found.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#64748B']}
              tintColor={isLightTheme ? '#64748B' : '#f9fafb'}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsFilterModalVisible(false);
          setSelectedFilterOption(null);
        }}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]"
          activeOpacity={1}
          onPressOut={() => {
            setIsFilterModalVisible(false);
            setSelectedFilterOption(null);
          }}
        >
          {/* Modal Content */}
          <View className={`
            w-[90%] p-5 rounded-xl
            bg-slate-800
          `}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-white">
                {selectedFilterOption === 'status'
                  ? 'Filter by Status'
                  : selectedFilterOption === 'user'
                  ? 'Filter by User'
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
                  color="#9ca3af"
                />
              </Pressable>
            </View>

            {/* If no specific filter selected yet */}
            {!selectedFilterOption && (
              <View>
                {/* Filter by Status */}
                <Pressable
                  className="flex-row items-center mb-4 p-2 rounded-lg"
                  android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                  onPress={() => setSelectedFilterOption('status')}
                >
                  <Ionicons
                    name="time"
                    size={24}
                    color={isLightTheme ? '#374151' : '#9ca3af'}
                    style={{ marginRight: 12 }}
                  />
                  <Text className={`text-lg ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
                    Filter by Status
                  </Text>
                </Pressable>

                {/* Filter by User */}
                <Pressable
                  className="flex-row items-center p-2 rounded-lg"
                  android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                  onPress={() => setSelectedFilterOption('user')}
                >
                  <Ionicons
                    name="people-circle-outline"
                    size={24}
                    color={isLightTheme ? '#374151' : '#9ca3af'}
                    style={{ marginRight: 12 }}
                  />
                  <Text className={`text-lg ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
                    Filter by User
                  </Text>
                </Pressable>
              </View>
            )}

            {/* If status filter selected */}
            {selectedFilterOption === 'status' && (
              <View>
                {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                  <Pressable
                    key={status}
                    className={`
                      flex-row items-center mb-3 p-2 rounded-lg
                      ${localFilterStatus === status ? 'bg-slate-200' : ''}
                    `}
                    onPress={() => {
                      setLocalFilterStatus(status);
                      setIsFilterModalVisible(false);
                      setSelectedFilterOption(null);
                    }}
                    android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                  >
                    <Ionicons
                      name={statusIcons[status]}
                      size={24}
                      color={
                        localFilterStatus === status
                          ? '#1e3a8a'
                          : isLightTheme
                          ? '#374151'
                          : '#9ca3af'
                      }
                      style={{ marginRight: 12 }}
                    />
                    <Text className={`
                      text-lg
                      ${localFilterStatus === status ? 'text-slate-900' : (isLightTheme ? 'text-slate-800' : 'text-slate-100')}
                    `}>
                      {status}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* If user filter selected */}
            {selectedFilterOption === 'user' && (
              <View>
                <Text className="text-lg mb-2 text-white font-medium">
                  Select a User
                </Text>
                {loadingUsers ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : errorUsers ? (
                  <Text className="text-base text-red-400">{errorUsers}</Text>
                ) : (
                  <>
                    {/* Show "All" option */}
                    <Pressable
                      className={`
                        flex-row items-center mb-3 p-2 rounded-lg
                        ${filterUserEmail === 'ALL' ? 'bg-slate-200' : ''}
                      `}
                      onPress={() => {
                        setFilterUserEmail('ALL');
                        setIsFilterModalVisible(false);
                        setSelectedFilterOption(null);
                      }}
                      android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                    >
                      <Ionicons
                        name="layers-outline"
                        size={24}
                        color={
                          filterUserEmail === 'ALL'
                            ? '#1e3a8a'
                            : isLightTheme
                            ? '#374151'
                            : '#9ca3af'
                        }
                        style={{ marginRight: 12 }}
                      />
                      <Text className={`
                        text-lg
                        ${filterUserEmail === 'ALL' ? 'text-slate-900' : (isLightTheme ? 'text-slate-800' : 'text-slate-100')}
                      `}>
                        All Users
                      </Text>
                    </Pressable>

                    {users.map(user => (
                      <Pressable
                        key={user.id}
                        className={`
                          flex-row items-center mb-3 p-2 rounded-lg
                          ${filterUserEmail === user.email ? 'bg-slate-200' : ''}
                        `}
                        onPress={() => {
                          setFilterUserEmail(user.email);
                          setIsFilterModalVisible(false);
                          setSelectedFilterOption(null);
                        }}
                        android_ripple={{color: isLightTheme ? '#e5e7eb' : '#4b5563'}}
                      >
                        <Ionicons
                          name="person-circle-outline"
                          size={24}
                          color={
                            filterUserEmail === user.email
                              ? '#1e3a8a'
                              : isLightTheme
                              ? '#374151'
                              : '#9ca3af'
                          }
                          style={{ marginRight: 12 }}
                        />
                        <Text className={`
                          text-lg
                          ${filterUserEmail === user.email ? 'text-slate-900' : (isLightTheme ? 'text-slate-800' : 'text-slate-100')}
                        `}>
                          {user.email}
                        </Text>
                      </Pressable>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        visible={isRejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsRejectModalVisible(false);
          setSelectedLeave(null);
          setRejectionReason('');
        }}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.5)]"
          activeOpacity={1}
          onPressOut={() => {
            setIsRejectModalVisible(false);
            setSelectedLeave(null);
            setRejectionReason('');
          }}
        >
          <View className={`
            w-[90%] p-5 rounded-xl
            ${isLightTheme ? 'bg-white' : 'bg-slate-700'}
          `}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`
                text-lg font-semibold
                ${isLightTheme ? 'text-slate-800' : 'text-white'}
              `}>
                Reject Leave Request
              </Text>
              <Pressable
                onPress={() => {
                  setIsRejectModalVisible(false);
                  setSelectedLeave(null);
                  setRejectionReason('');
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={isLightTheme ? '#374151' : '#9ca3af'}
                />
              </Pressable>
            </View>

            <Text className={`
              text-base mb-2
              ${isLightTheme ? 'text-slate-800' : 'text-white'}
            `}>
              Rejection Reason:
            </Text>
            <TextInput
              className={`
                border rounded-lg p-3 text-base 
                ${isLightTheme ? 'border-slate-300 bg-slate-100 text-slate-800' : 'border-slate-600 bg-slate-800 text-slate-100'}
              `}
              placeholder="Enter reason for rejection"
              placeholderTextColor={isLightTheme ? '#a1a1aa' : '#9ca3af'}
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />

            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                className="py-2 px-4 rounded-lg ml-2 bg-slate-200"
                onPress={() => {
                  setIsRejectModalVisible(false);
                  setSelectedLeave(null);
                  setRejectionReason('');
                }}
              >
                <Text className="text-base font-medium text-slate-800">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="py-2 px-4 rounded-lg ml-2 bg-green-500"
                onPress={handleReject}
              >
                <Text className="text-base font-medium text-white">Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Leaves;
