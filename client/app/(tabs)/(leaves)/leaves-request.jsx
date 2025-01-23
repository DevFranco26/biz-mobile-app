// File: app/(tabs)/(leaves)/leaves-request.jsx

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
  const [currentPicker, setCurrentPicker] = useState(null); 

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

  const [isSubmitting, setIsSubmitting] = useState(false); 

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
                router.replace('(auth)/login-user');
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
        label: approver.name || `${approver.firstName} ${approver.lastName}`, 
        value: String(approver.id), 
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
        router.replace('(auth)/login-user');
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

  // Render date/time picker based on platform
  const renderPicker = () => {
    if (!currentPicker) return null;

    const isDatePicker = currentPicker.includes('Date');
    const isFromPicker = currentPicker.startsWith('from');

    const onChange = (event, selectedValue) => {
      if (Platform.OS === 'android') {
        if (event.type === 'set') {
          // User confirmed the selection
          if (isDatePicker) {
            if (isFromPicker) {
              setLeaveFromDate(selectedValue || leaveFromDate);
              // Ensure fromDate <= toDate
              const newCombinedFromDate = combineDateAndTime(selectedValue || leaveFromDate, leaveFromTime);
              const currentCombinedToDate = combineDateAndTime(leaveToDate, leaveToTime);
              if (newCombinedFromDate > currentCombinedToDate) {
                setLeaveToDate(selectedValue || leaveFromDate);
              }
            } else {
              const newToDate = selectedValue || leaveToDate;
              const currentCombinedFromDate = combineDateAndTime(leaveFromDate, leaveFromTime);
              const newCombinedToDate = combineDateAndTime(newToDate, leaveToTime);
              if (newCombinedToDate < currentCombinedFromDate) {
                Alert.alert(
                  'Invalid Date',
                  "Leave 'To Date and Time' should be greater than or equal to 'From Date and Time'."
                );
                return;
              }
              setLeaveToDate(newToDate);
            }
          } else {
            if (isFromPicker) {
              setLeaveFromTime(selectedValue || leaveFromTime);
            } else {
              setLeaveToTime(selectedValue || leaveToTime);
            }
          }
        }
        // For Android, picker closes automatically after selection
        setCurrentPicker(null);
      } else {
        // iOS handling
        if (event.type === 'set') {
          if (isDatePicker) {
            setTempDate(selectedValue || (isFromPicker ? leaveFromDate : leaveToDate));
          } else {
            setTempTime(selectedValue || (isFromPicker ? leaveFromTime : leaveToTime));
          }
        }
      }
    };

    if (Platform.OS === 'android') {
      // For Android, render the picker without custom modal
      return (
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
          display="default"
          onChange={onChange}
        />
      );
    } else {
      // For iOS, render the picker inside a custom modal
      return (
        <Modal
          visible={!!currentPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setCurrentPicker(null)}
        >
          <TouchableWithoutFeedback onPress={() => setCurrentPicker(null)}>
            <View className="flex-1 justify-center items-center bg-slate-950/70 ">
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
                    display="spinner"
                    onChange={onChange}
                    style={{
                      width: '100%',
                      backgroundColor: isLightTheme ? '#ffffff' : '#1e293b',
                    }}
                  />
                  <View className="flex-row justify-between mt-4">
                    <Pressable
                      onPress={() => setCurrentPicker(null)}
                      className={`p-4 rounded-lg ${
                        isLightTheme ? 'bg-slate-200' : 'bg-slate-700'
                      } flex-1 mr-2`}
                    >
                      <Text
                        className={`text-center ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-100'
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
                      className="p-4 rounded-lg bg-orange-500 flex-1 ml-2"
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
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 bg-${isLightTheme ? 'white' : 'slate-900'} px-4 `}
      style={{ paddingTop: 60 }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1">
            {/* Form Fields */}
            <View className="space-y-4">
              {/* Leave Type Dropdown */}
              <View className="my-2">
                <Text className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">
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
                    borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
                    backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
                  }}
                  dropDownContainerStyle={{
                    borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
                    backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
                  }}
                  arrowIconStyle={{
                    tintColor: isLightTheme ? '#1e293b' : '#cbd5e1', 
                  }}
                  tickIconStyle={{
                    tintColor: isLightTheme ? '#1e293b' : '#cbd5e1', 
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
                <Text className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">
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
                    borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
                    backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
                  }}
                  dropDownContainerStyle={{
                    borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
                    backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
                  }}
                  arrowIconStyle={{
                    tintColor: isLightTheme ? '#1e293b' : '#cbd5e1', // slate-800 / slate-300
                  }}
                  tickIconStyle={{
                    tintColor: isLightTheme ? '#1e293b' : '#cbd5e1', // slate-800 / slate-300
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
                <Text className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">
                  Reason (Optional)
                </Text>
                <TextInput
                  className={`p-4 rounded-lg mb-4 text-base ${
                    isLightTheme ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-slate-100'
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
                <Text className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">
                  Leave From <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row space-x-4 mb-4 gap-3">
                  {/* From Date */}
                  <Pressable
                    className={`flex-1 p-4 rounded-lg flex-row items-center justify-between ${
                      isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                    onPress={() => {
                      setCurrentPicker('fromDate');
                    }}
                  >
                    <Text className={`text-base ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
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
                      setCurrentPicker('fromTime');
                    }}
                  >
                    <Text className={`text-base ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
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
                <Text className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">
                  Leave To <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row space-x-4 mb-4 gap-3">
                  {/* To Date */}
                  <Pressable
                    className={`flex-1 p-4 rounded-lg flex-row items-center justify-between ${
                      isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                    onPress={() => {
                      setCurrentPicker('toDate');
                    }}
                  >
                    <Text className={`text-base ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
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
                      setCurrentPicker('toTime');
                    }}
                  >
                    <Text className={`text-base ${isLightTheme ? 'text-slate-800' : 'text-slate-100'}`}>
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
            </View>

            {/* Submit Button */}
            <View className="mt-auto mb-4">
              <Pressable
                onPress={handleSubmit}
                className={`bg-orange-500 py-4 px-5 rounded-lg w-full flex-row items-center justify-center ${
                  isSubmitting ? 'opacity-50' : 'opacity-100'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                )}
                <Text className="text-white text-center text-lg font-medium rounded-2xl">
                  {isSubmitting ? 'Submitting...' : 'Submit Leave'}
                </Text>
              </Pressable>
              {errorSubmitting && (
                <Text className="text-center text-red-500 mt-2 text-sm">
                  {errorSubmitting}
                </Text>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Render the date/time picker */}
      {renderPicker()}
    </SafeAreaView>
  );
};

export default SubmitLeaves;
