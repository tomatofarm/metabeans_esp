import type { ControllerSensorData, RealtimeMonitoringData, RealtimeControllerData, SensorHistoryDataPoint } from '../../types/sensor.types';
import { mockDelay, mockStoreTree } from './common.mock';
import { assertMockEquipmentStoreAccess, type AuthorizedStoresParam } from '../../utils/mockAccess';
import { SENSOR_RANGES } from '../../utils/constants';

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

// 센서 데이터 생성기 (CLAUDE.md SENSOR_RANGES 준수)
export function generateMockSensorData(
  controllerId: string,
  overrides?: Partial<ControllerSensorData>,
): ControllerSensorData {
  return {
    controllerId,
    timestamp: Math.floor(Date.now() / 1000),
    pm25: randomFloat(SENSOR_RANGES.pm25.min, SENSOR_RANGES.pm25.max, SENSOR_RANGES.pm25.decimals),
    pm10: randomFloat(SENSOR_RANGES.pm10.min, SENSOR_RANGES.pm10.max, SENSOR_RANGES.pm10.decimals),
    diffPressure: randomFloat(SENSOR_RANGES.diffPressure.min, SENSOR_RANGES.diffPressure.max, SENSOR_RANGES.diffPressure.decimals),
    oilLevel: randomChoice([0, 1]),
    ppTemp: randomInt(SENSOR_RANGES.ppTemp.min, SENSOR_RANGES.ppTemp.max),
    ppSpark: randomInt(SENSOR_RANGES.ppSpark.min, SENSOR_RANGES.ppSpark.max),
    ppPower: randomChoice([0, 1]),
    ppAlarm: randomChoice([0, 1]),
    fanSpeed: randomChoice([0, 1, 2, 3]),
    fanMode: randomChoice([0, 1]),
    fanRunning: randomChoice([0, 1]),
    fanFreq: randomFloat(SENSOR_RANGES.fanFreq.min, SENSOR_RANGES.fanFreq.max, SENSOR_RANGES.fanFreq.decimals),
    fanTargetPct: randomFloat(SENSOR_RANGES.fanTargetPct.min, SENSOR_RANGES.fanTargetPct.max, SENSOR_RANGES.fanTargetPct.decimals),
    damperMode: randomChoice([0, 1]),
    flow: randomFloat(SENSOR_RANGES.flow.min, SENSOR_RANGES.flow.max, SENSOR_RANGES.flow.decimals),
    damperCtrl: randomFloat(SENSOR_RANGES.damperCtrl.min, SENSOR_RANGES.damperCtrl.max, SENSOR_RANGES.damperCtrl.decimals),
    damper: randomFloat(SENSOR_RANGES.damper.min, SENSOR_RANGES.damper.max, SENSOR_RANGES.damper.decimals),
    inletTemp: randomFloat(SENSOR_RANGES.inletTemp.min, SENSOR_RANGES.inletTemp.max, SENSOR_RANGES.inletTemp.decimals),
    velocity: randomFloat(SENSOR_RANGES.velocity.min, SENSOR_RANGES.velocity.max, SENSOR_RANGES.velocity.decimals),
    ductDp: randomFloat(SENSOR_RANGES.ductDp.min, SENSOR_RANGES.ductDp.max, SENSOR_RANGES.ductDp.decimals),
    statusFlags: 63,
    ...overrides,
  };
}

// 장비 ID → 컨트롤러 매핑 (mockStoreTree 기반)
function getControllersForEquipment(equipmentId: number): { controllerId: number; ctrlDeviceId: string; connectionStatus: 'ONLINE' | 'OFFLINE' }[] {
  for (const store of mockStoreTree) {
    for (const floor of store.floors) {
      for (const gw of floor.gateways) {
        for (const eq of gw.equipments) {
          if (eq.equipmentId === equipmentId) {
            return eq.controllers.map((c) => ({
              controllerId: c.controllerId,
              ctrlDeviceId: c.ctrlDeviceId,
              connectionStatus: c.connectionStatus,
            }));
          }
        }
      }
    }
  }
  return [];
}

// 장비 메타데이터 조회
function getEquipmentMeta(equipmentId: number): { equipmentName: string; storeName: string; connectionStatus: 'ONLINE' | 'OFFLINE' } | null {
  for (const store of mockStoreTree) {
    for (const floor of store.floors) {
      for (const gw of floor.gateways) {
        for (const eq of gw.equipments) {
          if (eq.equipmentId === equipmentId) {
            return {
              equipmentName: eq.equipmentName ?? `ESP #${equipmentId}`,
              storeName: store.storeName,
              connectionStatus: eq.connectionStatus,
            };
          }
        }
      }
    }
  }
  return null;
}

// 이상치 시나리오 적용 (일부 장비에 문제 상황을 시뮬레이션)
const ABNORMAL_SCENARIOS: Record<number, Partial<ControllerSensorData>> = {
  1: { inletTemp: 105.3, ppTemp: 62, ppPower: 1, ppAlarm: 0 },
  5: { ppPower: 0 },
};

// Mock API: 실시간 센서 데이터 조회
export async function mockGetRealtimeSensorData(
  equipmentId: number,
  authorizedStoreIds: AuthorizedStoresParam = null,
): Promise<RealtimeMonitoringData> {
  assertMockEquipmentStoreAccess(equipmentId, authorizedStoreIds);
  const meta = getEquipmentMeta(equipmentId);
  const controllers = getControllersForEquipment(equipmentId);

  const controllerData: RealtimeControllerData[] = controllers.map((ctrl) => {
    const isOffline = ctrl.connectionStatus === 'OFFLINE';
    const overrides = ABNORMAL_SCENARIOS[ctrl.controllerId] ?? {};
    const sensorData = generateMockSensorData(ctrl.ctrlDeviceId, {
      ppPower: isOffline ? 0 : (overrides.ppPower ?? 1),
      ...overrides,
      timestamp: isOffline
        ? Math.floor(Date.now() / 1000) - 3600 // OFFLINE: 1시간 전
        : Math.floor(Date.now() / 1000),
    });

    return {
      controllerId: ctrl.controllerId,
      controllerName: ctrl.ctrlDeviceId,
      connectionStatus: ctrl.connectionStatus,
      lastSeenAt: isOffline
        ? new Date(Date.now() - 3600 * 1000).toISOString()
        : new Date().toISOString(),
      sensorData,
    };
  });

  const data: RealtimeMonitoringData = {
    equipmentId,
    equipmentName: meta?.equipmentName ?? `ESP 집진기 #${equipmentId}`,
    modelName: 'MB-ESP-3000',
    storeName: meta?.storeName ?? '알 수 없음',
    connectionStatus: meta?.connectionStatus ?? 'OFFLINE',
    controllers: controllerData,
  };

  return mockDelay(data, 200);
}

// Mock API: 센서 이력 데이터 (시계열 차트용)
export async function mockGetSensorHistory(
  equipmentId: number,
  _from?: number,
  _to?: number,
  authorizedStoreIds: AuthorizedStoresParam = null,
): Promise<SensorHistoryDataPoint[]> {
  assertMockEquipmentStoreAccess(equipmentId, authorizedStoreIds);
  const controllers = getControllersForEquipment(equipmentId);
  const now = Math.floor(Date.now() / 1000);
  const points: SensorHistoryDataPoint[] = [];

  // 최근 1시간, 10초 간격 → 360개 포인트/컨트롤러
  for (const ctrl of controllers) {
    // 기준 값 (변동의 중심점)
    const basePpTemp = randomInt(40, 55);
    const basePpSpark = randomInt(1000, 4000);
    const basePm25 = randomFloat(15, 45, 1);
    const basePm10 = randomFloat(30, 60, 1);
    const baseDiffPressure = randomFloat(15, 35, 1);
    const baseInletTemp = randomFloat(25, 45, 1);
    const baseFlow = randomFloat(500, 900, 1);
    const baseVelocity = randomFloat(5, 10, 1);
    const baseDuctDp = randomFloat(100, 300, 1);

    for (let i = 360; i >= 0; i--) {
      const ts = now - i * 10;
      // 약간의 랜덤 변동 (±5~10% 범위)
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
