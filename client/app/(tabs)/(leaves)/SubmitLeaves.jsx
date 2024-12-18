import React, { useState, useEffect } from 'react';
import {
  Text,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  ActivityIndicator,
  Alert,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import useThemeStore from '../../../store/themeStore';
import useLeaveStore from '../../../store/leaveStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

// Helper function to combine date and time
const combineDateAndTime = (date, time) => {
  const combined = new Date(date);
  combined.setHours(time.getHours());
  combined.setMinutes(time.getMinutes());
  combined.setSeconds(time.getSeconds());
  combined.setMilliseconds(time.getMilliseconds());
  return combined;
};

const SubmitLeaves = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Form states
  const [leaveType, setLeaveType] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFromDate, setLeaveFromDate] = useState(new Date());
  const [leaveFromTime, setLeaveFromTime] = useState(new Date());
  const [leaveToDate, setLeaveToDate] = useState(new Date());
  const [leaveToTime, setLeaveToTime] = useState(new Date());

  // Approver Dropdown states
  const [approverOpen, setApproverOpen] = useState(false);
  const [approverItems, setApproverItems] = useState([]);
  const [approverValue, setApproverValue] = useState('');

  // Picker states
  const [currentPicker, setCurrentPicker] = useState(null); // 'fromDate', 'fromTime', 'toDate', 'toTime'

  // Temporary states for picker selections
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  // Leave Type Dropdown states
  const [openLeaveType, setOpenLeaveType] = useState(false);
  const [leaveTypeItems, setLeaveTypeItems] = useState([
    { label: 'Sick Leave', value: 'Sick Leave' },
    { label: 'Vacation Leave', value: 'Vacation Leave' },
    { label: 'Emergency Leave', value: 'Emergency Leave' },
    { label: 'Maternity/Paternity Leave', value: 'Maternity/Paternity Leave' },
    { label: 'Casual Leave', value: 'Casual Leave' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false); // Submission loading state

  // Accessing leaveStore
  const {
    approvers,
    fetchApprovers,
    submitLeave,
    loadingApprovers,
    submittingLeave,
    errorApprovers,
    errorSubmitting,
  } = useLeaveStore();

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
                // Navigate to sign-in screen or handle accordingly
                router.replace('(auth)/signin');
              },
            },
          ]
        );
        return;
      }

      await fetchApprovers(token);
    };
    initialize();
  }, [fetchApprovers, router]);

  // Update approverItems when approvers data changes
  useEffect(() => {
    if (approvers.length > 0) {
      const formattedApprovers = approvers.map((approver) => ({
        label: approver.name || `${approver.firstName} ${approver.lastName}`, // Adjust based on backend response
        value: String(approver.id), // Convert to string to prevent type mismatch
      }));
      setApproverItems(formattedApprovers);
    } else {
      setApproverItems([]);
    }
  }, [approvers]);

  // Handle leave request submission
  const handleSubmit = async () => {
    // Validate required fields
    if (!leaveType || !approverValue) {
      Alert.alert(
        'Incomplete Form',
        'Please fill in all required fields, including selecting an approver.'
      );
      return;
    }

    // Combine dates and times
    const combinedFromDate = combineDateAndTime(leaveFromDate, leaveFromTime);
    const combinedToDate = combineDateAndTime(leaveToDate, leaveToTime);

    // Validate date range
    if (combinedFromDate > combinedToDate) {
      Alert.alert('Invalid Dates', 'From Date and Time cannot be after To Date and Time.');
      return;
    }

    setIsSubmitting(true); // Start loading

    try {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        Alert.alert('Authentication Error', 'Please sign in again.');
        setIsSubmitting(false);
        router.replace('(auth)/signin');
        return;
      }

      // Convert combined dates to UTC ISO strings
      const fromDateInUTC = combinedFromDate.toISOString();
      const toDateInUTC = combinedToDate.toISOString();

      // Log the UTC dates for debugging
      console.log('From Date UTC:', fromDateInUTC);
      console.log('To Date UTC:', toDateInUTC);

      // Prepare payload
      const payload = {
        type: leaveType,
        reason: leaveReason.trim() === '' ? null : leaveReason,
        fromDate: fromDateInUTC, // ISO string in UTC
        toDate: toDateInUTC, // ISO string in UTC
        approverId: approverValue,
      };

      console.log('Submitting Leave Payload:', payload);

      // Submit leave using the leaveStore's action
      await submitLeave(token, payload);

      // Reset form fields
      setLeaveType('');
      setLeaveReason('');
      setLeaveFromDate(new Date());
      setLeaveFromTime(new Date());
      setLeaveToDate(new Date());
      setLeaveToTime(new Date());
      setApproverValue('');

      // Show success alert and navigate back
      Alert.alert('Success', 'Leave request submitted successfully!', [
        {
          text: 'OK',
        },
      ]);
    } catch (error) {
      console.error('Submission Error:', error);
      Alert.alert('Error', 'There was an issue submitting your leave request.');
    } finally {
      setIsSubmitting(false); // End loading
    }
  };

  // Render date/time picker modal with Confirm and Cancel buttons
  const renderPickerModal = () => {
    if (!currentPicker) return null;

    // Determine if picker is for date or time and which field
    const isDatePicker = currentPicker.includes('Date');
    const isFromPicker = currentPicker.startsWith('from');

    return (
      <Modal
        visible={!!currentPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCurrentPicker(null)}
      >
        <TouchableWithoutFeedback onPress={() => setCurrentPicker(null)}>
          <View className="flex-1 justify-center items-center bg-slate-950/60 ">
            <TouchableWithoutFeedback>
              <View
                className={`w-11/12 max-w-lg p-6 rounded-lg ${
                  isLightTheme ? 'bg-white' : 'bg-slate-800'
                }`}
              >
                <DateTimePicker
                  value={
                    isFromPicker
                      ? isDatePicker
                        ? leaveFromDate
                        : leaveFromTime
                      : isDatePicker
                      ? leaveToDate
                      : leaveToTime
                  }
                  mode={isDatePicker ? 'date' : 'time'}
                  is24Hour={true}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedValue) => {
                    if (event.type === 'set') {
                      if (isDatePicker) {
                        setTempDate(selectedValue || (isFromPicker ? leaveFromDate : leaveToDate));
                      } else {
                        setTempTime(selectedValue || (isFromPicker ? leaveFromTime : leaveToTime));
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    backgroundColor: isLightTheme ? '#ffffff' : '#1e293b',
                  }}
                />
                <View className="flex-row justify-between mt-4">
                  <Pressable
                    onPress={() => setCurrentPicker(null)}
                    className={`p-3 rounded-lg ${
                      isLightTheme ? 'bg-slate-200' : 'bg-slate-700'
                    } flex-1 mr-2`}
                  >
                    <Text
                      className={`text-center ${
                        isLightTheme ? 'text-gray-800' : 'text-gray-100'
                      }`}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (isFromPicker) {
                        if (isDatePicker) {
                          setLeaveFromDate(tempDate);
                          // Ensure fromDate <= toDate
                          const newCombinedFromDate = combineDateAndTime(tempDate, leaveFromTime);
                          const currentCombinedToDate = combineDateAndTime(leaveToDate, leaveToTime);
                          if (newCombinedFromDate > currentCombinedToDate) {
                            setLeaveToDate(tempDate);
                          }
                        } else {
                          setLeaveFromTime(tempTime);
                        }
                      } else {
                        if (isDatePicker) {
                          const newCombinedToDate = combineDateAndTime(tempDate, leaveToTime);
                          const currentCombinedFromDate = combineDateAndTime(leaveFromDate, leaveFromTime);
                          if (newCombinedToDate < currentCombinedFromDate) {
                            Alert.alert(
                              'Invalid Date',
                              "Leave 'To Date and Time' should be greater than or equal to 'From Date and Time'."
                            );
                            return;
                          }
                          setLeaveToDate(tempDate);
                        } else {
                          setLeaveToTime(tempTime);
                        }
                      }
                      setCurrentPicker(null);
                    }}
                    className="p-3 rounded-lg bg-orange-500 flex-1 ml-2"
                  >
                    <Text className="text-center text-white">Confirm</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <SafeAreaView
      className={`flex-1 bg-${isLightTheme ? 'white' : 'slate-900'} px-4`}
      style={{ paddingTop: insets.top }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 justify-start">
            <View className="space-y-4">
              {/* Leave Type Dropdown */}
              <View className="my-2">
                <Text className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  Leave Type <Text className="text-red-500">*</Text>
                </Text>
                <DropDownPicker
                  open={openLeaveType}
                  value={leaveType}
                  items={leaveTypeItems}
                  setOpen={setOpenLeaveType}
                  setValue={setLeaveType}
                  setItems={setLeaveTypeItems}
                  placeholder="Select Leave Type"
                  textStyle={{
                    color: isLightTheme ? '#374151' : '#9ca3af',
                  }}
                  className="mb-4"
                  style={{
                    borderColor: isLightTheme ? '#E5E7EB' : '#1E293B',
                    backgroundColor: isLightTheme ? '#FFFFFF' : '#1E293B',
                  }}
                  dropDownContainerStyle={{
                    borderColor: isLightTheme ? '#E5E7EB' : '#1E293B',
                    backgroundColor: isLightTheme ? '#FFFFFF' : '#1E293B',
                  }}
                  zIndex={3000}
                  zIndexInverse={1000}
                  placeholderStyle={{
                    color: isLightTheme ? '#6B7280' : '#9CA3AF',
                  }}
                />
              </View>

              {/* Approver Dropdown */}
              <View className="my-2">
                <Text className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  Approver <Text className="text-red-500">*</Text>
                </Text>
                <DropDownPicker
                  open={approverOpen}
                  value={approverValue}
                  items={approverItems}
                  setOpen={setApproverOpen}
                  setValue={setApproverValue}
                  setItems={setApproverItems}
                  placeholder="Select Approver"
                  textStyle={{
                    color: isLightTheme ? '#374151' : '#9ca3af',
                  }}
                  className="mb-4"
                  style={{
                    borderColor: isLightTheme ? '#E5E7EB' : '#1E293B',
                    backgroundColor: isLightTheme ? '#FFFFFF' : '#1E293B',
                  }}
                  dropDownContainerStyle={{
                    borderColor: isLightTheme ? '#E5E7EB' : '#1E293B',
                    backgroundColor: isLightTheme ? '#FFFFFF' : '#1E293B',
                  }}
                  zIndex={2000} // Ensure it appears above other elements
                  zIndexInverse={2000}
                  placeholderStyle={{
                    color: isLightTheme ? '#6B7280' : '#9CA3AF',
                  }}
                />
                {loadingApprovers && <ActivityIndicator size="small" color="#10B981" className="mt-2" />}
                {errorApprovers && (
                  <Text className="text-red-500 mt-2 text-sm">
                    {errorApprovers}
                  </Text>
                )}
              </View>

              {/* Leave Reason */}
              <View className="my-2">
                <Text className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  Reason (Optional)
                </Text>
                <TextInput
                  className={`p-4 rounded-lg mb-4 text-base ${
                    isLightTheme ? 'bg-slate-100 text-gray-800' : 'bg-slate-800 text-gray-100'
                  }`}
                  placeholder="Enter leave reason"
                  value={leaveReason}
                  onChangeText={setLeaveReason}
                  multiline
                  numberOfLines={4}
                  style={{
                    textAlignVertical: 'top',
                  }}
                  placeholderTextColor={isLightTheme ? '#6B7280' : '#9CA3AF'}
                />
              </View>

              {/* Leave From Date & Time */}
              <View className="">
                <Text className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  Leave From <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row space-x-4 mb-4 gap-3">
                  {/* From Date */}
                  <Pressable
                    className={`flex-1 p-4 rounded-lg flex-row items-center justify-between ${
                      isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                    onPress={() => {
                      setTempDate(leaveFromDate);
                      setCurrentPicker('fromDate');
                    }}
                  >
                    <Text className={`text-base ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                      {leaveFromDate.toLocaleDateString()}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={isLightTheme ? '#374151' : '#D1D5DB'}
                    />
                  </Pressable>

                  {/* From Time */}
                  <Pressable
                    className={`flex-1 p-4 rounded-lg flex-row items-center justify-between ${
                      isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                    onPress={() => {
                      setTempTime(leaveFromTime);
                      setCurrentPicker('fromTime');
                    }}
                  >
                    <Text className={`text-base ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                      {leaveFromTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={isLightTheme ? '#374151' : '#D1D5DB'}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Leave To Date & Time */}
              <View className="my-2">
                <Text className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                  Leave To <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row space-x-4 mb-4 gap-3">
                  {/* To Date */}
                  <Pressable
                    className={`flex-1 p-4 rounded-lg flex-row items-center justify-between ${
                      isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                    onPress={() => {
                      setTempDate(leaveToDate);
                      setCurrentPicker('toDate');
                    }}
                  >
                    <Text className={`text-base ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                      {leaveToDate.toLocaleDateString()}
                    </Text>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color={isLightTheme ? '#374151' : '#D1D5DB'}
                    />
                  </Pressable>

                  {/* To Time */}
                  <Pressable
                    className={`flex-1 p-4 rounded-lg flex-row items-center justify-between ${
                      isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                    onPress={() => {
                      setTempTime(leaveToTime);
                      setCurrentPicker('toTime');
                    }}
                  >
                    <Text className={`text-base ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                      {leaveToTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={isLightTheme ? '#374151' : '#D1D5DB'}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <View className="mt-44">
                <Pressable
                  onPress={handleSubmit}
                  className={`bg-orange-500/90 py-4 px-5 rounded-lg w-full flex-row items-center justify-center ${
                    isSubmitting ? 'opacity-50' : 'opacity-100'
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                  )}
                  <Text className="text-white text-center text-lg font-medium">
                    {isSubmitting ? 'Submitting...' : 'Request Leave'}
                  </Text>
                </Pressable>
                {errorSubmitting && (
                  <Text className="text-center text-red-500 mt-2 text-sm">
                    {errorSubmitting}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Render the date/time picker modal */}
      {renderPickerModal()}
    </SafeAreaView>
  );
};

export default SubmitLeaves;
