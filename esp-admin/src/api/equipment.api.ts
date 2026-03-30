/**
 * 장비 API — REST 설계서 §4 와 매핑
 *
 * | 훅 | REST |
 * |----|------|
 * | useEquipments | GET /equipment |
 * | useEquipmentDetail | GET /equipment/:equipmentId |
 * | useCreateEquipment | POST /equipment |
 * | useUpdateEquipment | PUT /equipment/:equipmentId |
 * | useDeleteEquipment | DELETE /equipment/:equipmentId |
 * | useEquipmentModels | GET /equipment/models |
 * | useStoreOptions / useFloorOptions / useGatewayOptions / useDealerOptions | 등록·수정 폼용 — Phase 2에서 동일 스키마의 BFF 엔드포인트로 대체 가능 |
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockGetEquipments,
  mockGetEquipmentDetail,
  mockCreateEquipment,
  mockUpdateEquipment,
  mockDeleteEquipment,
  mockGetEquipmentModels,
  mockGetStoreOptions,
  mockGetFloorOptions,
  mockGetGatewayOptions,
  mockGetDealerOptions,
} from './mock/equipment.mock';
import type {
  EquipmentCreateRequest,
  EquipmentUpdateRequest,
  EquipmentDetail,
} from '../types/equipment.types';
import type { ApiResponse } from './mock/common.mock';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthorizedNumericStoreIds } from '../utils/mockAccess';

function useMockAuthorizedStores() {
  const storeIds = useAuthStore((s) => s.user?.storeIds);
  return useMemo(() => resolveAuthorizedNumericStoreIds(storeIds), [storeIds]);
}

// 장비 목록 조회
export function useEquipments(params?: {
  storeId?: number;
  floorId?: number;
  status?: string;
  connectionStatus?: string;
  search?: string;
}) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['equipments', user?.userId, authorizedStoreIds, params],
    queryFn: () => mockGetEquipments({ ...params, authorizedStoreIds }),
    staleTime: 30 * 1000,
  });
}

// 장비 상세 조회
export function useEquipmentDetail(equipmentId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['equipment', user?.userId, authorizedStoreIds, equipmentId],
    queryFn: () => mockGetEquipmentDetail(equipmentId!, authorizedStoreIds),
    enabled: equipmentId !== null,
    staleTime: 30 * 1000,
  });
}

// 장비 모델 목록
export function useEquipmentModels() {
  return useQuery({
    queryKey: ['equipmentModels'],
    queryFn: () => mockGetEquipmentModels(),
    staleTime: 5 * 60 * 1000,
  });
}

// 매장 옵션
export function useStoreOptions() {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['storeOptions', user?.userId, authorizedStoreIds],
    queryFn: () => mockGetStoreOptions(authorizedStoreIds),
    staleTime: 5 * 60 * 1000,
  });
}

// 층 옵션
export function useFloorOptions(storeId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['floorOptions', user?.userId, authorizedStoreIds, storeId],
    queryFn: () => mockGetFloorOptions(storeId!, authorizedStoreIds),
    enabled: storeId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

// 게이트웨이 옵션
export function useGatewayOptions(floorId: number | null) {
  return useQuery({
    queryKey: ['gatewayOptions', floorId],
    queryFn: () => mockGetGatewayOptions(floorId!),
    enabled: floorId !== null,
    staleTime: 5 * 60 * 1000,
  });
}

// 대리점 옵션
export function useDealerOptions() {
  return useQuery({
    queryKey: ['dealerOptions'],
    queryFn: () => mockGetDealerOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

// 장비 등록
export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: EquipmentCreateRequest) => mockCreateEquipment(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
    },
  });
}

// 장비 수정
export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ equipmentId, data }: { equipmentId: number; data: EquipmentUpdateRequest }) =>
      mockUpdateEquipment(equipmentId, data),
    onSuccess: (
      _data: ApiResponse<EquipmentDetail>,
      variables: { equipmentId: number; data: EquipmentUpdateRequest },
    ) => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.equipmentId] });
    },
  });
}

// 장비 삭제
export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (equipmentId: number) => mockDeleteEquipment(equipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] });
    },
  });
}
