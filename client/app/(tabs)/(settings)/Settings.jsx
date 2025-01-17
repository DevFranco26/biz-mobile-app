import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons'; 
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import useThemeStore from '../../../store/themeStore';
import useUserStore from '../../../store/userStore';
import useCompanyStore from '../../../store/companyStore';
import useSubscriptionStore from '../../../store/subscriptionStore';

const Settings = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  const { user } = useUserStore();
  const { getCompanyName, fetchCompanyById } = useCompanyStore();
  const { currentSubscription, loadingCurrent, fetchCurrentSubscription } = useSubscriptionStore();

  // Theming constants
  const headerTextColor = isLightTheme ? 'text-slate-800' : 'text-slate-300';
  const accentColor = '#f97316';

  const userRole = (user?.role || '').toLowerCase();
  const userName = user ? `${user.firstName}`.trim() : '...';
  const userCompanyName = user?.companyId
    ? getCompanyName(user.companyId) || '...'
    : 'Unknown';

  // Keep track of subscription name and lock status
  const [subscriptionName, setSubscriptionName] = useState('Loading...');
  const [isLocked, setIsLocked] = useState(false);

  // Array of allowed plans — everything else is locked unless superadmin
  const ALLOWED_PLANS = ['basic', 'pro'];

  // Whenever subscription or role changes, update lock logic
  useEffect(() => {
    if (!currentSubscription || !currentSubscription.plan) {
      // No active subscription => lock for non-superadmin
      setSubscriptionName('No active subscription');
      setIsLocked(userRole !== 'superadmin');
    } else {
      const planName = currentSubscription.plan?.planName || 'Unknown Plan';
      setSubscriptionName(planName);

      if (userRole === 'superadmin') {
        // superadmin always unlocked
        setIsLocked(false);
      } else {
        // Lock if plan not in allowed list (e.g. free plan, or any other plan not in ALLOWED_PLANS)
        const lowerPlanName = planName.toLowerCase();
        if (!ALLOWED_PLANS.includes(lowerPlanName)) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      }
    }
  }, [currentSubscription, userRole]);

  // Fetch subscription if user is admin or superadmin
  useEffect(() => {
    const fetchSub = async () => {
      if (!user || !['admin', 'superadmin'].includes(userRole)) return;
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetchCurrentSubscription(token);
      }
    };
    fetchSub();
  }, [userRole, fetchCurrentSubscription, user]);

  // Fetch the company data if user has a companyId
  useEffect(() => {
    const init = async () => {
      if (user?.companyId) {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          await fetchCompanyById(token, user.companyId);
        }
      }
    };
    init();
  }, [user?.companyId, fetchCompanyById]);

  // Icon by role
  const roleIconByRole = {
    superadmin: 'ribbon-outline',
    admin: 'shield-checkmark-outline',
    supervisor: 'briefcase-outline',
    user: 'person-outline',
  };
  const roleIconName = roleIconByRole[userRole] || 'person-outline';

  // Determine if Punch Locations should be locked specifically
  const punchLocationsLocked = (
    userRole !== 'superadmin' &&
    subscriptionName.toLowerCase() !== 'pro'
  );

  // Reusable pressable card for other features
  const renderFeature = (
    IconComponent,
    iconName,
    title,
    description,
    featurePath,
    overrideLock = false
  ) => (
    <Pressable
      onPress={() => {
        // Only navigate if unlocked or explicitly overridden
        if (!isLocked || overrideLock) {
          router.push(featurePath);
        }
      }}
      style={{
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        backgroundColor: isLightTheme ? '#f1f5f9' : '#1e293b',
        // Dim the card if locked and not overridden
        opacity: isLocked && !overrideLock ? 0.5 : 1,
      }}
      disabled={isLocked && !overrideLock}
    >
      <IconComponent
        name={iconName}
        size={28}
        color={accentColor}
        style={{ marginRight: 12 }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: isLightTheme ? '#1f2937' : '#f1f5f9',
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: isLightTheme ? '#4b5563' : '#a0aec0',
          }}
          className="mt-1"
        >
          {description}
        </Text>
      </View>
      {/* Show lock icon if locked and not overridden */}
      {isLocked && !overrideLock && (
        <MaterialIcons name="lock" size={24} color="#f97316" />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
      edges={['top']}
    >
      {/* Header Section */}
      <View className="rounded-xl my-4 mx-4">
        <View className="flex-row justify-between items-center border-b-2 border-slate-300 pb-2">
          <View>
            <Text className={`text-3xl font-extrabold ${headerTextColor}`}>
              Hi, {userName}
            </Text>
          </View>
          <View className="flex-row mr-2">
            <Ionicons name={roleIconName} size={25} color={accentColor} />
            <Text
              className={`text-xs font-semibold capitalize my-auto ml-1 ${
                isLightTheme ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              {userRole}
            </Text>
          </View>
        </View>
      </View>

      {userRole === 'user' ? (
        // Regular user has no admin features
        <View className="flex-1 px-4">
          <Text
            className={`text-base font-semibold ${
              isLightTheme ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            You currently have no administrative features available.
          </Text>
        </View>
      ) : (
        // Render admin/supervisor features
        <ScrollView
          className="flex-1 px-4 pb-6"
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View className="space-y-5">
            {/* Superadmin-Only Section */}
            {userRole === 'superadmin' && (
              <View className="my-2">
                <Text
                  className={`text-xl font-bold mb-1 ${
                    isLightTheme ? 'text-slate-800' : 'text-slate-300'
                  }`}
                >
                  Company
                </Text>

                {renderFeature(
                  Ionicons,
                  'business-outline',
                  'Manage Companies',
                  'Create, update, remove companies.',
                  './ManageCompanies'
                )}

                {renderFeature(
                  Ionicons,
                  'reader-outline',
                  'Manage Subscriptions',
                  'Track all companies’ subscriptions.',
                  './ManageSubscriptions'
                )}

                {renderFeature(
                  Ionicons,
                  'settings-outline',
                  'Manage Plans',
                  'Create or update subscription plans.',
                  './ManageSubscriptionPlans'
                )}
              </View>
            )}

            {/* Department Section */}
            <View className="my-2">
              <Text
                className={`text-xl font-bold mb-1 ${
                  isLightTheme ? 'text-slate-800' : 'text-slate-300'
                }`}
              >
                Department
              </Text>
              {renderFeature(
                Ionicons,
                'briefcase-outline',
                'Manage Departments',
                'Organize departments and teams.',
                './ManageDepartments'
              )}
            </View>

            {/* Employee Section */}
            <View className="my-2">
              <Text
                className={`text-xl font-bold mb-1 ${
                  isLightTheme ? 'text-slate-800' : 'text-slate-300'
                }`}
              >
                Employee
              </Text>
              {renderFeature(
                Ionicons,
                'people-outline',
                'Manage Employees',
                'Monitor, create, update, remove employees.',
                './ManageUsers'
              )}
              {renderFeature(
                Ionicons,
                'calendar-outline',
                'Employee Shifts',
                'Create, update, assign shift schedules.',
                './ManageShiftSchedules'
              )}
              {/* Custom Punch Locations feature */}
              <Pressable
                onPress={() => {
                  if (!punchLocationsLocked) {
                    router.push('./ManageLocations');
                  }
                }}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginVertical: 4,
                  backgroundColor: isLightTheme ? '#f1f5f9' : '#1e293b',
                  opacity: punchLocationsLocked ? 0.5 : 1,
                }}
                disabled={punchLocationsLocked}
              >
                <Ionicons
                  name="location-outline"
                  size={28}
                  color={accentColor}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '600',
                      color: isLightTheme ? '#1f2937' : '#f1f5f9',
                    }}
                  >
                    Punch Locations
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: isLightTheme ? '#4b5563' : '#a0aec0',
                    }}
                    className = "mt-1"
                  >
                    Create, update, assign or delete punch locations.
                  </Text>
                </View>
                {punchLocationsLocked && (
                  <MaterialIcons name="lock" size={24} color="#f97316" />
                )}
              </Pressable>
              {renderFeature(
                Ionicons,
                'calendar-outline',
                'Leave Request',
                'Approve and reject employee leaves.',
                './ManageLeaves'
              )}
            </View>

            {/* Admin or superadmin (not supervisor) */}
            {userRole !== 'supervisor' && (
              <>
                {/* Payroll Section */}
                <View className="my-2">
                  <Text
                    className={`text-xl font-bold mb-1 ${
                      isLightTheme ? 'text-slate-800' : 'text-slate-300'
                    }`}
                  >
                    Company: {userCompanyName} Payroll
                  </Text>
                  {renderFeature(
                    MaterialIcons,
                    'attach-money',
                    'Company Payroll Settings',
                    'Configure cutoff cycles, currency, and overtime rates.',
                    './PayrollSettings'
                  )}
                  {renderFeature(
                    Ionicons,
                    'cash-outline',
                    'Employee Payrate Settings',
                    'Set or update pay rates for users.',
                    './PayrateSettings'
                  )}
                  {renderFeature(
                    Ionicons,
                    'calculator-outline',
                    'Calculate Payroll Manually',
                    'Manually calculate payroll for a user/period.',
                    './CalculatePayrollManually'
                  )}
                  {renderFeature(
                    Ionicons,
                    'document-text-outline',
                    'Payroll Records',
                    'View & manage all payroll records.',
                    './PayrollRecords'
                  )}
                </View>

                {/* Subscription Section (always unlocked so user can view/update plan) */}
                <View className="my-2">
                  <Text
                    className={`text-xl font-bold mb-1 ${
                      isLightTheme ? 'text-slate-800' : 'text-slate-300'
                    }`}
                  >
                    Subscription
                  </Text>
                  {renderFeature(
                    Ionicons,
                    'reader-outline',
                    loadingCurrent
                      ? 'Checking subscription...'
                      : subscriptionName,
                    'View or manage your company’s subscription plan.',
                    './CurrentSubscription',
                    true // Always unlocked so you can view/update your plan
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Settings;
