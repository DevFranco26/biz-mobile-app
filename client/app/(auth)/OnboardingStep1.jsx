import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import useThemeStore from '../../store/themeStore';
import useOnboardingStore from '../../store/globalOnboardingStore';

// Validation schema
const StepOneSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'Too short')
    .max(50, 'Too long')
    .required('First name is required'),
  middleName: Yup.string().max(50, 'Too long'),
  lastName: Yup.string()
    .min(2, 'Too short')
    .max(50, 'Too long')
    .required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string()
    .min(10, 'Phone number is too short')
    .max(15, 'Phone number is too long')
    .required('Phone number is required'),
  password: Yup.string()
    .min(6, 'Min 6 chars')
    .matches(/[a-z]/, 'At least one lowercase')
    .matches(/[A-Z]/, 'At least one uppercase')
    .matches(/\d/, 'At least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
});

export default function OnboardingStep1() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { step1Data, setStep1Data } = useOnboardingStore();

  const isLightTheme = theme === 'light';
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleNext = (values) => {
    setStep1Data(values);
    router.push('(auth)/OnboardingStep2');
  };

  return (
    <View className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}>
      <StatusBar barStyle={isLightTheme ? 'dark-content' : 'light-content'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            className="flex-grow pt-5"
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 items-center px-6 pb-10">
              <Formik
                initialValues={step1Data}
                validationSchema={StepOneSchema}
                onSubmit={handleNext}
              >
                {({
                  values,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  errors,
                  touched,
                }) => (
                  <>
                    <Text
                      className={`text-4xl font-extrabold text-center mb-8 ${
                        isLightTheme ? 'text-slate-800' : 'text-slate-100'
                      }`}
                    >
                      Get Started
                    </Text>

                    {/* First Name */}
                    <View className="mb-4 w-full">
                      <Text
                        className={`text-base mb-1 ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        First Name <Text className="text-red-500">*</Text>
                      </Text>
                      <TextInput
                        className={`w-full p-4 rounded-lg ${
                          isLightTheme
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                        placeholder="Enter your first name"
                        placeholderTextColor={
                          isLightTheme ? '#6b7280' : '#9ca3af'
                        }
                        value={values.firstName}
                        onChangeText={handleChange('firstName')}
                        onBlur={handleBlur('firstName')}
                      />
                      {touched.firstName && errors.firstName && (
                        <Text className="text-red-500 text-sm">
                          {errors.firstName}
                        </Text>
                      )}
                    </View>

                    {/* Middle Name */}
                    <View className="mb-4 w-full">
                      <Text
                        className={`text-base mb-1 ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        Middle Name
                      </Text>
                      <TextInput
                        className={`w-full p-4 rounded-lg ${
                          isLightTheme
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                        placeholder="Enter your middle name (optional)"
                        placeholderTextColor={
                          isLightTheme ? '#6b7280' : '#9ca3af'
                        }
                        value={values.middleName}
                        onChangeText={handleChange('middleName')}
                        onBlur={handleBlur('middleName')}
                      />
                      {touched.middleName && errors.middleName && (
                        <Text className="text-red-500 text-sm">
                          {errors.middleName}
                        </Text>
                      )}
                    </View>

                    {/* Last Name */}
                    <View className="mb-4 w-full">
                      <Text
                        className={`text-base mb-1 ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        Last Name <Text className="text-red-500">*</Text>
                      </Text>
                      <TextInput
                        className={`w-full p-4 rounded-lg ${
                          isLightTheme
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                        placeholder="Enter your last name"
                        placeholderTextColor={
                          isLightTheme ? '#6b7280' : '#9ca3af'
                        }
                        value={values.lastName}
                        onChangeText={handleChange('lastName')}
                        onBlur={handleBlur('lastName')}
                      />
                      {touched.lastName && errors.lastName && (
                        <Text className="text-red-500 text-sm">
                          {errors.lastName}
                        </Text>
                      )}
                    </View>

                    {/* Email */}
                    <View className="mb-4 w-full">
                      <Text
                        className={`text-base mb-1 ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        Email <Text className="text-red-500">*</Text>
                      </Text>
                      <TextInput
                        className={`w-full p-4 rounded-lg ${
                          isLightTheme
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                        placeholder="Enter your email"
                        placeholderTextColor={
                          isLightTheme ? '#6b7280' : '#9ca3af'
                        }
                        keyboardType="email-address"
                        value={values.email}
                        onChangeText={handleChange('email')}
                        onBlur={handleBlur('email')}
                      />
                      {touched.email && errors.email && (
                        <Text className="text-red-500 text-sm">
                          {errors.email}
                        </Text>
                      )}
                    </View>

                    {/* Phone */}
                    <View className="mb-4 w-full">
                      <Text
                        className={`text-base mb-1 ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        Phone Number <Text className="text-red-500">*</Text>
                      </Text>
                      <TextInput
                        className={`w-full p-4 rounded-lg ${
                          isLightTheme
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                        placeholder="Enter your phone number"
                        placeholderTextColor={
                          isLightTheme ? '#6b7280' : '#9ca3af'
                        }
                        keyboardType="phone-pad"
                        value={values.phone}
                        onChangeText={handleChange('phone')}
                        onBlur={handleBlur('phone')}
                      />
                      {touched.phone && errors.phone && (
                        <Text className="text-red-500 text-sm">
                          {errors.phone}
                        </Text>
                      )}
                    </View>

                    {/* Password */}
                    <View className="mb-4 w-full">
                      <Text
                        className={`text-base mb-1 ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        Password <Text className="text-red-500">*</Text>
                      </Text>
                      <View className="relative">
                        <TextInput
                          className={`w-full p-4 rounded-lg ${
                            isLightTheme
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-slate-800 text-slate-100'
                          }`}
                          placeholder="Enter your password"
                          placeholderTextColor={
                            isLightTheme ? '#6b7280' : '#9ca3af'
                          }
                          secureTextEntry={!passwordVisible}
                          value={values.password}
                          onChangeText={handleChange('password')}
                          onBlur={handleBlur('password')}
                        />
                        <Pressable
                          onPress={() => setPasswordVisible(!passwordVisible)}
                          className="absolute right-3 top-4"
                        >
                          <Ionicons
                            name={passwordVisible ? 'eye-off' : 'eye'}
                            size={24}
                            color={isLightTheme ? '#6b7280' : '#9ca3af'}
                          />
                        </Pressable>
                      </View>
                      {touched.password && errors.password && (
                        <Text className="text-red-500 text-sm">
                          {errors.password}
                        </Text>
                      )}
                    </View>

                    {/* Confirm Password */}
                    <View className="mb-6 w-full">
                      <Text
                        className={`text-base mb-1 ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        Confirm Password <Text className="text-red-500">*</Text>
                      </Text>
                      <View className="relative">
                        <TextInput
                          className={`w-full p-4 rounded-lg ${
                            isLightTheme
                              ? 'bg-slate-100 text-slate-800'
                              : 'bg-slate-800 text-slate-100'
                          }`}
                          placeholder="Confirm your password"
                          placeholderTextColor={
                            isLightTheme ? '#6b7280' : '#9ca3af'
                          }
                          secureTextEntry={!confirmPasswordVisible}
                          value={values.confirmPassword}
                          onChangeText={handleChange('confirmPassword')}
                          onBlur={handleBlur('confirmPassword')}
                        />
                        <Pressable
                          onPress={() =>
                            setConfirmPasswordVisible(!confirmPasswordVisible)
                          }
                          className="absolute right-3 top-4"
                        >
                          <Ionicons
                            name={confirmPasswordVisible ? 'eye-off' : 'eye'}
                            size={24}
                            color={isLightTheme ? '#6b7280' : '#9ca3af'}
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
                      className="w-full py-4 rounded-lg mt-2 bg-orange-500/90"
                      onPress={handleSubmit}
                    >
                      <Text className="text-white text-center text-base font-semibold">
                        Next
                      </Text>
                    </Pressable>

                    {/* Back to Sign In */}
                    <Pressable
                      className="w-full py-4 rounded-lg mt-4 border-2 border-orange-500/90"
                      onPress={() => router.replace('(auth)/signin')}
                    >
                      <Text className="text-orange-500/90 text-center text-base font-semibold">
                        Back to Sign In
                      </Text>
                    </Pressable>
                  </>
                )}
              </Formik>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}
