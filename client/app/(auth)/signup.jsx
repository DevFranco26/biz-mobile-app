// File: app/(auth)/signup.jsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Picker, // Consider using @react-native-picker/picker for better support
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as SecureStore from 'expo-secure-store';
import useThemeStore from '../../store/themeStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native'; // Import Stripe hooks

const SignupSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password should be at least 6 characters').required('Password is required'),
  companyName: Yup.string().required('Company name is required'),
  pax: Yup.string().oneOf(['1', '2-7', '8-20'], 'Select a valid number of users').required('Number of users is required'),
  packageType: Yup.string().oneOf(['Basic', 'VIP'], 'Select a valid package').required('Package type is required'),
});

const Signup = () => {
  const { theme } = useThemeStore();
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const handleSignup = async (values) => {
    const { email, password, companyName, pax, packageType } = values;

    try {
      setLoading(true);
      // Step 1: Create user and company in backend
      const response = await fetch('http://192.168.100.8:5000/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName, pax, packageType }),
      });

      const data = await response.json();

      if (response.ok) {
        // Step 2: Initialize the payment sheet with the client secret
        const { paymentIntentClientSecret } = data;

        const { error } = await initPaymentSheet({
          paymentIntentClientSecret,
          // Additional options as needed
        });

        if (!error) {
          // Step 3: Present the payment sheet to the user
          const { error: presentError } = await presentPaymentSheet();

          if (presentError) {
            Alert.alert(`Payment Error`, presentError.message);
          } else {
            // Payment succeeded, store tokens and navigate
            await SecureStore.setItemAsync('token', data.token);
            await SecureStore.setItemAsync('user', JSON.stringify(data.user));
            await SecureStore.setItemAsync('subscription', JSON.stringify(data.subscription));

            // Redirect to dashboard or profile
            router.replace('(tabs)/profile');
          }
        } else {
          Alert.alert(`Error`, error.message);
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Signup Error:', error);
      Alert.alert('Error', 'An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={`flex-1 justify-center items-center px-6 ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
          <Formik
            initialValues={{ email: '', password: '', companyName: '', pax: '', packageType: '' }}
            validationSchema={SignupSchema}
            onSubmit={handleSignup}
          >
            {({ values, handleChange, handleBlur, handleSubmit, errors, touched, setFieldValue }) => (
              <>
                <Text className={`text-5xl font-extrabold text-center mb-12 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>
                  Create Account
                </Text>

                {/* Company Name Input */}
                <View className="mb-4 w-full">
                  <Text className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} text-left`}>Company Name</Text>
                  <TextInput
                    className={`w-full p-4 my-2 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} ${
                      theme === 'light' ? 'text-gray-800' : 'text-gray-100'
                    }`}
                    value={values.companyName}
                    onChangeText={handleChange('companyName')}
                    onBlur={handleBlur('companyName')}
                    selectionColor="#0f766e"
                    placeholder="Enter your company name"
                    placeholderTextColor={theme === 'light' ? '#6b7280' : '#9ca3af'}
                  />
                  {touched.companyName && errors.companyName && (
                    <Text className="text-red-500 text-sm">{errors.companyName}</Text>
                  )}
                </View>

                {/* Email Input */}
                <View className="mb-4 w-full">
                  <Text className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} text-left`}>Email</Text>
                  <TextInput
                    className={`w-full p-4 my-2 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} ${
                      theme === 'light' ? 'text-gray-800' : 'text-gray-100'
                    }`}
                    keyboardType="email-address"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    selectionColor="#0f766e"
                    placeholder="Enter your email"
                    placeholderTextColor={theme === 'light' ? '#6b7280' : '#9ca3af'}
                  />
                  {touched.email && errors.email && <Text className="text-red-500 text-sm">{errors.email}</Text>}
                </View>

                {/* Password Input */}
                <View className="mb-6 w-full">
                  <Text className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} text-left`}>Password</Text>
                  <TextInput
                    className={`w-full p-4 my-2 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} ${
                      theme === 'light' ? 'text-gray-800' : 'text-gray-100'
                    }`}
                    secureTextEntry
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    selectionColor="#0f766e"
                    placeholder="Enter your password"
                    placeholderTextColor={theme === 'light' ? '#6b7280' : '#9ca3af'}
                  />
                  {touched.password && errors.password && (
                    <Text className="text-red-500 text-sm">{errors.password}</Text>
                  )}
                </View>

                {/* Number of Users (Pax) Picker */}
                <View className="mb-4 w-full">
                  <Text className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} text-left`}>
                    Number of Users
                  </Text>
                  <Picker
                    selectedValue={values.pax}
                    onValueChange={(itemValue) => setFieldValue('pax', itemValue)}
                    style={{
                      height: 50,
                      width: '100%',
                      color: theme === 'light' ? '#1f2937' : '#f3f4f6',
                      backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                      borderRadius: 8,
                    }}
                  >
                    <Picker.Item label="Select number of users" value="" />
                    <Picker.Item label="1 Pax" value="1" />
                    <Picker.Item label="2-7 Pax" value="2-7" />
                    <Picker.Item label="8-20 Pax" value="8-20" />
                  </Picker>
                  {touched.pax && errors.pax && <Text className="text-red-500 text-sm">{errors.pax}</Text>}
                </View>

                {/* Package Type Picker */}
                <View className="mb-6 w-full">
                  <Text className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} text-left`}>
                    Package Type
                  </Text>
                  <Picker
                    selectedValue={values.packageType}
                    onValueChange={(itemValue) => setFieldValue('packageType', itemValue)}
                    style={{
                      height: 50,
                      width: '100%',
                      color: theme === 'light' ? '#1f2937' : '#f3f4f6',
                      backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                      borderRadius: 8,
                    }}
                  >
                    <Picker.Item label="Select package type" value="" />
                    <Picker.Item label="Basic Package" value="Basic" />
                    <Picker.Item label="VIP Package" value="VIP" />
                  </Picker>
                  {touched.packageType && errors.packageType && (
                    <Text className="text-red-500 text-sm">{errors.packageType}</Text>
                  )}
                </View>

                {/* Sign Up Button */}
                <Pressable
                  className="w-full py-4 rounded-lg mt-7 bg-orange-500/90"
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  <Text className="text-white text-center text-lg font-medium">Sign Up</Text>
                </Pressable>

                {/* Already have an account */}
                <Pressable onPress={() => router.replace('/signin')}>
                  <Text
                    className={`text-blue-500 text-sm mt-4 text-center ${
                      theme === 'light' ? 'text-blue-700' : 'text-blue-400'
                    }`}
                  >
                    Already have an account? Sign In
                  </Text>
                </Pressable>
              </>
            )}
          </Formik>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Signup;
