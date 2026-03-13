/**
 * 센서 데이터 훅 (스켈레톤 - Phase 1: Mock 기반)
 * Phase 2에서 TanStack Query + 실시간 데이터로 교체
 */
export function useSensorData(_equipmentId: string | null) {
  // Phase 1: Mock 데이터 반환
  // Phase 2: WebSocket/SSE를 통한 실시간 센서 데이터 구독
  return {
    data: null,
    isLoading: false,
    error: null,
  };
}
