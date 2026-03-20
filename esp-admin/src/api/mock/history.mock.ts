import type { ControlCommand, ControlTarget, ControlResult } from '../../types/control.types';
import type { EquipmentChangeHistory, AlarmEvent, AlarmType, AlarmSeverity } from '../../types/equipment.types';
import type { SensorHistoryDataPoint } from '../../types/sensor.types';
import { SENSOR_RANGES } from '../../utils/constants';
import { mockDelay, mockStoreTree } from './common.mock';
import { assertMockEquipmentStoreAccess, type AuthorizedStoresParam } from '../../utils/mockAccess';

// --- 유틸 ---
function randomFloat(min: number, max: number, decimals: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

// 장비 ID → 컨트롤러 매핑
function getControllersForEquipment(equipmentId: number): { controllerId: number; ctrlDeviceId: string }[] {
  for (const store of mockStoreTree) {
    for (const floor of store.floors) {
      for (const gw of floor.gateways) {
        for (const eq of gw.equipments) {
          if (eq.equipmentId === equipmentId) {
            return eq.controllers.map((c) => ({
              controllerId: c.controllerId,
              ctrlDeviceId: c.ctrlDeviceId,
            }));
          }
        }
      }
    }
  }
  return [];
}

// 장비 메타 정보 조회
function getEquipmentMeta(equipmentId: number): { storeName: string; equipmentName: string; storeId: number } | null {
  for (const store of mockStoreTree) {
    for (const floor of store.floors) {
      for (const gw of floor.gateways) {
        for (const eq of gw.equipments) {
          if (eq.equipmentId === equipmentId) {
            return {
              storeName: store.storeName,
              equipmentName: eq.equipmentName ?? `ESP #${equipmentId}`,
              storeId: store.storeId,
            };
          }
        }
      }
    }
  }
  return null;
}

// --- 센서 이력 (기간 지원, 집계 모드) ---
export async function mockGetSensorHistoryRange(
  equipmentId: number,
  from: number, // epoch seconds
  to: number,   // epoch seconds
  authorizedStoreIds: AuthorizedStoresParam = null,
): Promise<SensorHistoryDataPoint[]> {
  assertMockEquipmentStoreAccess(equipmentId, authorizedStoreIds);
  const controllers = getControllersForEquipment(equipmentId);
  const points: SensorHistoryDataPoint[] = [];
  const durationSec = to - from;

  // 기간에 따라 간격 결정: 1일 이하=10초, 7일 이하=5분, 30일 이하=1시간
  let intervalSec: number;
  if (durationSec <= 86400) {
    intervalSec = 10;
  } else if (durationSec <= 7 * 86400) {
    intervalSec = 300;
  } else {
    intervalSec = 3600;
  }

  const maxPoints = Math.min(Math.floor(durationSec / intervalSec), 2000);

  for (const ctrl of controllers) {
    const basePpTemp = randomInt(40, 55);
    const basePpSpark = randomInt(1000, 4000);
    const basePm25 = randomFloat(15, 45, 1);
    const basePm10 = randomFloat(30, 60, 1);
    const baseDiffPressure = randomFloat(15, 35, 1);
    const baseInletTemp = randomFloat(25, 45, 1);
    const baseFlow = randomFloat(500, 900, 1);
    const baseVelocity = randomFloat(5, 10, 1);
    const baseDuctDp = randomFloat(100, 300, 1);

    for (let i = maxPoints; i >= 0; i--) {
      const ts = to - i * intervalSec;
      if (ts < from) continue;
      const jitter = () => (Math.random() - 0.5) * 0.1;
      points.push({
        timestamp: ts,
        controllerId: ctrl.ctrlDeviceId,
        controllerName: ctrl.ctrlDeviceId,
        ppTemp: Math.round(basePpTemp * (1 + jitter())),
        ppSpark: Math.max(0, Math.min(9999, Math.round(basePpSpark * (1 + jitter() * 2)))),
        pm25: parseFloat((basePm25 * (1 + jitter())).toFixed(1)),
        pm10: parseFloat((basePm10 * (1 + jitter())).toFixed(1)),
        diffPressure: parseFloat((baseDiffPressure * (1 + jitter())).toFixed(1)),
        inletTemp: parseFloat((baseInletTemp * (1 + jitter())).toFixed(1)),
        flow: parseFloat((baseFlow * (1 + jitter())).toFixed(1)),
        velocity: parseFloat((baseVelocity * (1 + jitter())).toFixed(1)),
        ductDp: parseFloat((baseDuctDp * (1 + jitter())).toFixed(1)),
      });
    }
  }

  return mockDelay(points, 300);
}

// --- 제어 이력 (기간/유형 필터) ---
export async function mockGetControlHistoryRange(
  equipmentId: number,
  from: number,
  to: number,
  targetFilter?: ControlTarget,
  authorizedStoreIds: AuthorizedStoresParam = null,
): Promise<ControlCommand[]> {
  assertMockEquipmentStoreAccess(equipmentId, authorizedStoreIds);
  const history: ControlCommand[] = [];
  const durationMs = (to - from) * 1000;
  const targets: ControlTarget[] = [0, 1, 2];
  const results: ControlResult[] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAIL'];
  const count = Math.min(50, Math.max(20, Math.floor(durationMs / (5 * 60 * 1000))));

  for (let i = 0; i < count; i++) {
    const target = randomChoice(targets);
    if (targetFilter !== undefined && target !== targetFilter) continue;

    const result = randomChoice(results);
    let action = 0;
    let value: number | undefined;

    switch (target) {
      case 0:
        action = randomChoice([0, 1, 2]);
        break;
      case 1:
        action = randomChoice([1, 2, 3]);
        if (action === 1) value = randomChoice([0, 10, 25, 40, 60, 75, 90, 100]);
        if (action === 2) value = randomChoice([0, 1]);
        if (action === 3) value = parseFloat((Math.random() * 600 + 400).toFixed(1));
        break;
      case 2:
        action = randomChoice([0, 1, 2, 3, 4, 5]);
        if (action === 4) value = randomChoice([0, 1]);
        if (action === 5) value = parseFloat((Math.random() * 10 + 2).toFixed(1));
        break;
    }

    const requestedAt = new Date(from * 1000 + Math.random() * durationMs).toISOString();
    history.push({
      commandId: 1000 + i,
      cmdId: crypto.randomUUID(),
      storeId: 1,
      gatewayId: 1,
      equipmentIdMqtt: `esp-${String(Math.ceil(Math.random() * 2)).padStart(3, '0')}`,
      controllerIdMqtt: `ctrl-${String(Math.ceil(Math.random() * 3)).padStart(3, '0')}`,
      target,
      action,
      value,
      controlMode: (target === 1 && action >= 2) || (target === 2 && action >= 4) ? 'AUTO' : 'MANUAL',
      requestedBy: randomChoice([1, 2, 3]),
      result,
      failReason: result === 'FAIL' ? '장치 응답 없음' : undefined,
      requestedAt,
      respondedAt: result !== 'PENDING'
        ? new Date(new Date(requestedAt).getTime() + Math.random() * 2000 + 500).toISOString()
        : undefined,
    });
  }

  // 시간 역순 정렬
  history.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  return mockDelay(history, 300);
}

// --- 알람 이력 ---
const ALARM_CONFIGS: { type: AlarmType; label: string; severities: AlarmSeverity[]; getMessage: (severity: AlarmSeverity, value?: number) => string }[] = [
  {
    type: 'COMM_ERROR',
    label: '통신 오류',
    severities: ['YELLOW', 'RED'],
    getMessage: (s) => s === 'RED' ? '통신 끊김 1일 이상' : '통신 끊김 1시간 이상',
  },
  {
    type: 'INLET_TEMP',
    label: '유입 온도 이상',
    severities: ['YELLOW', 'RED'],
    getMessage: (s, v) => s === 'RED' ? `유입 온도 ${v}°C (100°C 초과)` : `유입 온도 ${v}°C (70°C 초과)`,
  },
  {
    type: 'FILTER_CHECK',
    label: '필터 청소 상태 점검',
    severities: ['YELLOW'],
    getMessage: () => '필터 점검 필요: 차압 기준 초과',
  },
  {
    type: 'DUST_PERFORMANCE',
    label: '먼지제거 성능 점검',
    severities: ['RED'],
    getMessage: (_, v) => `먼지 제거 성능 저하 (PM2.5: ${v}µg/m³)`,
  },
  {
    type: 'SPARK',
    label: '스파크 이상',
    severities: ['YELLOW', 'RED'],
    getMessage: (s, v) => s === 'RED' ? `스파크 위험 수준 (${v})` : `스파크 주의 수준 (${v})`,
  },
  {
    type: 'OVER_TEMP',
    label: '보드 과온도',
    severities: ['YELLOW', 'RED'],
    getMessage: (s, v) => s === 'RED' ? `보드 온도 위험 (${v}°C)` : `보드 온도 주의 (${v}°C)`,
  },
];

export async function mockGetAlarmHistory(
  equipmentId: number,
  from: number,
  to: number,
  typeFilter?: AlarmType,
  authorizedStoreIds: AuthorizedStoresParam = null,
): Promise<AlarmEvent[]> {
  assertMockEquipmentStoreAccess(equipmentId, authorizedStoreIds);
  const meta = getEquipmentMeta(equipmentId);
  const controllers = getControllersForEquipment(equipmentId);
  const alarms: AlarmEvent[] = [];
  const durationMs = (to - from) * 1000;
  const count = Math.min(40, Math.max(15, Math.floor(durationMs / (15 * 60 * 1000))));

  for (let i = 0; i < count; i++) {
    const config = randomChoice(ALARM_CONFIGS);
    if (typeFilter && config.type !== typeFilter) continue;

    const severity = randomChoice(config.severities);
    const ctrl = controllers.length > 0 ? randomChoice(controllers) : undefined;
    let value: number | undefined;

    switch (config.type) {
      case 'INLET_TEMP':
        value = severity === 'RED' ? randomFloat(100, 120, 1) : randomFloat(70, 99, 1);
        break;
      case 'DUST_PERFORMANCE':
        value = randomFloat(50, 80, 1);
        break;
      case 'SPARK':
        value = severity === 'RED' ? randomInt(7000, 9999) : randomInt(3000, 6999);
        break;
      case 'OVER_TEMP':
        value = severity === 'RED' ? randomInt(80, 95) : randomInt(60, 79);
        break;
    }

    const occurredAt = new Date(from * 1000 + Math.random() * durationMs).toISOString();
    const isResolved = Math.random() > 0.3;

    alarms.push({
      alarmId: 2000 + i,
      storeId: meta?.storeId ?? 1,
      storeName: meta?.storeName ?? '알 수 없음',
      equipmentId,
      equipmentName: meta?.equipmentName ?? `ESP #${equipmentId}`,
      controllerId: ctrl?.controllerId,
      controllerName: ctrl?.ctrlDeviceId,
      alarmType: config.type,
      severity,
      value,
      message: config.getMessage(severity, value),
      occurredAt,
      resolvedAt: isResolved
        ? new Date(new Date(occurredAt).getTime() + Math.random() * 3600000 + 60000).toISOString()
        : undefined,
    });
  }

  alarms.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return mockDelay(alarms, 300);
}

// --- 장비 변경 이력 ---
const CHANGE_FIELDS = [
  { field: '장비명', gen: () => ({ old: 'ESP 집진기 #1', new: 'ESP 집진기 A-1' }) },
  { field: '셀 타입', gen: () => ({ old: '2셀', new: '3셀' }) },
  { field: '모델', gen: () => ({ old: 'MB-ESP-2000', new: 'MB-ESP-3000' }) },
  { field: '담당 대리점', gen: () => ({ old: '서울 동부 대리점', new: '경기 서부 대리점' }) },
  { field: '파워팩 수량', gen: () => ({ old: String(randomInt(1, 2)), new: String(randomInt(2, 3)) }) },
  { field: '보증 만료일', gen: () => ({ old: '2025-06-30', new: '2026-06-30' }) },
  { field: '운용 상태', gen: () => randomChoice([
    { old: '정상', new: '점검중' },
    { old: '점검중', new: '정상' },
    { old: '정상', new: '비활성' },
  ]) },
];

const CHANGERS = ['관리자', '김대리', '박본사'];

export async function mockGetEquipmentChangeHistory(
  equipmentId: number,
  authorizedStoreIds: AuthorizedStoresParam = null,
): Promise<EquipmentChangeHistory[]> {
  assertMockEquipmentStoreAccess(equipmentId, authorizedStoreIds);
  const changes: EquipmentChangeHistory[] = [];
  const now = Date.now();
  const count = randomInt(8, 15);

  for (let i = 0; i < count; i++) {
    const fieldConfig = randomChoice(CHANGE_FIELDS);
    const values = fieldConfig.gen();
    changes.push({
      changeId: 3000 + i,
      equipmentId,
      changedField: fieldConfig.field,
      oldValue: values.old,
      newValue: values.new,
      changedBy: randomChoice(CHANGERS),
      changedAt: new Date(now - i * randomInt(86400000, 604800000)).toISOString(),
    });
  }

  changes.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  return mockDelay(changes, 200);
}
