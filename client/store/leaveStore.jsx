// File: store/leaveStore.jsx

import create from 'zustand';

const useLeaveStore = create((set) => ({
  leaves: [],
  loading: false,
  error: null,

  // Action to fetch leaves
  fetchLeaves: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('http://192.168.100.8:5000/api/admin/leaves', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        set({ leaves: data.data, loading: false });
      } else {
        set({ error: data.message || 'Failed to fetch leave requests.', loading: false });
      }
    } catch (error) {
      set({ error: 'An error occurred while fetching leave requests.', loading: false });
    }
  },

  // Action to approve a leave
  approveLeave: async (leaveId, token) => {
    try {
      const response = await fetch(`http://192.168.100.8:5000/api/admin/leaves/${leaveId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Update the specific leave status
        set((state) => ({
          leaves: state.leaves.map((leave) =>
            leave.id === leaveId ? { ...leave, status: 'Approved' } : leave
          ),
        }));
        return { success: true, message: data.message || 'Leave approved successfully.' };
      } else {
        return { success: false, message: data.message || 'Failed to approve leave.' };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred while approving the leave.' };
    }
  },

  // Action to reject a leave
  rejectLeave: async (leaveId, token) => {
    try {
      const response = await fetch(`http://192.168.100.8:5000/api/admin/leaves/${leaveId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        // Update the specific leave status
        set((state) => ({
          leaves: state.leaves.map((leave) =>
            leave.id === leaveId ? { ...leave, status: 'Rejected' } : leave
          ),
        }));
        return { success: true, message: data.message || 'Leave rejected successfully.' };
      } else {
        return { success: false, message: data.message || 'Failed to reject leave.' };
      }
    } catch (error) {
      return { success: false, message: 'An error occurred while rejecting the leave.' };
    }
  },
}));

export default useLeaveStore;
