import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../../store/themeStore';
import useUserStore from '../../../store/userStore';
import { useNavigation } from '@react-navigation/native';
import * as Device from 'expo-device';

const Punch = () => {
  const { user } = useUserStore(); 
  const { theme } = useThemeStore(); 
  const navigation = useNavigation(); 

  const [isTimeIn, setIsTimeIn] = useState(false);
  const [time, setTime] = useState(0);
  const [timer, setTimer] = useState(null);
  const [currentDate, setCurrentDate] = useState('');
  const [punchedInTime, setPunchedInTime] = useState('Not Time In');

  // Format elapsed time to (HH:mm:ss)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    return date.toLocaleDateString('en-CA');
  };

  // Format current time (HH:mm:ss) in 12-hour format with AM/PM
  const formatCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  // Format punched-in time properly
  const formatPunchedInTime = (timeInDate, timeInTime) => {
    if (!timeInDate || !timeInTime) return 'Not Time In';
    const fullDateTime = new Date(`${timeInDate}T${timeInTime}`);
    return fullDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  // Capture Device Info
  const captureDeviceInfo = () => {
    return {
      deviceName: Device.deviceName,
      systemName: Device.osName,
      systemVersion: Device.osVersion,
      model: Device.modelName,
    };
  };

  // Fetch User Time Log on Component Mount to check Time-In status
  const fetchUserTimeLog = async () => {
    try {
      const response = await fetch(`http://192.168.100.8:5000/api/timelogs/${user.id}`);
      const data = await response.json();
      const latestLog = data.data;

      if (latestLog && latestLog.status) {
        // User is time-in
        setIsTimeIn(true);
        setPunchedInTime(formatPunchedInTime(latestLog.timeInDate, latestLog.timeInTime));
        const timeInDateTime = new Date(`${latestLog.timeInDate}T${latestLog.timeInTime}`);
        const currentTime = new Date();
        const timeDiff = Math.floor((currentTime - timeInDateTime) / 1000);
        setTime(timeDiff);

        // Start timer for time-in user
        const intervalId = setInterval(updateTime, 1000);
        setTimer(intervalId);
      } else {
        // User is time-out
        setIsTimeIn(false);
        setTime(0);
        setPunchedInTime('Not Time In');
      }
    } catch (error) {
      console.error('Error fetching user time log:', error);
    }
  };

  const updateTime = () => {
    setTime((prevTime) => prevTime + 1);
  };

  // Handle Time-In and Time-Out actions
  const handleShiftAction = async () => {
    const deviceInfo = await captureDeviceInfo(); 
    const apiEndpoint = isTimeIn
      ? 'http://192.168.100.8:5000/api/timelogs/time-out'
      : 'http://192.168.100.8:5000/api/timelogs/time-in';

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          deviceInfo: deviceInfo,
        }),
      });

      if (response.ok) {
        if (isTimeIn) {
          setPunchedInTime('Not Time In');
          clearInterval(timer); // Stop timer on Time-Out
          setTime(0); // Reset time to 0
        } else {
          const currentTime = formatCurrentTime();
          setPunchedInTime(currentTime); // Update punchedInTime immediately when Time In is clicked
          const intervalId = setInterval(updateTime, 1000); // Start the timer on Time-In
          setTimer(intervalId);
        }

        setIsTimeIn(!isTimeIn); // Toggle state between Time-In and Time-Out
      } else {
        console.error('Error logging time-in/out');
      }
    } catch (error) {
      console.error('Error saving time log:', error);
    }
  };

  useEffect(() => {
    setCurrentDate(formatDate(new Date())); // Set current date on mount
    fetchUserTimeLog(); // Fetch user time log on component mount
  }, []);

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer); // Cleanup timer on unmount
    };
  }, [timer]);

  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800 flex-1'}`}>
      <ScrollView contentContainerStyle={{flexGrow: 1,  paddingLeft:16, paddingRight:16}}>
        <View className="bg-teal-700 rounded-xl p-6 mb-6">
            <Text className={`text-lg font-medium text-left ${theme === 'light' ? 'text-white' : 'text-gray-100'}`}>
            Date: {currentDate}
            </Text>
            <Text className={`text-lg font-medium text-left ${theme === 'light' ? 'text-white' : 'text-gray-100'}`}>
           Time: {formatCurrentTime()}
            </Text>
        </View>


        <View className="flex-1 justify-center items-center mb-6 gap-4">
          <Text className={`text-6xl tracking-widest font-bold ${theme === 'light' ? 'text-slate-800' : 'text-teal-800'}`}>
            {formatTime(time)} {/* Display the formatted time with seconds */}
          </Text>
          <Text className="text-2xl font-normal text-slate-600">
            {isTimeIn ? `You're on the clock.` : `You're off the clock.`}
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg text-slate-600">
            Punched In: {punchedInTime} {/* Display punched-in time */}
          </Text>
        </View>

        <View className="mb-6">
          <Pressable
            className="bg-teal-700 py-4 px-5 rounded-lg w-full mb-4"
            onPress={handleShiftAction} // Trigger Time-In/Time-Out
          >
            <Text className="text-center text-white">
              {isTimeIn ? 'Time Out' : 'Time In'} {/* Toggle button label */}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <StatusBar
        backgroundColor={theme === 'dark' ? 'black' : '#f8fafc'}
        style={theme === 'dark' ? 'light' : 'dark'}
      />
    </SafeAreaView>
  );
};

export default Punch;
