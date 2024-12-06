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
    </Stack>
  );
};

export default AuthLayout;
