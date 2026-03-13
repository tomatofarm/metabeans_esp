import { create } from 'zustand';
import type { LoginUser, UserRole } from '../types/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  user: LoginUser | null;
  accessToken: string | null;
  login: (user: LoginUser, token: string) => void;
  logout: () => void;
  getRole: () => UserRole | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  accessToken: null,

  login: (user, token) => {
    set({ isAuthenticated: true, user, accessToken: token });
  },

  logout: () => {
    set({ isAuthenticated: false, user: null, accessToken: null });
  },

  getRole: () => {
    return get().user?.role ?? null;
  },
}));
