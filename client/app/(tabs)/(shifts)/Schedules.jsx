import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
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
  const lastDay = new Date(year, month+1, 0);

  const days = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate()+1)) {
    days.push(new Date(d));
  }
  return days;
}

function isWeekday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5; // Monday=1 ... Friday=5
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday=0, Saturday=6
}

const Schedule = () => {
  const { theme } = useThemeStore();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
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
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setAssignments(data.data); 
        } else {
          Alert.alert('Error', data.message || 'Failed to fetch schedule.');
        }
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const daysInMonth = getDaysInCurrentMonth();
  const markedDates = {};

  // Mark recurrence
  daysInMonth.forEach(day => {
    const dayStr = day.toISOString().split('T')[0];
    let mark = false;

    for (const a of assignments) {
      const { recurrence } = a;
      // Check recurrence conditions with correct weekday logic
      if (recurrence === 'all') {
        mark = true;
        break;
      } else if (recurrence === 'weekdays' && isWeekday(day)) {
        mark = true;
        break;
      } else if (recurrence === 'weekends' && isWeekend(day)) {
        mark = true;
        break;
      }
    }

    if (mark) {
      // Mark with a dot
      markedDates[dayStr] = {
        marked: true,
        dotColor: 'green'
      };
    }
  });

  // Highlight current day text with orange (no circle)
  const currentDateStr = new Date().toISOString().split('T')[0];
  if (!markedDates[currentDateStr]) {
    markedDates[currentDateStr] = {};
  }
  // Using custom marking to change text color only
  markedDates[currentDateStr].customStyles = {
    text: { color: '#f97316', fontWeight: 'bold' }
  };

  const onDayPress = (day) => {
    const dayDate = new Date(day.dateString);
    const applicable = assignments.filter(a => {
      if (a.recurrence === 'all') return true;
      if (a.recurrence === 'weekdays') return isWeekday(dayDate);
      if (a.recurrence === 'weekends') return isWeekend(dayDate);
      return false;
    });

    if (applicable.length === 0) {
      Alert.alert('No Shifts', 'No assigned shift for this date.');
    } else {
      const msg = applicable.map(a => {
        const localStart = new Date(a.shiftSchedule.startTime);
        const localEnd = new Date(a.shiftSchedule.endTime);
        const startTime = localStart.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        const endTime = localEnd.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        return `${a.shiftSchedule.title}: ${startTime} - ${endTime}`;
      }).join('\n');
      Alert.alert('Assigned Shifts', msg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900" style={{paddingTop: insets.top}}>
      <Text className="text-white font-bold text-xl mt-5 ml-4">
        My Shift Schedule
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#475569" style={{ marginTop: 48 }} />
      ) : (
        <View className="mx-4 mt-4 shadow-lg rounded-lg overflow-hidden">
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            markingType="custom"
            theme={{
              backgroundColor: '#1f2937',
              calendarBackground: '#1f2937',
              dayTextColor: '#fff',
              monthTextColor: '#fff',
              arrowColor: '#fff',
              textSectionTitleColor: '#fff'
            }}
            style={{
              borderRadius: 12,
              overflow: 'hidden',
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Schedule;
