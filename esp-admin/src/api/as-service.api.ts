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
  return useQuery({
    queryKey: ['as-alerts', params],
    queryFn: () => mockGetASAlerts(params),
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
  return useQuery({
    queryKey: ['as-requests', params],
    queryFn: () => mockGetASRequests(params),
    staleTime: 30 * 1000,
  });
}

// A/S 신청
export function useCreateASRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: ASCreateRequest) => mockCreateASRequest(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['as-requests'] });
      queryClient.invalidateQueries({ queryKey: ['as-alerts'] });
    },
  });
}

// 매장 옵션 (A/S 신청 폼용)
export function useASStoreOptions() {
  return useQuery({
    queryKey: ['as-store-options'],
    queryFn: () => mockGetASStoreOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

// 매장별 장비 옵션
export function useASEquipmentOptions(storeId: number | null) {
  return useQuery({
    queryKey: ['as-equipment-options', storeId],
    queryFn: () => mockGetEquipmentOptionsByStore(storeId!),
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
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['as-status-list', params],
    queryFn: () => mockGetASStatusList(params),
    staleTime: 30 * 1000,
  });
}

// A/S 상세 조회
export function useASDetail(requestId: number | null) {
  return useQuery({
    queryKey: ['as-detail', requestId],
    queryFn: () => mockGetASDetail(requestId!),
    enabled: requestId !== null,
    staleTime: 30 * 1000,
  });
}

// A/S 상태 변경
export function useUpdateASStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, update }: { requestId: number; update: ASStatusUpdateRequest }) =>
      mockUpdateASStatus(requestId, update),
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
      mockAssignDealer(requestId, dealerId),
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
  return useQuery({
    queryKey: ['as-report', requestId],
    queryFn: () => mockGetASReport(requestId!),
    enabled: requestId !== null,
    staleTime: 30 * 1000,
  });
}

// 보고서 작성
export function useCreateASReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: number; data: ASReportCreateRequest }) =>
      mockCreateASReport(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['as-requests'] });
      queryClient.invalidateQueries({ queryKey: ['as-status-list'] });
      queryClient.invalidateQueries({ queryKey: ['as-detail'] });
      queryClient.invalidateQueries({ queryKey: ['as-report'] });
    },
  });
}
