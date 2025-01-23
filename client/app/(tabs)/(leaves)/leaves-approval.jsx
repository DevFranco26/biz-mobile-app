// File: app/(tabs)/(leaves)/leaves-approval.jsx

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';
import useLeaveStore from '../../../store/leaveStore';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import useUsersStore from '../../../store/usersStore';

const ApprovalLeaves = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();
  const { userLeaves, fetchUserLeaves, loadingUserLeaves, errorUserLeaves } = useLeaveStore();
  const { fetchUserById } = useUsersStore();
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedFilterOption, setSelectedFilterOption] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [approverEmails, setApproverEmails] = useState({});
  const [requesterEmails, setRequesterEmails] = useState({});

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Sick Leave':
        return 'bandage-outline';
      case 'Vacation Leave':
        return 'airplane-outline';
      case 'Emergency Leave':
        return 'warning-outline';
      case 'Maternity/Paternity Leave':
        return 'woman-outline';
      case 'Casual Leave':
        return 'beer-outline';
      default:
        return 'layers-outline';
    }
  };

  // Helper function for Status icons using Ionicons
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return 'time-outline';
      case 'Approved':
        return 'checkmark-circle-outline';
      case 'Rejected':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert(
          'Authentication Error',
          'You are not logged in. Please sign in again.',
          [{ text: 'OK', onPress: () => router.replace('(auth)/login-user') }]
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

  useEffect(() => {
    (async () => {
      if (!Array.isArray(userLeaves)) return;
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const uniqueApproverIds = [
        ...new Set(userLeaves.map((l) => l.approverId).filter(Boolean)),
      ];
      for (const approverId of uniqueApproverIds) {
        if (!approverEmails[approverId]) {
          const userData = await fetchUserById(approverId, token);
          if (userData?.email) {
            setApproverEmails((prev) => ({ ...prev, [approverId]: userData.email }));
          }
        }
      }
    })();
  }, [userLeaves, approverEmails, fetchUserById]);

  useEffect(() => {
    (async () => {
      if (!Array.isArray(userLeaves)) return;
      const token = await SecureStore.getItemAsync('token');
      if (!token) return;
      const uniqueRequesterIds = [
        ...new Set(userLeaves.map((l) => l.userId).filter(Boolean)),
      ];
      for (const userId of uniqueRequesterIds) {
        if (!requesterEmails[userId]) {
          const userData = await fetchUserById(userId, token);
          if (userData?.email) {
            setRequesterEmails((prev) => ({ ...prev, [userId]: userData.email }));
          }
        }
      }
    })();
  }, [userLeaves, requesterEmails, fetchUserById]);

  const getFilteredAndSortedLeaves = () => {
    let filtered = Array.isArray(userLeaves) ? [...userLeaves] : [];

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((leave) => leave.status === filterStatus);
    }
    if (filterType !== 'ALL') {
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
        return 'text-slate-500';
    }
  };

  const renderLeaveItem = ({ item }) => (
    <View className={`p-4 rounded-lg mb-4 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
      <View className="flex-row justify-between items-center mb-2">
        <Text className={`text-lg font-semibold ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
          {item.type}
        </Text>
        <Text className={`font-semibold ${getStatusColor(item.status)}`}>{item.status}</Text>
      </View>

      {item.userId && (
        <View className="mt-1 flex-row items-start">
          <FontAwesome5
            name="user-alt"
            size={18}
            color={isLightTheme ? '#374151' : '#9ca3af'}
            className="mr-1 mt-1"
          />
          <Text className={`text-sm my-auto ${isLightTheme ? 'text-slate-700' : 'text-slate-300'} flex-1`}>
            <Text className="font-bold">Requester:</Text>{' '}
            {requesterEmails[item.userId] || 'Fetching requester email...'}
          </Text>
        </View>
      )}

      {item.approverId && (
        <View className="mt-1 flex-row items-start">
          <FontAwesome5
            name="user-cog"
            size={18}
            color={isLightTheme ? '#374151' : '#9ca3af'}
            className="mr-1 mt-1"
          />
          <Text className={`text-sm my-auto ${isLightTheme ? 'text-slate-700' : 'text-slate-300'} flex-1`}>
            <Text className="font-bold">Approver:</Text>{' '}
            {approverEmails[item.approverId] || 'Fetching approver email...'}
          </Text>
        </View>
      )}

      <View className="flex-row items-center mt-2">
        <FontAwesome5
          name="arrow-alt-circle-up"
          size={20}
          color={isLightTheme ? '#374151' : '#9ca3af'}
          className="mr-2"
        />
        <Text className={`text-sm font-medium ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
          <Text className="font-bold">Start: </Text>{formatDateTime(item.fromDate)}
        </Text>
      </View>

      <View className="flex-row items-center mt-2">
        <FontAwesome5
          name="arrow-alt-circle-down"
          size={20}
          color={isLightTheme ? '#374151' : '#9ca3af'}
          className="mr-2"
        />
        <Text className={`text-sm font-medium ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
          <Text className="font-bold">End: </Text>{formatDateTime(item.toDate)}
        </Text>
      </View>

      {item.reason && (
        <View className="mt-1 flex-row items-start">
          <FontAwesome5
            name="info-circle"
            size={20}
            color={isLightTheme ? '#374151' : '#9ca3af'}
            className="mr-2 mt-1 my-auto"
          />
          <Text className={`text-sm my-auto ${isLightTheme ? 'text-slate-700' : 'text-slate-300'} flex-1`}>
            <Text className="font-bold">Reason: </Text>{item.reason}
          </Text>
        </View>
      )}

      {item.status === 'Rejected' && item.rejectionReason && (
        <View className="mt-1 flex-row items-start">
          <AntDesign
            name="closecircle"
            size={20}
            color="#ef4444"
            className="mr-2 mt-1"
          />
          <Text className={`text-sm my-auto ${isLightTheme ? 'text-slate-700' : 'text-slate-300'} flex-1`}>
            <Text className="font-bold text-red-500">Rejected: </Text>{item.rejectionReason}
          </Text>
        </View>
      )}
    </View>
  );

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const handleFilterOption = (option) => setSelectedFilterOption(option);
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
    if (filterTypeToRemove === 'status') setFilterStatus('ALL');
    else if (filterTypeToRemove === 'type') setFilterType('ALL');
  };

  return (
    <SafeAreaView
      className={`flex-1 px-4 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      style={{ paddingTop: 60 }}
    >
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row flex-wrap">
          {filterStatus !== 'ALL' && (
            <View
              className={`flex-row items-center px-2 py-1 rounded-full mr-2 mb-1 ${
                isLightTheme ? 'bg-slate-100' : 'bg-slate-700'
              }`}
            >
              <Text className={`text-sm mr-1 ${isLightTheme ? 'text-slate-900' : 'text-slate-300'}`}>
                {filterStatus}
              </Text>
              <Pressable onPress={() => removeFilter('status')}>
                <Ionicons name="close-circle" size={16} color={isLightTheme ? '#374151' : '#9ca3af'} />
              </Pressable>
            </View>
          )}
          {filterType !== 'ALL' && (
            <View
              className={`flex-row items-center px-2 py-1 rounded-full mr-2 mb-1 ${
                isLightTheme ? 'bg-slate-100' : 'bg-slate-700'
              }`}
            >
              <Text className={`text-sm mr-1 ${isLightTheme ? 'text-slate-900' : 'text-slate-300'}`}>
                {filterType}
              </Text>
              <Pressable onPress={() => removeFilter('type')}>
                <Ionicons name="close-circle" size={16} color={isLightTheme ? '#374151' : '#9ca3af'} />
              </Pressable>
            </View>
          )}
        </View>

        <View className="flex-row">
          <Pressable onPress={toggleSortOrder} className="mr-4" accessibilityLabel="Sort by Date">
            <MaterialIcons
              name="sort"
              size={24}
              color={sortOrder === 'asc' ? '#f97316' : isLightTheme ? '#374151' : '#9ca3af'}
            />
          </Pressable>
          <Pressable onPress={() => setIsFilterModalVisible(true)} className="mr-4" accessibilityLabel="Filter Options">
            <Ionicons name="filter" size={24} color={isLightTheme ? '#374151' : '#9ca3af'} />
          </Pressable>
        </View>
      </View>

      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsFilterModalVisible(false);
          setSelectedFilterOption(null);
        }}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center"
          activeOpacity={1}
          onPressOut={() => {
            setIsFilterModalVisible(false);
            setSelectedFilterOption(null);
          }}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)' }}
        >
          <View
            className={`w-11/12 max-h-3/4 p-6 rounded-2xl ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            }`}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className={`text-xl font-semibold ${
                  isLightTheme ? 'text-slate-800' : 'text-slate-100'
                }`}
              >
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
                <Ionicons name="close" size={24} color={isLightTheme ? '#374151' : '#9ca3af'} />
              </Pressable>
            </View>

            {!selectedFilterOption && (
              <View>
                <Pressable
                  className="flex-row items-center mb-4 p-2 rounded-lg"
                  android_ripple={{ color: isLightTheme ? '#e5e7eb' : '#4b5563' }}
                  onPress={() => handleFilterOption('status')}
                >
                  <Ionicons
                    name={getStatusIcon('Pending')}
                    size={24}
                    color={isLightTheme ? '#374151' : '#9ca3af'}
                    className="mr-3"
                  />
                  <Text className={`text-lg ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
                    Filter by Status
                  </Text>
                </Pressable>

                <Pressable
                  className="flex-row items-center p-2 rounded-lg"
                  android_ripple={{ color: isLightTheme ? '#e5e7eb' : '#4b5563' }}
                  onPress={() => handleFilterOption('type')}
                >
                  <Ionicons
                    name={getStatusIcon('All')}
                    size={24}
                    color={isLightTheme ? '#374151' : '#9ca3af'}
                    className="mr-3"
                  />
                  <Text className={`text-lg ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
                    Filter by Leave Type
                  </Text>
                </Pressable>
              </View>
            )}

            {selectedFilterOption === 'status' && (
              <View>
                {['Pending', 'Approved', 'Rejected'].map((status) => (
                  <Pressable
                    key={status}
                    className={`flex-row items-center mb-3 p-2 rounded-lg ${
                      filterStatus === status ? 'bg-slate-200' : ''
                    }`}
                    onPress={() => handleStatusSelection(status)}
                    android_ripple={{ color: isLightTheme ? '#e5e7eb' : '#4b5563' }}
                  >
                    <Ionicons
                      name={getStatusIcon(status)}
                      size={24}
                      color={
                        filterStatus === status
                          ? '#1e3a8a'
                          : isLightTheme
                          ? '#374151'
                          : '#9ca3af'
                      }
                      className="mr-3"
                    />
                    <Text
                      className={`text-lg ${
                        filterStatus === status
                          ? 'text-slate-900'
                          : isLightTheme
                          ? 'text-slate-800'
                          : 'text-slate-100'
                      }`}
                    >
                      {status}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {selectedFilterOption === 'type' && (
              <View>
                {[
                  'Sick Leave',
                  'Vacation Leave',
                  'Emergency Leave',
                  'Maternity/Paternity Leave',
                  'Casual Leave',
                ].map((type) => (
                  <Pressable
                    key={type}
                    className={`flex-row items-center mb-3 p-2 rounded-lg ${
                      filterType === type
                        ? isLightTheme
                          ? 'bg-slate-200'
                          : 'bg-slate-600'
                        : ''
                    }`}
                    onPress={() => handleTypeSelection(type)}
                    android_ripple={{ color: isLightTheme ? '#e5e7eb' : '#4b5563' }}
                  >
                    <Ionicons
                      name={getTypeIcon(type)}
                      size={24}
                      color={
                        filterType === type
                          ? isLightTheme
                            ? '#44403c'
                            : '#d6d3d1'
                          : isLightTheme
                          ? '#44403c'
                          : '#d6d3d1'
                      }
                      className="mr-3"
                    />
                    <Text
                      className={`text-lg ${
                        filterType === type
                          ? isLightTheme
                            ? 'text-slate-700'
                            : 'text-slate-300'
                          : isLightTheme
                          ? 'text-slate-700'
                          : 'text-slate-300'
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {loadingUserLeaves && !refreshing ? (
        <ActivityIndicator size="large" color="#6B7280" className="mt-10" />
      ) : errorUserLeaves ? (
        <Text className={`text-center mt-10 text-base ${isLightTheme ? 'text-red-700' : 'text-red-300'}`}>
          {errorUserLeaves}
        </Text>
      ) : (
        <FlatList
          data={getFilteredAndSortedLeaves()}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderLeaveItem}
          showsVerticalScrollIndicator
          contentContainerStyle={
            getFilteredAndSortedLeaves().length === 0
              ? { flexGrow: 1, justifyContent: 'center', alignItems: 'center' }
              : { paddingBottom: 40 }
          }
          ListEmptyComponent={
            <Text className={`text-center mt-10 text-base ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
              You have not submitted any leave requests.
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#6B7280']}
              tintColor={isLightTheme ? '#6B7280' : '#6B7280'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ApprovalLeaves;
