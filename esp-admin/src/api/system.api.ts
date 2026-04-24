/**
 * 시스템 관리 API — REST 설계서 §9 (ADMIN 전용)
 *
 * `VITE_API_BASE_URL` + `VITE_USE_MOCK_API !== 'true'` 이면 `real/system.real.ts`로 백엔드 호출.
 *
 * | 구역 | 훅 | REST |
 * |------|-----|------|
 * | 권한 매트릭스 | `usePermissionMatrix` | `GET /system/permissions` — **서버에 저장된 전부** (접속 제어는 토큰/역할/기능, 프론트는 역할로 분기하지 않음) |
 * | 권한 저장 | `useUpdatePermissions` | `PUT /system/permissions` — 가능 여부는 **서버**가 결정. `GET`과 **동일한** 매트릭스 스키마. |
 * | 권한 오버라이드 | useUserPermissionOverrides, useSaveUserPermissionOverride, useDeleteUserPermissionOverride | §9.1.3 — **UI에서 사용자 편집 시 제거됨**, 훅·Mock은 잔존 |
 * | 가입 승인 | usePendingApprovals, useApproveUser, useRejectUser | GET /system/approvals, PATCH .../approvals/:userId |
 * | 비번 재설정 대기 | usePasswordResetRequests, useApprovePasswordReset | §9 본문에 없을 수 있음 — 백엔드 스펙 확인 |
 * | 사용자 | useSystemUsers, useSystemUserDetail, useUpdateSystemUser | GET 목록·상세, PUT 수정 |
 * | 사용자 | (미구현) | POST /system/users, PATCH .../status, DELETE ... |
 * | 기준수치 | useThresholdSettings, useUpdateThresholds | §9.4.3 댐퍼/팬 자동제어 기본값 + 권장 `GET/PUT /system/thresholds` 묶음. Mock은 단일 `ThresholdSettings` — 백엔드는 cleaning/iaq 분리 유지 시 §9.4.3 분리 엔드포인트 병행 가능 |
 *
 * 장비 모델 CRUD: §9.4.3 — 현재 `equipment.api`의 `useEquipmentModels`(조회)만 해당. 등록/수정/삭제는 미구현.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as systemReal from './real/system.real';
import { useAuthStore } from '../stores/authStore';
import {
  mockGetPermissionMatrix,
  mockUpdatePermissions,
  mockGetPendingApprovals,
  mockApproveUser,
  mockRejectUser,
  mockGetPasswordResetRequests,
  mockApprovePasswordReset,
  mockGetUsers,
  mockGetUserDetail,
  mockUpdateUser,
  mockGetUserPermissionOverrides,
  mockSaveUserPermissionOverride,
  mockDeleteUserPermissionOverride,
  mockGetThresholds,
  mockUpdateThresholds,
} from './mock/system.mock';
import type {
  PermissionUpdateRequest,
  UserListParams,
  SystemUserUpdateRequest,
  FeatureCode,
  ThresholdSettings,
} from '../types/system.types';

const useRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' && Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

// ===== 권한 관리 =====

/** `system.permission` 등으로 UI에 들어온 사용자(어드민 외)도 **동일** 매트릭스를 써야 하므로 `GET`은 역할 분기 없이 한 종류. */
export function usePermissionMatrix() {
  const isLoggedIn = useAuthStore((s) => Boolean(s.user));
  return useQuery({
    queryKey: ['system-permissions'],
    queryFn: () => (useRealApi ? systemReal.fetchPermissionMatrix() : mockGetPermissionMatrix()),
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PermissionUpdateRequest) =>
      useRealApi ? systemReal.updatePermissions(request) : mockUpdatePermissions(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-permissions'] });
    },
  });
}

// ===== 가입 승인 =====

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['system-approvals'],
    queryFn: () => (useRealApi ? systemReal.fetchPendingApprovals() : mockGetPendingApprovals()),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => (useRealApi ? systemReal.approveUser(userId) : mockApproveUser(userId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      useRealApi ? systemReal.rejectUser(userId, reason) : mockRejectUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-approvals'] });
    },
  });
}

export function usePasswordResetRequests() {
  return useQuery({
    queryKey: ['system-password-resets'],
    queryFn: () =>
      useRealApi ? systemReal.fetchPasswordResetRequests() : mockGetPasswordResetRequests(),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });
}

export function useApprovePasswordReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) =>
      useRealApi ? systemReal.approvePasswordReset(requestId) : mockApprovePasswordReset(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-password-resets'] });
    },
  });
}

// ===== 사용자 관리 =====

export function useSystemUsers(
  params?: UserListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['system-users', params],
    queryFn: () => (useRealApi ? systemReal.fetchSystemUsers(params) : mockGetUsers(params)),
    enabled: options?.enabled !== false,
    staleTime: 30 * 1000,
  });
}

export function useSystemUserDetail(userId: number | null) {
  return useQuery({
    queryKey: ['system-user-detail', userId],
    queryFn: () => (useRealApi ? systemReal.fetchSystemUserDetail(userId!) : mockGetUserDetail(userId!)),
    enabled: userId !== null,
    staleTime: 30 * 1000,
  });
}

export function useUpdateSystemUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: SystemUserUpdateRequest }) =>
      useRealApi ? systemReal.updateSystemUser(userId, data) : mockUpdateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-detail'] });
    },
  });
}

export function useUserPermissionOverrides(userId: number | null) {
  return useQuery({
    queryKey: ['system-user-overrides', userId],
    queryFn: () =>
      useRealApi
        ? systemReal.fetchUserPermissionOverrides(userId!)
        : mockGetUserPermissionOverrides(userId!),
    enabled: userId !== null,
    staleTime: 30 * 1000,
  });
}

export function useSaveUserPermissionOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      featureCode,
      isAllowed,
      reason,
    }: {
      userId: number;
      featureCode: FeatureCode;
      isAllowed: boolean;
      reason?: string;
    }) =>
      useRealApi
        ? systemReal.saveUserPermissionOverride(userId, featureCode, isAllowed, reason)
        : mockSaveUserPermissionOverride(userId, featureCode, isAllowed, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-user-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-detail'] });
    },
  });
}

export function useDeleteUserPermissionOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, featureCode }: { userId: number; featureCode: FeatureCode }) =>
      useRealApi
        ? systemReal.deleteUserPermissionOverride(userId, featureCode)
        : mockDeleteUserPermissionOverride(userId, featureCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-user-overrides'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-detail'] });
    },
  });
}

// ===== 기준수치 관리 =====

export function useThresholdSettings() {
  return useQuery({
    queryKey: ['system-thresholds'],
    queryFn: () => (useRealApi ? systemReal.fetchThresholdSettings() : mockGetThresholds()),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateThresholds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ThresholdSettings>) =>
      useRealApi ? systemReal.updateThresholds(data) : mockUpdateThresholds(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-thresholds'] });
    },
  });
}
