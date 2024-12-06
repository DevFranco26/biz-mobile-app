// File: app/(tabs)/payroll.jsx

import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
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
    <SafeAreaView style={[styles.flexContainer, { backgroundColor: isLightTheme ? '#f1f5f9' : '#1e293b' }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Payroll Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Payroll</Text>
          <Text style={styles.headerSubtitle}>
            Here is the detailed breakdown of your payroll for this month.
          </Text>
        </View>

        {/* Payroll Details */}
        <View style={[styles.payrollDetails, { backgroundColor: isLightTheme ? '#ffffff' : '#334155' }]}>
          <Text style={[styles.payrollTextTitle, { color: isLightTheme ? '#0f172a' : '#2dd4bf' }]}>
            Employee Name: {currentUserPayroll.name}
          </Text>
          <Text style={styles.payrollText}>Position: {currentUserPayroll.position}</Text>
          <Text style={styles.payrollText}>Salary: {currentUserPayroll.salary}</Text>
          <Text style={styles.payrollText}>Bonuses: {currentUserPayroll.bonuses}</Text>
          <Text style={styles.payrollText}>Deductions: {currentUserPayroll.deductions}</Text>
          <Text style={[styles.netPayText, { color: '#0f766e' }]}>
            Net Pay: {currentUserPayroll.netPay}
          </Text>
        </View>

        {/* Action Button (e.g., Print or Export) */}
        <View style={styles.actionContainer}>
          <Pressable style={styles.printButton}>
            <Text style={styles.printButtonText}>Print Payroll Details</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles for the component
const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  headerContainer: {
    backgroundColor: '#0f766e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#ffffff',
    fontSize: 14,
  },
  payrollDetails: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  payrollTextTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  payrollText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 4,
  },
  netPayText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  actionContainer: {
    marginBottom: 16,
  },
  printButton: {
    backgroundColor: '#0f766e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  printButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Payroll;
