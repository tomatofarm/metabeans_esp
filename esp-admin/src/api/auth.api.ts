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
// Phase 2: import { axiosLogin, axiosLogout, ... } from './real/auth.real';

export async function login(request: LoginRequest): Promise<LoginResponse> {
  return mockLogin(request); // Phase 2: axiosLogin(request)
}

export async function logout(): Promise<void> {
  return mockLogout(); // Phase 2: axiosLogout()
}

export async function passwordResetRequest(
  request: PasswordResetRequest,
): Promise<{ message: string }> {
  return mockPasswordResetRequest(request); // Phase 2: axiosPasswordResetRequest(request)
}

export async function changePassword(
  request: ChangePasswordRequest,
): Promise<void> {
  return mockChangePassword(request); // Phase 2: axiosChangePassword(request)
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
  return mockCheckLoginId(loginId); // Phase 2: axiosCheckLoginId(loginId)
}

export async function checkBusinessNumber(
  number: string,
): Promise<{ isValid: boolean; isDuplicate: boolean }> {
  return mockCheckBusinessNumber(number); // Phase 2: axiosCheckBusinessNumber(number)
}

export async function getDealerList(region?: string): Promise<DealerListItem[]> {
  return mockGetDealerList(region); // Phase 2: axiosGetDealerList(region)
}

export async function registerOwner(request: RegisterOwnerRequest): Promise<RegisterResponse> {
  return mockRegisterOwner(request); // Phase 2: axiosRegisterOwner(request)
}

export async function registerHQ(request: RegisterHQRequest): Promise<RegisterResponse> {
  return mockRegisterHQ(request); // Phase 2: axiosRegisterHQ(request)
}

export async function registerAdmin(request: RegisterAdminRequest): Promise<RegisterResponse> {
  return mockRegisterAdmin(request); // Phase 2: axiosRegisterAdmin(request)
}

export async function registerDealer(request: RegisterDealerRequest): Promise<RegisterResponse> {
  return mockRegisterDealer(request); // Phase 2: axiosRegisterDealer(request)
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
