// File: app/_layout.jsx

import { Stack } from 'expo-router';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <Stack>
        {/* Entry point of the app */}
        <Stack.Screen
          name="index"
          options={{
            title: 'Biz University',
            headerShown: false,
          }}
        />
        {/* Tab navigation screens */}
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            title: 'Biz University',
          }}
        />
        {/* Authentication screens */}
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            title: 'Biz University',
          }}
        />
      </Stack>
    </>
  );
}
