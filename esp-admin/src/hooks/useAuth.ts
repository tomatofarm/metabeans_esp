import { useAuthStore } from '../stores/authStore';

/**
 * 인증 관련 훅 (Phase 1: Mock 기반)
 */
export function useAuth() {
  const { isAuthenticated, user, accessToken, login, logout } = useAuthStore();

  return {
    isAuthenticated,
    user,
    accessToken,
    role: user?.role ?? null,
    storeIds: user?.storeIds ?? [],
    login,
    logout,
  };
}
