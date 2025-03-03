// app/_layout.jsx
import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import "../global.css";

export default function RootLayout() {
  return (
    <StripeProvider publishableKey="pk_test_51Oh4bHEjdw0xVgOBD5Tcqst7U3RHtR4Axv7Qd2hHTuJCjIq9UGBqsB7Ct300SxMtFZP0uxCZRZDJQN0MbE04rMFH00eRxVj3w3">
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: "Biz University",
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            title: "Biz University",
          }}
        />
        <Stack.Screen
          name="(auth)"
          options={{
            headerShown: false,
            title: "Biz University",
          }}
        />
      </Stack>
    </StripeProvider>
  );
}
