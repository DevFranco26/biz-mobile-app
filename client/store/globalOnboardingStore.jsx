// File: store/globalOnboardingStore.js
import { create } from 'zustand'; 
// ^ If using zustand v4+
// If you must use older, do: import create from 'zustand';

const useOnboardingStore = create((set) => ({
  step1Data: {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  step2Data: {
    companyName: '',
    pax: '',
    subscriptionPlanId: null,
  },

  setStep1Data: (data) =>
    set((state) => ({
      step1Data: { ...state.step1Data, ...data },
    })),

  setStep2Data: (data) =>
    set((state) => ({
      step2Data: { ...state.step2Data, ...data },
    })),

  resetOnboardingData: () =>
    set(() => ({
      step1Data: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      step2Data: {
        companyName: '',
        pax: '',
        subscriptionPlanId: null,
      },
    })),
}));

export default useOnboardingStore;
