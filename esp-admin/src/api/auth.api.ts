/**
 * 인증·회원가입 — `VITE_API_BASE_URL` 설정 + `VITE_USE_MOCK_API !== 'true'` 이면 백엔드 연동 (`auth.real.ts`).
 * Base: `{VITE_API_BASE_URL}` (= API_BASE_PATH `/api/v1` 포함)
 *
 * | 함수 | Method | 백엔드 경로 |
 * |------|--------|-------------|
 * | login | POST | /auth/login |
 * | logout | POST | /auth/logout |
 * | passwordResetRequest | POST | /auth/password-reset-request |
 * | changePassword | PUT | /auth/password (Bearer) |
 * | checkLoginId | GET | /auth/check-login-id?loginId= |
 * | checkBusinessNumber | GET | /registration/check-business-number?number= |
 * | getDealerList | GET | /registration/dealer-list?region= |
 * | registerOwner/HQ/Admin/Dealer | POST | /registration/owner, /hq, /admin, /dealer |
 *
 * POST /auth/refresh: `httpClient` 응답 인터셉터에서 401 시 쿠키 기반으로 자동 호출됨.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  ChangePasswordRequest,
  RegisterOwnerRequest,
  RegisterHQRequest,
  RegisterAdminRequest,
  RegisterDealerRequest,
  RegisterResponse,
  DealerListItem,
} from '../types/auth.types';
import {
  mockLogin,
  mockLogout,
  mockPasswordResetRequest,
  mockChangePassword,
  mockCheckLoginId,
  mockCheckBusinessNumber,
  mockGetDealerList,
  mockRegisterOwner,
  mockRegisterHQ,
  mockRegisterAdmin,
  mockRegisterDealer,
} from './mock/auth.mock';
import * as authReal from './real/auth.real';

/** 백엔드 `API_BASE_PATH`까지 포함한 절대 또는 상대 베이스 (예: `http://localhost:4000/api/v1`). */
const useRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' && Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return useRealApi ? authReal.login(request) : mockLogin(request);
}

export async function logout(): Promise<void> {
  return useRealApi ? authReal.logout() : mockLogout();
}

export async function passwordResetRequest(
  request: PasswordResetRequest,
): Promise<{ message: string }> {
  return useRealApi ? authReal.passwordResetRequest(request) : mockPasswordResetRequest(request);
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
  return useRealApi ? authReal.changePassword(request) : mockChangePassword(request);
}

// TanStack Query Hooks

export function useLogin() {
  return useMutation({
    mutationFn: (request: LoginRequest) => login(request),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => logout(),
  });
}

export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: (request: PasswordResetRequest) => passwordResetRequest(request),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (request: ChangePasswordRequest) => changePassword(request),
  });
}

// Registration APIs

export async function checkLoginId(loginId: string): Promise<{ available: boolean }> {
  return useRealApi ? authReal.checkLoginId(loginId) : mockCheckLoginId(loginId);
}

export async function checkBusinessNumber(
  number: string,
): Promise<{ isValid: boolean; isDuplicate: boolean }> {
  return useRealApi ? authReal.checkBusinessNumber(number) : mockCheckBusinessNumber(number);
}

export async function getDealerList(region?: string): Promise<DealerListItem[]> {
  return useRealApi ? authReal.getDealerList(region) : mockGetDealerList(region);
}

export async function registerOwner(request: RegisterOwnerRequest): Promise<RegisterResponse> {
  return useRealApi ? authReal.registerOwner(request) : mockRegisterOwner(request);
}

export async function registerHQ(request: RegisterHQRequest): Promise<RegisterResponse> {
  return useRealApi ? authReal.registerHQ(request) : mockRegisterHQ(request);
}

export async function registerAdmin(request: RegisterAdminRequest): Promise<RegisterResponse> {
  return useRealApi ? authReal.registerAdmin(request) : mockRegisterAdmin(request);
}

export async function registerDealer(request: RegisterDealerRequest): Promise<RegisterResponse> {
  return useRealApi ? authReal.registerDealer(request) : mockRegisterDealer(request);
}

// Registration Hooks

export function useCheckLoginId(loginId: string) {
  return useQuery({
    queryKey: ['checkLoginId', loginId],
    queryFn: () => checkLoginId(loginId),
    enabled: loginId.length >= 4,
  });
}

export function useDealerList(region?: string) {
  return useQuery({
    queryKey: ['dealerList', region],
    queryFn: () => getDealerList(region),
  });
}

export function useRegisterOwner() {
  return useMutation({ mutationFn: (request: RegisterOwnerRequest) => registerOwner(request) });
}

export function useRegisterHQ() {
  return useMutation({ mutationFn: (request: RegisterHQRequest) => registerHQ(request) });
}

export function useRegisterAdmin() {
  return useMutation({ mutationFn: (request: RegisterAdminRequest) => registerAdmin(request) });
}

export function useRegisterDealer() {
  return useMutation({ mutationFn: (request: RegisterDealerRequest) => registerDealer(request) });
}
