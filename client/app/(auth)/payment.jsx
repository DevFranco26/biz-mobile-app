// File: app/(auth)/payment.jsx
import React, { useState, useEffect } from "react";
import { View, Button, ActivityIndicator, Alert } from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useRouter } from "expo-router";
import useOnboardingStore from "../../store/globalOnboardingStore";
import { API_BASE_URL } from "../../config/constant";
import * as SecureStore from "expo-secure-store";
export default function PaymentPage() {
  const router = useRouter();
  const { selectedPlan, setPaymentStatus } = useOnboardingStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentSheetEnabled, setPaymentSheetEnabled] = useState(false);
  const fetchPaymentSheetParams = async () => {
    const response = await fetch(`${API_BASE_URL}/payment/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(selectedPlan.price * 100), planId: selectedPlan.id }),
    });
    const { paymentIntent, ephemeralKey, customer } = await response.json();
    return { paymentIntent, ephemeralKey, customer };
  };
  const initializePaymentSheet = async () => {
    setLoading(true);
    const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();
    const { error } = await initPaymentSheet({
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      paymentIntentClientSecret: paymentIntent,
      returnURL: "yourapp://stripe-redirect",
    });
    if (!error) {
      setPaymentSheetEnabled(true);
    } else {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };
  useEffect(() => {
    initializePaymentSheet();
  }, []);
  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      Alert.alert("Payment failed", error.message);
    } else {
      setPaymentStatus("paid");
      router.push("(auth)/details-user");
    }
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
      {loading ? <ActivityIndicator size="large" /> : <Button title="Pay Now" disabled={!paymentSheetEnabled} onPress={openPaymentSheet} />}
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}
