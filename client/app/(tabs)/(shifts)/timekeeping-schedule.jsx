// File: app/(tabs)/(shifts)/timekeeping-schedule.jsx

import React, { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import useThemeStore from '../../../store/themeStore'
import { Calendar } from 'react-native-calendars'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { API_BASE_URL } from '../../../config/constant'
import { getDaysInCurrentMonth, isWeekday, isWeekend } from '../../../utils/timeUtils'

const Schedule = () => {
  const { theme } = useThemeStore()
  const isLightTheme = theme === 'light'
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Notifications permission is required.')
      }
    })()
  }, [])

  const fetchData = async () => {
    const token = await SecureStore.getItemAsync('token')
    if (!token) {
      Alert.alert('Authentication Error', 'Please sign in again.')
      router.replace('(auth)/login-user')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/shiftschedules/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        const schedules = data.data
        setAssignments(schedules)
        schedules.forEach(a => {
          const startTime = new Date(a.shiftSchedule.startTime)
          const endTime = new Date(a.shiftSchedule.endTime)
          const now = new Date()
          const startNotificationTime = new Date(startTime.getTime() - 30 * 60000)
          const endNotificationTime = new Date(endTime.getTime() - 30 * 60000)
          if (startNotificationTime > now) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Shift Reminder',
                body: `Your shift "${a.shiftSchedule.title}" starts at ${startTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}.`,
              },
              trigger: startNotificationTime,
            })
          }
          if (endNotificationTime > now) {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'Shift Reminder',
                body: `Your shift "${a.shiftSchedule.title}" ends at ${endTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}.`,
              },
              trigger: endNotificationTime,
            })
          }
        })
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch schedule.')
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [router])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }

  // Memoize daysInMonth to prevent unnecessary recalculations
  const daysInMonth = useMemo(() => getDaysInCurrentMonth(), [])

  // Memoize markedDates based on assignments and theme
  const markedDates = useMemo(() => {
    const marks = {}
    daysInMonth.forEach(day => {
      const localDate = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const yyyy = localDate.getFullYear()
      const mm = String(localDate.getMonth() + 1).padStart(2, '0')
      const dd = String(localDate.getDate()).padStart(2, '0')
      const localDayStr = `${yyyy}-${mm}-${dd}`
      let mark = false
      for (const a of assignments) {
        const { recurrence } = a
        if (recurrence === 'all') {
          mark = true
          break
        } else if (recurrence === 'weekdays' && isWeekday(localDate)) {
          mark = true
          break
        } else if (recurrence === 'weekends' && isWeekend(localDate)) {
          mark = true
          break
        }
      }
      if (mark) {
        marks[localDayStr] = {
          marked: true,
          dotColor: isLightTheme ? 'green' : 'lightgreen', // Adjust dot color based on theme
        }
      }
    })
    return marks
  }, [assignments, daysInMonth, isLightTheme])

  const onDayPress = day => {
    const dayDate = new Date(day.dateString)
    const applicable = assignments.filter(a => {
      if (a.recurrence === 'all') return true
      if (a.recurrence === 'weekdays') return isWeekday(dayDate)
      if (a.recurrence === 'weekends') return isWeekend(dayDate)
      return false
    })
    if (applicable.length === 0) {
      Alert.alert('No Shifts', 'No assigned shift for this date.')
    } else {
      const msg = applicable
        .map(a => {
          const localStart = new Date(a.shiftSchedule.startTime)
          const localEnd = new Date(a.shiftSchedule.endTime)
          const startTime = localStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const endTime = localEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          return `${a.shiftSchedule.title}: ${startTime} - ${endTime}`
        })
        .join('\n')
      Alert.alert('Assigned Shifts', msg)
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`} style={{ paddingTop: insets.top }}>
      <Text className={`font-bold text-xl mt-5 ml-4 ${isLightTheme ? 'text-slate-800' : 'text-slate-300'}`}>
        My Shift Schedule
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color={isLightTheme ? '#475569' : '#94a3b8'} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View className="mx-4 mt-4 rounded-2xl overflow-hidden">
            <Calendar
              key={isLightTheme ? 'light' : 'dark'} // Force re-render when theme changes
              onDayPress={onDayPress}
              markedDates={markedDates}
              markingType="custom"
              theme={{
                backgroundColor: isLightTheme ? '#FFFFFF' : '#1f2937',
                calendarBackground: isLightTheme ? '#f1f5f9' : '#1f2937',
                textSectionTitleColor: isLightTheme ? '#1f2937' : '#cbd5e1',
                selectedDayBackgroundColor: isLightTheme ? '#3B82F6' : '#2563EB',
                selectedDayTextColor: '#ffffff',
                todayTextColor: isLightTheme ? '#f97316' : '#f97316',
                dayTextColor: isLightTheme ? '#1f2937' : '#cbd5e1',
                textDisabledColor: isLightTheme ? '#d1d5db' : '#6b7280',
                arrowColor: isLightTheme ? '#1f2937' : '#cbd5e1',
                monthTextColor: isLightTheme ? '#1f2937' : '#cbd5e1',
                indicatorColor: isLightTheme ? '#3B82F6' : '#2563EB',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '400',
                textDayFontSize: 16,
                textMonthFontSize: 20,
                textDayHeaderFontSize: 14,
              }}
              style={{ borderRadius: 12, overflow: 'hidden' }}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default Schedule
