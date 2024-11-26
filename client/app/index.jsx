import React, { useState, useEffect } from 'react';
import { Text, View, Pressable, ScrollView, Image, StatusBar } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import bizImage1 from '../assets/images/biz-university-1.png';
import bizImage2 from '../assets/images/biz-university-2.png';
import bizImage3 from '../assets/images/biz-university-3.png';
import bizImage4 from '../assets/images/biz-university-4.png';
import bizImage5 from '../assets/images/biz-university-5.png';
import bizImage6 from '../assets/images/biz-university-6.png';
import useThemeStore from '../store/themeStore';
import { Ionicons } from '@expo/vector-icons'; 
import { FontAwesome5 } from '@expo/vector-icons'; 


export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken();
      setIsLoggedIn(!!token);
    };
    checkAuth();
  }, []);

  const getAuthToken = () => {
    return Promise.resolve("token");
  };

  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-white' : 'bg-slate-800'}`}>
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View className="flex-1 w-full justify-between min-h-[85vh] px-4">
          {/* Title */}
          <Text className={`text-3xl font-bold ${theme === 'light' ? 'text-teal-950' : 'text-teal-50'} p-5`}>
            Biz University
          </Text>

          {/* Images */}
          <View className="flex-row flex-wrap justify-between p-5 border-teal-950 rounded-xl">
            <Image
              source={bizImage1}
              className={`w-[10rem] h-[10rem] mb-5 rounded-3xl border p-2 ${theme === 'light' ? ' border-teal-950/40': 'border-teal-800'}`}
            />
            <Image
              source={bizImage2}
              className={`w-[10rem] h-[10rem] mb-5 rounded-3xl border p-2 ${theme === 'light' ? ' border-teal-950/40': 'border-teal-800'}`}
            />
            <Image
              source={bizImage3}
              className={`w-[10rem] h-[10rem] mb-5 rounded-3xl border p-2 ${theme === 'light' ? ' border-teal-950/40': 'border-teal-800'}`}
            />
            <Image
              source={bizImage4}
              className={`w-[10rem] h-[10rem] mb-5 rounded-3xl border p-2 ${theme === 'light' ? ' border-teal-950/40': 'border-teal-800'}`}
            />
            <Image
              source={bizImage5}
              className={`w-[10rem] h-[10rem] mb-5 rounded-3xl border p-2 ${theme === 'light' ? ' border-teal-950/40': 'border-teal-800'}`}
            />
            <Image
              source={bizImage6}
              className={`w-[10rem] h-[10rem] mb-5 rounded-3xl border p-2 ${theme === 'light' ? ' border-teal-950/40': 'border-teal-800'}`}
            />
          </View>

          {/* Conditional Button */}
          {isLoggedIn ? (
            <Link href="/home" asChild>
              <Pressable
                className={`px-2 py-4 rounded-lg bg-teal-700 mt-5 text-nowrap max-w-[8rem] min-w-[8rem] mx-auto mb-10`}>
                <Text className="text-white font-medium text-center">Go to Home</Text>
              </Pressable>
            </Link>
          ) : (
            <Link href="/signin" asChild>
              <Pressable
                className={`px-2 py-4 rounded-lg bg-teal-700 mt-5 text-nowrap max-w-[8rem] min-w-[8rem] mx-auto mb-10`}>
                <Text className="text-white font-medium text-center">Sign In</Text>
              </Pressable>
            </Link>
          )}
          
          {/* Toggle Theme Button */}
          <Pressable
            onPress={toggleTheme}
            className={`absolute top-5 right-5 p-2 rounded-full ${theme === 'light' ? 'bg-teal-700' : 'bg-teal-700'}`}>
            {theme === 'light' ? (
              <Ionicons name="partly-sunny-sharp" size={20} color={'white'} />
            ) : (
              <FontAwesome5 name="cloud-moon" size={20} color={'white'} />
            )}
          </Pressable>
        </View>
      </ScrollView>
      <StatusBar
        backgroundColor={theme === 'dark' ? 'black' : '#f8fafc'}
        style={theme === 'dark' ? '#f8fafc' : 'dark'}
      />
    </SafeAreaView>
  );
}
