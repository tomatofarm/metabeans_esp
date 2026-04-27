import { fetchNewAccessToken } from '../api/httpClient';
import { getCurrentUser } from '../api/auth.api';
import { useAuthStore } from '../stores/authStore';
import type { LoginUser } from '../types/auth.types';
import {
  isMockApiMode,
  loadStoredSession,
  clearStoredSession,
} from '../lib/authSessionStorage';

/**
 * 앱 첫 부팅 시: 실 API — refresh 쿠키로 access + GET /auth/me(실패 시 session `user` 백업).
 * Mock — sessionStorage에 저장한 user+token 복원.
 */
export async function runAuthRestore(): Promise<void> {
  const { login, setAccessToken, logout } = useAuthStore.getState();

  if (isMockApiMode()) {
    const snap = loadStoredSession();
    if (snap?.mode === 'mock') {
      login(snap.user, snap.accessToken);
    }
    return;
  }

  const base = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
  if (!base) {
    return;
  }

  try {
    const token = await fetchNewAccessToken();
    setAccessToken(token);
    let user: LoginUser | null = null;
    try {
      user = await getCurrentUser();
    } catch {
      const snap = loadStoredSession();
      if (snap?.mode === 'real') {
        user = snap.user;
      }
    }
    if (user) {
      login(user, token);
    } else {
      clearStoredSession();
      logout();
    }
  } catch {
    clearStoredSession();
  }
}
