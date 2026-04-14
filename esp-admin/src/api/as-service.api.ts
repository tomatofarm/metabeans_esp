/**
 * A/S API — REST 설계서 §7
 *
 * | 훅 | REST |
 * |----|------|
 * | useCreateASRequest | POST /as-service/requests |
 * | useASRequests | GET /as-service/requests |
 * | useASStatusList | 동일 (쿼리로 처리현황·완료보고서 탭 구분 — Phase 2에서 단일 엔드포인트 유지 권장) |
 * | useASDetail | GET /as-service/requests/:requestId |
 * | useUpdateASStatus | PATCH /as-service/requests/:requestId/status |
 * | useAssignDealer | (설계서 전용 경로 없음) status PATCH 또는 별도 스펙 합의 |
 * | useCreateASReport | POST /as-service/requests/:requestId/report |
 * | useASReport | GET /as-service/requests/:requestId/report |
 * | useASAlerts | GET /as-service/alerts |
 * | useASStoreOptions / useASEquipmentOptions / useDealerOptions | 폼용 — §4·§8 등과 조합 |
 *
 * Phase 2: 첨부파일은 multipart/form-data (§7.1, §7.5).
 */
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
import * as asServiceReal from './real/as-service.real';
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

const useRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' && Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

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
    queryFn: () =>
      useRealApi
        ? asServiceReal.fetchASAlerts({ ...params, authorizedStoreIds })
        : mockGetASAlerts({ ...params, authorizedStoreIds }),
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
    queryFn: () =>
      useRealApi
        ? asServiceReal.fetchASRequests({ ...params, authorizedStoreIds })
        : mockGetASRequests({ ...params, authorizedStoreIds }),
    staleTime: 30 * 1000,
  });
}

// A/S 신청
export function useCreateASRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ASCreateRequest) =>
      useRealApi
        ? asServiceReal.createASRequest(req, getAuthorizedStoresSnapshot())
        : mockCreateASRequest(req, getAuthorizedStoresSnapshot()),
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
    queryFn: () =>
      useRealApi
        ? asServiceReal.fetchASStoreOptions(authorizedStoreIds)
        : mockGetASStoreOptions(authorizedStoreIds),
    staleTime: 5 * 60 * 1000,
  });
}

// 매장별 장비 옵션
export function useASEquipmentOptions(storeId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-equipment-options', user?.userId, authorizedStoreIds, storeId],
    queryFn: () =>
      useRealApi
        ? asServiceReal.fetchEquipmentOptionsByStore(storeId!, authorizedStoreIds)
        : mockGetEquipmentOptionsByStore(storeId!, authorizedStoreIds),
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
    queryFn: () =>
      useRealApi
        ? asServiceReal.fetchASStatusList({ ...params, authorizedStoreIds })
        : mockGetASStatusList({ ...params, authorizedStoreIds }),
    staleTime: 30 * 1000,
  });
}

// A/S 상세 조회
export function useASDetail(requestId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-detail', user?.userId, authorizedStoreIds, requestId],
    queryFn: () =>
      useRealApi
        ? asServiceReal.fetchASDetail(requestId!, authorizedStoreIds)
        : mockGetASDetail(requestId!, authorizedStoreIds),
    enabled: requestId !== null,
    staleTime: 30 * 1000,
  });
}

// A/S 상태 변경
export function useUpdateASStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, update }: { requestId: number; update: ASStatusUpdateRequest }) =>
      useRealApi
        ? asServiceReal.updateASStatus(requestId, update, getAuthorizedStoresSnapshot())
        : mockUpdateASStatus(requestId, update, getAuthorizedStoresSnapshot()),
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
      useRealApi
        ? asServiceReal.assignDealer(requestId, dealerId, getAuthorizedStoresSnapshot())
        : mockAssignDealer(requestId, dealerId, getAuthorizedStoresSnapshot()),
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
    queryFn: () => (useRealApi ? asServiceReal.fetchDealerOptions() : mockGetDealerOptions()),
    staleTime: 5 * 60 * 1000,
  });
}

// 보고서 조회
export function useASReport(requestId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['as-report', user?.userId, authorizedStoreIds, requestId],
    queryFn: () =>
      useRealApi
        ? asServiceReal.fetchASReport(requestId!, authorizedStoreIds)
        : mockGetASReport(requestId!, authorizedStoreIds),
    enabled: requestId !== null,
    staleTime: 30 * 1000,
  });
}

// 보고서 작성
export function useCreateASReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: ASReportCreateRequest }) =>
      useRealApi
        ? asServiceReal.createASReport(requestId, data, getAuthorizedStoresSnapshot())
        : mockCreateASReport(requestId, data, getAuthorizedStoresSnapshot()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['as-requests'] });
      queryClient.invalidateQueries({ queryKey: ['as-status-list'] });
      queryClient.invalidateQueries({ queryKey: ['as-detail'] });
      queryClient.invalidateQueries({ queryKey: ['as-report'] });
    },
  });
}
