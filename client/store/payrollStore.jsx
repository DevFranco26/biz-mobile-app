// File: store/payrollStore.jsx

import create from 'zustand';

const usePayrollStore = create((set) => ({
  payrollData: [],
  loading: false,
  error: null,

  // Action to fetch payroll data
  fetchPayrollData: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://192.168.100.8:5000/api/admin/payroll', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set({ payrollData: data.data, loading: false });
      } else {
        set({ error: data.message || 'Failed to fetch payroll data.', loading: false });
      }
    } catch (error) {
      set({ error: 'An error occurred while fetching payroll data.', loading: false });
    }
  },

  // Action to mark payroll as paid
  markAsPaid: async (payrollId, token) => {
    try {
      const response = await fetch(`http://192.168.100.8:5000/api/admin/payroll/${payrollId}/mark-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Update the specific payroll status
        set((state) => ({
          payrollData: state.payrollData.map((payroll) =>
            payroll.id === payrollId ? { ...payroll, isPaid: true } : payroll
          ),
        }));
        return { success: true, message: data.message || 'Payroll marked as paid.' };
      } else {
        return { success: false, message: data.message || 'Failed to update payroll status.' };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred while updating payroll status.' };
    }
  },
}));

export default usePayrollStore;
