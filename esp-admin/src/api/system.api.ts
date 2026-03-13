import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// ===== 권한 관리 =====

export function usePermissionMatrix() {
  return useQuery({
    queryKey: ['system-permissions'],
    queryFn: () => mockGetPermissionMatrix(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PermissionUpdateRequest) => mockUpdatePermissions(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-permissions'] });
    },
  });
}

// ===== 가입 승인 =====

export function usePendingApprovals() {
  return useQuery({
    queryKey: ['system-approvals'],
    queryFn: () => mockGetPendingApprovals(),
    staleTime: 30 * 1000,
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => mockApproveUser(userId),
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
      mockRejectUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-approvals'] });
    },
  });
}

export function usePasswordResetRequests() {
  return useQuery({
    queryKey: ['system-password-resets'],
    queryFn: () => mockGetPasswordResetRequests(),
    staleTime: 30 * 1000,
  });
}

export function useApprovePasswordReset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => mockApprovePasswordReset(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-password-resets'] });
    },
  });
}

// ===== 사용자 관리 =====

export function useSystemUsers(params?: UserListParams) {
  return useQuery({
    queryKey: ['system-users', params],
    queryFn: () => mockGetUsers(params),
    staleTime: 30 * 1000,
  });
}

export function useSystemUserDetail(userId: number | null) {
  return useQuery({
    queryKey: ['system-user-detail', userId],
    queryFn: () => mockGetUserDetail(userId!),
    enabled: userId !== null,
    staleTime: 30 * 1000,
  });
}

export function useUpdateSystemUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: SystemUserUpdateRequest }) =>
      mockUpdateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-users'] });
      queryClient.invalidateQueries({ queryKey: ['system-user-detail'] });
    },
  });
}

export function useUserPermissionOverrides(userId: number | null) {
  return useQuery({
    queryKey: ['system-user-overrides', userId],
    queryFn: () => mockGetUserPermissionOverrides(userId!),
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
    }) => mockSaveUserPermissionOverride(userId, featureCode, isAllowed, reason),
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
      mockDeleteUserPermissionOverride(userId, featureCode),
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
    queryFn: () => mockGetThresholds(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateThresholds() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ThresholdSettings>) => mockUpdateThresholds(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-thresholds'] });
    },
  });
}
