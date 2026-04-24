import { apiRequest } from './apiHelpers';
import type { ControlCommand, ControlTarget } from '../../types/control.types';
import type { AlarmEvent, AlarmType, EquipmentChangeHistory } from '../../types/equipment.types';
import type { SensorHistoryDataPoint } from '../../types/sensor.types';

type ApiLatest = {
  controllers: Array<{
    controllerId: number;
    ctrlDeviceId: string;
  }>;
};

type ApiHistoryPoint = {
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

type ApiHistoryChunk = {
  controllerId: number;
  dataPoints: ApiHistoryPoint[];
};

type ApiAlarmRow = {
  alarmId: number;
  storeId: number;
  storeName: string;
  equipmentId: number;
  equipmentName: string;
  controllerId?: number | null;
  controllerName?: string | null;
  alarmType: string;
  severity: 'YELLOW' | 'RED';
  message: string;
  occurredAt: string;
  resolvedAt?: string | null;
};

const toAlarmType = (v: string): AlarmType => {
  if (v === 'INLET_TEMP_ABNORMAL') return 'INLET_TEMP';
  if (v === 'DUST_REMOVAL_CHECK') return 'DUST_PERFORMANCE';
  if (v === 'COMM_ERROR' || v === 'FILTER_CHECK' || v === 'SPARK' || v === 'OVER_TEMP') return v;
  return 'COMM_ERROR';
};

function n(v: number | null | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

export async function fetchSensorHistoryRange(
  equipmentId: number,
  fromEpochSec: number,
  toEpochSec: number,
): Promise<SensorHistoryDataPoint[]> {
  const latest = await apiRequest<ApiLatest>({
    method: 'get',
    url: `/monitoring/equipment/${equipmentId}/latest`,
  });
  const fromIso = new Date(fromEpochSec * 1000).toISOString();
  const toIso = new Date(toEpochSec * 1000).toISOString();

  const nameById = new Map(latest.controllers.map((c) => [c.controllerId, c.ctrlDeviceId]));
  const chunks = await Promise.all(
    latest.controllers.map((c) =>
      apiRequest<ApiHistoryChunk>({
        method: 'get',
        url: `/monitoring/equipment/${equipmentId}/history?controllerId=${c.controllerId}&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
      }),
    ),
  );

  return chunks
    .flatMap((chunk) =>
      chunk.dataPoints.map((p) => ({
        timestamp: Math.floor(new Date(p.receivedAt).getTime() / 1000),
        controllerId: nameById.get(chunk.controllerId) ?? String(chunk.controllerId),
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

export async function fetchControlHistoryRange(
  equipmentId: number,
  fromEpochSec: number,
  toEpochSec: number,
  targetFilter?: ControlTarget,
): Promise<ControlCommand[]> {
  const rows = await apiRequest<ControlCommand[]>({
    method: 'get',
    url: `/control/history?equipmentId=${equipmentId}`,
  });

  return rows.filter((r) => {
    const ts = new Date(r.requestedAt).getTime() / 1000;
    if (ts < fromEpochSec || ts > toEpochSec) return false;
    if (targetFilter !== undefined && r.target !== targetFilter) return false;
    return true;
  });
}

export async function fetchAlarmHistory(
  equipmentId: number,
  fromEpochSec: number,
  toEpochSec: number,
  typeFilter?: AlarmType,
): Promise<AlarmEvent[]> {
  const fromIso = new Date(fromEpochSec * 1000).toISOString();
  const toIso = new Date(toEpochSec * 1000).toISOString();
  const alarmTypeParam =
    typeFilter === 'INLET_TEMP'
      ? 'INLET_TEMP_ABNORMAL'
      : typeFilter === 'DUST_PERFORMANCE'
        ? 'DUST_REMOVAL_CHECK'
        : typeFilter;

  const url = `/monitoring/equipment/${equipmentId}/history-log?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}${alarmTypeParam ? `&alarmType=${encodeURIComponent(alarmTypeParam)}` : ''}`;
  const rows = await apiRequest<ApiAlarmRow[]>({ method: 'get', url });

  return rows.map((r) => ({
    alarmId: r.alarmId,
    storeId: r.storeId,
    storeName: r.storeName,
    equipmentId: r.equipmentId,
    equipmentName: r.equipmentName,
    controllerId: r.controllerId ?? undefined,
    controllerName: r.controllerName ?? undefined,
    alarmType: toAlarmType(r.alarmType),
    severity: r.severity,
    message: r.message,
    occurredAt: r.occurredAt,
    resolvedAt: r.resolvedAt ?? undefined,
  }));
}

export async function fetchEquipmentChangeHistory(equipmentId: number): Promise<EquipmentChangeHistory[]> {
  return apiRequest<EquipmentChangeHistory[]>({
    method: 'get',
    url: `/monitoring/equipment/${equipmentId}/change-history`,
  });
}
