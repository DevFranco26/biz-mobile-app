import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore'

const Payroll = () => {
  const { theme } = useThemeStore();

  // Example payroll data for the current user
  const currentUserPayroll = {
    name: 'John Doe',
    position: 'Software Engineer',
    salary: '$5000',
    bonuses: '$1000',
    deductions: '$200',
    netPay: '$5800',
  };

  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800 flex-1'}`}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 0 }}>
        {/* Payroll Header */}
        <View className="bg-teal-700 rounded-xl p-6 mb-7">
          <Text className="text-2xl font-bold text-white mb-2">Payroll</Text>
          <Text className="text-white text-base">
            Here is the detailed breakdown of your payroll for this month.
          </Text>
        </View>

        {/* Payroll Details */}
        <View className={`${theme === 'light'? 'bg-white': 'bg-slate-700'} rounded-lg p-6 shadow-sm mb-7`}>
          <Text className={`${theme === 'light'? 'text-teal-900': 'text-teal-400'} text-xl font-semibold `}>Employee Name: {currentUserPayroll.name}</Text>
          <Text className="text-lg text-gray-500">Position: {currentUserPayroll.position}</Text>
          <Text className="text-lg text-gray-500">Salary: {currentUserPayroll.salary}</Text>
          <Text className="text-lg text-gray-500">Bonuses: {currentUserPayroll.bonuses}</Text>
          <Text className="text-lg text-gray-500">Deductions: {currentUserPayroll.deductions}</Text>
          <Text className="text-xl font-bold text-teal-600 mt-4">Net Pay: {currentUserPayroll.netPay}</Text>
        </View>

        {/* Action Button (e.g., Print or Export) */}
        <View className="mb-6">
          <Pressable className="bg-teal-700 rounded-lg p-4 mb-4">
            <Text className="text-white text-center font-medium">Print Payroll Details</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Payroll;
