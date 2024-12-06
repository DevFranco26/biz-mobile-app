// File: app/(tabs)/leaves.jsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import useThemeStore from '../../store/themeStore';

const Leaves = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  // Form states
  const [leaveType, setLeaveType] = useState(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFromDate, setLeaveFromDate] = useState(new Date());
  const [leaveFromTime, setLeaveFromTime] = useState(new Date());
  const [leaveToDate, setLeaveToDate] = useState(new Date());
  const [leaveToTime, setLeaveToTime] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showLeaves, setShowLeaves] = useState(false);

  // Picker states
  const [currentPicker, setCurrentPicker] = useState(null); // 'fromDate', 'fromTime', 'toDate', 'toTime'

  // Dropdown states
  const [openLeaveType, setOpenLeaveType] = useState(false);
  const [leaveTypeItems, setLeaveTypeItems] = useState([
    { label: 'Sick Leave', value: 'Sick Leave' },
    { label: 'Vacation Leave', value: 'Vacation Leave' },
    { label: 'Emergency Leave', value: 'Emergency Leave' },
    { label: 'Maternity/Paternity Leave', value: 'Maternity/Paternity Leave' },
    { label: 'Casual Leave', value: 'Casual Leave' },
  ]);

  // Handle leave request submission
  const handleRequestLeave = () => {
    if (!leaveType || !leaveReason || !leaveFromDate || !leaveToDate) {
      alert('Please fill in all fields');
      return;
    }

    const fromDate = `${leaveFromDate.toDateString()} ${leaveFromTime.toLocaleTimeString()}`;
    const toDate = `${leaveToDate.toDateString()} ${leaveToTime.toLocaleTimeString()}`;

    const newRequest = {
      id: (leaveRequests.length + 1).toString(),
      type: leaveType,
      fromDate,
      toDate,
      reason: leaveReason,
      status: 'Pending',
    };

    setLeaveRequests((prevRequests) => [...prevRequests, newRequest]);
    // Reset form fields
    setLeaveType(null);
    setLeaveReason('');
    setLeaveFromDate(new Date());
    setLeaveFromTime(new Date());
    setLeaveToDate(new Date());
    setLeaveToTime(new Date());
    alert('Leave request submitted successfully!');
  };

  // Render date or time picker modal
  const renderPickerModal = () => {
    const dateProps =
      currentPicker === 'fromDate'
        ? { value: leaveFromDate, onChange: onFromDateChange }
        : currentPicker === 'fromTime'
        ? { value: leaveFromTime, onChange: onFromTimeChange }
        : currentPicker === 'toDate'
        ? { value: leaveToDate, onChange: onToDateChange }
        : { value: leaveToTime, onChange: onToTimeChange };

    if (!currentPicker) return null;

    return (
      <Modal
        visible={!!currentPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCurrentPicker(null)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className={`bg-${isLightTheme ? 'white' : 'gray-800'} p-6 rounded-lg`}>
            <DateTimePicker
              {...dateProps}
              mode={currentPicker.includes('Date') ? 'date' : 'time'}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              style={{
                backgroundColor: isLightTheme ? '#ffffff' : '#1e293b',
              }}
              textColor={isLightTheme ? '#0f766e' : '#2dd4bf'}
            />
            <Pressable
              onPress={() => setCurrentPicker(null)}
              className={`mt-4 p-3 rounded-lg bg-${isLightTheme ? 'gray-200' : 'gray-700'} items-center`}
            >
              <Text className={isLightTheme ? 'text-gray-800' : 'text-gray-100'}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  };

  // Picker change handlers
  const onFromDateChange = (event, selectedDate) => {
    if (event.type === 'set') setLeaveFromDate(selectedDate || leaveFromDate);
  };

  const onFromTimeChange = (event, selectedTime) => {
    if (event.type === 'set') setLeaveFromTime(selectedTime || leaveFromTime);
  };

  const onToDateChange = (event, selectedDate) => {
    if (event.type === 'set') {
      if (selectedDate < leaveFromDate) {
        alert("Leave 'To Date' should be greater than or equal to 'From Date'.");
        return;
      }
      setLeaveToDate(selectedDate || leaveToDate);
    }
  };

  const onToTimeChange = (event, selectedTime) => {
    if (event.type === 'set') setLeaveToTime(selectedTime || leaveToTime);
  };

  // Render leave requests if `showLeaves` is true
  if (showLeaves) {
    return (
      <View className={`flex-1 p-6 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}>
        <Text className={`text-2xl font-bold mb-4 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
          Leave Requests
        </Text>
        {/* Map over leaveRequests and display them */}
        {leaveRequests.map((request) => (
          <View key={request.id} className={`p-4 mb-2 rounded-lg ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}>
            <Text className={`font-semibold ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
              {request.type}
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
              From: {request.fromDate}
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>
              To: {request.toDate}
            </Text>
            <Text className={`${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>Reason: {request.reason}</Text>
            <Text className={`${isLightTheme ? 'text-gray-600' : 'text-gray-300'}`}>Status: {request.status}</Text>
          </View>
        ))}
        <Pressable className="mt-4 p-4 rounded-lg bg-teal-700" onPress={() => setShowLeaves(false)}>
          <Text className="text-white text-center">Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}>
      {/* Form Header */}
      <View className="bg-teal-700 rounded-xl p-6 mb-4 mx-5 mt-5">
        <Text className="text-2xl font-bold text-white mb-2">Leave</Text>
        <Text className="text-white text-base">Note: Vacation leave should be requested 2 weeks ahead.</Text>
      </View>

      {/* Leave Type Dropdown */}
      <Text className={`text-xl font-semibold mx-5 mb-2 mt-5 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
        Leave Type
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
        style={{
          backgroundColor: isLightTheme ? '#ffffff' : '#374151',
          borderColor: isLightTheme ? '#e5e7eb' : '#374151',
          borderWidth: 1,
          borderRadius: 8,
          marginHorizontal: 24,
          alignSelf: 'center',
          width: '93%',
        }}
        dropDownContainerStyle={{
          backgroundColor: isLightTheme ? '#ffffff' : '#374151',
          borderColor: isLightTheme ? '#e5e7eb' : '#374151',
          borderWidth: 1,
          borderRadius: 8,
          marginHorizontal: 24,
          alignSelf: 'center',
          width: '93%',
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
            {/* Leave Reason */}
            <Text className={`text-xl font-semibold mb-2 mt-2 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
              Reason
            </Text>
            <TextInput
              className={`p-4 rounded-lg mb-4 ${isLightTheme ? 'bg-gray-100 text-gray-800' : 'bg-gray-800 text-gray-100'}`}
              placeholder="Enter leave reason"
              value={leaveReason}
              onChangeText={setLeaveReason}
              multiline
              placeholderTextColor={isLightTheme ? '#6b7280' : '#9ca3af'}
            />

            {/* From Date & Time */}
            <Text className={`text-xl font-semibold mb-2 mt-2 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
              Leave From
            </Text>
            <View className="flex-row justify-between">
              <Pressable
                className={`p-4 rounded-lg mb-4 flex-1 mr-2 ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}
                onPress={() => setCurrentPicker('fromDate')}
              >
                <Text className={`text-center ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                  {leaveFromDate.toDateString()}
                </Text>
              </Pressable>

              <Pressable
                className={`p-4 rounded-lg mb-4 flex-1 ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}
                onPress={() => setCurrentPicker('fromTime')}
              >
                <Text className={`text-center ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                  {leaveFromTime.toLocaleTimeString()}
                </Text>
              </Pressable>
            </View>

            {/* To Date & Time */}
            <Text className={`text-xl font-semibold mb-2 mt-2 ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
              Leave To
            </Text>
            <View className="flex-row justify-between">
              <Pressable
                className={`p-4 rounded-lg mb-4 flex-1 mr-2 ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}
                onPress={() => setCurrentPicker('toDate')}
              >
                <Text className={`text-center ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                  {leaveToDate.toDateString()}
                </Text>
              </Pressable>

              <Pressable
                className={`p-4 rounded-lg mb-4 flex-1 ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}
                onPress={() => setCurrentPicker('toTime')}
              >
                <Text className={`text-center ${isLightTheme ? 'text-gray-800' : 'text-gray-100'}`}>
                  {leaveToTime.toLocaleTimeString()}
                </Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable onPress={handleRequestLeave} className="bg-teal-700 py-4 px-5 rounded-lg w-full mb-4 mt-auto">
              <Text className="text-white text-center text-lg font-medium">Request Leave</Text>
            </Pressable>

            {/* View Leave Requests Button */}
            <Pressable
              onPress={() => setShowLeaves(true)}
              className={`py-4 px-5 rounded-lg w-full ${isLightTheme ? 'bg-gray-100' : 'bg-gray-800'}`}
            >
              <Text className={`${isLightTheme ? 'text-gray-800' : 'text-gray-100'} text-center text-lg font-medium`}>
                View Leave Requests
              </Text>
            </Pressable>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Render the date/time picker modal */}
      {renderPickerModal()}
    </SafeAreaView>
  );
};

export default Leaves;
