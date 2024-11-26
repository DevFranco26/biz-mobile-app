import React from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { SafeAreaView } from 'react-native-safe-area-context';

const SigninSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password should be at least 6 characters').required('Password is required'),
});

const Signin = () => {
  const handleSignin = async (values) => {
    const { email, password } = values;

    try {
      const response = await fetch('https://your-api-endpoint.com/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Signed in successfully!');
      } else {
        Alert.alert('Error', data.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again later.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView className="flex-1 justify-center items-center p-6">
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={SigninSchema}
            onSubmit={handleSignin}
          >
            {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => (
              <>
                {/* Email Input */}
                <View className="mb-4 w-full ">
                  <Text className="text-3xl text-teal-950 font-medium text-center mb-8">Sign in to Biz University</Text>
                  <Text className="text-lg text-left text-teal-950">Email</Text>
                  <TextInput
                    className="w-full p-4 my-2 border border-gray-300 rounded-lg bg-white"
                    keyboardType="email-address"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    style={{ fontSize: 16 }}
                    selectionColor="#008080"
                  />
                  {touched.email && errors.email && (
                    <Text className="text-red-500 text-sm">{errors.email}</Text>
                  )}
                </View>

                {/* Password Input */}
                <View className="mb-6 w-full">
                  <Text className="text-lg text-left text-teal-950">Password</Text>
                  <TextInput
                    className="w-full p-4 my-2 border border-gray-300 rounded-lg bg-white"
                    secureTextEntry
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    style={{ fontSize: 16 }}
                    selectionColor="#008080"
                  />
                  {touched.password && errors.password && (
                    <Text className="text-red-500 text-sm">{errors.password}</Text>
                  )}
                </View>

                {/* Sign In Button */}
                <Pressable
                  className="w-full py-4 rounded-lg mt-7 bg-teal-700"
                  onPress={handleSubmit}
                >
                  <Text className="text-slate-50 text-center text-lg font-medium ">Submit</Text>
                </Pressable>

                {/* Forgot Password Link */}
                <Pressable onPress={() => Alert.alert('Forgot Password')}>
                  <Text className="text-blue-500 text-sm mt-4 text-center">Forgot Password?</Text>
                </Pressable>
              </>
            )}
          </Formik>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Signin;
