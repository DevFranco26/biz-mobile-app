// File: app/(auth)/_layout.jsx

import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>

      <Stack.Screen
        name="login-user"
        options={{
          title: 'Login User',
          headerShown: false,
        }}
      />

       <Stack.Screen
        name="registration-user"
        options={{
          title: 'Registration User',
          headerShown: false,
        }}
      />

        <Stack.Screen
        name="registration-company"
        options={{
          title: 'Registration Company',
          headerShown: false,
        }}
      />

    </Stack>
  );
}
