import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../store/themeStore';

const LeavesRequests = ({ leaveRequests, onBack }) => {
  const { theme } = useThemeStore();
  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800 flex-1'}`}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="bg-teal-700 rounded-xl p-6 mb-6">
          <Text className="text-2xl font-bold text-white mb-2">Leave Requests</Text>
          <Text className="text-white text-base">
            View your submitted leave requests below.
          </Text>
        </View>

        {/* Requests Section */}
        <View>
          <Text className={`text-xl font-bold mb-3 ${theme === 'light'? 'text-teal-900': 'text-teal-400'}`}>Your Requests</Text>
          {leaveRequests.length > 0 ? (
            leaveRequests.map((request, index) => (
              <View
                key={request.id}
                className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
              >
                <Text className="text-lg font-bold text-teal-700 mb-2">
                  Request {index + 1}
                </Text>
                <Text className="text-base text-slate-700">
                  <Text className="font-bold">Type: </Text>
                  {request.type}
                </Text>
                <Text className="text-base text-slate-700 mt-1">
                  <Text className="font-bold">Reason: </Text>
                  {request.reason || 'N/A'}
                </Text>
                <Text className="text-base text-slate-700 mt-1">
                  <Text className="font-bold">From: </Text>
                  {request.fromDate}
                </Text>
                <Text className="text-base text-slate-700 mt-1">
                  <Text className="font-bold">To: </Text>
                  {request.toDate}
                </Text>
                {/* Status with Conditional Color */}
                <Text className={`text-base mt-1 font-bold ${request.status === 'Pending' ? 'text-yellow-500' : request.status === 'Approved' ? 'text-teal-500' : 'text-red-500'}`}>
                  Status: {request.status}
                </Text>
              </View>
            ))
          ) : (
            <Text className={`text-center text-gray-500`}>
              No leave requests available.
            </Text>
          )}
        </View>

        {/* Back Button */}
        <Pressable
          className="bg-teal-700 py-4 px-5 rounded-lg w-full mt-5"
          onPress={onBack}
        >
          <Text className="text-lg font-bold text-center text-white">
            Back to Leave Request
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LeavesRequests;
