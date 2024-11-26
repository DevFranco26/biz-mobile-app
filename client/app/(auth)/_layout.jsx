import { Stack } from "expo-router";
import React from 'react'

const AuthLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="signin"
        options={{
          title: "Sign in",
          headerShown: false
        }}
      />
    </Stack>
    
  )
}

export default AuthLayout