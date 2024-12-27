// File: app/(tabs)/(settings)/(admin)/PayrollRecords.jsx

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import useThemeStore from '../../../../store/themeStore';
import usePayrollStore from '../../../../store/payrollStore';
import useUsersStore from '../../../../store/usersStore';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import DropDownPicker from 'react-native-dropdown-picker';

const getPayTypeColor = (payType) => {
  switch (payType) {
    case 'hourly':
      return '#3b82f6'; // Blue
    case 'monthly':
      return '#ef4444'; // Red
    default:
      return '#3b82f6'; // Default Blue
  }
};

const PayrollRecords = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  const router = useRouter();

  const {
    payrollRecords,
    fetchAllPayroll,
    loading,
  } = usePayrollStore();

  const {
    users,
    fetchUsers,
    loading: usersLoading,
  } = useUsersStore();

  const [token, setToken] = useState(null);

  // Sorting and Filtering States
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState(null);
  const [sortItems, setSortItems] = useState([
    { label: 'Net Pay: Low to High', value: 'netPay_asc' },
    { label: 'Net Pay: High to Low', value: 'netPay_desc' },
    { label: 'Name: A-Z', value: 'name_asc' },
    { label: 'Name: Z-A', value: 'name_desc' },
  ]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState(null);
  const [filterItems, setFilterItems] = useState([
    { label: 'All Users', value: 'all' },
    // Users will be dynamically added here
  ]);

  // Populate filterItems with users
  useEffect(() => {
    if (users && Array.isArray(users)) {
      const userOptions = users.map((user) => ({
        label: `${user.firstName} ${user.lastName}`,
        value: user.id,
      }));
      setFilterItems([{ label: 'All Users', value: 'all' }, ...userOptions]);
    }
  }, [users]);

  // Load token and fetch payroll records & users
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        if (!storedToken) {
          Alert.alert('Authentication Error', 'Please sign in again.');
          // Optionally navigate to sign-in screen
          return;
        }
        setToken(storedToken);
        await fetchAllPayroll(storedToken);
        await fetchUsers(storedToken);
      } catch (error) {
        console.error('Error loading PayrollRecords:', error);
        Alert.alert('Error', 'Failed to load payroll records.');
      }
    };
    initialize();
  }, [fetchAllPayroll, fetchUsers]);

  // Sort and Filter Logic using useMemo for performance optimization
  const sortedAndFilteredPayrollRecords = useMemo(() => {
    let records = [...payrollRecords];

    // Filtering
    if (filterValue && filterValue !== 'all') {
      records = records.filter((record) => record.userId === filterValue);
    }

    // Sorting
    if (sortValue) {
      switch (sortValue) {
        case 'netPay_asc':
          records.sort((a, b) => parseFloat(a.netPay) - parseFloat(b.netPay));
          break;
        case 'netPay_desc':
          records.sort((a, b) => parseFloat(b.netPay) - parseFloat(a.netPay));
          break;
        case 'name_asc':
          records.sort((a, b) => {
            const nameA = `${a.user.firstName} ${a.user.lastName}`.toUpperCase();
            const nameB = `${b.user.firstName} ${b.user.lastName}`.toUpperCase();
            return nameA.localeCompare(nameB);
          });
          break;
        case 'name_desc':
          records.sort((a, b) => {
            const nameA = `${a.user.firstName} ${a.user.lastName}`.toUpperCase();
            const nameB = `${b.user.firstName} ${b.user.lastName}`.toUpperCase();
            return nameB.localeCompare(nameA);
          });
          break;
        default:
          break;
      }
    }

    return records;
  }, [payrollRecords, filterValue, sortValue]);

  const renderPayrollItem = ({ item }) => {
    console.log('Payroll Record Item:', item); // Debugging line

    // Retrieve user details directly from the payroll record's user object
    const user = item.user;
    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    
    // Parse grossPay and netPay as floats
    const grossPayValue = parseFloat(item.grossPay);
    const netPayValue = parseFloat(item.netPay);

    // Check if parsed values are valid numbers
    const grossPay = !isNaN(grossPayValue) ? grossPayValue.toFixed(2) : 'N/A';
    const netPay = !isNaN(netPayValue) ? netPayValue.toFixed(2) : 'N/A';

    return (
      <View
        className={`p-4 mb-3 rounded-lg flex-col ${
          isLightTheme ? 'bg-slate-100' : 'bg-slate-800'
        }`}
      >
        <Text
          className={`text-base font-semibold ${
            isLightTheme ? 'text-slate-800' : 'text-slate-300'
          }`}
        >
          {userName} 
          {/* ID: {item.userId} */}
        </Text>
        <Text
          className={`text-sm mt-1 ${
            isLightTheme ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          Period: {format(new Date(item.startDate), 'MMMM d, yyyy')} ~ {format(new Date(item.endDate), 'MMMM d, yyyy')}
        </Text>

        <View className="flex-row items-center mt-1">
          <Ionicons
            name="cash-outline"
            size={16}
            color={getPayTypeColor(item.payType)}
            className="mr-1"
          />
          <Text className={`text-sm ${isLightTheme ? 'text-slate-700' : 'text-slate-300'}`}>
            Pay Type: {item.payType.charAt(0).toUpperCase() + item.payType.slice(1)}
          </Text>
        </View>

        <Text
          className={`text-sm mt-1 ${
            isLightTheme ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          Gross Pay: ${grossPay}
        </Text>
        <Text
          className={`text-sm mt-1 ${
            isLightTheme ? 'text-slate-700' : 'text-slate-300'
          }`}
        >
          Net Pay: ${netPay}
        </Text>
      </View>
    );
  };

  if (loading || usersLoading) {
    return (
      <SafeAreaView
        className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
        edges={['top']}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0f766e" />
          <Text
            className={`mt-4 ${isLightTheme ? 'text-gray-700' : 'text-gray-300'}`}
          >
            Loading Payroll Records...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      edges={['top']}
    >
      {/* Header */}
      <View className="flex-row items-center px-4 py-4">
        <Pressable onPress={() => router.back()} className="mr-2">
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={isLightTheme ? '#333' : '#fff'}
          />
        </Pressable>
        <Text className={`text-xl font-bold ${isLightTheme ? 'text-slate-800' : 'text-white'}`}>
          Payroll Records
        </Text>
      </View>

      {/* Sorting and Filtering Options */}
      <View className="px-4 mb-4">
        <View className=" justify-between gap-2">
          {/* Sort Dropdown */}
          <DropDownPicker
            open={sortOpen}
            value={sortValue}
            items={sortItems}
            setOpen={setSortOpen}
            setValue={setSortValue}
            setItems={setSortItems}
            placeholder="Sort By"
            textStyle={{
              color: isLightTheme ? '#374151' : '#9ca3af',
            }}
            className="mb-3"
            style={{
              borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
              backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            }}
            dropDownContainerStyle={{
              borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
              backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            }}
            arrowIconStyle={{
              tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
            }}
            tickIconStyle={{
              tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
            }}
            zIndex={4000}
            zIndexInverse={1000}
            placeholderStyle={{
              color: isLightTheme ? '#6B7280' : '#9CA3AF',
            }}
         
          />

          {/* Filter Dropdown */}
          <DropDownPicker
            open={filterOpen}
            value={filterValue}
            items={filterItems}
            setOpen={setFilterOpen}
            setValue={setFilterValue}
            setItems={setFilterItems}
            placeholder="Filter By User"
            textStyle={{
              color: isLightTheme ? '#374151' : '#9ca3af',
            }}
            className="mb-3"
            style={{
              borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
              backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            
            }}
            dropDownContainerStyle={{
              borderColor: isLightTheme ? '#f1f5f9' : '#1E293B',
              backgroundColor: isLightTheme ? '#f1f5f9' : '#1E293B',
            }}
            arrowIconStyle={{
              tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
            }}
            tickIconStyle={{
              tintColor: isLightTheme ? '#1e293b' : '#cbd5e1',
            }}
            zIndex={3000}
            zIndexInverse={2000}
            placeholderStyle={{
              color: isLightTheme ? '#6B7280' : '#9CA3AF',
            }}
           
          />
        </View>
      </View>

      {/* Payroll Records List */}
      <FlatList
        data={sortedAndFilteredPayrollRecords}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPayrollItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListEmptyComponent={
          !loading && !usersLoading && (
            <Text
              className={`text-center mt-12 text-lg ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              No payroll records found.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
};

export default PayrollRecords;
