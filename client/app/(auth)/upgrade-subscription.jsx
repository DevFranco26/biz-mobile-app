// File: client/app/(auth)/upgrade-subscription.jsx
import React, { useState, useEffect } from "react";
import { View, Button, ActivityIndicator, Alert, Text } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "../../config/constant";
import useSubscriptionStore from "../../store/subscriptionStore";
import * as SecureStore from "expo-secure-store";

export default function UpgradeSubscription() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Retrieve plan details passed from the modal in manage-mysubscriptions
  const { planId, planName, planPrice } = params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);
  const { upgradeSubscription } = useSubscriptionStore();
  const [token, setToken] = useState(null);

  const fetchPaymentSheetParams = async () => {
    try {
      console.log("Fetching payment params for upgrade:", { planId, planName, planPrice });
      const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(Number(planPrice) * 100),
          planId: planId,
          // Optionally, include a flag such as isUpgrade: true if your backend requires it
        }),
      });
      const data = await response.json();
      console.log("Payment sheet params:", data);
      if (!data.paymentIntent || !data.ephemeralKey || !data.customer) {
        throw new Error("Missing payment parameters from backend.");
      }
      return {
        paymentIntent: data.paymentIntent,
        ephemeralKey: data.ephemeralKey,
        customer: data.customer,
      };
    } catch (error) {
      console.error("Error fetching payment sheet params:", error);
      Alert.alert("Error", "Unable to fetch payment parameters.");
      return {};
    }
  };

  const initializePaymentSheet = async () => {
    setLoading(true);
    const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();
    if (!paymentIntent || !ephemeralKey || !customer) {
      setLoading(false);
      return;
    }
    const { error } = await initPaymentSheet({
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      returnURL: "yourapp://stripe-redirect",
    });
    if (error) {
      console.error("Error initializing payment sheet:", error);
      Alert.alert("Error", error.message);
    } else {
      setPaymentSheetEnabled(true);
      console.log("Payment sheet initialized successfully.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const getToken = async () => {
      const storedToken = await SecureStore.getItemAsync("token");
      setToken(storedToken);
    };
    getToken();
    initializePaymentSheet();
  }, []);

  const openPaymentSheet = async () => {
    console.log("Presenting payment sheet for upgrade...");
    const { error } = await presentPaymentSheet();
    if (error) {
      console.error("Payment error:", error);
      Alert.alert("Payment failed", error.message);
    } else {
      // After payment succeeds, call the upgrade endpoint to update the subscription record
      if (!token) {
        Alert.alert("Error", "Authentication token not found.");
        return;
      }
      const result = await upgradeSubscription(token, planId, "stripe");
      if (result.success) {
        Alert.alert("Success", "Your subscription has been upgraded.");
        router.push("/(tabs)/(settings)/(management)/manage-mysubscriptions");
      } else {
        Alert.alert("Error", "Subscription upgrade failed.");
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
      <Text style={{ marginBottom: 20, fontSize: 18 }}>
        Upgrade Subscription to: {planName} (${planPrice})
      </Text>
      {loading ? <ActivityIndicator size="large" /> : <Button title="Pay Now" disabled={!paymentSheetEnabled} onPress={openPaymentSheet} />}
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}
