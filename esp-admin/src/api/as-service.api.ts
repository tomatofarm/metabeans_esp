import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockGetASAlerts,
  mockGetASRequests,
  mockCreateASRequest,
  mockGetEquipmentOptionsByStore,
  mockGetASStoreOptions,
  mockGetASDetail,
  mockUpdateASStatus,
  mockAssignDealer,
  mockGetASReport,
  mockCreateASReport,
  mockGetDealerOptions,
  mockGetASStatusList,
} from './mock/as-service.mock';
import type {
  AlertSeverity,
  AlertType,
  ASStatus,
  Urgency,
  ASCreateRequest,
  ASStatusUpdateRequest,
  ASReportCreateRequest,
} from '../types/as-service.types';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthorizedNumericStoreIds, type AuthorizedStoresParam } from '../utils/mockAccess';

function getAuthorizedStoresSnapshot(): AuthorizedStoresParam {
  return resolveAuthorizedNumericStoreIds(useAuthStore.getState().user?.storeIds);
}

function useMockAuthorizedStores(): AuthorizedStoresParam {
  const storeIds = useAuthStore((s) => s.user?.storeIds);
  return useMemo(() => resolveAuthorizedNumericStoreIds(storeIds), [storeIds]);
}

// 알림 현황 조회
export function useASAlerts(params?: {
  severity?: AlertSeverity;
  alertType?: AlertType;
  storeId?: number;
  isResolved?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-alerts', user?.userId, authorizedStoreIds, params],
    queryFn: () => mockGetASAlerts({ ...params, authorizedStoreIds }),
    staleTime: 30 * 1000,
  });
}

// A/S 요청 목록 조회
export function useASRequests(params?: {
  status?: ASStatus;
  urgency?: Urgency;
  storeId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-requests', user?.userId, authorizedStoreIds, params],
    queryFn: () => mockGetASRequests({ ...params, authorizedStoreIds }),
    staleTime: 30 * 1000,
  });
}

// A/S 신청
export function useCreateASRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ASCreateRequest) =>
      mockCreateASRequest(req, getAuthorizedStoresSnapshot()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['as-requests'] });
      queryClient.invalidateQueries({ queryKey: ['as-alerts'] });
    },
  });
}

// 매장 옵션 (A/S 신청 폼용)
export function useASStoreOptions() {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-store-options', user?.userId, authorizedStoreIds],
    queryFn: () => mockGetASStoreOptions(authorizedStoreIds),
    staleTime: 5 * 60 * 1000,
  });
}

// 매장별 장비 옵션
export function useASEquipmentOptions(storeId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-equipment-options', user?.userId, authorizedStoreIds, storeId],
    queryFn: () => mockGetEquipmentOptionsByStore(storeId!, authorizedStoreIds),
    enabled: storeId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

// 처리 현황 목록 조회
export function useASStatusList(params?: {
  status?: ASStatus;
  urgency?: Urgency;
  storeId?: number;
  dealerId?: number;
  reportOnly?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-status-list', user?.userId, authorizedStoreIds, params],
    queryFn: () => mockGetASStatusList({ ...params, authorizedStoreIds }),
    staleTime: 30 * 1000,
  });
}

// A/S 상세 조회
export function useASDetail(requestId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-detail', user?.userId, authorizedStoreIds, requestId],
    queryFn: () => mockGetASDetail(requestId!, authorizedStoreIds),
    enabled: requestId !== null,
    staleTime: 30 * 1000,
  });
}

// A/S 상태 변경
export function useUpdateASStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, update }: { requestId: number; update: ASStatusUpdateRequest }) =>
      mockUpdateASStatus(requestId, update, getAuthorizedStoresSnapshot()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['as-requests'] });
      queryClient.invalidateQueries({ queryKey: ['as-status-list'] });
      queryClient.invalidateQueries({ queryKey: ['as-detail'] });
    },
  });
}

// 대리점 배정
export function useAssignDealer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, dealerId }: { requestId: number; dealerId: number }) =>
      mockAssignDealer(requestId, dealerId, getAuthorizedStoresSnapshot()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['as-requests'] });
      queryClient.invalidateQueries({ queryKey: ['as-status-list'] });
      queryClient.invalidateQueries({ queryKey: ['as-detail'] });
    },
  });
}

// 대리점 옵션
export function useDealerOptions() {
  return useQuery({
    queryKey: ['dealer-options'],
    queryFn: () => mockGetDealerOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

// 보고서 조회
export function useASReport(requestId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-report', user?.userId, authorizedStoreIds, requestId],
    queryFn: () => mockGetASReport(requestId!, authorizedStoreIds),
    enabled: requestId !== null,
    staleTime: 30 * 1000,
  });
}

// 보고서 작성
export function useCreateASReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: ASReportCreateRequest }) =>
      mockCreateASReport(requestId, data, getAuthorizedStoresSnapshot()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['as-requests'] });
      queryClient.invalidateQueries({ queryKey: ['as-status-list'] });
      queryClient.invalidateQueries({ queryKey: ['as-detail'] });
      queryClient.invalidateQueries({ queryKey: ['as-report'] });
    },
  });
}
