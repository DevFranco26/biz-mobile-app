import create from 'zustand';

const useUserStore = create((set) => ({
  user: null,  // Initial user state is null
  setUser: (user) => set({ user }),  // Action to set user data
  clearUser: () => set({ user: null }),  // Action to clear user data
}));

export default useUserStore;
