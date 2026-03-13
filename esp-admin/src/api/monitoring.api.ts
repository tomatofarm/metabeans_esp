import { useQuery } from '@tanstack/react-query';
import { mockGetRealtimeSensorData, mockGetSensorHistory } from './mock/monitoring.mock';
import { SENSOR_INTERVAL_MS } from '../utils/constants';

// 실시간 센서 데이터 조회 (10초 자동 갱신)
export function useRealtimeSensorData(equipmentId: number | null) {
  return useQuery({
    queryKey: ['monitoring', 'realtime', equipmentId],
    queryFn: () => mockGetRealtimeSensorData(equipmentId!),
    enabled: equipmentId !== null,
    refetchInterval: SENSOR_INTERVAL_MS,
    staleTime: SENSOR_INTERVAL_MS - 1000,
  });
}

// 센서 이력 데이터 조회 (차트용)
export function useSensorHistory(equipmentId: number | null) {
  return useQuery({
    queryKey: ['monitoring', 'history', equipmentId],
    queryFn: () => mockGetSensorHistory(equipmentId!),
    enabled: equipmentId !== null,
    staleTime: 60 * 1000,
  });
}
