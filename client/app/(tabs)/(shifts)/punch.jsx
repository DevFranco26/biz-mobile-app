// File: app/(tabs)/(shifts)/Punch.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  Alert, 
  ToastAndroid, 
  Platform, 
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons, Ionicons, Entypo } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// -- Stores
import useUserStore from '../../../store/userStore';
import useThemeStore from '../../../store/themeStore';
import useSubscriptionStore from '../../../store/subscriptionStore'; // <-- (1) Import the Subscription Store

const Punch = () => {
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // -- Subscription store states & methods
  const { currentSubscription, fetchCurrentSubscription } = useSubscriptionStore(); // <-- (2) Destructure subscription data

  const [isTimeIn, setIsTimeIn] = useState(false);
  const [punchedInTime, setPunchedInTime] = useState('Not Time In');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timeZone, setTimeZone] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [punchQueue, setPunchQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const punchQueueRef = useRef([]);
  const isSyncingRef = useRef(false);
  const prevIsConnected = useRef(true);

  // -- (3) Fetch current subscription once on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await fetchCurrentSubscription(token);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    })();
  }, [fetchCurrentSubscription]);

  // Keep punchQueueRef in sync
  useEffect(() => {
    punchQueueRef.current = punchQueue;
  }, [punchQueue]);

  // Get local timeZone
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimeZone(tz);
  }, []);

  // Example unused interval for future expansions
  useEffect(() => {
    const interval = setInterval(() => {
      // This interval is intentionally left as-is.
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load any stored offline punches on mount
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const storedQueue = await AsyncStorage.getItem('punchQueue');
        if (storedQueue) {
          const parsedQueue = JSON.parse(storedQueue);
          setPunchQueue(parsedQueue);
        }
      } catch (error) {
        console.error('Failed to load punch queue:', error);
        Alert.alert('Error', 'Failed to load queued punches.');
      }
    };
    loadQueue();
  }, []);

  const getGMTOffset = () => {
    const offsetInMinutes = new Date().getTimezoneOffset();
    const offsetInHours = -offsetInMinutes / 60;
    const sign = offsetInHours >= 0 ? '+' : '-';
    return `GMT${sign}${Math.abs(offsetInHours)}`;
  };

  const getLocalDate = () => new Date().toLocaleDateString('en-CA');
  const getDayName = () => new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // -- (4) Check if current subscription allows offline punch
  const canOfflinePunch = useCallback(() => {
    if (
      !currentSubscription ||
      !currentSubscription.plan ||
      !currentSubscription.plan.features
    ) {
      return false;
    }
    // The specific feature we care about
    return currentSubscription.plan.features['timekeeping-punch-offline'] === true;
  }, [currentSubscription]);

  // Offline queue sync logic
  const syncPunchQueue = useCallback(async () => {
    if (isSyncingRef.current || punchQueueRef.current.length === 0) return;
    isSyncingRef.current = true;

    const newQueue = [...punchQueueRef.current];
    const successfullySynced = [];
    const errorMessages = [];

    for (const punchData of newQueue) {
      try {
        const apiEndpoint = punchData.isTimeIn
          ? 'http://192.168.100.8:5000/api/timelogs/time-in'
          : 'http://192.168.100.8:5000/api/timelogs/time-out';

        const token = await SecureStore.getItemAsync('token');
        if (!token) throw new Error('Authentication token not found.');

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(punchData),
        });

        const result = await response.json();
        if (response.ok) {
          successfullySynced.push(punchData);
        } else {
          throw new Error(result.message || 'Failed to sync punch.');
        }
      } catch (error) {
        console.error('Sync Error:', error);
        errorMessages.push(error.message);
      }
    }

    if (successfullySynced.length > 0) {
      const remainingQueue = newQueue.filter(
        (item) => !successfullySynced.includes(item)
      );
      setPunchQueue(remainingQueue);
      try {
        await AsyncStorage.setItem('punchQueue', JSON.stringify(remainingQueue));
      } catch (error) {
        console.error('Failed to update punch queue after sync:', error);
        errorMessages.push('Failed to update local punch queue.');
      }
      notifyUser('Sync Success', 'Your offline data has been synced.');
    }

    if (errorMessages.length > 0) {
      notifyUser('Sync Errors', errorMessages.join('\n'));
    }

    isSyncingRef.current = false;
  }, []);

  // Watch for network changes to trigger sync
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected !== prevIsConnected.current) {
        setIsConnected(state.isConnected);
        if (state.isConnected && !prevIsConnected.current) {
          syncPunchQueue();
        }
        prevIsConnected.current = state.isConnected;
      }
    });
    return () => unsubscribe();
  }, [syncPunchQueue]);

  const notifyUser = (title, message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(`${title}: ${message}`, ToastAndroid.LONG);
    } else {
      Alert.alert(title, message);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return null;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
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

  const handlePunch = async () => {
    setIsLoading(true);
    try {
      // -- (5) If user is offline but subscription doesn't allow offline punch, block action
      if (!isConnected && !canOfflinePunch()) {
        Alert.alert(
          'Subscription Notice',
          'Your current plan does not allow offline punching. Please ensure you are online to punch in/out.'
        );
        setIsLoading(false);
        return;
      }

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

      const currentDateTime = new Date();
      const date = currentDateTime.toISOString().split('T')[0];
      const time = [
        currentDateTime.getUTCHours().toString().padStart(2, '0'),
        currentDateTime.getUTCMinutes().toString().padStart(2, '0'),
        currentDateTime.getUTCSeconds().toString().padStart(2, '0')
      ].join(':');

      const punchData = {
        userId: user.id,
        deviceInfo,
        location: loc,
        date,
        time,
        timeZone,
        isTimeIn: !isTimeIn,
      };

      if (isConnected) {
        try {
          const apiEndpoint = !isTimeIn
            ? 'http://192.168.100.8:5000/api/timelogs/time-in'
            : 'http://192.168.100.8:5000/api/timelogs/time-out';

          const token = await SecureStore.getItemAsync('token');
          if (!token) throw new Error('Authentication token not found.');

          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(punchData),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.message || 'Failed to punch.');

          notifyUser('Success', result.message);

          if (isTimeIn) {
            clearInterval(timer);
            setTimer(null);
            setTimeElapsed(0);
            setPunchedInTime('Not Time In');
          } else {
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
            const intervalId = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
            setTimer(intervalId);
          }
          setIsTimeIn(!isTimeIn);
        } catch (error) {
          console.error('Punch Error:', error);
          Alert.alert('Error', error.message);
        }
      } else {
        // -- Offline handling (already checked subscription above)
        try {
          let updatedQueue = [...punchQueueRef.current];
          updatedQueue = updatedQueue.filter(item => item.isTimeIn !== punchData.isTimeIn);
          updatedQueue.push(punchData);

          setPunchQueue(updatedQueue);
          await AsyncStorage.setItem('punchQueue', JSON.stringify(updatedQueue));
          notifyUser('Offline', 'Your punch has been saved and will sync when online.');

          if (!isTimeIn) {
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
            const intervalId = setInterval(() => setTimeElapsed((prev) => prev + 1), 1000);
            setTimer(intervalId);
          } else {
            clearInterval(timer);
            setTimer(null);
            setTimeElapsed(0);
            setPunchedInTime('Not Time In');
          }
          setIsTimeIn(!isTimeIn);
        } catch (error) {
          console.error('Queue Error:', error);
          Alert.alert('Error', 'Failed to queue punch. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected Error:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear timer if component unmounts
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <View style={{ flex: 1, backgroundColor: isLightTheme ? 'white' : '#0f172a', paddingTop: insets.top }}>
      <View className="mx-4 mt-20 space-y-4">
        {/* Date Box */}
        <View className={`flex-row items-center justify-between p-4 rounded-xl my-2 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
          <View className="flex-row items-center">
            <MaterialIcons 
              name="date-range" 
              size={30} 
              color="#3B82F6" 
              className="mr-4" 
              accessibilityLabel="Date Icon"
            />
            <View>
              <Text className={`text-base font-semibold ${isLightTheme ? 'text-gray-800' : 'text-gray-200'}`}>Date</Text>
              <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>{dayName}</Text>
            </View>
          </View>
          <View className="flex-col items-end">
            <Text className={`text-sm ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>{getLocalDate()}</Text>
          </View>
        </View>

        {/* Timezone Box */}
        <View className={`flex-row items-center p-4 rounded-xl my-2 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
          <Ionicons 
            name="location" 
            size={30} 
            color="#10B981" 
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

        {/* Status Box */}
        <View className={`flex-row items-center justify-between p-4 rounded-xl my-2 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
          <View className="flex-row items-center">
            <Entypo
              name={isTimeIn ? 'controller-record' : 'controller-play'}
              size={30}
              color={isTimeIn ? '#F59E0B' : '#EF4444'}
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
          <View className="flex-col items-end">
            <Text className={`text-md ${isLightTheme ? 'text-gray-600' : 'text-gray-400'}`}>
              {isTimeIn ? punchedInTime : '00:00:00'}
            </Text>
          </View>
        </View>

        {/* Network Status Box */}
        <View className={`flex-row items-center p-4 rounded-xl my-2 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-800'}`}>
          {isConnected ? (
            <MaterialIcons 
              name="wifi" 
              size={30} 
              color="#8B5CF6" 
              className="mr-4" 
              accessibilityLabel="Network Icon Online"
            />
          ) : (
            <MaterialIcons 
              name="wifi-off" 
              size={30} 
              color="#6B7280" 
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

        {/* Timer Section */}
        <View className="justify-center items-center mt-16">
          <View className={`w-full p-6 rounded-xl ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
            <Text className={`text-6xl font-bold text-center ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}>
              {formatTime(timeElapsed)}
            </Text>
          </View>
        </View>
      </View>

      {/* Punch Button Container */}
      <View className="mt-auto mb-4 mx-4" style={{ paddingBottom: insets.bottom || 16 }}>
        <Pressable
          onPress={handlePunch}
          disabled={isLoading}
          className={`py-4 px-5 rounded-lg w-full flex-row items-center justify-center ${
            isTimeIn ? 'bg-red-500' : 'bg-orange-500'
          } ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        >
          {isLoading && (
            <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
          )}
          <Text className="text-center text-white text-xl font-semibold">
            {isTimeIn ? 'Time Out' : 'Time In'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Punch;
