import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockGetRealtimeSensorData, mockGetSensorHistory } from './mock/monitoring.mock';
import { SENSOR_INTERVAL_MS } from '../utils/constants';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthorizedNumericStoreIds } from '../utils/mockAccess';

function useMockAuthorizedStores() {
  const storeIds = useAuthStore((s) => s.user?.storeIds);
  return useMemo(() => resolveAuthorizedNumericStoreIds(storeIds), [storeIds]);
}

// 실시간 센서 데이터 조회 (10초 자동 갱신)
export function useRealtimeSensorData(equipmentId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['monitoring', 'realtime', user?.userId, authorizedStoreIds, equipmentId],
    queryFn: () => mockGetRealtimeSensorData(equipmentId!, authorizedStoreIds),
    enabled: equipmentId !== null,
    refetchInterval: SENSOR_INTERVAL_MS,
    staleTime: SENSOR_INTERVAL_MS - 1000,
  });
}

// 센서 이력 데이터 조회 (차트용)
export function useSensorHistory(equipmentId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['monitoring', 'history', user?.userId, authorizedStoreIds, equipmentId],
    queryFn: () => mockGetSensorHistory(equipmentId!, undefined, undefined, authorizedStoreIds),
    enabled: equipmentId !== null,
    staleTime: 60 * 1000,
  });
}
