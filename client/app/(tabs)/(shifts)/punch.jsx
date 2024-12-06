// File: app/(tabs)/(shifts)/Punch.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Alert, ToastAndroid, Platform } from 'react-native';
import { MaterialIcons, Ionicons, Entypo } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store'; // Import SecureStore
import useUserStore from '../../../store/userStore';
import useThemeStore from '../../../store/themeStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';

const Punch = () => {
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [isTimeIn, setIsTimeIn] = useState(false);
  const [punchedInTime, setPunchedInTime] = useState('Not Time In');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timeZone, setTimeZone] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [punchQueue, setPunchQueue] = useState([]);

  // Refs to track the latest punchQueue and syncing status
  const punchQueueRef = useRef([]);
  const isSyncingRef = useRef(false);
  const prevIsConnected = useRef(true);

  // Update punchQueueRef whenever punchQueue changes
  useEffect(() => {
    punchQueueRef.current = punchQueue;
  }, [punchQueue]);

  // Log punchQueue whenever it changes
  useEffect(() => {
    console.log('Current punchQueue:', punchQueue);
  }, [punchQueue]);

  // Initialize timezone on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(tz);
    console.log('Initialized timezone:', tz);
  }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formattedCurrentTime = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setCurrentTime(formattedCurrentTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load queued punches on mount
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const storedQueue = await AsyncStorage.getItem('punchQueue');
        if (storedQueue) {
          const parsedQueue = JSON.parse(storedQueue);
          setPunchQueue(parsedQueue);
          console.log('Loaded punchQueue from AsyncStorage:', parsedQueue);
        } else {
          console.log('No punches in queue.');
        }
      } catch (error) {
        console.error('Failed to load punch queue:', error);
      }
    };
    loadQueue();
  }, []); // Run only once

  // Define syncPunchQueue with useCallback to prevent recreation
  const syncPunchQueue = useCallback(async () => {
    if (isSyncingRef.current || punchQueueRef.current.length === 0) {
      console.log('No sync needed or already syncing.');
      return;
    }

    isSyncingRef.current = true;
    console.log('Starting synchronization...');
    console.log('PunchQueue to sync:', punchQueueRef.current); // **Console Log**

    const newQueue = [...punchQueueRef.current];
    const successfullySynced = [];

    for (const punchData of newQueue) {
      try {
        const apiEndpoint = punchData.isTimeIn
          ? 'http://192.168.100.8:5000/api/timelogs/time-out'
          : 'http://192.168.100.8:5000/api/timelogs/time-in';

        console.log(`Syncing punchData to ${apiEndpoint}:`, punchData); // **Console Log**

        // Retrieve token from SecureStore
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          throw new Error('Authentication token not found.');
        }

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Include the token
          },
          body: JSON.stringify(punchData),
        });

        const result = await response.json();
        console.log('API Response:', result);

        if (response.ok) {
          successfullySynced.push(punchData);
          console.log('Successfully synced:', punchData);
        } else {
          throw new Error(result.message || 'Failed to sync punch.');
        }
      } catch (error) {
        console.error('Sync Error:', error);
        // Optionally, implement retry logic or notify the user
      }
    }

    if (successfullySynced.length > 0) {
      const remainingQueue = newQueue.filter(
        (item) => !successfullySynced.includes(item)
      );
      setPunchQueue(remainingQueue);
      try {
        await AsyncStorage.setItem('punchQueue', JSON.stringify(remainingQueue));
        console.log('Updated punchQueue after sync:', remainingQueue);
      } catch (error) {
        console.error('Failed to update punch queue after sync:', error);
      }

      // Notify the user once after syncing
      notifyUser('Sync Success', 'Your offline data has been synced.');
    } else {
      console.log('No punches were successfully synced.');
    }

    isSyncingRef.current = false;
    console.log('Synchronization complete.');
  }, []);

  // Listen for network changes once
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      console.log('Network state changed:', state.isConnected);
      if (state.isConnected !== prevIsConnected.current) {
        setIsConnected(state.isConnected);
        if (state.isConnected && !prevIsConnected.current) {
          // Device just connected to the internet
          console.log('Device reconnected to the internet.');
          syncPunchQueue();
        }
        prevIsConnected.current = state.isConnected;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [syncPunchQueue]); // Added syncPunchQueue as a dependency

  // Function to notify the user
  const notifyUser = (title, message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${title}: ${message}`, ToastAndroid.LONG);
    } else {
      Alert.alert(title, message);
    }
  };

  // Format elapsed time for display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
  };

  // Fetch user location
  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return null;
      }
      const location = await Location.getCurrentPositionAsync({});
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location.');
      return null;
    }
  };

  // Handle punch action
  const handlePunch = async () => {
    const deviceInfo = {
      deviceName: Device.deviceName,
      systemName: Device.osName,
      systemVersion: Device.osVersion,
      model: Device.modelName,
    };

    const loc = await fetchLocation();
    if (!loc) return;

    // Get current date and time in UTC
    const currentDateTime = new Date();
    const date = currentDateTime.toISOString().split('T')[0]; // '2024-12-06'
    const time =
      currentDateTime.getUTCHours().toString().padStart(2, '0') + ':' +
      currentDateTime.getUTCMinutes().toString().padStart(2, '0') + ':' +
      currentDateTime.getUTCSeconds().toString().padStart(2, '0'); // '13:35:16'

    // Data to store locally
    const punchData = {
      userId: user.id,
      deviceInfo,
      location: loc,
      date,
      time,
      timeZone,
      isTimeIn: !isTimeIn, // **Send the intended action**
    };

    console.log('Handle Punch:', punchData);

    if (isConnected) {
      // Send to server
      try {
        const apiEndpoint = !isTimeIn
          ? 'http://192.168.100.8:5000/api/timelogs/time-in'
          : 'http://192.168.100.8:5000/api/timelogs/time-out';

        console.log(`Sending punch to server at ${apiEndpoint}:`, punchData); // **Console Log**

        // Retrieve token from SecureStore
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          throw new Error('Authentication token not found. Please sign in again.');
        }

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // **Include the token**
          },
          body: JSON.stringify(punchData),
        });

        const result = await response.json();
        console.log('API Response:', result);

        if (!response.ok) throw new Error(result.message || 'Failed to punch.');

        notifyUser('Success', result.message);

        if (isTimeIn) {
          // Handle Time Out
          clearInterval(timer);
          setTimer(null);
          setTimeElapsed(0); // Reset elapsed time to 0
          setPunchedInTime('Not Time In');
        } else {
          // Handle Time In
          const [hour, minute, second] = time.split(':');

          // Create a UTC Date object
          const dateForPunchedInTime = new Date(Date.UTC(
            currentDateTime.getUTCFullYear(),
            currentDateTime.getUTCMonth(),
            currentDateTime.getUTCDate(),
            parseInt(hour),
            parseInt(minute),
            parseInt(second),
            0
          ));

          // Convert UTC time to local time string
          const localPunchedInTime = dateForPunchedInTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
          setPunchedInTime(localPunchedInTime);

          // Start timer
          const intervalId = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
          setTimer(intervalId);
        }

        setIsTimeIn(!isTimeIn);
        console.log('Punch status updated to:', !isTimeIn);
      } catch (error) {
        console.error('Punch Error:', error);
        Alert.alert('Error', error.message);
      }
    } else {
      // Add to queue
      try {
        let updatedQueue = [...punchQueueRef.current];

        // **Restrict to one time-in and one time-out**
        updatedQueue = updatedQueue.filter(item => item.isTimeIn !== punchData.isTimeIn);
        updatedQueue.push(punchData);

        setPunchQueue(updatedQueue);
        await AsyncStorage.setItem('punchQueue', JSON.stringify(updatedQueue));
        console.log('Punch added to queue:', punchData);
        console.log('Updated punchQueue:', updatedQueue); // **Console Log**

        notifyUser('Offline', 'Your punch has been saved and will sync when online.');

        // Update UI accordingly
        if (!isTimeIn) {
          // Handling Time In while offline
          const [hour, minute, second] = time.split(':');

          // Create a UTC Date object
          const dateForPunchedInTime = new Date(Date.UTC(
            currentDateTime.getUTCFullYear(),
            currentDateTime.getUTCMonth(),
            currentDateTime.getUTCDate(),
            parseInt(hour),
            parseInt(minute),
            parseInt(second),
            0
          ));

          // Convert UTC time to local time string
          const localPunchedInTime = dateForPunchedInTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          });
          setPunchedInTime(localPunchedInTime);

          // Start timer
          const intervalId = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
          setTimer(intervalId);
        } else {
          // **Handling Time Out while offline**
          clearInterval(timer);
          setTimer(null);
          setTimeElapsed(0); // Reset elapsed time to 0
          setPunchedInTime('Not Time In');
        }

        setIsTimeIn(!isTimeIn);
        console.log('Punch status updated to:', !isTimeIn);
      } catch (error) {
        console.error('Queue Error:', error);
        Alert.alert('Error', 'Failed to queue punch. Please try again.');
      }
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  return (
    <View
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-gray-900'}`}
      style={{ paddingTop: insets.top + 60 }} // Adjust paddingTop to account for the tab bar height
    >
      {/* Status Boxes with Square Shape and Two Per Row */}
      <View className="mt-4 flex-row flex-wrap justify-around px-4 gap-5">
        {/* Date Box */}
        <View
          className={`w-[45%] aspect-square py-10 mb-4 rounded-lg ${
            isLightTheme ? 'bg-blue-500' : 'bg-blue-600'
          } flex-row items-center justify-center`}
        >
          <MaterialIcons name="date-range" size={35} color="#fff" className="mr-2" />
          <View>
            <Text className="text-white font-semibold">Date</Text>
            {/* Changed to display local date */}
            <Text className="text-white">{new Date().toLocaleDateString('en-CA')}</Text>
          </View>
        </View>

        {/* Timezone Box */}
        <View
          className={`w-[45%] aspect-square py-10 mb-4 rounded-lg ${
            isLightTheme ? 'bg-green-500' : 'bg-green-600'
          } flex-row items-center justify-center`}
        >
          <Ionicons name="location" size={35} color="#fff" className="mr-2" />
          <View>
            <Text className="text-white font-semibold">Timezone</Text>
            <Text className="text-white">{timeZone}</Text>
          </View>
        </View>

        {/* Status Box */}
        <View
          className={`w-[45%] aspect-square py-10 mb-4 rounded-lg ${
            isTimeIn
              ? isLightTheme
                ? 'bg-red-500'
                : 'bg-red-600'
              : isLightTheme
              ? 'bg-yellow-500'
              : 'bg-yellow-600'
          } flex-row items-center justify-center`}
        >
          <Entypo
            name={isTimeIn ? 'controller-record' : 'controller-play'}
            size={35}
            color="#fff"
            className="mr-2"
          />
          <View>
            <Text className="text-white font-semibold">Status</Text>
            <Text className="text-white">{isTimeIn ? 'On the Clock' : 'Off the Clock'}</Text>
          </View>
        </View>

        {/* Network Status Box */}
        <View
          className={`w-[45%] aspect-square py-10 mb-4 rounded-lg ${
            isConnected
              ? isLightTheme
                ? 'bg-purple-500'
                : 'bg-purple-600'
              : isLightTheme
              ? 'bg-gray-500'
              : 'bg-gray-600'
          } flex-row items-center justify-center`}
        >
          {isConnected ? (
            <MaterialIcons name="wifi" size={35} color="#fff" className="mr-2" />
          ) : (
            <MaterialIcons name="wifi-off" size={35} color="#fff" className="mr-2" />
          )}
          <View>
            <Text className="text-white font-semibold">Network</Text>
            <Text className="text-white">{isConnected ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
      </View>

      {/* Timer Section */}
      <View className="flex-1 justify-center items-center">
        <View
          className={`w-[90%] max-w-md justify-center items-center rounded-lg py-12 ${
            isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
          } shadow-sm`}
        >
          <Text
            className={`text-7xl font-bold ${
              isLightTheme ? 'text-slate-700' : 'text-slate-400'
            }`}
          >
            {formatTime(timeElapsed)}
          </Text>
          {/* Display punchedInTime in local time below the timer */}
          <Text
            className={`text-lg text-right mt-4 ${
              isLightTheme ? 'text-gray-600' : 'text-gray-400'
            }`}
          >
            {isTimeIn ? punchedInTime : 'Not Time In'}
          </Text>
        </View>
      </View>

      {/* Punch Button */}
      <Pressable
        onPress={handlePunch}
        className={`py-4 rounded-lg mb-6 mx-4 ${
          isTimeIn
            ? isLightTheme
              ? 'bg-red-600'
              : 'bg-red-500'
            : isLightTheme
            ? 'bg-orange-600'
            : 'bg-orange-500'
        }`}
      >
        <Text className="text-center text-white text-xl font-semibold">
          {isTimeIn ? 'Time Out' : 'Time In'}
        </Text>
      </Pressable>
    </View>
  );
};

export default Punch;
