import { create } from 'zustand';
import type { LoginUser, UserRole } from '../types/auth.types';
import { clearStoredSession, saveSessionAfterLogin } from '../lib/authSessionStorage';

interface AuthState {
  /** `runAuthRestore` 완료 전까지 `false` — 라우트는 로그인으로 보내지 말고 대기 */
  authReady: boolean;
  isAuthenticated: boolean;
  user: LoginUser | null;
  accessToken: string | null;
  setAuthReady: (ready: boolean) => void;
  login: (user: LoginUser, token: string) => void;
  /** 액세스 토큰만 교체 (401 후 `/auth/refresh` 성공 시) */
  setAccessToken: (token: string) => void;
  logout: () => void;
  getRole: () => UserRole | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  authReady: false,
  isAuthenticated: false,
  user: null,
  accessToken: null,

  setAuthReady: (ready) => {
    set({ authReady: ready });
  },

  login: (user, token) => {
    saveSessionAfterLogin(user, token);
    set({ isAuthenticated: true, user, accessToken: token });
  },

  setAccessToken: (token) => {
    set({ accessToken: token });
  },

  logout: () => {
    clearStoredSession();
    set({ isAuthenticated: false, user: null, accessToken: null });
  },

  getRole: () => {
    return get().user?.role ?? null;
  },
}));
