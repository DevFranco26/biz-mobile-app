// File: app/(auth)/signin.jsx

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
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as SecureStore from 'expo-secure-store';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SigninSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password should be at least 6 characters').required('Password is required'),
});

const Signin = () => {
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();
  const router = useRouter();

  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSignin = async (values) => {
    const { email, password } = values;

    try {
      const response = await fetch('http://192.168.100.8:5000/api/auth/sign-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Signin Response:', data);

      if (response.ok) {
        if (data.token && data.user) {
          await SecureStore.setItemAsync('token', data.token);
          await SecureStore.setItemAsync('user', JSON.stringify(data.user));

          setUser(data.user);

          router.replace('(tabs)/profile');
        } else {
          Alert.alert('Error', 'Missing token or user data in response.');
        }
      } else {
        Alert.alert('Error', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Signin Error:', error);
      Alert.alert('Error', 'An error occurred. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={`flex-1 justify-center items-center px-6 ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`}>
          <Formik initialValues={{ email: '', password: '' }} validationSchema={SigninSchema} onSubmit={handleSignin}>
            {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => (
              <>
                <Text className={`text-5xl font-extrabold text-center mb-12 ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>
                  Biz Buddy
                </Text>

                {/* Email Input */}
                <View className="mb-4 w-full">
                  <Text className={`text-lg ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'} text-left`}>Email</Text>
                  <TextInput
                    className={`w-full p-4 my-2 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}
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
                  <View className="relative">
                    <TextInput
                      className={`w-full p-4 my-2 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}
                      secureTextEntry={!passwordVisible}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      selectionColor="#0f766e"
                      placeholder="Enter your password"
                      placeholderTextColor={theme === 'light' ? '#6b7280' : '#9ca3af'}
                    />
                    <Pressable
                      onPress={() => setPasswordVisible(!passwordVisible)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: [{ translateY: -12 }],
                      }}
                    >
                      <Ionicons
                        name={passwordVisible ? 'eye-off' : 'eye'}
                        size={24}
                        color={theme === 'light' ? '#6b7280' : '#9ca3af'}
                      />
                    </Pressable>
                  </View>
                  {touched.password && errors.password && <Text className="text-red-500 text-sm">{errors.password}</Text>}
                </View>

                {/* Sign In Button */}
                <Pressable className="w-full py-4 rounded-lg mt-7 bg-orange-500/90" onPress={handleSubmit}>
                  <Text className="text-white text-center text-lg font-medium">Sign In</Text>
                </Pressable>

                {/* Forgot Password */}
                <Pressable onPress={() => Alert.alert('Forgot Password')}>
                  <Text className={`text-blue-500 text-sm mt-4 text-center ${theme === 'light' ? 'text-blue-700' : 'text-blue-400'}`}>
                    Forgot Password?
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

export default Signin;
