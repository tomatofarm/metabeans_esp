import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

type RetryableConfig = InternalAxiosRequestConfig & { _espAuthRetry?: boolean };

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

/** 인터셉터를 타지 않는 클라이언트 — refresh 전용(무한 루프 방지) */
const refreshClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

async function fetchNewAccessToken(): Promise<string> {
  const { data } = await refreshClient.post<{ success: boolean; data?: { accessToken: string } }>(
    '/auth/refresh',
    {},
  );
  if (!data.success || !data.data?.accessToken) {
    throw new Error('REFRESH_FAILED');
  }
  return data.data.accessToken;
}

function shouldSkipAuthRefresh(cfg: InternalAxiosRequestConfig): boolean {
  const url = cfg.url ?? '';
  if (url.includes('/auth/refresh')) return true;
  if (url.includes('/auth/login') && (cfg.method ?? 'get').toLowerCase() === 'post') return true;
  return false;
}

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
  baseURL,
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
  async (error: AxiosError) => {
    if (shouldLogApiCalls() && error?.config) {
      const cfg = error.config;
      const method = (cfg.method ?? 'get').toUpperCase();
      const url = axios.getUri(cfg);
      const status = error.response?.status ?? 'ERR';
      console.warn(`[API] ✗ ${status} ${method} ${url}`, error.message);
    }

    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    if (
      status === 401 &&
      original &&
      !original._espAuthRetry &&
      !shouldSkipAuthRefresh(original) &&
      baseURL.trim() !== ''
    ) {
      original._espAuthRetry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = fetchNewAccessToken()
            .then((token) => {
              useAuthStore.getState().setAccessToken(token);
              return token;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const newToken = await refreshPromise;
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.assign('/login');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
