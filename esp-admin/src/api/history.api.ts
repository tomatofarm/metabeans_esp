/**
 * 이력 탭 API — 장비관리 > 이력 (Mock). REST와의 정합:
 * - 센서 구간: §5.2 `GET /monitoring/equipment/:id/history` 와 중복 가능 → 백엔드 단일화 권장.
 * - 제어: §6.3 `GET /control/history`
 * - 알람·장비변경: DB 뷰 또는 §5.4 history-log 와 스펙 합의 후 연동.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  mockGetSensorHistoryRange,
  mockGetControlHistoryRange,
  mockGetAlarmHistory,
  mockGetEquipmentChangeHistory,
} from './mock/history.mock';
import * as historyReal from './real/history.real';
import type { ControlTarget } from '../types/control.types';
import type { AlarmType } from '../types/equipment.types';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthorizedNumericStoreIds } from '../utils/mockAccess';

const useRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' && Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

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
      useRealApi
        ? historyReal.fetchSensorHistoryRange(equipmentId!, from!, to!)
        : mockGetSensorHistoryRange(equipmentId!, from!, to!, authorizedStoreIds),
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
      useRealApi
        ? historyReal.fetchControlHistoryRange(equipmentId!, from!, to!, targetFilter)
        : mockGetControlHistoryRange(equipmentId!, from!, to!, targetFilter, authorizedStoreIds),
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
      useRealApi
        ? historyReal.fetchAlarmHistory(equipmentId!, from!, to!, typeFilter)
        : mockGetAlarmHistory(equipmentId!, from!, to!, typeFilter, authorizedStoreIds),
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
    queryFn: () =>
      useRealApi
        ? historyReal.fetchEquipmentChangeHistory(equipmentId!)
        : mockGetEquipmentChangeHistory(equipmentId!, authorizedStoreIds),
    enabled: equipmentId !== null,
    staleTime: 60 * 1000,
  });
}
