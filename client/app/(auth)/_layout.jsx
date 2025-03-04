// File: app/(auth)/_layout.jsx

import React from "react";
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="login-user"
        options={{
          title: "Login User",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="details-user"
        options={{
          title: "Registration User",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="details-company"
        options={{
          title: "Registration Company",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="pricing"
        options={{
          title: "Subscription Plans Pricing",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="payment"
        options={{
          title: "Subscription Plans Payment",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="upgrade-subscription"
        options={{
          title: "Upgrade Subscription",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
