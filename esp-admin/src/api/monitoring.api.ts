/**
 * 모니터링 API — REST 설계서 §5
 *
 * | 훅 | REST |
 * |----|------|
 * | useRealtimeSensorData | GET /monitoring/equipment/:equipmentId/latest |
 * | useSensorHistory | GET /monitoring/equipment/:equipmentId/history (Mock: 쿼리 생략 → Phase 2에서 controllerId, metrics, from, to, interval 반영) |
 *
 * 미구현: GET /monitoring/gateway/:gatewayId/iaq-history, GET .../history-log, GET .../esg
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { mockGetRealtimeSensorData, mockGetSensorHistory } from './mock/monitoring.mock';
import { SENSOR_INTERVAL_MS } from '../utils/constants';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthorizedNumericStoreIds } from '../utils/mockAccess';
import { apiRequest } from './real/apiHelpers';
import type { RealtimeMonitoringData, SensorHistoryDataPoint, ControllerSensorData } from '../types/sensor.types';

const useRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' && Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

type ApiLatest = {
  equipmentId: number;
  equipmentName: string | null;
  connectionStatus: 'ONLINE' | 'OFFLINE';
  controllers: Array<{
    controllerId: number;
    ctrlDeviceId: string;
    timestamp: string | null;
    connectionStatus: 'ONLINE' | 'OFFLINE';
    sensorData: Record<string, unknown> | null;
  }>;
};

type ApiEquipment = {
  equipmentId: number;
  equipmentName: string | null;
  mqttEquipmentId?: string | null;
  gateway?: { gatewayId: number } | null;
  model?: { modelName: string | null } | null;
  store?: { storeName: string | null } | null;
};

function n(v: unknown, d = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : d;
}

/** v3.2 oil_level(0|1). `n()`만 쓰면 string 등이 0으로 떨어져 ESG가 갱신되지 않을 수 있음. */
function intBit01(v: unknown, d: 0 | 1 = 0): 0 | 1 {
  if (v === 0 || v === "0" || v === false) return 0;
  if (v === 1 || v === "1" || v === true) return 1;
  const x = Number(v);
  if (!Number.isFinite(x)) return d;
  return x >= 0.5 ? 1 : 0;
}

function mapSensor(controllerName: string, timestampIso: string | null, raw: Record<string, unknown> | null): ControllerSensorData {
  const s = raw ?? {};
  const epoch = timestampIso ? Math.floor(new Date(timestampIso).getTime() / 1000) : Math.floor(Date.now() / 1000);
  return {
    controllerId: controllerName,
    timestamp: epoch,
    pm25: n(s.pm2_5 ?? s.pm25),
    pm10: n(s.pm10),
    diffPressure: n(s.diffPressure ?? s.diff_pressure),
    oilLevel: intBit01(s.oilLevel ?? s.oil_level),
    ppTemp: n(s.ppTemp ?? s.pp_temp),
    ppSpark: n(s.ppSpark ?? s.pp_spark),
    ppPower: n(s.ppPower ?? s.pp_power),
    ppAlarm: n(s.ppAlarm ?? s.pp_alarm),
    fanSpeed: n(s.fanSpeed ?? s.fan_speed),
    fanMode: n(s.fanMode ?? s.fan_mode),
    fanRunning: n(s.fanRunning ?? s.fan_running),
    fanFreq: n(s.fanFreq ?? s.fan_freq),
    fanTargetPct: n(s.fanTargetPct ?? s.fan_target_pct),
    damperMode: n(s.damperMode ?? s.damper_mode),
    flow: n(s.flow),
    damperCtrl: n(s.damperCtrl ?? s.damper_ctrl),
    damper: n(s.damper),
    inletTemp: n(s.inletTemp ?? s.inlet_temp),
    velocity: n(s.velocity),
    ductDp: n(s.ductDp ?? s.duct_dp),
    statusFlags: n(s.statusFlags ?? s.status_flags),
  };
}

async function fetchRealtimeSensorData(equipmentId: number): Promise<RealtimeMonitoringData> {
  const [eq, latest] = await Promise.all([
    apiRequest<ApiEquipment>({ method: "get", url: `/equipment/${equipmentId}` }),
    apiRequest<ApiLatest>({ method: "get", url: `/monitoring/equipment/${equipmentId}/latest` }),
  ]);

  return {
    equipmentId: eq.equipmentId,
    mqttEquipmentId: eq.mqttEquipmentId ?? undefined,
    gatewayId: eq.gateway?.gatewayId ?? undefined,
    equipmentName: eq.equipmentName ?? `장비-${equipmentId}`,
    modelName: eq.model?.modelName ?? '—',
    storeName: eq.store?.storeName ?? '—',
    connectionStatus: latest.connectionStatus,
    controllers: latest.controllers.map((c) => ({
      controllerId: c.controllerId,
      controllerName: c.ctrlDeviceId,
      connectionStatus: c.connectionStatus,
      lastSeenAt: c.timestamp ?? new Date().toISOString(),
      sensorData: mapSensor(c.ctrlDeviceId, c.timestamp, c.sensorData),
    })),
  };
}

type ApiHistoryPoint = {
  controllerId: number;
  receivedAt: string;
  ppTemp: number | null;
  ppSpark: number | null;
  pm2_5: number | null;
  pm10: number | null;
  diffPressure: number | null;
  inletTemp: number | null;
  flow: number | null;
  velocity: number | null;
  ductDp: number | null;
};

async function fetchSensorHistory(equipmentId: number): Promise<SensorHistoryDataPoint[]> {
  const latest = await apiRequest<ApiLatest>({ method: "get", url: `/monitoring/equipment/${equipmentId}/latest` });
  const to = new Date();
  const from = new Date(to.getTime() - 3600_000);
  const nameById = new Map(latest.controllers.map((c) => [c.controllerId, c.ctrlDeviceId]));
  const chunks = await Promise.all(
    latest.controllers.map((c) =>
      apiRequest<{ controllerId: number; dataPoints: ApiHistoryPoint[] }>({
        method: "get",
        url: `/monitoring/equipment/${equipmentId}/history?controllerId=${c.controllerId}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
      }),
    ),
  );
  return chunks
    .flatMap((chunk) =>
      chunk.dataPoints.map((p) => ({
        timestamp: Math.floor(new Date(p.receivedAt).getTime() / 1000),
        controllerId: String(chunk.controllerId),
        controllerName: nameById.get(chunk.controllerId) ?? String(chunk.controllerId),
        ppTemp: n(p.ppTemp),
        ppSpark: n(p.ppSpark),
        pm25: n(p.pm2_5),
        pm10: n(p.pm10),
        diffPressure: n(p.diffPressure),
        inletTemp: n(p.inletTemp),
        flow: n(p.flow),
        velocity: n(p.velocity),
        ductDp: n(p.ductDp),
      })),
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

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
    queryFn: () =>
      useRealApi ? fetchRealtimeSensorData(equipmentId!) : mockGetRealtimeSensorData(equipmentId!, authorizedStoreIds),
    enabled: equipmentId !== null,
    refetchInterval: SENSOR_INTERVAL_MS,
    staleTime: SENSOR_INTERVAL_MS - 1000,
  });
}

// 센서 이력 데이터 조회 (차트·필터 점검 등) — 갱신 주기는 `useRealtimeSensorData`와 동일(SENSOR_INTERVAL_MS)
export function useSensorHistory(equipmentId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['monitoring', 'history', user?.userId, authorizedStoreIds, equipmentId],
    queryFn: () =>
      useRealApi ? fetchSensorHistory(equipmentId!) : mockGetSensorHistory(equipmentId!, undefined, undefined, authorizedStoreIds),
    enabled: equipmentId !== null,
    refetchInterval: SENSOR_INTERVAL_MS,
    staleTime: SENSOR_INTERVAL_MS - 1000,
  });
}
