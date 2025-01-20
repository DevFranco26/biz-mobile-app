import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Tabs, useRouter  } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Stores
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/userStore';
import useSubscriptionStore from '../../store/subscriptionStore';

// Helper to get initials
const getInitials = (user) => {
  if (!user) return '';
  const { firstName = '', lastName = '' } = user;
  const firstInitial = firstName.charAt(0).toUpperCase() || '';
  const lastInitial = lastName.charAt(0).toUpperCase() || '';
  return `${firstInitial}${lastInitial}`;
};

const TabsLayout = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { currentSubscription, fetchCurrentSubscription } = useSubscriptionStore();
  
  const isLightTheme = theme === 'light';
  const [isLocked, setIsLocked] = useState(false);
  const userRole = (user?.role || '').toLowerCase();

  // Allowed (unlocked) plans for non-superadmins
  const ALLOWED_PLANS = ['basic', 'pro'];

  // Fetch current subscription for locking logic
  useEffect(() => {
    const fetchSub = async () => {
      if (!user || !['user', 'supervisor', 'admin','superadmin'].includes(userRole)) return;
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        await fetchCurrentSubscription(token);
      }
    };
    fetchSub();
  }, [userRole, fetchCurrentSubscription, user]);

  // Determine lock status based on subscription plan
  useEffect(() => {
    if (!currentSubscription || !currentSubscription.plan) {
      setIsLocked(userRole !== 'superadmin');
    } else {
      const planName = (currentSubscription.plan?.planName || '').toLowerCase();
      
      if (userRole === 'superadmin') {
        setIsLocked(false);
        return;
      }

      if (planName !== 'pro' && planName !== 'basic') {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    }
  }, [currentSubscription, userRole]);

  // Reusable Avatar icon for settings tab
  const AvatarIcon = ({ color, size }) => {
    const initials = getInitials(user);
    const circleSize = 23;
    return (
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
          {initials}
        </Text>
      </View>
    );
  };

  // Custom icon renderer with lock overlay
  const lockedIcon = (iconName, color, size) => (
    <View>
      <Ionicons name={iconName} size={size} color={color} />
      {isLocked && (
        <MaterialIcons
          name="lock"
          size={size * 0.6}
          color="#f97316"
          style={{ position: 'absolute', top: 0, right: 0 }}
        />
      )}
    </View>
  );

  /**
   * When locked, we prevent the default navigation and show an alert.
   * We also spread `props` and keep `props.style` so the layout doesn't shift.
   */
  const renderLockedTabBarButton = (props) => {
    return (
      <Pressable
        {...props}
        style={[props.style, styles.button]}
        onPress={(e) => {
          e.preventDefault();
          Alert.alert(
            'Upgrade Subscription',
            'This feature is not available on your current plan. Please upgrade your subscription.'
          );
        }}
      >
        {props.children}
      </Pressable>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: isLightTheme ? '#ffffff' : '#0f172a',
          borderTopColor: isLightTheme ? '#ffffff' : '#0f172a',
        },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(leaves)"
        options={{
          title: 'Leaves',
          headerShown: false,
          tabBarIcon: ({ color, size }) => lockedIcon('calendar-outline', color, size),
          tabBarButton: isLocked ? renderLockedTabBarButton : undefined,
        }}
      />
      <Tabs.Screen
        name="payroll"
        options={{
          title: 'Payroll',
          headerShown: false,
          tabBarIcon: ({ color, size }) => lockedIcon('cash-outline', color, size),
          tabBarButton: isLocked ? renderLockedTabBarButton : undefined,
        }}
      />
      <Tabs.Screen
        name="(shifts)"
        options={{
          title: 'Timekeeping',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: AvatarIcon,
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TabsLayout;
