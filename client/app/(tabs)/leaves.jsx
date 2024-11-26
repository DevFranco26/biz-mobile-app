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
import LeavesRequests from '../../components/leavesRequests';
import useThemeStore from '../../store/themeStore';

const Create = () => {
  const { theme } = useThemeStore();

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
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <View
            style={{
              backgroundColor: theme === 'light' ? '#fff' : '#333',
              padding: 20,
              borderRadius: 10,
            }}
          >
            <DateTimePicker
              {...dateProps}
              mode={currentPicker.includes('Date') ? 'date' : 'time'}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'spinner'}
              style={{
                backgroundColor: theme === 'light' ? '#fff' : '#333',
              }}
              textColor={theme === 'light' ? '#038C8C' : '#2DD4BF'}
            />
            <Pressable
              onPress={() => setCurrentPicker(null)}
              style={{
                backgroundColor: theme === 'light' ? '#ddd' : '#555',
                padding: 10,
                marginTop: 10,
                borderRadius: 5,
                alignItems: 'center',
              }}
            >
                <Text className={theme === 'light' ? 'text-teal-950' : 'text-white'}>
                  Confirm
              </Text>
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
    return <LeavesRequests leaveRequests={leaveRequests} onBack={() => setShowLeaves(false)} />;
  }

  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800'} flex-1`}>
      {/* Form Header */}
      <View className="bg-teal-700 rounded-xl p-6 mb-4 mx-5 mt-5">
        <Text className="text-2xl font-bold text-white mb-2">Leave</Text>
        <Text className="text-white text-base">
          Note: Vacation leave should be requested 2 weeks ahead.
        </Text>
      </View>

      {/* Leave Type Dropdown */}
      <Text
        className={`text-xl font-semibold mx-5 ${
          theme === 'light' ? 'text-teal-950' : 'text-teal-400'
        } mb-2 mt-5`}
      >
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
          color: theme === 'light' ? '#334155' : '#94a3b8', 
        }}
        style={{
          backgroundColor: theme === 'light' ? 'white' : '#334155',
          borderColor: theme === 'light' ? 'white' : '#334155',
          borderWidth: 1,
          borderRadius: 8,
          marginHorizontal: 24,
          alignSelf: 'center',
          width: '93%'
        }}
        dropDownContainerStyle={{
          backgroundColor: theme === 'light' ? 'white' : '#334155',
          borderColor: theme === 'light' ? 'white' : '#334155',
          borderWidth: 1,
          borderRadius: 8,
          marginHorizontal: 24,
          alignSelf: 'center',
          width: '93%',
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
            {/* Leave Reason */}
            <Text className={`text-xl font-semibold ${theme === 'light' ? 'text-teal-950' : 'text-teal-400'} mt-2 mb-2`}>
              Reason
            </Text>
            <TextInput
              className={` ${theme === 'light' ? 'bg-white text-black' : 'bg-slate-700 text-slate-400'} p-4 rounded-lg mb-4`}
              placeholder="Enter leave reason"
              value={leaveReason}
              onChangeText={setLeaveReason}
              multiline
              placeholderTextColor={theme === 'light' ? '#000000' : '#94a3b8'} 
              style={{
                borderColor: theme === 'light' ? 'white' : '#334155', 
                borderWidth: 1,
              }}
            />


            {/* From Date & Time */}
            <Text className={`text-xl font-semibold ${theme === 'light' ? 'text-teal-950' : 'text-teal-400'} mb-2 mt-2`}>
              Leave From
            </Text>
            <View className="w-full flex-row justify-between">
            <Pressable
              className={`p-4 rounded-lg mb-4 flex-1 mr-2 ${
                theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-700 border-slate-500'
              }`}
              onPress={() => setCurrentPicker('fromDate')}
            >
              <Text
               className= {` text-center ${theme === 'light' ? 'text-black' : 'text-slate-400'}`}
              >
                {leaveFromDate.toDateString()}
              </Text>
            </Pressable>

            <Pressable
              className={`p-4 rounded-lg mb-4 flex-1 ${
                theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-700 border-slate-500'
              }`}
              onPress={() => setCurrentPicker('fromTime')}
            >
              <Text
                className= {` text-center ${theme === 'light' ? 'text-black' : 'text-slate-400'}`}
              >
                {leaveFromTime.toLocaleTimeString()}
              </Text>
            </Pressable>

            </View>
            {/* To Date & Time */}
            <Text className={`text-xl font-semibold ${theme === 'light' ? 'text-teal-950' : 'text-teal-400'} mb-2 mt-2`}>
              Leave To
            </Text>
            <View className="w-full flex-row justify-between">
            <Pressable
                className={`p-4 rounded-lg mb-4 flex-1 mr-2 ${
                  theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-700 border-slate-500'
                }`}
                onPress={() => setCurrentPicker('toDate')}
              >
                <Text
                  className={`text-center ${theme === 'light' ? 'text-black' : 'text-slate-400'}`}
                >
                  {leaveToDate.toDateString()}
                </Text>
              </Pressable>

              <Pressable
                className={`p-4 rounded-lg mb-4 flex-1 ${
                  theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-700 border-slate-500'
                }`}
                onPress={() => setCurrentPicker('toTime')}
              >
                <Text
                  className= {` text-center ${theme === 'light' ? 'text-black' : 'text-slate-400'}`}
                >
                  {leaveToTime.toLocaleTimeString()}
                </Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleRequestLeave}
             className='bg-teal-700 py-4 px-5 rounded-lg w-full mb-4 mt-auto'
            >
              <Text className=" text-center text-white">Request Leave</Text>
            </Pressable>

            {/* View Leave Requests Button */}
            <Pressable
              onPress={() => setShowLeaves(true)}
              className={`py-4 px-5 rounded-lg w-full ${theme === 'light' ? 'bg-white': 'bg-slate-700'}`}
            >
              <Text className={`${theme === 'light'? 'text-slate-800': 'text-slate-400' } text-center`}>Leave Requests</Text>
            </Pressable>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Render the date/time picker modal */}
      {renderPickerModal()}
    </SafeAreaView>
  );
};

export default Create;
