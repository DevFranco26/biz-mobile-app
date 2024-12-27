// File: src/components/ManageShiftSchedules.jsx

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
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import RadioButtonRN from 'radio-buttons-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import useThemeStore from '../../../../store/themeStore';
import useShiftSchedulesStore from '../../../../store/shiftSchedulesStore';
import useUsersStore from '../../../../store/usersStore';
import { convertUTCToLocal, convertLocalToUTC } from '../../../../utils/timeUtils';

// Define color hex codes based on the theme
const COLORS = {
  light: {
    background: '#FFFFFF', 
    backgroundSecondary: '#F1F5F9', 
    text: '#374151', 
    modalBackground: '#FFFFFF', 
    inputBackground: '#F1F5F9', 
    borderColor: '#E5E7EB', 
    placeholder: '#6B7280', 
    iconColor: '#374151', 
    activityIndicator: '#374151', 
    deleteIconColor: '#EF4444', 
  },
  dark: {
    background: '#0F172A', 
    backgroundSecondary: '#374151', 
    text: '#D1D5DB', 
    modalBackground: '#1F2937', 
    inputBackground: '#374151', 
    borderColor: '#374151', 
    placeholder: '#9CA3AF', 
    iconColor: '#D1D5DB', 
    activityIndicator: '#D1D5DB', 
    deleteIconColor: '#EF4444', 
  },
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', 
    zIndex: 9999,
    elevation: 9999,
  },
  modalInner: {
    width: '100%',
    padding: 24,
    borderRadius: 12,
  },
  assignModalInner: {
    width: '90%',
    padding: 24,
    borderRadius: 12,
    zIndex: 1000,
  },
  usersModalInner: {
    width: '90%',
    maxHeight: '80%',
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
});

// Compute total hours purely from UTC times.
function computeTotalHours(startUTC, endUTC) {
  const start = new Date(startUTC);
  const end = new Date(endUTC);
  let diffMs = end - start;

  // If diffMs is negative, assume endTime is on the next day
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000; 
  }

  return diffMs / (1000 * 60 * 60);
}

const ManageShiftSchedules = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const {
    shiftSchedules,
    loading,
    error,
    fetchShiftSchedules,
    createShiftSchedule,
    updateShiftSchedule,
    deleteShiftSchedule,
    assignShiftToUser,
    deleteUserFromShift,
  } = useShiftSchedulesStore();
  const { users, fetchUsers } = useUsersStore();

  const [token, setToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 3600000));
  const [editShiftModalVisible, setEditShiftModalVisible] = useState(false);

  // For assigning a shift
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userPickerValue, setUserPickerValue] = useState(null);
  const [userPickerItems, setUserPickerItems] = useState([]);
  const recurrenceOptions = [
    { label: 'All Days', value: 'all' },
    { label: 'Weekdays Only (Mon-Fri)', value: 'weekdays' },
    { label: 'Weekends Only (Sat-Sun)', value: 'weekends' },
  ];
  const [selectedRecurrence, setSelectedRecurrence] = useState('all');

  // For viewing assigned users
  const [assignedUsersModalVisible, setAssignedUsersModalVisible] = useState(false);
  const [selectedShiftForUsers, setSelectedShiftForUsers] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await SecureStore.getItemAsync('token');
      if (!storedToken) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        router.replace('(auth)/signin');
        return;
      }
      setToken(storedToken);
      await fetchShiftSchedules(storedToken);
      await fetchUsers(storedToken);
    };
    initialize();
  }, [fetchShiftSchedules, fetchUsers, router]);

  useEffect(() => {
    if (assignedUsersModalVisible && selectedShiftForUsers) {
      const updatedShift = shiftSchedules.find(
        (shift) => shift.id === selectedShiftForUsers.id
      );
      if (updatedShift) {
        setSelectedShiftForUsers(updatedShift);
      }
    }
  }, [shiftSchedules, assignedUsersModalVisible, selectedShiftForUsers]);

  useEffect(() => {
    // Build userPicker items from users
    const items = [
      { label: 'Select a user...', value: 'null' },
      { label: 'All Users', value: '0' },
      ...users.map((user) => ({
        label: user.email,
        value: String(user.id),
      })),
    ];
    setUserPickerItems(items);
  }, [users]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchShiftSchedules(token);
    await fetchUsers(token);
    setRefreshing(false);
  };

  // Add new shift
  const handleAddShift = () => {
    setSelectedShift(null);
    setEditTitle('');
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 3600000);
    setStartTime(now);
    setEndTime(oneHourLater);
    setEditShiftModalVisible(true);
  };

  // Edit shift
  const handleEditShift = (shift) => {
    setSelectedShift(shift);
    setEditTitle(shift.title);
    setStartTime(new Date(shift.startTime));
    setEndTime(new Date(shift.endTime));
    setEditShiftModalVisible(true);
  };

  // Save shift
  const handleSaveShift = async () => {
    if (!token) return;
    if (!editTitle) {
      Alert.alert('Validation Error', 'Title is required.');
      return;
    }
    const startUTC = convertLocalToUTC(startTime);
    const endUTC = convertLocalToUTC(endTime);
    const payload = {
      title: editTitle,
      startTime: startUTC,
      endTime: endUTC,
    };

    let result;
    if (selectedShift) {
      result = await updateShiftSchedule(token, selectedShift.id, payload);
    } else {
      result = await createShiftSchedule(token, payload);
    }
    if (result && result.success) {
      setEditShiftModalVisible(false);
      await fetchShiftSchedules(token);
    } else if (result && result.message) {
      Alert.alert('Error', result.message);
    }
  };

  // Delete shift
  const handleDeleteShift = async (shiftId) => {
    if (!token) return;
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this shift schedule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await deleteShiftSchedule(token, shiftId);
          if (result && result.success) {
            await fetchShiftSchedules(token);
          } else if (result && result.message) {
            Alert.alert('Error', result.message);
          }
        },
      },
    ]);
  };

  // SHIFT ACTIONS => Edit, Delete, Cancel (no "Assign to User")
  const handleShiftAction = (shift) => {
    Alert.alert(
      'Shift Actions',
      `Choose an action for "${shift.title}".`,
      [
        { text: 'Edit', onPress: () => handleEditShift(shift) },
        { text: 'Delete', onPress: () => handleDeleteShift(shift.id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Open "Assign Shift" modal
  const openAssignModal = (shift) => {
    setSelectedShift(shift);
    setSelectedUserId(null);
    setUserPickerValue(null);
    setSelectedRecurrence('all');
    setAssignModalVisible(true);
  };

  // Assign shift
  const handleAssignShift = async () => {
    if (!token || !selectedShift) {
      Alert.alert('Validation Error', 'Missing shift information.');
      return;
    }
    if (selectedUserId === 0) {
      // If "All Users" is selected
      const assignPromises = users.map((u) =>
        assignShiftToUser(token, selectedShift.id, u.id, selectedRecurrence)
      );
      const results = await Promise.all(assignPromises);
      const success = results.every((res) => res && res.success);
      if (success) {
        setAssignModalVisible(false);
        await fetchShiftSchedules(token);
      } else {
        Alert.alert('Error', 'Failed to assign shift to some users.');
      }
      return;
    }
    if (selectedUserId === null) {
      Alert.alert('Validation Error', 'Please select a user.');
      return;
    }

    const result = await assignShiftToUser(token, selectedShift.id, selectedUserId, selectedRecurrence);
    if (result && result.success) {
      setAssignModalVisible(false);
      await fetchShiftSchedules(token);
    } else if (result && result.message) {
      Alert.alert('Error', result.message);
    }
  };

  // View assigned users
  const handleViewAssignedUsers = (shift) => {
    setSelectedShiftForUsers(shift);
    setAssignedUsersModalVisible(true);
  };

  // Delete user from shift
  const handleDeleteUserFromShift = (shiftId, userId, userName) => {
    Alert.alert(
      'Confirm Removal',
      `Are you sure you want to remove ${userName} from this shift?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteUserFromShift(token, shiftId, userId);
            if (result && result.success) {
              // store refresh
            }
          },
        },
      ]
    );
  };

  // SHIFT LIST ITEM
  const renderItem = ({ item }) => {
    const hours = computeTotalHours(item.startTime, item.endTime).toFixed(2);

    return (
      <View
        className={`p-4 mb-3 rounded-lg flex-row justify-between items-center ${
          isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
        }`}
      >
        <View className="flex-1">
          {/* Title + People icon (always show) */}
          <View className="flex-row items-center">
            <Text
              className={`text-lg font-semibold ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              {item.title}
            </Text>

            {/* People outline icon */}
            <TouchableOpacity onPress={() => handleViewAssignedUsers(item)} className="ml-2">
              <Ionicons
                name="people-outline"
                size={20}
                color={isLightTheme ? COLORS.light.iconColor : COLORS.dark.iconColor}
              />
            </TouchableOpacity>

            {/* + icon to open assign modal */}
            <TouchableOpacity onPress={() => openAssignModal(item)} className="ml-2">
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={isLightTheme ? COLORS.light.iconColor : COLORS.dark.iconColor}
              />
            </TouchableOpacity>
          </View>

          <Text
            className={`text-sm mt-1 ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            Start: {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text
            className={`text-sm mt-1 ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            End: {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text
            className={`text-sm mt-1 ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            Total Hours: {hours} hrs
          </Text>
        </View>

        {/* Ellipsis for SHIFT ACTIONS */}
        <Pressable onPress={() => handleShiftAction(item)} className="p-2">
          <Ionicons
            name="ellipsis-vertical"
            size={24}
            color={isLightTheme ? COLORS.light.iconColor : COLORS.dark.iconColor}
          />
        </Pressable>
      </View>
    );
  };

  // ASSIGNED USERS ITEM
  const renderAssignedUserItem = ({ item }) => {
    return (
      <View className="flex-row items-center mb-3">
        <Ionicons
          name="person-circle-outline"
          size={24}
          color={isLightTheme ? COLORS.light.iconColor : COLORS.dark.iconColor}
          className="mr-2"
        />
        <View style={{ flex: 1 }}>
          <Text
            className={`font-semibold ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            {item.firstName} {item.middleName} {item.lastName}
          </Text>
          <Text
            className={`text-sm ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            ID: {item.id} | {item.UserShiftAssignment.recurrence}
          </Text>
        </View>
        {/* Delete Icon */}
        <TouchableOpacity
          onPress={() =>
            handleDeleteUserFromShift(
              selectedShiftForUsers.id,
              item.id,
              `${item.firstName} ${item.lastName}`
            )
          }
          className="ml-2"
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={COLORS[theme].deleteIconColor}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? COLORS.light.iconColor : COLORS.dark.iconColor}
          />
        </Pressable>
        <Text
          className={`text-lg font-bold ${
            isLightTheme ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          Manage Shifts
        </Text>
      </View>

      {/* Title and Add Button */}
      <View className="flex-row justify-between items-center px-4 mb-4">
        <Text
          className={`text-2xl font-bold ${
            isLightTheme ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          Shift Schedules
        </Text>
        <Pressable
          onPress={handleAddShift}
          className={`p-2 rounded-full ${
            isLightTheme ? 'bg-white' : 'bg-slate-900'
          }`}
        >
          <Ionicons name="add" size={24} color={isLightTheme? `#1e293b` : `#cbd5e1`} />
        </Pressable>
      </View>

      {/* Shift List */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color={isLightTheme ? COLORS.light.activityIndicator : COLORS.dark.activityIndicator}
          style={{ marginTop: 48 }}
        />
      ) : (
        <FlatList
          data={shiftSchedules}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isLightTheme ? COLORS.light.activityIndicator : COLORS.dark.activityIndicator]}
              tintColor={isLightTheme ? COLORS.light.activityIndicator : COLORS.dark.activityIndicator}
            />
          }
          ListEmptyComponent={
            <Text
              className={`text-center mt-12 text-lg ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              No shift schedules found.
            </Text>
          }
        />
      )}

      {/* Add/Edit Shift Modal */}
      <Modal
        visible={editShiftModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditShiftModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '90%' }}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 20}
            >
              <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <View
                  style={[
                    styles.modalInner,
                    {
                      backgroundColor: isLightTheme
                        ? COLORS.light.modalBackground
                        : COLORS.dark.modalBackground,
                    },
                  ]}
                >
                  {/* Modal Title */}
                  <Text
                    className={`font-bold mb-8 ${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    }`}
                    style={{ fontSize: 18 }}
                  >
                    {selectedShift ? 'Edit Shift' : 'Create Shift'}
                  </Text>

                  {/* Title Input */}
                  <Text
                    className={`${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    } mb-2`}
                    style={{ fontSize: 14 }}
                  >
                    Title
                  </Text>
                  <View
                    className={`${
                      isLightTheme ? 'bg-slate-100' : 'bg-slate-700'
                    } rounded-lg mb-6 p-2`}
                  >
                    <TextInput
                      className={`${
                        isLightTheme ? 'text-slate-700' : 'text-slate-300'
                      } text-md py-1`}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      placeholder="e.g., Morning Shift"
                      placeholderTextColor={
                        isLightTheme ? COLORS.light.placeholder : COLORS.dark.placeholder
                      }
                    />
                  </View>

                  {/* Start & End Time */}
                  <View className="flex-row justify-between mb-8">
                    {/* Start Time */}
                    <View className="flex-1 mr-2">
                      <Text
                        className={`${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        } mb-2`}
                        style={{ fontSize: 14 }}
                      >
                        Start Time
                      </Text>
                      <DateTimePicker
                        value={startTime}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === 'android') {
                            // ...
                          }
                          if (selectedDate) {
                            setStartTime(selectedDate);
                            // Ensure endTime is after startTime
                            if (selectedDate >= endTime) {
                              Alert.alert(
                                'Invalid Time',
                                'Start time cannot be after or equal to end time.'
                              );
                              setStartTime(new Date(endTime.getTime() - 3600000));
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                        }}
                        textColor={isLightTheme ? COLORS.light.text : COLORS.dark.text}
                      />
                    </View>

                    {/* End Time */}
                    <View className="flex-1 ml-2">
                      <Text
                        className={`${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        } mb-1`}
                        style={{ fontSize: 14 }}
                      >
                        End Time
                      </Text>
                      <DateTimePicker
                        value={endTime}
                        mode="time"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedDate) => {
                          if (Platform.OS === 'android') {
                            // ...
                          }
                          if (selectedDate) {
                            if (selectedDate <= startTime) {
                              Alert.alert(
                                'Invalid Time',
                                'End time cannot be before or equal to start time.'
                              );
                              setEndTime(new Date(startTime.getTime() + 3600000));
                            } else {
                              setEndTime(selectedDate);
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                        }}
                        textColor={isLightTheme ? COLORS.light.text : COLORS.dark.text}
                      />
                    </View>
                  </View>

                  {/* Save & Cancel Buttons */}
                  <View className="flex-row justify-end mt-3">
                    <TouchableOpacity
                      onPress={() => setEditShiftModalVisible(false)}
                      className="mr-3"
                    >
                      <Text
                        className={`${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        } font-semibold text-sm my-auto`}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveShift}
                      className="bg-orange-500 py-2 px-4 rounded-full"
                    >
                      <Text className="text-white font-semibold text-sm">Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Assign Shift Modal */}
      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAssignModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.assignModalInner,
                  {
                    backgroundColor: isLightTheme
                      ? COLORS.light.modalBackground
                      : COLORS.dark.modalBackground,
                  },
                ]}
              >
                {/* Modal Title */}
                <Text
                  className={`font-bold mb-8 ${
                    isLightTheme ? 'text-slate-700' : 'text-slate-300'
                  }`}
                  style={{ fontSize: 20 }}
                >
                  Assign Shift: {selectedShift?.title}
                </Text>

                {/* Select User */}
                <Text
                  className={`${
                    isLightTheme ? 'text-slate-700' : 'text-slate-300'
                  } mb-1`}
                  style={{ fontSize: 16 }}
                >
                  Select User
                </Text>
                <View
                  className={`${
                    isLightTheme
                      ? 'border-gray-300 bg-slate-100'
                      : 'border-slate-800 bg-slate-800'
                  } border rounded-lg mb-6`}
                  style={{ zIndex: 3000 }}
                >
                  <DropDownPicker
                    open={userPickerOpen}
                    value={userPickerValue}
                    items={userPickerItems}
                    setOpen={setUserPickerOpen}
                    setValue={setUserPickerValue}
                    setItems={setUserPickerItems}
                    placeholder="Select a user..."
                    onChangeValue={(value) => {
                      if (value === '0') {
                        setSelectedUserId(0);
                      } else if (value === 'null') {
                        setSelectedUserId(null);
                      } else {
                        setSelectedUserId(Number(value));
                      }
                    }}
                    style={{
                      borderColor: isLightTheme
                        ? COLORS.light.borderColor
                        : COLORS.dark.borderColor,
                      backgroundColor: isLightTheme
                        ? COLORS.light.background
                        : COLORS.dark.backgroundSecondary,
                    }}
                    dropDownContainerStyle={{
                      borderColor: isLightTheme
                        ? COLORS.light.borderColor
                        : COLORS.dark.borderColor,
                      backgroundColor: isLightTheme
                        ? COLORS.light.background
                        : COLORS.dark.backgroundSecondary,
                    }}
                    placeholderStyle={{
                      color: isLightTheme
                        ? COLORS.light.placeholder
                        : COLORS.dark.placeholder,
                    }}
                    listMode="SCROLLVIEW"
                    zIndex={9999}
                    textStyle={{
                      color: isLightTheme
                        ? COLORS.light.text
                        : COLORS.dark.text,
                    }}
                    selectedItemContainerStyle={{
                      backgroundColor: isLightTheme ? '#F3F4F6' : '#374151',
                    }}
                    selectedItemLabelStyle={{
                      color: isLightTheme ? COLORS.light.text : COLORS.dark.text,
                      fontWeight: 'bold',
                    }}
                  />
                </View>

                {/* Recurrence Pattern */}
                <Text
                  className={`${
                    isLightTheme ? 'text-slate-700' : 'text-slate-300'
                  } mb-1`}
                  style={{ fontSize: 16 }}
                >
                  Recurrence Pattern
                </Text>
                <View
                  className={`${
                    isLightTheme ? 'bg-slate-100' : 'bg-slate-700'
                  } rounded-lg p-4 mb-8`}
                >
                  <RadioButtonRN
                    data={recurrenceOptions}
                    initial={
                      recurrenceOptions.findIndex(
                        (option) => option.value === selectedRecurrence
                      ) + 1
                    }
                    box={false}
                    activeColor="#f97316"
                    textColor={isLightTheme ? COLORS.light.text : COLORS.dark.text}
                    selectedBtn={(e) => setSelectedRecurrence(e.value)}
                    layout="row"
                    style={{
                      justifyContent: 'space-evenly',
                      alignItems: 'center',
                    }}
                  />
                </View>

                {/* Assign & Cancel Buttons */}
                <View className="flex-row justify-end">
                  <TouchableOpacity
                    onPress={() => setAssignModalVisible(false)}
                    className="mr-4"
                  >
                    <Text
                      className={`${
                        isLightTheme ? 'text-slate-700' : 'text-slate-300'
                      } font-semibold text-base my-auto`}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAssignShift}
                    className="bg-orange-500 py-2 px-4 rounded-full my-auto"
                  >
                    <Text className="text-white font-semibold text-base my-auto text-center">
                      Assign
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Assigned Users Modal */}
      <Modal
        visible={assignedUsersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssignedUsersModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setAssignedUsersModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.usersModalInner,
                  {
                    backgroundColor: isLightTheme
                      ? COLORS.light.modalBackground
                      : COLORS.dark.modalBackground,
                  },
                ]}
              >
                {/* Modal Header */}
                <View className="flex-row justify-between items-center mb-4">
                  {/* Title */}
                  <Text
                    className={`font-bold ${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    }`}
                    style={{ fontSize: 20 }}
                  >
                    Assigned Users
                  </Text>

                  <TouchableOpacity onPress={() => setAssignedUsersModalVisible(false)}>
                    <Ionicons
                      name="close-circle-outline"
                      size={24}
                      color={isLightTheme ? COLORS.light.iconColor : COLORS.dark.iconColor}
                    />
                  </TouchableOpacity>
                </View>

                {/* Shift Details */}
                <Text
                  className={`font-semibold ${
                    isLightTheme ? 'text-slate-700' : 'text-slate-300'
                  }`}
                  style={{ fontSize: 16, marginBottom: 16 }}
                >
                  Shift: {selectedShiftForUsers?.title}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  {/* Start Time */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={isLightTheme ? COLORS.light.iconColor : COLORS.dark.iconColor}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      className={`text-sm ${
                        isLightTheme ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      {new Date(selectedShiftForUsers?.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>

                  {/* End Time */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={isLightTheme ? COLORS.light.iconColor : COLORS.dark.iconColor}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      className={`text-sm ${
                        isLightTheme ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      {new Date(selectedShiftForUsers?.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>

                {/* List of Assigned Users */}
                {selectedShiftForUsers && selectedShiftForUsers.assignedUsers.length > 0 ? (
                  <FlatList
                    data={selectedShiftForUsers.assignedUsers}
                    keyExtractor={(user) => user.id.toString()}
                    renderItem={renderAssignedUserItem}
                    ListEmptyComponent={
                      <Text
                        className={`text-center text-sm ${
                          isLightTheme ? 'text-slate-700' : 'text-slate-300'
                        }`}
                      >
                        No users assigned to this shift.
                      </Text>
                    }
                  />
                ) : (
                  <Text
                    className={`text-center text-sm ${
                      isLightTheme ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    No users assigned to this shift.
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

export default ManageShiftSchedules;
