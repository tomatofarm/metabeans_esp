import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

/**
 * Phase 2 실제 REST 호출용 Axios 인스턴스.
 * 현재 Mock 기반 `*.api.ts`는 이 클라이언트를 사용하지 않음 — 연동 시 `queryFn`에서 `apiClient` 사용.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Phase 2: 응답 인터셉터 — 공통 에러 코드(AUTH_TOKEN_EXPIRED 등), Refresh 흐름
