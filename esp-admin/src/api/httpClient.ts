import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

/**
 * `.env`에 `VITE_DEBUG_API=true` 이면 브라우저 콘솔에 API 요청/응답(메서드 + 전체 URL) 로그.
 * Mock 모드에서는 `apiClient`를 쓰지 않으므로 로그도 나오지 않음.
 */
function shouldLogApiCalls(): boolean {
  return import.meta.env.VITE_DEBUG_API === 'true';
}

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
  if (shouldLogApiCalls()) {
    const method = (config.method ?? 'get').toUpperCase();
    const url = axios.getUri(config);
    console.log(`[API] → ${method} ${url}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (shouldLogApiCalls()) {
      const cfg = response.config;
      const method = (cfg.method ?? 'get').toUpperCase();
      const url = axios.getUri(cfg);
      console.log(`[API] ← ${response.status} ${method} ${url}`);
    }
    return response;
  },
  (error) => {
    if (shouldLogApiCalls() && error?.config) {
      const cfg = error.config as import('axios').InternalAxiosRequestConfig;
      const method = (cfg.method ?? 'get').toUpperCase();
      const url = axios.getUri(cfg);
      const status = error.response?.status ?? 'ERR';
      console.warn(`[API] ✗ ${status} ${method} ${url}`, error.message);
    }
    return Promise.reject(error);
  },
);

// Phase 2: 응답 인터셉터 — 공통 에러 코드(AUTH_TOKEN_EXPIRED 등), Refresh 흐름
