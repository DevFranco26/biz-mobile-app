// File: app/(auth)/get-started.jsx

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
  ActivityIndicator,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as SecureStore from 'expo-secure-store';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const GetStarted = () => {
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();
  const router = useRouter();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: CEO Information
  const StepOneSchema = Yup.object().shape({
    name: Yup.string()
      .min(2, 'Name is too short')
      .max(50, 'Name is too long')
      .required('Name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password should be at least 6 characters')
      .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
      .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .matches(/\d/, 'Password must contain at least one number')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required'),
  });

  // Step 2: Company and Subscription
  const StepTwoSchema = Yup.object().shape({
    companyName: Yup.string()
      .min(2, 'Company name is too short')
      .max(100, 'Company name is too long')
      .required('Company name is required'),
    pax: Yup.string().required('Please select the number of users'),
    package: Yup.string().required('Please select a package'),
  });

  const handleSignup = async (values) => {
    const { name, email, password, companyName, pax, package: selectedPackage } = values;

    setIsSubmitting(true);

    try {
      // Assuming your backend expects a combined payload for user and company creation
      const response = await fetch('http://192.168.100.8:5000/api/auth/get-started', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, companyName, pax, package: selectedPackage }),
      });

      const data = await response.json();
      console.log('GetStarted Response:', data);

      if (response.ok) {
        if (data.token && data.user) {
          await SecureStore.setItemAsync('token', data.token);
          await SecureStore.setItemAsync('user', JSON.stringify(data.user));

          setUser(data.user);

          Alert.alert('Success', 'Account and Company created successfully!', [
            {
              text: 'OK',
              onPress: () => router.replace('(tabs)/profile'),
            },
          ]);
        } else {
          Alert.alert('Error', 'Missing token or user data in response.');
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to create account and company');
      }
    } catch (error) {
      console.error('GetStarted Error:', error);
      Alert.alert('Error', 'An error occurred. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Step 1: CEO Information
  const renderStepOne = (formikProps) => {
    const { values, handleChange, handleBlur, errors, touched } = formikProps;
    return (
      <>
        <Text
          className={`text-4xl font-extrabold text-center mb-8 ${
            theme === 'light' ? 'text-slate-800' : 'text-slate-100'
          }`}
        >
          Get Started
        </Text>

        {/* Name Input */}
        <View className="mb-4 w-full">
          <Text
            className={`text-lg ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            } text-left`}
          >
            Name
          </Text>
          <TextInput
            className={`w-full p-4 my-2 rounded-lg ${
              theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'
            } ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            }`}
            value={values.name}
            onChangeText={handleChange('name')}
            onBlur={handleBlur('name')}
            selectionColor="#0f766e"
            placeholder="Enter your name"
            placeholderTextColor={
              theme === 'light' ? '#6b7280' : '#9ca3af'
            }
          />
          {touched.name && errors.name && (
            <Text className="text-red-500 text-sm">{errors.name}</Text>
          )}
        </View>

        {/* Email Input */}
        <View className="mb-4 w-full">
          <Text
            className={`text-lg ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            } text-left`}
          >
            Email
          </Text>
          <TextInput
            className={`w-full p-4 my-2 rounded-lg ${
              theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'
            } ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            }`}
            keyboardType="email-address"
            value={values.email}
            onChangeText={handleChange('email')}
            onBlur={handleBlur('email')}
            selectionColor="#0f766e"
            placeholder="Enter your email"
            placeholderTextColor={
              theme === 'light' ? '#6b7280' : '#9ca3af'
            }
          />
          {touched.email && errors.email && (
            <Text className="text-red-500 text-sm">{errors.email}</Text>
          )}
        </View>

        {/* Password Input */}
        <View className="mb-4 w-full">
          <Text
            className={`text-lg ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            } text-left`}
          >
            Password
          </Text>
          <View className="relative">
            <TextInput
              className={`w-full p-4 my-2 rounded-lg ${
                theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'
              } ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-100'
              }`}
              secureTextEntry={!passwordVisible}
              value={values.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              selectionColor="#0f766e"
              placeholder="Enter your password"
              placeholderTextColor={
                theme === 'light' ? '#6b7280' : '#9ca3af'
              }
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
                color={
                  theme === 'light' ? '#6b7280' : '#9ca3af'
                }
              />
            </Pressable>
          </View>
          {touched.password && errors.password && (
            <Text className="text-red-500 text-sm">
              {errors.password}
            </Text>
          )}
        </View>

        {/* Confirm Password Input */}
        <View className="mb-6 w-full">
          <Text
            className={`text-lg ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            } text-left`}
          >
            Confirm Password
          </Text>
          <View className="relative">
            <TextInput
              className={`w-full p-4 my-2 rounded-lg ${
                theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'
              } ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-100'
              }`}
              secureTextEntry={!confirmPasswordVisible}
              value={values.confirmPassword}
              onChangeText={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              selectionColor="#0f766e"
              placeholder="Confirm your password"
              placeholderTextColor={
                theme === 'light' ? '#6b7280' : '#9ca3af'
              }
            />
            <Pressable
              onPress={() =>
                setConfirmPasswordVisible(!confirmPasswordVisible)
              }
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: [{ translateY: -12 }],
              }}
            >
              <Ionicons
                name={
                  confirmPasswordVisible ? 'eye-off' : 'eye'
                }
                size={24}
                color={
                  theme === 'light' ? '#6b7280' : '#9ca3af'
                }
              />
            </Pressable>
          </View>
          {touched.confirmPassword && errors.confirmPassword && (
            <Text className="text-red-500 text-sm">
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {/* Next Button */}
        <Pressable
          className="w-full py-4 rounded-lg mt-7 bg-orange-500/90"
          onPress={() => formikProps.handleSubmit()}
        >
          <Text className="text-white text-center text-lg font-medium">
            Next
          </Text>
        </Pressable>

        {/* Back to Sign In */}
        <Pressable
          className="w-full py-4 rounded-lg mt-4 border-2 border-orange-500/90"
          onPress={() => router.replace('(auth)/signin')}
        >
          <Text className="text-orange-500/90 text-center text-lg font-medium">
            Back to Sign In
          </Text>
        </Pressable>
      </>
    );
  };

  // Render Step 2: Company and Subscription
  const renderStepTwo = (formikProps) => {
    const { values, handleChange, handleBlur, errors, touched } = formikProps;
    return (
      <>
        <Text
          className={`text-4xl font-extrabold text-center mb-8 ${
            theme === 'light' ? 'text-slate-800' : 'text-slate-100'
          }`}
        >
          Company & Subscription
        </Text>

        {/* Company Name Input */}
        <View className="mb-4 w-full">
          <Text
            className={`text-lg ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            } text-left`}
          >
            Company Name
          </Text>
          <TextInput
            className={`w-full p-4 my-2 rounded-lg ${
              theme === 'light' ? 'bg-slate-100' : 'bg-slate-800'
            } ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            }`}
            value={values.companyName}
            onChangeText={handleChange('companyName')}
            onBlur={handleBlur('companyName')}
            selectionColor="#0f766e"
            placeholder="Enter your company name"
            placeholderTextColor={
              theme === 'light' ? '#6b7280' : '#9ca3af'
            }
          />
          {touched.companyName && errors.companyName && (
            <Text className="text-red-500 text-sm">
              {errors.companyName}
            </Text>
          )}
        </View>

        {/* Number of Users (Pax) Selection */}
        <View className="mb-4 w-full">
          <Text
            className={`text-lg ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            } text-left`}
          >
            Number of Users (Pax)
          </Text>
          <View className="flex-row justify-between mt-2">
            {/* Example options: 1 Pax, 2-5 Pax, 6-10 Pax, 11+ Pax */}
            {['1 Pax', '2-5 Pax', '6-10 Pax', '11+ Pax'].map((option) => (
              <Pressable
                key={option}
                className={`flex-1 py-2 m-1 rounded-lg border-2 ${
                  values.pax === option
                    ? 'border-orange-500/90 bg-orange-500/30'
                    : `border-slate-300 ${
                        theme === 'light'
                          ? 'bg-slate-100'
                          : 'bg-slate-800'
                      }`
                }`}
                onPress={() => handleChange('pax')(option)}
              >
                <Text
                  className={`text-center text-lg ${
                    values.pax === option
                      ? 'text-orange-500'
                      : theme === 'light'
                      ? 'text-slate-800'
                      : 'text-slate-100'
                  }`}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
          {touched.pax && errors.pax && (
            <Text className="text-red-500 text-sm">
              {errors.pax}
            </Text>
          )}
        </View>

        {/* Package Selection */}
        <View className="mb-6 w-full">
          <Text
            className={`text-lg ${
              theme === 'light' ? 'text-slate-800' : 'text-slate-100'
            } text-left`}
          >
            Select Package
          </Text>
          <View className="flex-row justify-between mt-2">
            {/* Example packages: Basic, Full */}
            {['Basic', 'Full'].map((pkg) => (
              <Pressable
                key={pkg}
                className={`flex-1 py-2 m-1 rounded-lg border-2 ${
                  values.package === pkg
                    ? 'border-orange-500/90 bg-orange-500/30'
                    : `border-slate-300 ${
                        theme === 'light'
                          ? 'bg-slate-100'
                          : 'bg-slate-800'
                      }`
                }`}
                onPress={() => handleChange('package')(pkg)}
              >
                <Text
                  className={`text-center text-lg ${
                    values.package === pkg
                      ? 'text-orange-500'
                      : theme === 'light'
                      ? 'text-slate-800'
                      : 'text-slate-100'
                  }`}
                >
                  {pkg}
                </Text>
              </Pressable>
            ))}
          </View>
          {touched.package && errors.package && (
            <Text className="text-red-500 text-sm">
              {errors.package}
            </Text>
          )}
        </View>

        {/* Back Button */}
        <Pressable
          className="w-full py-4 rounded-lg mt-7 bg-slate-500/90"
          onPress={() => setCurrentStep(1)}
        >
          <Text className="text-white text-center text-lg font-medium">
            Back
          </Text>
        </Pressable>

        {/* Submit Button */}
        <Pressable
          className="w-full py-4 rounded-lg mt-4 bg-orange-500/90"
          onPress={() => formikProps.handleSubmit()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-center text-lg font-medium">
              Subscribe
            </Text>
          )}
        </Pressable>
      </>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          className={`flex-1 justify-center items-center px-6 ${
            theme === 'light' ? 'bg-white' : 'bg-slate-900'
          }`}
        >
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              confirmPassword: '',
              companyName: '',
              pax: '',
              package: '',
            }}
            validationSchema={
              currentStep === 1 ? StepOneSchema : StepTwoSchema
            }
            onSubmit={(values) => {
              if (currentStep === 1) {
                // Validate Step 1 and move to Step 2
                setCurrentStep(2);
              } else {
                // Handle final submission
                handleSignup(values);
              }
            }}
          >
            {(formikProps) =>
              currentStep === 1
                ? renderStepOne(formikProps)
                : renderStepTwo(formikProps)
            }
          </Formik>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default GetStarted;
