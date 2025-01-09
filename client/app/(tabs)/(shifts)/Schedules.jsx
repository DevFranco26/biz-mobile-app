// File: app/(tabs)/(shifts)/Schedule.jsx

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, ScrollView, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import useThemeStore from '../../../store/themeStore';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

function getDaysInCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function isWeekday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

const Schedule = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Request notification permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Notifications permission is required.');
      }
    })();
  }, []);

  // Extracted data-fetching function
  const fetchData = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.');
      router.replace('(auth)/signin');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/shiftschedules/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const schedules = data.data;
        setAssignments(schedules);

        // Schedule notifications for each assignment
        schedules.forEach((a) => {
          const startTime = new Date(a.shiftSchedule.startTime);
          const endTime = new Date(a.shiftSchedule.endTime);
          const now = new Date();

          const startNotificationTime = new Date(startTime.getTime() - 30 * 60000);
          const endNotificationTime = new Date(endTime.getTime() - 30 * 60000);

          if (startNotificationTime > now) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Shift Reminder',
                body: `Your shift "${a.shiftSchedule.title}" starts at ${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
              },
              trigger: startNotificationTime,
            });
          }

          if (endNotificationTime > now) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Shift Reminder',
                body: `Your shift "${a.shiftSchedule.title}" ends at ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
              },
              trigger: endNotificationTime,
            });
          }
        });
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch schedule.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
    setLoading(false);
  };

  // Initial data fetch on mount
  useEffect(() => {
    fetchData();
  }, [router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const daysInMonth = getDaysInCurrentMonth();
  const markedDates = {};

  daysInMonth.forEach((day) => {
    const localDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, '0');
    const dd = String(localDate.getDate()).padStart(2, '0');
    const localDayStr = `${yyyy}-${mm}-${dd}`;

    let mark = false;

    for (const a of assignments) {
      const { recurrence } = a;
      if (recurrence === 'all') {
        mark = true;
        break;
      } else if (recurrence === 'weekdays' && isWeekday(localDate)) {
        mark = true;
        break;
      } else if (recurrence === 'weekends' && isWeekend(localDate)) {
        mark = true;
        break;
      }
    }

    if (mark) {
      markedDates[localDayStr] = {
        marked: true,
        dotColor: 'green',
      };
    }
  });

  const onDayPress = (day) => {
    const dayDate = new Date(day.dateString);
    const applicable = assignments.filter((a) => {
      if (a.recurrence === 'all') return true;
      if (a.recurrence === 'weekdays') return isWeekday(dayDate);
      if (a.recurrence === 'weekends') return isWeekend(dayDate);
      return false;
    });

    if (applicable.length === 0) {
      Alert.alert('No Shifts', 'No assigned shift for this date.');
    } else {
      const msg = applicable
        .map((a) => {
          const localStart = new Date(a.shiftSchedule.startTime);
          const localEnd = new Date(a.shiftSchedule.endTime);
          const startTime = localStart.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const endTime = localEnd.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return `${a.shiftSchedule.title}: ${startTime} - ${endTime}`;
        })
        .join('\n');
      Alert.alert('Assigned Shifts', msg);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      style={{ paddingTop: insets.top }}
    >
      <Text
        className={`font-bold text-xl mt-5 ml-4 ${
          isLightTheme ? 'text-slate-800' : 'text-white'
        }`}
      >
        My Shift Schedule
      </Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={isLightTheme ? '#475569' : '#94a3b8'}
          style={{ marginTop: 48 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="mx-4 mt-4 rounded-2xl overflow-hidden">
            <Calendar
              onDayPress={onDayPress}
              markedDates={markedDates}
              markingType="custom"
              theme={{
                backgroundColor: isLightTheme ? '#FFFFFF' : '#1f2937',
                calendarBackground: isLightTheme ? '#f1f5f9' : '#1f2937',
                dayTextColor: isLightTheme ? '#1f2937' : '#FFFFFF',
                monthTextColor: isLightTheme ? '#1f2937' : '#FFFFFF',
                arrowColor: isLightTheme ? '#1f2937' : '#FFFFFF',
                textSectionTitleColor: isLightTheme ? '#1f2937' : '#FFFFFF',
                todayTextColor: '#f97316', // Orange 500
              }}
              style={{
                borderRadius: 12,
                overflow: 'hidden',
              }}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Schedule;
