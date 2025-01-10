// File: app/(auth)/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>

      <Stack.Screen
        name="signin"
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />

       <Stack.Screen
        name="OnboardingStep1"
        options={{
          title: 'OnboardingStep1',
          headerShown: false,
        }}
      />

        <Stack.Screen
        name="OnboardingStep2"
        options={{
          title: 'OnboardingStep2',
          headerShown: false,
        }}
      />

    </Stack>
  );
}
