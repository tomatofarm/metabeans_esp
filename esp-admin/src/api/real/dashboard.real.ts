import { apiRequest } from './apiHelpers';
import type { StatusLevel } from '../../utils/constants';
import { INLET_TEMP_THRESHOLDS } from '../../utils/constants';
import type {
  DashboardSummary,
  DashboardIssueCategory,
  DashboardIssueItem,
  DashboardIssueType,
  EsgSummary,
  StoreMapItem,
  StoreDashboard,
  StoreEquipmentStatus,
  StoreAsRequest,
  EquipmentDashboard,
  ControllerStatus,
  EmergencyAlarm,
  RoleDashboardSummary,
  SensorHistoryPoint,
} from '../../types/dashboard.types';
import type { GatewaySensorData, ControllerSensorData } from '../../types/sensor.types';
import type { AlarmType, AlarmStatus } from '../../types/system.types';
import type { ASRequestListItem, ASStatus, FaultType, IssueType } from '../../types/as-service.types';
import type { AuthorizedStoresParam } from '../../utils/mockAccess';

/** 백엔드 알람 행 (issues / alarms 응답) */
interface ApiAlarmRow {
  alarmId: number;
  storeId: number;
  gatewayId?: number | null;
  equipmentId?: number | null;
  controllerId?: number | null;
  alarmType: string;
  severity: string;
  message?: string | null;
  occurredAt: string;
  status: string;
  storeName: string;
  equipmentName: string;
  controllerName?: string;
}

interface SummaryApi {
  storeCount: number;
  activeEquipmentCount: number;
  offlineEquipmentCount: number;
  asRequestPending: number;
  asRequestInProgress: number;
  criticalAlarmCount: number;
  warningAlarmCount: number;
}

const CATEGORY_META: Record<
  DashboardIssueType,
  { label: string; description: string }
> = {
  COMM_ERROR: {
    label: '통신 연결 상태 점검',
    description: 'Yellow: 끊김 1시간 이상 / Red: 끊김 하루 이상',
  },
  INLET_TEMP: {
    label: '유입 온도 이상',
    description: 'Yellow: 70°C 이상 / Red: 100°C 이상',
  },
  FILTER_CHECK: {
    label: '필터 청소 상태 점검',
    description: 'Yellow: 점검 필요',
  },
  DUST_REMOVAL: {
    label: '먼지제거 성능 점검',
    description: 'Red: 점검 필요',
  },
};

const ISSUE_TYPE_ORDER: DashboardIssueType[] = ['COMM_ERROR', 'INLET_TEMP', 'FILTER_CHECK', 'DUST_REMOVAL'];

function mapAlarmTypeToDashboardIssueType(t: string): DashboardIssueType {
  switch (t) {
    case 'COMM_ERROR':
      return 'COMM_ERROR';
    case 'INLET_TEMP_ABNORMAL':
      return 'INLET_TEMP';
    case 'FILTER_CHECK':
      return 'FILTER_CHECK';
    case 'DUST_REMOVAL_CHECK':
      return 'DUST_REMOVAL';
    default:
      return 'COMM_ERROR';
  }
}

function severityToStatusLevel(s: string): StatusLevel {
  if (s === 'RED') return 'red';
  if (s === 'YELLOW') return 'yellow';
  return 'yellow';
}

function isoAt(v: string | Date): string {
  if (typeof v === 'string') return v;
  return new Date(v).toISOString();
}

function mapAlarmRowsToCategories(rows: ApiAlarmRow[]): DashboardIssueCategory[] {
  const itemsByType = new Map<DashboardIssueType, DashboardIssueItem[]>();
  for (const t of ISSUE_TYPE_ORDER) itemsByType.set(t, []);

  for (const r of rows) {
    const issueType = mapAlarmTypeToDashboardIssueType(r.alarmType);
    const item: DashboardIssueItem = {
      issueId: r.alarmId,
      storeId: r.storeId,
      storeName: r.storeName,
      equipmentId: r.equipmentId ?? 0,
      equipmentName: r.equipmentName || '장비',
      issueType,
      severity: severityToStatusLevel(r.severity),
      message: r.message ?? '',
      occurredAt: isoAt(r.occurredAt as unknown as string),
    };
    itemsByType.get(issueType)!.push(item);
  }

  return ISSUE_TYPE_ORDER.map((type) => {
    const items = itemsByType.get(type)!;
    return {
      type,
      ...CATEGORY_META[type],
      items,
      yellowCount: items.filter((i) => i.severity === 'yellow').length,
      redCount: items.filter((i) => i.severity === 'red').length,
    };
  });
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const s = await apiRequest<SummaryApi>({ method: 'get', url: '/dashboard/summary' });
  return {
    totalStores: s.storeCount,
    activeStores: s.storeCount,
    totalEquipments: s.activeEquipmentCount + s.offlineEquipmentCount,
    normalEquipments: s.activeEquipmentCount,
    pendingAsRequests: s.asRequestPending + s.asRequestInProgress,
    emergencyAlarms: s.criticalAlarmCount,
  };
}

export async function fetchDashboardIssues(): Promise<DashboardIssueCategory[]> {
  const rows = await apiRequest<ApiAlarmRow[]>({ method: 'get', url: '/dashboard/issues' });
  return mapAlarmRowsToCategories(rows);
}

function mapToEmergencyAlarm(r: ApiAlarmRow): EmergencyAlarm {
  return {
    alarmId: r.alarmId,
    storeId: r.storeId,
    storeName: r.storeName,
    equipmentId: r.equipmentId ?? 0,
    equipmentName: r.equipmentName || '장비',
    controllerId: r.controllerId ?? undefined,
    controllerName: r.controllerName,
    alarmType: r.alarmType as AlarmType,
    severity: 'RED',
    message: r.message ?? '',
    occurredAt: isoAt(r.occurredAt as unknown as string),
    status: r.status as AlarmStatus,
  };
}

export async function fetchEmergencyAlarms(
  authorizedStoreIds: AuthorizedStoresParam,
): Promise<EmergencyAlarm[]> {
  const rows = await apiRequest<ApiAlarmRow[]>({ method: 'get', url: '/dashboard/alarms' });
  const mapped = rows.map(mapToEmergencyAlarm);
  if (authorizedStoreIds === null) return mapped;
  if (authorizedStoreIds.length === 0) return [];
  const set = new Set(authorizedStoreIds);
  return mapped.filter((a) => set.has(a.storeId));
}

type StoreTree = {
  storeId: number;
  storeName: string;
  address: string;
  latitude: unknown;
  longitude: unknown;
  businessType: string | null;
  contactPhone: string | null;
  floors: Array<{
    floorId: number;
    floorCode: string;
    floorName: string | null;
    gateways: Array<{ gatewayId: number }>;
    equipment: Array<{
      equipmentId: number;
      equipmentName: string | null;
      connectionStatus: string;
      lastSeenAt: string | null;
      controllers: Array<{ controllerId: number; connectionStatus: string }>;
    }>;
  }>;
};

function countEquipmentInStore(s: StoreTree): number {
  let n = 0;
  for (const f of s.floors) n += f.equipment.length;
  return n;
}

function storeMapStatus(storeId: number, issueRows: ApiAlarmRow[]): StatusLevel {
  const forStore = issueRows.filter((r) => r.storeId === storeId);
  if (forStore.some((r) => r.severity === 'RED')) return 'red';
  if (forStore.some((r) => r.severity === 'YELLOW') || forStore.length > 0) return 'yellow';
  return 'green';
}

export async function fetchStoreMapData(): Promise<StoreMapItem[]> {
  const [tree, issueRows] = await Promise.all([
    apiRequest<StoreTree[]>({ method: 'get', url: '/dashboard/store-tree' }),
    apiRequest<ApiAlarmRow[]>({ method: 'get', url: '/dashboard/issues' }),
  ]);

  return tree.map((store) => {
    const equipmentCount = countEquipmentInStore(store);
    const issueCount = issueRows.filter((r) => r.storeId === store.storeId).length;
    const lat = store.latitude != null ? Number(store.latitude) : 0;
    const lng = store.longitude != null ? Number(store.longitude) : 0;
    return {
      storeId: store.storeId,
      storeName: store.storeName,
      address: store.address,
      latitude: lat,
      longitude: lng,
      status: storeMapStatus(store.storeId, issueRows),
      equipmentCount,
      issueCount,
    };
  });
}

type IaqGateway = {
  gatewayId: number;
  gwDeviceId: string;
  floorName: string;
  iaq: Record<string, number | null> | null;
  updatedAt: string | null;
};

type IaqResponse = {
  storeId: number;
  storeName: string;
  gateways: IaqGateway[];
};

function emptyGatewaySensor(gatewayId: number): GatewaySensorData {
  return {
    gatewayId,
    timestamp: Math.floor(Date.now() / 1000),
    pm1_0: 0,
    pm2_5: 0,
    pm4_0: 0,
    pm10: 0,
    temperature: 0,
    humidity: 0,
    vocIndex: null,
    noxIndex: null,
    co2: 0,
    o3: 0,
    co: 0,
    hcho: 0,
  };
}

function mapIaqToGatewaySensor(g: IaqGateway): GatewaySensorData | null {
  const iaq = g.iaq;
  if (!iaq) return null;
  const n = (x: unknown, d = 0) => (typeof x === 'number' && !Number.isNaN(x) ? x : d);
  return {
    gatewayId: g.gatewayId,
    timestamp: g.updatedAt ? Math.floor(new Date(g.updatedAt).getTime() / 1000) : Math.floor(Date.now() / 1000),
    pm1_0: n(iaq.pm1_0),
    pm2_5: n(iaq.pm2_5),
    pm4_0: n(iaq.pm4_0),
    pm10: n(iaq.pm10),
    temperature: n(iaq.temperature),
    humidity: n(iaq.humidity),
    vocIndex: iaq.vocIndex != null ? n(iaq.vocIndex) : null,
    noxIndex: iaq.noxIndex != null ? n(iaq.noxIndex) : null,
    co2: n(iaq.co2),
    o3: n(iaq.o3),
    co: n(iaq.co),
    hcho: n(iaq.hcho),
  };
}

function alarmsForEquipment(equipmentId: number, rows: ApiAlarmRow[]): ApiAlarmRow[] {
  return rows.filter((r) => r.equipmentId === equipmentId);
}

function equipmentStatusLevel(equipmentId: number, connectionStatus: string, issueRows: ApiAlarmRow[]): StatusLevel {
  if (connectionStatus === 'OFFLINE') return 'red';
  const forEq = alarmsForEquipment(equipmentId, issueRows);
  if (forEq.some((a) => a.severity === 'RED')) return 'red';
  if (forEq.some((a) => a.severity === 'YELLOW')) return 'yellow';
  return 'green';
}

export async function fetchStoreDashboard(storeId: number): Promise<StoreDashboard> {
  const [tree, iaqRes, issueRows, asRows] = await Promise.all([
    apiRequest<StoreTree[]>({ method: 'get', url: '/dashboard/store-tree' }),
    apiRequest<IaqResponse>({ method: 'get', url: `/dashboard/iaq?storeId=${storeId}` }),
    apiRequest<ApiAlarmRow[]>({ method: 'get', url: `/dashboard/issues?storeId=${storeId}` }),
    apiRequest<AsRequestApi[]>({ method: 'get', url: '/as-service/requests' }),
  ]);

  const store = tree.find((s) => s.storeId === storeId);
  if (!store) {
    throw new Error('매장을 찾을 수 없습니다.');
  }

  const storeIssues = issueRows.filter((r) => r.storeId === storeId);
  const issueItems: DashboardIssueItem[] = storeIssues.map((r) => ({
    issueId: r.alarmId,
    storeId: r.storeId,
    storeName: r.storeName,
    equipmentId: r.equipmentId ?? 0,
    equipmentName: r.equipmentName || '장비',
    issueType: mapAlarmTypeToDashboardIssueType(r.alarmType),
    severity: severityToStatusLevel(r.severity),
    message: r.message ?? '',
    occurredAt: isoAt(r.occurredAt as unknown as string),
  }));

  const floorIaqList = iaqRes.gateways.map((g) => ({
    floorId: g.gatewayId,
    floorCode: g.floorName || '—',
    floorName: g.floorName || '—',
    iaqData: mapIaqToGatewaySensor(g) ?? emptyGatewaySensor(g.gatewayId),
  }));

  const firstIaq = iaqRes.gateways.map((g) => mapIaqToGatewaySensor(g)).find(Boolean) ?? null;

  const equipments: StoreEquipmentStatus[] = [];
  for (const f of store.floors) {
    for (const e of f.equipment) {
      const ctrl = e.controllers ?? [];
      const normalControllers = ctrl.filter((c) => c.connectionStatus === 'ONLINE').length;
      equipments.push({
        equipmentId: e.equipmentId,
        equipmentName: e.equipmentName || '장비',
        status: equipmentStatusLevel(e.equipmentId, e.connectionStatus, issueRows),
        connectionStatus: e.connectionStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
        controllerCount: ctrl.length,
        normalControllers,
        lastSeenAt: e.lastSeenAt ? isoAt(e.lastSeenAt as unknown as string) : new Date().toISOString(),
      });
    }
  }

  const recentAsRequests: StoreAsRequest[] = asRows
    .filter((r) => r.storeId === storeId)
    .slice(0, 10)
    .map((r) => ({
      requestId: r.requestId,
      equipmentName: r.equipment?.equipmentName ?? undefined,
      issueType: toIssueType(r.issueType),
      status: r.status as ASStatus,
      createdAt: isoAt(r.createdAt as unknown as string),
      description: r.description,
    }));

  return {
    storeId: store.storeId,
    storeName: store.storeName,
    address: store.address,
    phone: store.contactPhone ?? '',
    businessType: store.businessType ?? '',
    iaqData: firstIaq,
    floorIaqList,
    equipments,
    issues: issueItems,
    recentAsRequests,
  };
}

type AsRequestApi = {
  requestId: number;
  storeId: number;
  equipmentId?: number | null;
  issueType: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  preferredVisitDatetime?: string | null;
  visitScheduledDatetime?: string | null;
  completedAt?: string | null;
  dealerId?: number | null;
  store?: { storeName: string };
  equipment?: { equipmentName: string | null } | null;
};

function mapIssueTypeToFaultType(s: string): FaultType {
  const allowed: FaultType[] = ['POWER', 'SPARK', 'TEMPERATURE', 'COMM_ERROR', 'NOISE', 'OTHER'];
  return allowed.includes(s as FaultType) ? (s as FaultType) : 'OTHER';
}

function toIssueType(s: string): IssueType {
  const allowed: IssueType[] = ['MALFUNCTION', 'CLEANING', 'REPLACEMENT', 'INSPECTION', 'OTHER'];
  return allowed.includes(s as IssueType) ? (s as IssueType) : 'OTHER';
}

function mapAsToListItem(r: AsRequestApi): ASRequestListItem {
  return {
    requestId: r.requestId,
    storeId: r.storeId,
    storeName: r.store?.storeName ?? '',
    equipmentId: r.equipmentId ?? undefined,
    equipmentName: r.equipment?.equipmentName ?? undefined,
    urgency: 'NORMAL',
    faultType: mapIssueTypeToFaultType(r.issueType),
    description: r.description,
    status: r.status as ASStatus,
    dealerId: r.dealerId ?? undefined,
    createdAt: isoAt(r.createdAt as unknown as string),
    updatedAt: isoAt(r.updatedAt as unknown as string),
    preferredVisitDatetime: r.preferredVisitDatetime ?? undefined,
    visitScheduledDatetime: r.visitScheduledDatetime
      ? isoAt(r.visitScheduledDatetime as unknown as string)
      : undefined,
    completedAt: r.completedAt ? isoAt(r.completedAt as unknown as string) : undefined,
  };
}

function sortAsByCreatedDesc(a: AsRequestApi, b: AsRequestApi) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** 대시보드 «A/S 요청 현황» — **최근** 요청(상태 무관) 정렬, 접근 가능 매장만(역할용). */
export async function fetchDashboardPendingAs(limit = 15): Promise<ASRequestListItem[]> {
  const rows = await apiRequest<AsRequestApi[]>({ method: 'get', url: '/as-service/requests' });
  return rows
    .sort(sortAsByCreatedDesc)
    .slice(0, limit)
    .map(mapAsToListItem);
}

export async function fetchRoleDashboardPendingAs(storeIds: string[], limit = 15): Promise<ASRequestListItem[]> {
  const resolved = resolveRoleStoreIds(storeIds, await loadAllStoreIds());
  const rows = await apiRequest<AsRequestApi[]>({ method: 'get', url: '/as-service/requests' });
  const set = new Set(resolved);
  return rows
    .filter((r) => set.has(r.storeId))
    .sort(sortAsByCreatedDesc)
    .slice(0, limit)
    .map(mapAsToListItem);
}

async function loadAllStoreIds(): Promise<number[]> {
  const tree = await apiRequest<StoreTree[]>({ method: 'get', url: '/dashboard/store-tree' });
  return tree.map((s) => s.storeId);
}

function resolveRoleStoreIds(storeIds: string[], allStoreIds: number[]): number[] {
  if (storeIds.includes('*')) return allStoreIds;
  return storeIds
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0 && allStoreIds.includes(n));
}

export async function fetchEsgSummary(): Promise<EsgSummary> {
  return apiRequest<EsgSummary>({ method: 'get', url: '/dashboard/esg-summary' });
}

type EquipmentApi = {
  equipmentId: number;
  equipmentName: string | null;
  connectionStatus: string;
  purchaseDate: string | null;
  store?: { storeName: string } | null;
  model?: { modelName: string } | null;
  dealer?: { name: string } | null;
  controllers: Array<{
    controllerId: number;
    ctrlDeviceId: string;
    connectionStatus: string;
    lastSeenAt: string | null;
  }>;
};

type MonitoringLatest = {
  equipmentId: number;
  equipmentName: string | null;
  connectionStatus: string;
  controllers: Array<{
    controllerId: number;
    ctrlDeviceId: string;
    timestamp: string | null;
    connectionStatus: string;
    sensorData: Record<string, number | null> | null;
  }>;
};

function num(x: unknown, d = 0): number {
  return typeof x === 'number' && !Number.isNaN(x) ? x : d;
}

function mapLatestSensor(ctrlDeviceId: string, s: Record<string, number | null> | null | undefined): ControllerSensorData {
  const v = s ?? {};
  return {
    controllerId: ctrlDeviceId,
    timestamp: Math.floor(Date.now() / 1000),
    pm25: num(v.pm2_5),
    pm10: num(v.pm10),
    diffPressure: num(v.diffPressure),
    oilLevel: num(v.oilLevel),
    ppTemp: num(v.ppTemp),
    ppSpark: num(v.ppSpark),
    ppPower: num(v.ppPower),
    ppAlarm: num(v.ppAlarm),
    fanSpeed: num(v.fanSpeed),
    fanMode: num(v.fanMode),
    fanRunning: num(v.fanRunning),
    fanFreq: num(v.fanFreq),
    fanTargetPct: num(v.fanTargetPct),
    damperMode: num(v.damperMode),
    flow: num(v.flow),
    damperCtrl: num(v.damperCtrl),
    damper: num(v.damper),
    inletTemp: num(v.inletTemp),
    velocity: num(v.velocity),
    ductDp: num(v.ductDp),
    statusFlags: num(v.statusFlags),
  };
}

function ctrlStatusFromSensor(s: ControllerSensorData): StatusLevel {
  if (num(s.ppAlarm) > 0) return 'red';
  if (s.inletTemp >= INLET_TEMP_THRESHOLDS.redMin) return 'red';
  if (s.inletTemp >= INLET_TEMP_THRESHOLDS.yellowMin) return 'yellow';
  return 'green';
}

function mergeEquipmentStatus(a: StatusLevel, b: StatusLevel): StatusLevel {
  const rank = { red: 3, yellow: 2, green: 1 };
  return rank[a] >= rank[b] ? a : b;
}

export async function fetchEquipmentDashboard(equipmentId: number): Promise<EquipmentDashboard> {
  const [eq, latest] = await Promise.all([
    apiRequest<EquipmentApi>({ method: 'get', url: `/equipment/${equipmentId}` }),
    apiRequest<MonitoringLatest>({ method: 'get', url: `/monitoring/equipment/${equipmentId}/latest` }),
  ]);

  const to = new Date();
  const from = new Date(to.getTime() - 3600_000);

  const historyChunks = await Promise.all(
    latest.controllers.map(async (c) => {
      const hist = await apiRequest<{ dataPoints: HistoryPointApi[] }>({
        method: 'get',
        url: `/monitoring/equipment/${equipmentId}/history?controllerId=${c.controllerId}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
      });
      return hist.dataPoints.map(
        (dp): SensorHistoryPoint => ({
          timestamp: new Date(dp.receivedAt).getTime() / 1000,
          controllerId: c.ctrlDeviceId,
          ppTemp: num(dp.ppTemp),
          ppSpark: num(dp.ppSpark),
        }),
      );
    }),
  );

  const sensorHistory = historyChunks.flat().sort((a, b) => a.timestamp - b.timestamp);

  const controllers: ControllerStatus[] = latest.controllers.map((c) => {
    const sensorData = mapLatestSensor(c.ctrlDeviceId, c.sensorData);
    const st = ctrlStatusFromSensor(sensorData);
    return {
      controllerId: c.controllerId,
      controllerName: c.ctrlDeviceId,
      connectionStatus: c.connectionStatus === 'ONLINE' ? 'ONLINE' : 'OFFLINE',
      status: c.connectionStatus === 'OFFLINE' ? 'red' : st,
      sensorData,
      lastSeenAt: c.timestamp ?? new Date().toISOString(),
    };
  });

  let equipStatus: StatusLevel = eq.connectionStatus === 'OFFLINE' ? 'red' : 'green';
  for (const c of controllers) {
    equipStatus = mergeEquipmentStatus(equipStatus, c.status);
  }

  const installDate = eq.purchaseDate
    ? isoAt(eq.purchaseDate as unknown as string).slice(0, 10)
    : '';

  return {
    equipmentId: eq.equipmentId,
    equipmentName: eq.equipmentName || '장비',
    modelName: eq.model?.modelName ?? '—',
    installDate,
    dealerName: eq.dealer?.name ?? '—',
    storeName: eq.store?.storeName ?? '—',
    status: equipStatus,
    controllers,
    sensorHistory,
  };
}

interface HistoryPointApi {
  receivedAt: string;
  ppTemp: number | null;
  ppSpark: number | null;
}

export async function fetchRoleDashboardSummary(storeIds: string[]): Promise<RoleDashboardSummary> {
  const [tree, issues] = await Promise.all([
    apiRequest<StoreTree[]>({ method: 'get', url: '/dashboard/store-tree' }),
    apiRequest<ApiAlarmRow[]>({ method: 'get', url: '/dashboard/issues' }),
  ]);
  const allIds = tree.map((s) => s.storeId);
  const resolved = resolveRoleStoreIds(storeIds, allIds);
  if (resolved.length === 0) {
    return {
      totalStores: 0,
      totalEquipments: 0,
      normalEquipments: 0,
      pendingAsRequests: 0,
      emergencyAlarms: 0,
    };
  }
  const set = new Set(resolved);
  let totalEquipments = 0;
  let normalEquipments = 0;
  for (const s of tree) {
    if (!set.has(s.storeId)) continue;
    for (const f of s.floors) {
      for (const e of f.equipment) {
        totalEquipments++;
        if (e.connectionStatus === 'ONLINE') normalEquipments++;
      }
    }
  }
  const issueItems = issues.filter((r) => set.has(r.storeId));
  const redAlarms = issueItems.filter((r) => r.severity === 'RED').length;
  const asRows = await apiRequest<AsRequestApi[]>({ method: 'get', url: '/as-service/requests' });
  const pendingAs = asRows.filter(
    (r) => set.has(r.storeId) && (r.status === 'PENDING' || r.status === 'IN_PROGRESS'),
  ).length;

  return {
    totalStores: resolved.length,
    totalEquipments,
    normalEquipments,
    pendingAsRequests: pendingAs,
    emergencyAlarms: redAlarms,
  };
}

export async function fetchRoleDashboardIssues(storeIds: string[]): Promise<DashboardIssueCategory[]> {
  const all = await fetchDashboardIssues();
  const tree = await apiRequest<StoreTree[]>({ method: 'get', url: '/dashboard/store-tree' });
  const resolved = resolveRoleStoreIds(storeIds, tree.map((s) => s.storeId));
  const set = new Set(resolved);
  return all.map((cat) => {
    const items = cat.items.filter((i) => set.has(i.storeId));
    return {
      ...cat,
      items,
      yellowCount: items.filter((i) => i.severity === 'yellow').length,
      redCount: items.filter((i) => i.severity === 'red').length,
    };
  });
}

export async function fetchRoleStoreList(storeIds: string[]): Promise<StoreMapItem[]> {
  const all = await fetchStoreMapData();
  const treeIds = all.map((s) => s.storeId);
  const resolved = resolveRoleStoreIds(storeIds, treeIds);
  const set = new Set(resolved);
  return all.filter((s) => set.has(s.storeId));
}

export interface RoleAsRequest {
  requestId: number;
  storeName: string;
  equipmentName: string;
  issueType: string;
  status: string;
  createdAt: string;
  description: string;
}

export async function fetchRoleRecentAs(storeIds: string[]): Promise<RoleAsRequest[]> {
  const tree = await apiRequest<StoreTree[]>({ method: 'get', url: '/dashboard/store-tree' });
  const resolved = resolveRoleStoreIds(storeIds, tree.map((s) => s.storeId));
  const set = new Set(resolved);
  const rows = await apiRequest<AsRequestApi[]>({ method: 'get', url: '/as-service/requests' });
  return rows
    .filter((r) => set.has(r.storeId))
    .map((r) => ({
      requestId: r.requestId,
      storeName: r.store?.storeName ?? '',
      equipmentName: r.equipment?.equipmentName ?? '장비 미지정',
      issueType: r.issueType,
      status: r.status,
      createdAt: isoAt(r.createdAt as unknown as string),
      description: r.description,
    }));
}

export async function fetchRoleEmergencyAlarms(storeIds: string[]): Promise<EmergencyAlarm[]> {
  const tree = await apiRequest<StoreTree[]>({ method: 'get', url: '/dashboard/store-tree' });
  const resolved = resolveRoleStoreIds(storeIds, tree.map((s) => s.storeId));
  const rows = await apiRequest<ApiAlarmRow[]>({ method: 'get', url: '/dashboard/alarms' });
  const set = new Set(resolved);
  return rows.filter((r) => set.has(r.storeId)).map(mapToEmergencyAlarm);
}
