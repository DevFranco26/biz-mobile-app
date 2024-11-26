import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ViewLogs from '../../components/viewLogs';
import useThemeStore from '../../store/themeStore';

const Shifts = () => {
  const { theme } = useThemeStore();
  const [isTimeIn, setIsTimeIn] = useState(true);
  const [shiftLogs, setShiftLogs] = useState([]);
  const [time, setTime] = useState(0);
  const [timer, setTimer] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-CA'); 
  };

  const updateTime = () => {
    setTime((prevTime) => prevTime + 1);
  };

  const handleShiftAction = () => {
    const currentTime = new Date().toLocaleTimeString();
    const currentDate = formatDate(new Date());
    const actionType = isTimeIn ? 'Time-In' : 'Time-Out';

    setShiftLogs((prevLogs) => [
      ...prevLogs,
      { id: Date.now().toString(), type: actionType, time: currentTime, date: currentDate },
    ]);

    if (isTimeIn) {
      const intervalId = setInterval(updateTime, 1000);
      setTimer(intervalId);
    } else {
      clearInterval(timer);
      setTime(0);
    }

    setIsTimeIn(!isTimeIn);
  };

  useEffect(() => {
    const today = formatDate(new Date());
    setCurrentDate(today);
  }, []);

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  if (showLogs) {
    return <ViewLogs shiftLogs={shiftLogs} onBack={() => setShowLogs(false)} />;
  }

  return (
    <SafeAreaView className={`h-full ${theme === 'light' ? 'bg-slate-50' : 'bg-slate-800 flex-1'}`}>
      <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1, paddingBottom: 0 }}>
        {/* Header */}
        <View className="bg-teal-700 rounded-xl p-6 mb-6">
          <Text className="text-2xl font-bold text-white mb-2">Shifts</Text>
          <Text className="text-white text-base">Today: {currentDate}</Text>
        </View>

        {/* Clock Section */}
        <View className="flex-1 justify-center items-center mb-6 gap-4">
          <Text className={`text-6xl tracking-widest font-extrabold ${theme === 'light' ? 'text-slate-700': 'text-teal-700'}`}>
            {formatTime(time)}
          </Text>
          <Text className="text-2xl font-normal text-slate-700">
            {isTimeIn ? `You're off the clock.` : `You're on the clock.`}
          </Text>
        </View>

        <View className="mb-6">
          {/* Time-In/Time-Out Button */}
          <Pressable
            className="bg-teal-700 py-4 px-5 rounded-lg w-full mb-4" 
            onPress={handleShiftAction}
          >
            <Text className=" text-center text-white">
              {isTimeIn ? 'Time In' : 'Time Out'}
            </Text>
          </Pressable>

          <Pressable
            className={` py-4 px-5 rounded-lg w-full ${theme === 'light' ? 'bg-white': 'bg-slate-700'}`}
            onPress={() => setShowLogs(true)}
          >
            <Text className={`${theme === 'light'? 'text-slate-800': 'text-slate-400' } text-center`}>
              View Logs
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <StatusBar
        backgroundColor={theme === 'dark' ? 'black' : '#f8fafc'}
        style={theme === 'dark' ? '#f8fafc' : 'dark'}
      />
    </SafeAreaView>
  );
};

export default Shifts;
