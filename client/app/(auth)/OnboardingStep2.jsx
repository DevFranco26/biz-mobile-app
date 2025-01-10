import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/userStore';
import useOnboardingStore from '../../store/globalOnboardingStore';

const API_BASE_URL = 'http://192.168.100.8:5000/api';

/** Validation for Step 2 form */
const StepTwoSchema = Yup.object().shape({
  companyName: Yup.string().min(2).max(100).required('Company name is required'),
});

export default function OnboardingStep2() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';

  const { setUser } = useUserStore();
  const { step1Data, step2Data, setStep2Data, resetOnboardingData } =
    useOnboardingStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // For Step 2, we no longer show plan choices or pax. We force them to:
  //   { pax: '1', subscriptionPlanId: '1' } (the "Free" plan).
  // (If needed, adjust the ID to match your server’s free plan.)
  const handleSignup = async (values) => {
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: step1Data.firstName,
        middleName: step1Data.middleName,
        lastName: step1Data.lastName,
        email: step1Data.email,
        password: step1Data.password,
        phone: step1Data.phone,
        companyName: values.companyName,
        // Force these defaults:
        pax: '1',
        subscriptionPlanId: '1', // the "Free" plan ID
      };

      const response = await fetch(`${API_BASE_URL}/auth/get-started`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        if (data.token && data.user) {
          await SecureStore.setItemAsync('token', data.token);
          await SecureStore.setItemAsync('user', JSON.stringify(data.user));
          setUser(data.user);

          Alert.alert('Success', 'Account and Company created successfully!', [
            {
              text: 'OK',
              onPress: () => {
                resetOnboardingData();
                router.replace('(tabs)/profile');
              },
            },
          ]);
        } else {
          Alert.alert('Error', 'Missing token or user data in response.');
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to create account.');
      }
    } catch (error) {
      console.error('OnboardingStep2 Error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isLightTheme ? 'bg-white' : 'bg-slate-900'}`}
    >
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
                initialValues={step2Data}
                validationSchema={StepTwoSchema}
                onSubmit={(values) => {
                  setStep2Data(values);
                  handleSignup(values);
                }}
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
                      Company Details
                    </Text>

                    {/* Company Name */}
                    <View className="mb-6 w-full">
                      <Text
                        className={`text-base mb-1 ${
                          isLightTheme ? 'text-slate-800' : 'text-slate-200'
                        }`}
                      >
                        Company Name <Text className="text-red-500">*</Text>
                      </Text>
                      <TextInput
                        className={`w-full p-4 rounded-lg ${
                          isLightTheme
                            ? 'bg-slate-100 text-slate-800'
                            : 'bg-slate-800 text-slate-100'
                        }`}
                        placeholder="Enter your company name"
                        placeholderTextColor={
                          isLightTheme ? '#6b7280' : '#9ca3af'
                        }
                        value={values.companyName}
                        onChangeText={handleChange('companyName')}
                        onBlur={handleBlur('companyName')}
                      />
                      {touched.companyName && errors.companyName && (
                        <Text className="text-red-500 text-sm">
                          {errors.companyName}
                        </Text>
                      )}
                    </View>

                    {/* Back Button */}
                    <Pressable
                      className="w-full py-4 rounded-lg bg-slate-600/90"
                      onPress={() => router.back()}
                      disabled={isSubmitting}
                    >
                      <Text className="text-white text-center text-base font-semibold">
                        Back
                      </Text>
                    </Pressable>

                    {/* Submit / Subscribe Button */}
                    <Pressable
                      className="w-full py-4 rounded-lg mt-4 bg-orange-500/90"
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text className="text-white text-center text-base font-semibold">
                          Subscribe
                        </Text>
                      )}
                    </Pressable>
                  </>
                )}
              </Formik>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
