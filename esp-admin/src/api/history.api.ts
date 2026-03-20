import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  mockGetSensorHistoryRange,
  mockGetControlHistoryRange,
  mockGetAlarmHistory,
  mockGetEquipmentChangeHistory,
} from './mock/history.mock';
import type { ControlTarget } from '../types/control.types';
import type { AlarmType } from '../types/equipment.types';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthorizedNumericStoreIds } from '../utils/mockAccess';

function useMockAuthorizedStores() {
  const storeIds = useAuthStore((s) => s.user?.storeIds);
  return useMemo(() => resolveAuthorizedNumericStoreIds(storeIds), [storeIds]);
}

// 센서 이력 데이터 (기간 지원)
export function useSensorHistoryRange(
  equipmentId: number | null,
  from: number | null,
  to: number | null,
) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['history', 'sensor', user?.userId, authorizedStoreIds, equipmentId, from, to],
    queryFn: () =>
      mockGetSensorHistoryRange(equipmentId!, from!, to!, authorizedStoreIds),
    enabled: equipmentId !== null && from !== null && to !== null,
    staleTime: 60 * 1000,
  });
}

// 제어 이력 (기간/유형 필터)
export function useControlHistoryRange(
  equipmentId: number | null,
  from: number | null,
  to: number | null,
  targetFilter?: ControlTarget,
) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['history', 'control', user?.userId, authorizedStoreIds, equipmentId, from, to, targetFilter],
    queryFn: () =>
      mockGetControlHistoryRange(equipmentId!, from!, to!, targetFilter, authorizedStoreIds),
    enabled: equipmentId !== null && from !== null && to !== null,
    staleTime: 30 * 1000,
  });
}

// 알람 이력 (기간/유형 필터)
export function useAlarmHistory(
  equipmentId: number | null,
  from: number | null,
  to: number | null,
  typeFilter?: AlarmType,
) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['history', 'alarm', user?.userId, authorizedStoreIds, equipmentId, from, to, typeFilter],
    queryFn: () =>
      mockGetAlarmHistory(equipmentId!, from!, to!, typeFilter, authorizedStoreIds),
    enabled: equipmentId !== null && from !== null && to !== null,
    staleTime: 30 * 1000,
  });
}

// 장비 변경 이력
export function useEquipmentChangeHistory(equipmentId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['history', 'equipment-change', user?.userId, authorizedStoreIds, equipmentId],
    queryFn: () => mockGetEquipmentChangeHistory(equipmentId!, authorizedStoreIds),
    enabled: equipmentId !== null,
    staleTime: 60 * 1000,
  });
}
