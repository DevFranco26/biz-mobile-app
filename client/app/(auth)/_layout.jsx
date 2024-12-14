// File: app/(auth)/_layout.jsx

import { Stack } from 'expo-router';

const AuthLayout = () => {
  return (
    <Stack>
      {/* Sign-in screen */}
      <Stack.Screen
        name="signin"
        options={{
          title: 'Sign In',
          headerShown: false,
        }}
      />
       <Stack.Screen
        name="get-started"
        options={{
          title: 'Get Started',
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default AuthLayout;
