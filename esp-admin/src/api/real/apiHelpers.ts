import type { AxiosError } from 'axios';
import { apiClient } from '../httpClient';

type ApiSuccess<T> = { success: true; data: T };
type ApiFailBody = { success: false; error: { code: string; message: string; details: unknown } };

function isApiFailBody(x: unknown): x is ApiFailBody {
  return (
    typeof x === 'object' &&
    x !== null &&
    'success' in x &&
    (x as ApiFailBody).success === false &&
    'error' in x &&
    typeof (x as ApiFailBody).error?.message === 'string'
  );
}

function unwrap<T>(body: unknown): T {
  if (typeof body === 'object' && body !== null && 'success' in body && (body as ApiSuccess<T>).success === true) {
    return (body as ApiSuccess<T>).data;
  }
  if (isApiFailBody(body)) {
    throw new Error(body.error.message);
  }
  throw new Error('서버 응답 형식이 올바르지 않습니다.');
}

function axiosErrorMessage(err: unknown): string {
  const ax = err as AxiosError<unknown>;
  const data = ax.response?.data;
  if (isApiFailBody(data)) return data.error.message;
  if (ax.message) return ax.message;
  return '요청에 실패했습니다.';
}

/** Axios 실패 시 `status`(HTTP 코드)를 보존 — React Query에서 403 재시도 생략 등에 사용 */
export class EspApiRequestError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'EspApiRequestError';
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function throwFromAxios(e: unknown): never {
  const ax = e as AxiosError<unknown>;
  throw new EspApiRequestError(axiosErrorMessage(e), ax.response?.status);
}

export async function apiRequest<T>(cfg: {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  url: string;
  data?: unknown;
}): Promise<T> {
  try {
    const res = await apiClient.request<{ data: unknown }>({
      method: cfg.method,
      url: cfg.url,
      ...(['get', 'delete'].includes(cfg.method) ? {} : { data: cfg.data }),
    });
    return unwrap<T>(res.data);
  } catch (e) {
    const ax = e as AxiosError<unknown>;
    if (ax.response?.data) {
      try {
        return unwrap<T>(ax.response.data);
      } catch {
        throwFromAxios(e);
      }
    }
    throwFromAxios(e);
  }
}

type ApiSuccessEnvelope<T> = { success: true; data: T; meta?: Record<string, unknown> };

function unwrapEnvelope<T>(body: unknown): ApiSuccessEnvelope<T> {
  if (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    (body as ApiSuccessEnvelope<T>).success === true &&
    'data' in body
  ) {
    return body as ApiSuccessEnvelope<T>;
  }
  if (isApiFailBody(body)) {
    throw new Error(body.error.message);
  }
  throw new Error('서버 응답 형식이 올바르지 않습니다.');
}

/** `ok(res, data, meta)` 형태 — `data`와 `meta`를 함께 쓸 때 */
export async function apiRequestWithMeta<T>(cfg: {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  url: string;
  data?: unknown;
}): Promise<{ data: T; meta?: Record<string, unknown> }> {
  try {
    const res = await apiClient.request<unknown>({
      method: cfg.method,
      url: cfg.url,
      ...(['get', 'delete'].includes(cfg.method) ? {} : { data: cfg.data }),
    });
    const env = unwrapEnvelope<T>(res.data);
    return { data: env.data, meta: env.meta };
  } catch (e) {
    const ax = e as AxiosError<unknown>;
    if (ax.response?.data) {
      try {
        const env = unwrapEnvelope<T>(ax.response.data);
        return { data: env.data, meta: env.meta };
      } catch {
        throwFromAxios(e);
      }
    }
    throwFromAxios(e);
  }
}
