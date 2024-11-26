import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../store/themeStore';

const ViewLogs = ({ shiftLogs, onBack }) => {

  const { theme } = useThemeStore();
  // Group logs into pairs
  const groupedLogs = [];
  for (let i = 0; i < shiftLogs.length; i += 2) {
    groupedLogs.push({
      date: shiftLogs[i]?.date || 'N/A',
      timeIn: shiftLogs[i]?.time || 'N/A',
      timeOut: shiftLogs[i + 1]?.time || 'N/A',
    });
  }

  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800 flex-1'}`}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="bg-teal-700 rounded-xl p-6 mb-6">
          <Text className="text-2xl font-bold text-white mb-2">Shift Logs</Text>
          <Text className="text-white text-base">
            Review your time-in and time-out logs below.
          </Text>
        </View>

        {/* Logs Section */}
        <View>
          <Text className={`text-xl font-bold mb-3 ${theme === 'light'? 'text-teal-900': 'text-teal-400'}`}>Your Logs</Text>
          {groupedLogs.length > 0 ? (
            groupedLogs.map((log, index) => (
              <View
                key={index}
                className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
              >
                <Text className="text-lg font-bold text-teal-700 mb-2">
                  Shift {index + 1}
                </Text>
                <Text className="text-base text-slate-700">
                  <Text className="font-bold">Date: </Text>
                  {log.date}
                </Text>
                <Text className="text-base text-slate-700 mt-1">
                  <Text className="font-bold">Time In: </Text>
                  {log.timeIn}
                </Text>
                <Text className="text-base text-slate-700 mt-1">
                  <Text className="font-bold">Time Out: </Text>
                  {log.timeOut}
                </Text>
              </View>
            ))
          ) : (
            <Text className={`text-center text-gray-500`}>
              No logs available.
            </Text>
          )}
        </View>

        {/* Back Button */}
        <Pressable
          className="bg-teal-700 py-4 px-5 rounded-lg w-full mt-5"
          onPress={onBack}
        >
          <Text className="text-lg font-bold text-center text-white">
            Back to Shifts
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ViewLogs;
