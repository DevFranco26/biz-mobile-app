// app/_layout.jsx
import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import "../global.css";
import { STRIPE_PUBLISHABLE_KEY } from "../config/constant";

export default function RootLayout() {
  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
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
