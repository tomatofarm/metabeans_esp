import { useQuery } from '@tanstack/react-query';
import {
  mockGetSensorHistoryRange,
  mockGetControlHistoryRange,
  mockGetAlarmHistory,
  mockGetEquipmentChangeHistory,
} from './mock/history.mock';
import type { ControlTarget } from '../types/control.types';
import type { AlarmType } from '../types/equipment.types';

// 센서 이력 데이터 (기간 지원)
export function useSensorHistoryRange(
  equipmentId: number | null,
  from: number | null,
  to: number | null,
) {
  return useQuery({
    queryKey: ['history', 'sensor', equipmentId, from, to],
    queryFn: () => mockGetSensorHistoryRange(equipmentId!, from!, to!),
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
  return useQuery({
    queryKey: ['history', 'control', equipmentId, from, to, targetFilter],
    queryFn: () => mockGetControlHistoryRange(equipmentId!, from!, to!, targetFilter),
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
  return useQuery({
    queryKey: ['history', 'alarm', equipmentId, from, to, typeFilter],
    queryFn: () => mockGetAlarmHistory(equipmentId!, from!, to!, typeFilter),
    enabled: equipmentId !== null && from !== null && to !== null,
    staleTime: 30 * 1000,
  });
}

// 장비 변경 이력
export function useEquipmentChangeHistory(equipmentId: number | null) {
  return useQuery({
    queryKey: ['history', 'equipment-change', equipmentId],
    queryFn: () => mockGetEquipmentChangeHistory(equipmentId!),
    enabled: equipmentId !== null,
    staleTime: 60 * 1000,
  });
}
