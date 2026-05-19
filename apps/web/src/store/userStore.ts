import { create } from 'zustand';
import type { User } from '@ludo/shared';

interface UserStore {
  user: User | null;
  balance: number;
  isLoading: boolean;
  setUser: (user: User, balance: number) => void;
  updateBalance: (balance: number) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  balance: 0,
  isLoading: true,
  setUser: (user, balance) => set({ user, balance, isLoading: false }),
  updateBalance: (balance) => set({ balance }),
  clearUser: () => set({ user: null, balance: 0, isLoading: false }),
}));
