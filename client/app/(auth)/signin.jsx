import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/userStore';  // Import the user store
import { Ionicons } from '@expo/vector-icons';

const SigninSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password should be at least 6 characters').required('Password is required'),
});

const Signin = () => {
  const navigation = useNavigation();
  const { theme } = useThemeStore();
  const { setUser } = useUserStore();  // Get the setUser function from the user store

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
        // Ensure token and user data are available
        if (data.token && data.user) {
          // Store token and user data securely
          await SecureStore.setItemAsync('token', data.token);
          await SecureStore.setItemAsync('user', JSON.stringify(data.user));  // Store user data
  
          // Set the user data in the store
          setUser(data.user);
  
          navigation.navigate('(tabs)', { screen: 'home' });
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

  const containerStyle = theme === 'light' ? 'bg-slate-50' : 'bg-slate-800';
  const textStyle = theme === 'light' ? 'text-teal-950' : 'text-teal-400';
  const buttonStyle = theme === 'light' ? 'bg-teal-700' : 'bg-teal-600';
  const inputBgStyle = theme === 'light' ? 'bg-white' : 'bg-gray-700';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className={`flex-1 justify-center items-center p-6 ${containerStyle}`}>
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={SigninSchema}
            onSubmit={handleSignin}
          >
            {({ values, handleChange, handleBlur, handleSubmit, errors, touched }) => (
              <>
                <Text className={`text-3xl ${textStyle} font-medium text-center mb-8`}>
                  Sign in to Biz University
                </Text>

                <View className="mb-4 w-full">
                  <Text className={`text-lg ${textStyle} text-left`}>Email</Text>
                  <TextInput
                    className={`w-full p-4 my-2 rounded-lg ${inputBgStyle} ${theme === 'light' ? 'text-teal-950' : 'text-white'}`} 
                    keyboardType="email-address"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    selectionColor="#008080"
                  />
                  {touched.email && errors.email && (
                    <Text className="text-red-500 text-sm">{errors.email}</Text>
                  )}
                </View>

                <View className="mb-6 w-full">
                  <Text className={`text-lg ${textStyle} text-left`}>Password</Text>
                  <View className="relative">
                    <TextInput
                      className={`w-full p-4 my-2 rounded-lg ${inputBgStyle} ${theme === 'light' ? 'text-teal-950' : 'text-white'}`}
                      secureTextEntry={!passwordVisible}
                      value={values.password}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      selectionColor="#008080"
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
                        color={theme === 'light' ? '#000' : '#fff'}
                      />
                    </Pressable>
                  </View>
                  {touched.password && errors.password && (
                    <Text className="text-red-500 text-sm">{errors.password}</Text>
                  )}
                </View>

                <Pressable className={`w-full py-4 rounded-lg mt-7 ${buttonStyle}`} onPress={handleSubmit}>
                  <Text className="text-slate-50 text-center text-lg font-medium">Submit</Text>
                </Pressable>

                <Pressable onPress={() => Alert.alert('Forgot Password')}>
                  <Text className={`text-blue-500 text-sm mt-4 text-center ${theme === 'light' ? 'text-teal-700' : 'text-teal-400'}`}>
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
