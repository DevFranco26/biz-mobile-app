// File: app/(tabs)/payroll.jsx

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useThemeStore from '../../store/themeStore';

const Payroll = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

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
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-slate-100' : 'bg-slate-900'}`}
    >
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Payroll Header */}
        <View
          className={`rounded-lg p-4 mb-4 ${
            isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
          }`}
        >
          <Text className="text-2xl font-bold text-white mb-2">Payroll</Text>
          <Text className="text-sm text-white">
            Here is the detailed breakdown of your payroll for this month.
          </Text>
        </View>

        {/* Payroll Details */}
        <View
          className={`rounded-lg p-4 mb-4 ${
            isLightTheme ? 'bg-white' : 'bg-slate-800'
          }`}
        >
          <Text
            className={`text-lg font-semibold mb-2 ${
              isLightTheme ? 'text-slate-900' : 'text-slate-200'
            }`}
          >
            Employee Name: {currentUserPayroll.name}
          </Text>
          <Text className="text-base text-slate-400 mb-1">
            Position: {currentUserPayroll.position}
          </Text>
          <Text className="text-base text-slate-400 mb-1">
            Salary: {currentUserPayroll.salary}
          </Text>
          <Text className="text-base text-slate-400 mb-1">
            Bonuses: {currentUserPayroll.bonuses}
          </Text>
          <Text className="text-base text-slate-400 mb-4">
            Deductions: {currentUserPayroll.deductions}
          </Text>
          <Text className="text-lg font-bold text-slate-200 mt-4">
            Net Pay: {currentUserPayroll.netPay}
          </Text>
        </View>

        {/* Action Button (e.g., Print or Export) */}
        <View className="mb-4">
          <Pressable
            className="bg-orange-500/90 border p-4 rounded-lg items-center"
            onPress={() => {
              // Handle print action
              console.log('Print Payroll Details');
            }}
          >
            <Text className="text-white text-base font-bold">
              Print Payroll Details
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Payroll;
