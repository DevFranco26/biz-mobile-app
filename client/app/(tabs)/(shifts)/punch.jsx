// File: app/(tabs)/(shifts)/Punch.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Alert, 
  ToastAndroid, 
  Platform, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons, Ionicons, Entypo } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
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
  const [isLoading, setIsLoading] = useState(false); // New Loading State

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
        Alert.alert('Error', 'Failed to load queued punches.');
      }
    };
    loadQueue();
  }, []); // Run only once

  // Helper function to get GMT offset
  const getGMTOffset = () => {
    const offsetInMinutes = new Date().getTimezoneOffset();
    const offsetInHours = -offsetInMinutes / 60;
    const sign = offsetInHours >= 0 ? '+' : '-';
    const absoluteOffset = Math.abs(offsetInHours);
    return `GMT${sign}${absoluteOffset}`;
  };

  // Helper function to get local date
  const getLocalDate = () => {
    return new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD
  };

  // Helper function to get day name
  const getDayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g., Monday
  };

  // Define syncPunchQueue with useCallback
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
    const errorMessages = [];

    for (const punchData of newQueue) {
      try {
        // Define API endpoint based on punch type
        const apiEndpoint = punchData.isTimeIn
          ? 'http://192.168.100.8:5000/api/timelogs/time-in'
          : 'http://192.168.100.8:5000/api/timelogs/time-out';

        console.log(`Syncing punchData to ${apiEndpoint}:`, punchData);

        // Retrieve token from SecureStore
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
          throw new Error('Authentication token not found.');
        }

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
        errorMessages.push(error.message);
        // Optionally handle failed sync items differently
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
        errorMessages.push('Failed to update local punch queue.');
      }

      // Notify the user once after syncing
      notifyUser('Sync Success', 'Your offline data has been synced.');
    } else {
      console.log('No punches were successfully synced.');
    }

    if (errorMessages.length > 0) {
      const combinedErrors = errorMessages.join('\n');
      notifyUser('Sync Errors', combinedErrors);
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
  }, [syncPunchQueue]); 

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
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest, // Ensure high accuracy
      });
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
    setIsLoading(true); // Start loading
    try {
      const deviceInfo = {
        deviceName: Device.deviceName,
        systemName: Device.osName,
        systemVersion: Device.osVersion,
        model: Device.modelName,
      };

      const loc = await fetchLocation();
      if (!loc) {
        setIsLoading(false);
        return;
      }

      // Get current date and time in UTC
      const currentDateTime = new Date();
      const date = currentDateTime.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      const time =
        currentDateTime.getUTCHours().toString().padStart(2, '0') + ':' +
        currentDateTime.getUTCMinutes().toString().padStart(2, '0') + ':' +
        currentDateTime.getUTCSeconds().toString().padStart(2, '0'); // 'HH:MM:SS'

      // Data to store locally
      const punchData = {
        userId: user.id,
        deviceInfo,
        location: loc,
        date,
        time,
        timeZone,
        isTimeIn: !isTimeIn, // Send the intended action
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
              'Authorization': `Bearer ${token}`,
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
            setTimeElapsed(0);
            setPunchedInTime('Not Time In');
          } else {
            // Handle Time In
            const [hour, minute, second] = time.split(':');
            const dateForPunchedInTime = new Date(Date.UTC(
              currentDateTime.getUTCFullYear(),
              currentDateTime.getUTCMonth(),
              currentDateTime.getUTCDate(),
              parseInt(hour),
              parseInt(minute),
              parseInt(second),
              0
            ));

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

          // Remove any existing queued item with the same isTimeIn state
          updatedQueue = updatedQueue.filter(item => item.isTimeIn !== punchData.isTimeIn);
          updatedQueue.push(punchData);

          setPunchQueue(updatedQueue);
          await AsyncStorage.setItem('punchQueue', JSON.stringify(updatedQueue));
          console.log('Punch added to queue:', punchData);
          console.log('Updated punchQueue:', updatedQueue);

          notifyUser('Offline', 'Your punch has been saved and will sync when online.');

          // Update UI accordingly
          if (!isTimeIn) {
            // Handling Time In while offline
            const [hour, minute, second] = time.split(':');
            const dateForPunchedInTime = new Date(Date.UTC(
              currentDateTime.getUTCFullYear(),
              currentDateTime.getUTCMonth(),
              currentDateTime.getUTCDate(),
              parseInt(hour),
              parseInt(minute),
              parseInt(second),
              0
            ));

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
            // Handling Time Out while offline
            clearInterval(timer);
            setTimer(null);
            setTimeElapsed(0);
            setPunchedInTime('Not Time In');
          }

          setIsTimeIn(!isTimeIn);
          console.log('Punch status updated to:', !isTimeIn);
        } catch (error) {
          console.error('Queue Error:', error);
          Alert.alert('Error', 'Failed to queue punch. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected Error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false); // End loading
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  // Retrieve day name once to avoid re-render issues
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <View className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`} style={{ paddingTop: insets.top }}>
      {/* Separate Status Boxes with Vertical Spacing */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        className="mx-4 mt-20"
      >
        <View className="space-y-4">
          {/* Date Box */}
          <View
            className={`flex-row items-center justify-between p-4 rounded-xl my-2 ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            } shadow-md`}
          >
            <View className="flex-row items-center">
              <MaterialIcons 
                name="date-range" 
                size={30} 
                color="#3B82F6" // Blue color for Date Icon
                className="mr-4" 
                accessibilityLabel="Date Icon"
              />
              <View>
                <Text className={`text-base font-semibold ${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>Date</Text>
                <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                  {dayName}
                </Text>
              </View>
            </View>
            <View className="flex-col items-end">
              <Text
                className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}
              >
                {getLocalDate()}
              </Text>
            </View>
          </View>

          {/* Timezone Box */}
          <View
            className={`flex-row items-center p-4 rounded-xl my-2 ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            } shadow-md`}
          >
            <Ionicons 
              name="location" 
              size={30} 
              color="#10B981" // Green color for Timezone Icon
              className="mr-4" 
              accessibilityLabel="Timezone Icon"
            />
            <View>
              <Text className={`text-base font-semibold ${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>Timezone</Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                {timeZone} ({getGMTOffset()})
              </Text>
            </View>
          </View>

          {/* Modified Status Box */}
          <View
            className={`flex-row items-center justify-between p-4 rounded-xl my-2 ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            } shadow-md`}
          >
            <View className="flex-row items-center">
              <Entypo
                name={isTimeIn ? 'controller-record' : 'controller-play'}
                size={30}
                color={isTimeIn ? '#F59E0B' : '#EF4444'} // Orange for "On the Clock", Red for "Off the Clock"
                className="mr-4"
                accessibilityLabel="Status Icon"
              />
              <View>
                <Text className={`text-base font-semibold ${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>Status</Text>
                <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                  {isTimeIn ? 'On the Clock' : 'Off the Clock'}
                </Text>
              </View>
            </View>
            {/* Moved Text Component to the Right */}
            <View className="flex-col items-end">
              <Text
                className={`text-md ${
                  isLightTheme ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                {isTimeIn ? punchedInTime : '00:00:00'}
              </Text>

            </View>
          </View>

          {/* Network Status Box */}
          <View
            className={`flex-row items-center p-4 rounded-xl my-2 ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
            } shadow-md`}
          >
            {isConnected ? (
              <MaterialIcons 
                name="wifi" 
                size={30} 
                color="#8B5CF6" // Purple for Online
                className="mr-4" 
                accessibilityLabel="Network Icon Online"
              />
            ) : (
              <MaterialIcons 
                name="wifi-off" 
                size={30} 
                color="#6B7280" // Gray for Offline
                className="mr-4" 
                accessibilityLabel="Network Icon Offline"
              />
            )}
            <View>
              <Text className={`text-base font-semibold ${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>Network</Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
                {isConnected ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </View>

        {/* Timer Section */}
        <View className="flex-1 justify-center items-center mt-8">
          <View
            className={`w-full p-6 rounded-xl ${
              isLightTheme ? 'bg-slate-100' : 'bg-slate-900'
            } `}
          >
            <Text
              className={`text-6xl font-bold text-center ${
                isLightTheme ? 'text-gray-700' : 'text-gray-300'
              }`}
            >
              {formatTime(timeElapsed)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Punch Button at the Bottom */}
      <Pressable
        onPress={handlePunch}
        disabled={isLoading} 
        className={`mx-4 mb-6 py-4 rounded-xl ${
          isTimeIn
            ? isLightTheme
              ? 'bg-red-600'
              : 'bg-red-500'
            : isLightTheme
            ? 'bg-orange-600'
            : 'bg-orange-500'
        } shadow-md ${isLoading ? 'opacity-50' : 'opacity-100'}`}
      >
        <View className="flex-row items-center justify-center">
          {isLoading && (
            <ActivityIndicator 
              size="small" 
              color="#FFFFFF" 
              className="mr-2" 
            />
          )}
          <Text className="text-center text-white text-xl font-semibold">
            {isTimeIn ? 'Time Out' : 'Time In'}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

export default Punch;
