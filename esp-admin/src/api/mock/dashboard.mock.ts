import dayjs from 'dayjs';
import type {
  DashboardSummary,
  DashboardIssueCategory,
  DashboardIssueItem,
  EsgSummary,
  StoreMapItem,
  StoreDashboard,
  StoreEquipmentStatus,
  StoreAsRequest,
  FloorIaqData,
  EquipmentDashboard,
  ControllerStatus,
  SensorHistoryPoint,
  EmergencyAlarm,
} from '../../types/dashboard.types';
import type { GatewaySensorData, ControllerSensorData } from '../../types/sensor.types';
import type { ASRequestListItem } from '../../types/as-service.types';
import { mockDelay, wrapResponse, STORE_ID_MAP } from './common.mock';
import { filterItemsByStoreAccess, type AuthorizedStoresParam } from '../../utils/mockAccess';
import { SENSOR_RANGES } from '../../utils/constants';
import { FILTER_CHECK_MESSAGE } from '../../utils/statusHelper';

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

function generateControllerSensorData(
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
    ppPower: 1,
    ppAlarm: 0,
    fanSpeed: 2,
    fanMode: 0,
    fanRunning: 1,
    fanFreq: randomFloat(SENSOR_RANGES.fanFreq.min, SENSOR_RANGES.fanFreq.max, SENSOR_RANGES.fanFreq.decimals),
    fanTargetPct: 0,
    damperMode: 0,
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

function generateGatewaySensorData(gatewayId: number): GatewaySensorData {
  return {
    gatewayId,
    timestamp: Math.floor(Date.now() / 1000),
    pm1_0: randomFloat(5, 25, 1),
    pm2_5: randomFloat(5, 30, 1),
    pm4_0: randomFloat(15, 70, 1),
    pm10: randomFloat(20, 90, 1),
    temperature: randomFloat(20, 30, 1),
    humidity: randomFloat(40, 70, 1),
    vocIndex: randomInt(50, 200),
    noxIndex: randomInt(10, 80),
    co2: randomFloat(400, 900, 0),
    o3: randomFloat(0.01, 0.08, 3),
    co: randomFloat(0.5, 3.0, 1),
    hcho: randomFloat(5, 25, 1),
  };
}

// --- Mock 데이터 ---

// 1. 대시보드 요약
export async function mockGetDashboardSummary(): Promise<DashboardSummary> {
  const data: DashboardSummary = {
    totalStores: 3,
    activeStores: 3,
    totalEquipments: 5,
    normalEquipments: 3,
    pendingAsRequests: 2,
    emergencyAlarms: 2,
  };
  return mockDelay(data, 300);
}

// 2. 이슈 목록 (4개 카테고리)
export async function mockGetIssueList(): Promise<DashboardIssueCategory[]> {
  const now = dayjs();

  const commErrors: DashboardIssueItem[] = [
    {
      issueId: 1,
      storeId: 2,
      storeName: '숯불갈비 홍대점',
      equipmentId: 4,
      equipmentName: 'ESP 집진기 #1 (B1)',
      issueType: 'COMM_ERROR',
      severity: 'red',
      message: '통신 끊김 1일 이상',
      occurredAt: now.subtract(26, 'hour').toISOString(),
    },
    {
      issueId: 2,
      storeId: 2,
      storeName: '숯불갈비 홍대점',
      equipmentId: 3,
      equipmentName: 'ESP 집진기 #1 (1F)',
      issueType: 'COMM_ERROR',
      severity: 'yellow',
      message: '통신 끊김 2시간',
      occurredAt: now.subtract(2, 'hour').toISOString(),
    },
  ];

  const inletTempIssues: DashboardIssueItem[] = [
    {
      issueId: 3,
      storeId: 1,
      storeName: '바삭치킨 강남점',
      equipmentId: 1,
      equipmentName: 'ESP 집진기 #1',
      issueType: 'INLET_TEMP',
      severity: 'red',
      currentValue: 105.3,
      unit: '°C',
      message: '유입 온도 100°C 이상 위험',
      occurredAt: now.subtract(30, 'minute').toISOString(),
    },
    {
      issueId: 4,
      storeId: 3,
      storeName: '로스팅하우스 신촌점',
      equipmentId: 5,
      equipmentName: 'ESP 집진기 #1',
      issueType: 'INLET_TEMP',
      severity: 'yellow',
      currentValue: 78.5,
      unit: '°C',
      message: '유입 온도 70°C 이상 주의',
      occurredAt: now.subtract(1, 'hour').toISOString(),
    },
  ];

  const filterCheckIssues: DashboardIssueItem[] = [
    {
      issueId: 5,
      storeId: 1,
      storeName: '바삭치킨 강남점',
      equipmentId: 2,
      equipmentName: 'ESP 집진기 #2',
      issueType: 'FILTER_CHECK',
      severity: 'yellow',
      currentValue: 42.5,
      unit: 'Pa',
      message: FILTER_CHECK_MESSAGE,
      occurredAt: now.subtract(3, 'hour').toISOString(),
    },
  ];

  const dustRemovalIssues: DashboardIssueItem[] = [
    {
      issueId: 6,
      storeId: 2,
      storeName: '숯불갈비 홍대점',
      equipmentId: 3,
      equipmentName: 'ESP 집진기 #1 (1F)',
      issueType: 'DUST_REMOVAL',
      severity: 'red',
      currentValue: 68.5,
      unit: 'µg/m³',
      message: '먼지제거 성능 점검 필요',
      occurredAt: now.subtract(45, 'minute').toISOString(),
    },
  ];

  const categories: DashboardIssueCategory[] = [
    {
      type: 'COMM_ERROR',
      label: '통신 연결 상태 점검',
      description: 'Yellow: 끊김 1시간 이상 / Red: 끊김 하루 이상',
      items: commErrors,
      yellowCount: commErrors.filter((i) => i.severity === 'yellow').length,
      redCount: commErrors.filter((i) => i.severity === 'red').length,
    },
    {
      type: 'INLET_TEMP',
      label: '유입 온도 이상',
      description: 'Yellow: 70°C 이상 / Red: 100°C 이상',
      items: inletTempIssues,
      yellowCount: inletTempIssues.filter((i) => i.severity === 'yellow').length,
      redCount: inletTempIssues.filter((i) => i.severity === 'red').length,
    },
    {
      type: 'FILTER_CHECK',
      label: '필터 청소 상태 점검',
      description: 'Yellow: 점검 필요',
      items: filterCheckIssues,
      yellowCount: filterCheckIssues.filter((i) => i.severity === 'yellow').length,
      redCount: filterCheckIssues.filter((i) => i.severity === 'red').length,
    },
    {
      type: 'DUST_REMOVAL',
      label: '먼지제거 성능 점검',
      description: 'Red: 점검 필요',
      items: dustRemovalIssues,
      yellowCount: dustRemovalIssues.filter((i) => i.severity === 'yellow').length,
      redCount: dustRemovalIssues.filter((i) => i.severity === 'red').length,
    },
  ];

  return mockDelay(categories, 400);
}

// 3. 매장 지도 데이터
export async function mockGetStoreMapData(): Promise<StoreMapItem[]> {
  const data: StoreMapItem[] = [
    {
      storeId: 1,
      storeName: '바삭치킨 강남점',
      address: '서울시 강남구 테헤란로 123',
      latitude: 37.4979,
      longitude: 127.0276,
      status: 'red',
      equipmentCount: 2,
      issueCount: 2,
    },
    {
      storeId: 2,
      storeName: '숯불갈비 홍대점',
      address: '서울시 마포구 홍익로 45',
      latitude: 37.5563,
      longitude: 126.9234,
      status: 'red',
      equipmentCount: 2,
      issueCount: 3,
    },
    {
      storeId: 3,
      storeName: '로스팅하우스 신촌점',
      address: '서울시 서대문구 신촌로 67',
      latitude: 37.5599,
      longitude: 126.9371,
      status: 'yellow',
      equipmentCount: 1,
      issueCount: 1,
    },
  ];
  return mockDelay(data, 300);
}

// 4. 개별 매장 대시보드
export async function mockGetStoreDashboard(storeId: number): Promise<StoreDashboard> {
  const storeMap: Record<number, StoreDashboard> = {
    1: {
      storeId: 1,
      storeName: '바삭치킨 강남점',
      address: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      businessType: '튀김',
      iaqData: generateGatewaySensorData(1),
      floorIaqList: [
        { floorId: 1, floorCode: '1F', floorName: '1층 주방', iaqData: generateGatewaySensorData(1) },
      ],
      equipments: [
        {
          equipmentId: 1,
          equipmentName: 'ESP 집진기 #1',
          status: 'red',
          connectionStatus: 'ONLINE',
          controllerCount: 2,
          normalControllers: 1,
          lastSeenAt: new Date().toISOString(),
        },
        {
          equipmentId: 2,
          equipmentName: 'ESP 집진기 #2',
          status: 'yellow',
          connectionStatus: 'ONLINE',
          controllerCount: 1,
          normalControllers: 1,
          lastSeenAt: new Date().toISOString(),
        },
      ],
      issues: [
        {
          issueId: 3,
          storeId: 1,
          storeName: '바삭치킨 강남점',
          equipmentId: 1,
          equipmentName: 'ESP 집진기 #1',
          issueType: 'INLET_TEMP',
          severity: 'red',
          currentValue: 105.3,
          unit: '°C',
          message: '유입 온도 100°C 이상 위험',
          occurredAt: dayjs().subtract(30, 'minute').toISOString(),
        },
        {
          issueId: 5,
          storeId: 1,
          storeName: '바삭치킨 강남점',
          equipmentId: 2,
          equipmentName: 'ESP 집진기 #2',
          issueType: 'FILTER_CHECK',
          severity: 'yellow',
          currentValue: 42.5,
          unit: 'Pa',
          message: FILTER_CHECK_MESSAGE,
          occurredAt: dayjs().subtract(3, 'hour').toISOString(),
        },
      ],
      recentAsRequests: [
        {
          requestId: 1,
          equipmentName: 'ESP 집진기 #1',
          issueType: 'MALFUNCTION',
          status: 'IN_PROGRESS',
          createdAt: dayjs().subtract(2, 'day').toISOString(),
          description: '파워팩 온도 이상 발생',
        },
        {
          requestId: 2,
          equipmentName: 'ESP 집진기 #2',
          issueType: 'CLEANING',
          status: 'PENDING',
          createdAt: dayjs().subtract(1, 'day').toISOString(),
          description: '필터 세척 필요',
        },
      ],
    },
    2: {
      storeId: 2,
      storeName: '숯불갈비 홍대점',
      address: '서울시 마포구 홍익로 45',
      phone: '02-2345-6789',
      businessType: '굽기',
      iaqData: generateGatewaySensorData(2),
      floorIaqList: [
        { floorId: 2, floorCode: '1F', floorName: '1층', iaqData: generateGatewaySensorData(2) },
        { floorId: 3, floorCode: 'B1', floorName: '지하 1층', iaqData: generateGatewaySensorData(3) },
      ],
      equipments: [
        {
          equipmentId: 3,
          equipmentName: 'ESP 집진기 #1 (1F)',
          status: 'yellow',
          connectionStatus: 'ONLINE',
          controllerCount: 2,
          normalControllers: 1,
          lastSeenAt: new Date().toISOString(),
        },
        {
          equipmentId: 4,
          equipmentName: 'ESP 집진기 #1 (B1)',
          status: 'red',
          connectionStatus: 'OFFLINE',
          controllerCount: 1,
          normalControllers: 0,
          lastSeenAt: dayjs().subtract(26, 'hour').toISOString(),
        },
      ],
      issues: [
        {
          issueId: 1,
          storeId: 2,
          storeName: '숯불갈비 홍대점',
          equipmentId: 4,
          equipmentName: 'ESP 집진기 #1 (B1)',
          issueType: 'COMM_ERROR',
          severity: 'red',
          message: '통신 끊김 1일 이상',
          occurredAt: dayjs().subtract(26, 'hour').toISOString(),
        },
        {
          issueId: 2,
          storeId: 2,
          storeName: '숯불갈비 홍대점',
          equipmentId: 3,
          equipmentName: 'ESP 집진기 #1 (1F)',
          issueType: 'COMM_ERROR',
          severity: 'yellow',
          message: '통신 끊김 2시간',
          occurredAt: dayjs().subtract(2, 'hour').toISOString(),
        },
        {
          issueId: 6,
          storeId: 2,
          storeName: '숯불갈비 홍대점',
          equipmentId: 3,
          equipmentName: 'ESP 집진기 #1 (1F)',
          issueType: 'DUST_REMOVAL',
          severity: 'red',
          currentValue: 68.5,
          unit: 'µg/m³',
          message: '먼지제거 성능 점검 필요',
          occurredAt: dayjs().subtract(45, 'minute').toISOString(),
        },
      ],
      recentAsRequests: [],
    },
    3: {
      storeId: 3,
      storeName: '로스팅하우스 신촌점',
      address: '서울시 서대문구 신촌로 67',
      phone: '02-3456-7890',
      businessType: '커피로스팅',
      iaqData: generateGatewaySensorData(4),
      floorIaqList: [
        { floorId: 4, floorCode: '1F', floorName: '1층', iaqData: generateGatewaySensorData(4) },
      ],
      equipments: [
        {
          equipmentId: 5,
          equipmentName: 'ESP 집진기 #1',
          status: 'yellow',
          connectionStatus: 'ONLINE',
          controllerCount: 1,
          normalControllers: 1,
          lastSeenAt: new Date().toISOString(),
        },
      ],
      issues: [
        {
          issueId: 4,
          storeId: 3,
          storeName: '로스팅하우스 신촌점',
          equipmentId: 5,
          equipmentName: 'ESP 집진기 #1',
          issueType: 'INLET_TEMP',
          severity: 'yellow',
          currentValue: 78.5,
          unit: '°C',
          message: '유입 온도 70°C 이상 주의',
          occurredAt: dayjs().subtract(1, 'hour').toISOString(),
        },
      ],
      recentAsRequests: [],
    },
  };

  const data = storeMap[storeId] ?? storeMap[1]!;
  return mockDelay(data, 400);
}

// 5. 장비별 대시보드
export async function mockGetEquipmentDashboard(equipmentId: number): Promise<EquipmentDashboard> {
  const now = Math.floor(Date.now() / 1000);

  // 센서 이력 생성 (최근 1시간, 10초 간격 → 360개 포인트 중 간추려서 60개)
  function generateHistory(ctrlId: string): SensorHistoryPoint[] {
    const points: SensorHistoryPoint[] = [];
    for (let i = 60; i >= 0; i--) {
      points.push({
        timestamp: now - i * 60,
        controllerId: ctrlId,
        ppTemp: randomInt(35, 65),
        ppSpark: randomInt(0, 5000),
      });
    }
    return points;
  }

  const equipmentMap: Record<number, EquipmentDashboard> = {
    1: {
      equipmentId: 1,
      equipmentName: 'ESP 집진기 #1',
      modelName: 'MB-ESP-3000',
      installDate: '2025-06-15',
      dealerName: '서울환경테크',
      storeName: '바삭치킨 강남점',
      status: 'red',
      controllers: [
        {
          controllerId: 1,
          controllerName: 'ctrl-001',
          connectionStatus: 'ONLINE',
          status: 'red',
          sensorData: generateControllerSensorData('ctrl-001', { inletTemp: 105.3, ppTemp: 62 }),
          lastSeenAt: new Date().toISOString(),
        },
        {
          controllerId: 2,
          controllerName: 'ctrl-002',
          connectionStatus: 'ONLINE',
          status: 'green',
          sensorData: generateControllerSensorData('ctrl-002'),
          lastSeenAt: new Date().toISOString(),
        },
      ],
      sensorHistory: [...generateHistory('ctrl-001'), ...generateHistory('ctrl-002')],
    },
    2: {
      equipmentId: 2,
      equipmentName: 'ESP 집진기 #2',
      modelName: 'MB-ESP-2000',
      installDate: '2025-08-20',
      dealerName: '서울환경테크',
      storeName: '바삭치킨 강남점',
      status: 'yellow',
      controllers: [
        {
          controllerId: 3,
          controllerName: 'ctrl-003',
          connectionStatus: 'ONLINE',
          status: 'yellow',
          sensorData: generateControllerSensorData('ctrl-003', { diffPressure: 42.5, ppSpark: 4500 }),
          lastSeenAt: new Date().toISOString(),
        },
      ],
      sensorHistory: generateHistory('ctrl-003'),
    },
    3: {
      equipmentId: 3,
      equipmentName: 'ESP 집진기 #1 (1F)',
      modelName: 'MB-ESP-3000',
      installDate: '2025-07-10',
      dealerName: '경기설비',
      storeName: '숯불갈비 홍대점',
      status: 'yellow',
      controllers: [
        {
          controllerId: 4,
          controllerName: 'ctrl-001',
          connectionStatus: 'ONLINE',
          status: 'green',
          sensorData: generateControllerSensorData('ctrl-001'),
          lastSeenAt: new Date().toISOString(),
        },
        {
          controllerId: 5,
          controllerName: 'ctrl-002',
          connectionStatus: 'OFFLINE',
          status: 'yellow',
          sensorData: generateControllerSensorData('ctrl-002', { ppPower: 0 }),
          lastSeenAt: dayjs().subtract(2, 'hour').toISOString(),
        },
      ],
      sensorHistory: [...generateHistory('ctrl-001'), ...generateHistory('ctrl-002')],
    },
    4: {
      equipmentId: 4,
      equipmentName: 'ESP 집진기 #1 (B1)',
      modelName: 'MB-ESP-1500',
      installDate: '2025-09-01',
      dealerName: '경기설비',
      storeName: '숯불갈비 홍대점',
      status: 'red',
      controllers: [
        {
          controllerId: 6,
          controllerName: 'ctrl-001',
          connectionStatus: 'OFFLINE',
          status: 'red',
          sensorData: generateControllerSensorData('ctrl-001', { ppPower: 0 }),
          lastSeenAt: dayjs().subtract(26, 'hour').toISOString(),
        },
      ],
      sensorHistory: generateHistory('ctrl-001'),
    },
    5: {
      equipmentId: 5,
      equipmentName: 'ESP 집진기 #1',
      modelName: 'MB-ESP-2000',
      installDate: '2025-10-05',
      dealerName: '서울환경테크',
      storeName: '로스팅하우스 신촌점',
      status: 'yellow',
      controllers: [
        {
          controllerId: 7,
          controllerName: 'ctrl-001',
          connectionStatus: 'ONLINE',
          status: 'yellow',
          sensorData: generateControllerSensorData('ctrl-001', { inletTemp: 78.5 }),
          lastSeenAt: new Date().toISOString(),
        },
      ],
      sensorHistory: generateHistory('ctrl-001'),
    },
  };

  const data = equipmentMap[equipmentId] ?? equipmentMap[1]!;
  return mockDelay(data, 400);
}

// 6. ESG 지표 요약
export async function mockGetEsgSummary(): Promise<EsgSummary> {
  const data: EsgSummary = {
    totalOilCollected: 342.5,
    energySavingRate: 18.7,
    co2Reduction: 1256.3,
  };
  return mockDelay(data, 200);
}

// --- 역할별 대시보드 Mock ---

function resolveStoreIds(storeIds: string[]): number[] {
  if (storeIds.includes('*')) return [1, 2, 3];
  return storeIds.map((sid) => STORE_ID_MAP[sid]).filter((id): id is number => id !== undefined);
}

// 역할별 대시보드 요약
export interface RoleDashboardSummary {
  totalStores: number;
  totalEquipments: number;
  normalEquipments: number;
  pendingAsRequests: number;
  emergencyAlarms: number;
}

export async function mockGetRoleDashboardSummary(storeIds: string[]): Promise<RoleDashboardSummary> {
  const resolved = resolveStoreIds(storeIds);
  const storeMap = await mockGetStoreMapData();
  const filteredStores = storeMap.filter((s) => resolved.includes(s.storeId));
  const totalEquipments = filteredStores.reduce((sum, s) => sum + s.equipmentCount, 0);
  const issues = await mockGetIssueList();
  const allItems = issues.flatMap((c) => c.items).filter((i) => resolved.includes(i.storeId));
  const redAlarms = allItems.filter((i) => i.severity === 'red');
  const pendingAs = filteredStores.length > 0 ? Math.min(filteredStores.length, 2) : 0;

  const data: RoleDashboardSummary = {
    totalStores: filteredStores.length,
    totalEquipments,
    normalEquipments: Math.max(0, totalEquipments - allItems.length),
    pendingAsRequests: pendingAs,
    emergencyAlarms: redAlarms.length,
  };
  return mockDelay(data, 300);
}

// 역할별 이슈 목록 (storeIds 필터)
export async function mockGetRoleIssueList(storeIds: string[]): Promise<DashboardIssueCategory[]> {
  const resolved = resolveStoreIds(storeIds);
  const allCategories = await mockGetIssueList();

  return allCategories.map((cat) => {
    const filteredItems = cat.items.filter((i) => resolved.includes(i.storeId));
    return {
      ...cat,
      items: filteredItems,
      yellowCount: filteredItems.filter((i) => i.severity === 'yellow').length,
      redCount: filteredItems.filter((i) => i.severity === 'red').length,
    };
  });
}

// 역할별 매장 목록
export async function mockGetRoleStoreList(storeIds: string[]): Promise<StoreMapItem[]> {
  const resolved = resolveStoreIds(storeIds);
  const allStores = await mockGetStoreMapData();
  return allStores.filter((s) => resolved.includes(s.storeId));
}

// 역할별 최근 A/S 목록
export interface RoleAsRequest {
  requestId: number;
  storeName: string;
  equipmentName: string;
  issueType: string;
  status: string;
  createdAt: string;
  description: string;
}

export async function mockGetRoleRecentAs(storeIds: string[]): Promise<RoleAsRequest[]> {
  const resolved = resolveStoreIds(storeIds);
  const requests: RoleAsRequest[] = [];

  for (const sid of resolved) {
    const store = await mockGetStoreDashboard(sid);
    for (const req of store.recentAsRequests) {
      requests.push({
        requestId: req.requestId,
        storeName: store.storeName,
        equipmentName: req.equipmentName ?? '장비 미지정',
        issueType: req.issueType,
        status: req.status,
        createdAt: req.createdAt,
        description: req.description,
      });
    }
  }

  return mockDelay(requests, 300);
}

// 역할별 긴급 알람 (storeIds 필터)
export async function mockGetRoleEmergencyAlarms(storeIds: string[]): Promise<EmergencyAlarm[]> {
  const resolved = resolveStoreIds(storeIds);
  return mockGetEmergencyAlarms(resolved);
}

// 대시보드용 미처리 A/S 목록 (전체 — ADMIN용)
const PENDING_AS_STATUSES = new Set(['PENDING', 'ACCEPTED', 'ASSIGNED', 'VISIT_SCHEDULED', 'IN_PROGRESS']);

export async function mockGetDashboardPendingAs(limit = 10): Promise<ASRequestListItem[]> {
  // as-service.mock의 데이터를 동적으로 import하여 최신 상태 반영
  const { mockGetASRequests } = await import('./as-service.mock');
  const res = await mockGetASRequests({ pageSize: 100, authorizedStoreIds: null });
  const pending = res.data
    .filter((r) => PENDING_AS_STATUSES.has(r.status))
    .slice(0, limit);
  return mockDelay(pending, 300);
}

// 역할별 대시보드 미처리 A/S 목록 (storeIds 필터)
export async function mockGetRoleDashboardPendingAs(storeIds: string[], limit = 10): Promise<ASRequestListItem[]> {
  const resolved = resolveStoreIds(storeIds);
  const { mockGetASRequests } = await import('./as-service.mock');
  const res = await mockGetASRequests({ pageSize: 100, authorizedStoreIds: resolved });
  const pending = res.data
    .filter((r) => PENDING_AS_STATUSES.has(r.status) && resolved.includes(r.storeId))
    .slice(0, limit);
  return mockDelay(pending, 300);
}

// 7. 긴급 알람 목록 (Red만)
export async function mockGetEmergencyAlarms(
  authorizedStoreIds: AuthorizedStoresParam = null,
): Promise<EmergencyAlarm[]> {
  const now = dayjs();
  const data: EmergencyAlarm[] = [
    {
      alarmId: 1,
      storeId: 2,
      storeName: '숯불갈비 홍대점',
      equipmentId: 4,
      equipmentName: 'ESP 집진기 #1 (B1)',
      controllerId: 6,
      controllerName: 'ctrl-001',
      alarmType: 'COMM_ERROR',
      severity: 'RED',
      message: '통신 끊김 1일 이상 — 즉시 점검 필요',
      occurredAt: now.subtract(26, 'hour').toISOString(),
      status: 'ACTIVE',
    },
    {
      alarmId: 2,
      storeId: 1,
      storeName: '바삭치킨 강남점',
      equipmentId: 1,
      equipmentName: 'ESP 집진기 #1',
      controllerId: 1,
      controllerName: 'ctrl-001',
      alarmType: 'INLET_TEMP_ABNORMAL',
      severity: 'RED',
      message: '유입 온도 105.3°C — 100°C 이상 위험',
      occurredAt: now.subtract(30, 'minute').toISOString(),
      status: 'ACTIVE',
    },
  ];
  const filtered = filterItemsByStoreAccess(data, authorizedStoreIds);
  return mockDelay(filtered, 300);
}
