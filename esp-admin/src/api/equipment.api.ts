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

// 장비 목록 조회
export function useEquipments(params?: {
  storeId?: number;
  floorId?: number;
  status?: string;
  connectionStatus?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['equipments', params],
    queryFn: () => mockGetEquipments(params),
    staleTime: 30 * 1000,
  });
}

// 장비 상세 조회
export function useEquipmentDetail(equipmentId: number | null) {
  return useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => mockGetEquipmentDetail(equipmentId!),
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
  return useQuery({
    queryKey: ['storeOptions'],
    queryFn: () => mockGetStoreOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

// 층 옵션
export function useFloorOptions(storeId: number | null) {
  return useQuery({
    queryKey: ['floorOptions', storeId],
    queryFn: () => mockGetFloorOptions(storeId!),
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
