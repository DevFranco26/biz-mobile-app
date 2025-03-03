// File: store/globalOnboardingStore.js
import { create } from "zustand";

const useOnboardingStore = create((set) => ({
  step1Data: {
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  },
  step2Data: {
    companyName: "",
    country: "USA",
    currency: "USD",
    language: "en",
  },
  selectedPlan: null,
  paymentStatus: "unpaid",

  setStep1Data: (data) =>
    set((state) => ({
      step1Data: { ...state.step1Data, ...data },
    })),

  setStep2Data: (data) =>
    set((state) => ({
      step2Data: { ...state.step2Data, ...data },
    })),

  setSelectedPlan: (plan) => set({ selectedPlan: plan }),

  setPaymentStatus: (status) => set({ paymentStatus: status }),

  resetOnboardingData: () =>
    set(() => ({
      step1Data: {
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      },
      step2Data: {
        companyName: "",
        country: "USA",
        currency: "USD",
        language: "en",
      },
      selectedPlan: null,
      paymentStatus: "unpaid",
    })),
}));

export default useOnboardingStore;
