import dayjs from 'dayjs';
import type {
  EquipmentListItem,
  EquipmentDetail,
  EquipmentModel,
  EquipmentCreateRequest,
  EquipmentUpdateRequest,
  StoreOption,
  FloorOption,
  GatewayOption,
  DealerOption,
} from '../../types/equipment.types';
import { mockDelay, wrapResponse, type ApiResponse } from './common.mock';

// --- Mock 기초 데이터 ---

const mockModels: EquipmentModel[] = [
  {
    modelId: 1,
    modelName: 'MB-ESP-5000',
    manufacturer: 'MetaBeans',
    specifications: { maxFlow: 5000, cellCount: 6 },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    modelId: 2,
    modelName: 'MB-ESP-3000',
    manufacturer: 'MetaBeans',
    specifications: { maxFlow: 3000, cellCount: 4 },
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    modelId: 3,
    modelName: 'MB-ESP-2000',
    manufacturer: 'MetaBeans',
    specifications: { maxFlow: 2000, cellCount: 3 },
    isActive: true,
    createdAt: '2024-03-15T00:00:00Z',
  },
  {
    modelId: 4,
    modelName: 'MB-ESP-1500',
    manufacturer: 'MetaBeans',
    specifications: { maxFlow: 1500, cellCount: 2 },
    isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
  },
];

const mockStoreOptions: StoreOption[] = [
  { storeId: 1, storeName: '강남점 (튀김)', siteId: 'site-001' },
  { storeId: 2, storeName: '홍대점 (굽기)', siteId: 'site-002' },
  { storeId: 3, storeName: '신촌점 (커피로스팅)', siteId: 'site-003' },
];

const mockFloorOptions: Record<number, FloorOption[]> = {
  1: [{ floorId: 1, floorCode: '1F', floorName: '1층 주방' }],
  2: [
    { floorId: 2, floorCode: '1F', floorName: '1층' },
    { floorId: 3, floorCode: 'B1', floorName: '지하 1층' },
  ],
  3: [{ floorId: 4, floorCode: '1F', floorName: '1층' }],
};

const mockGatewayOptions: Record<number, GatewayOption[]> = {
  1: [{ gatewayId: 1, gwDeviceId: 'gw-001', connectionStatus: 'ONLINE' }],
  2: [{ gatewayId: 2, gwDeviceId: 'gw-002', connectionStatus: 'ONLINE' }],
  3: [{ gatewayId: 3, gwDeviceId: 'gw-003', connectionStatus: 'OFFLINE' }],
  4: [{ gatewayId: 4, gwDeviceId: 'gw-004', connectionStatus: 'ONLINE' }],
};

const mockDealerOptions: DealerOption[] = [
  { dealerId: 1, dealerName: '서울환경테크' },
  { dealerId: 2, dealerName: '경기설비' },
  { dealerId: 3, dealerName: '인천환경서비스' },
];

// --- Mock 장비 상세 데이터 ---

const mockEquipmentDetails: EquipmentDetail[] = [
  {
    equipmentId: 1,
    equipmentSerial: 'MB-ESP-2024-00001',
    mqttEquipmentId: 'esp-001',
    store: { storeId: 1, storeName: '강남점 (튀김)', siteId: 'site-001' },
    floor: { floorId: 1, floorCode: '1F', floorName: '1층 주방' },
    equipmentName: 'ESP 집진기 #1',
    model: { modelId: 2, modelName: 'MB-ESP-3000', manufacturer: 'MetaBeans' },
    cellType: 'SUS 316L',
    powerpackCount: 2,
    purchaseDate: '2025-06-15',
    warrantyEndDate: '2027-06-14',
    dealer: { dealerId: 1, dealerName: '서울환경테크' },
    status: 'NORMAL',
    connectionStatus: 'ONLINE',
    lastSeenAt: dayjs().subtract(5, 'second').toISOString(),
    gateway: {
      gatewayId: 1,
      gwDeviceId: 'gw-001',
      connectionStatus: 'ONLINE',
      statusFlags: 127, // 0b1111111 = 7비트 모두 정상
      controllerCount: 3,
    },
    controllers: [
      {
        controllerId: 1,
        ctrlDeviceId: 'ctrl-001',
        connectionStatus: 'ONLINE',
        statusFlags: 63, // 0b111111 = 6비트 모두 정상
        lastSeenAt: dayjs().subtract(5, 'second').toISOString(),
      },
      {
        controllerId: 2,
        ctrlDeviceId: 'ctrl-002',
        connectionStatus: 'ONLINE',
        statusFlags: 63,
        lastSeenAt: dayjs().subtract(8, 'second').toISOString(),
      },
    ],
    registeredBy: { userId: 2, name: '김대리' },
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2026-01-20T14:30:00Z',
  },
  {
    equipmentId: 2,
    equipmentSerial: 'MB-ESP-2024-00002',
    mqttEquipmentId: 'esp-002',
    store: { storeId: 1, storeName: '강남점 (튀김)', siteId: 'site-001' },
    floor: { floorId: 1, floorCode: '1F', floorName: '1층 주방' },
    equipmentName: 'ESP 집진기 #2',
    model: { modelId: 3, modelName: 'MB-ESP-2000', manufacturer: 'MetaBeans' },
    cellType: 'SUS 304',
    powerpackCount: 1,
    purchaseDate: '2025-08-20',
    warrantyEndDate: '2027-08-19',
    dealer: { dealerId: 1, dealerName: '서울환경테크' },
    status: 'INSPECTION',
    connectionStatus: 'ONLINE',
    lastSeenAt: dayjs().subtract(3, 'second').toISOString(),
    gateway: {
      gatewayId: 1,
      gwDeviceId: 'gw-001',
      connectionStatus: 'ONLINE',
      statusFlags: 127,
      controllerCount: 3,
    },
    controllers: [
      {
        controllerId: 3,
        ctrlDeviceId: 'ctrl-003',
        connectionStatus: 'ONLINE',
        statusFlags: 59, // 0b111011 = SDP810 차압 센서 이상
        lastSeenAt: dayjs().subtract(3, 'second').toISOString(),
      },
    ],
    registeredBy: { userId: 2, name: '김대리' },
    createdAt: '2025-08-20T09:00:00Z',
    updatedAt: '2026-02-01T11:00:00Z',
  },
  {
    equipmentId: 3,
    equipmentSerial: 'MB-ESP-2024-00003',
    mqttEquipmentId: 'esp-001',
    store: { storeId: 2, storeName: '홍대점 (굽기)', siteId: 'site-002' },
    floor: { floorId: 2, floorCode: '1F', floorName: '1층' },
    equipmentName: 'ESP 집진기 #1',
    model: { modelId: 2, modelName: 'MB-ESP-3000', manufacturer: 'MetaBeans' },
    cellType: 'SUS 316L',
    powerpackCount: 2,
    purchaseDate: '2025-07-10',
    warrantyEndDate: '2027-07-09',
    dealer: { dealerId: 2, dealerName: '경기설비' },
    status: 'NORMAL',
    connectionStatus: 'ONLINE',
    lastSeenAt: dayjs().subtract(7, 'second').toISOString(),
    gateway: {
      gatewayId: 2,
      gwDeviceId: 'gw-002',
      connectionStatus: 'ONLINE',
      statusFlags: 127,
      controllerCount: 2,
    },
    controllers: [
      {
        controllerId: 4,
        ctrlDeviceId: 'ctrl-001',
        connectionStatus: 'ONLINE',
        statusFlags: 63,
        lastSeenAt: dayjs().subtract(7, 'second').toISOString(),
      },
      {
        controllerId: 5,
        ctrlDeviceId: 'ctrl-002',
        connectionStatus: 'OFFLINE',
        statusFlags: 62, // 0b111110 = 파워팩 RS-485 통신 이상
        lastSeenAt: dayjs().subtract(2, 'hour').toISOString(),
      },
    ],
    registeredBy: { userId: 1, name: '관리자' },
    createdAt: '2025-07-10T14:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
  },
  {
    equipmentId: 4,
    equipmentSerial: 'MB-ESP-2024-00004',
    mqttEquipmentId: 'esp-001',
    store: { storeId: 2, storeName: '홍대점 (굽기)', siteId: 'site-002' },
    floor: { floorId: 3, floorCode: 'B1', floorName: '지하 1층' },
    equipmentName: 'ESP 집진기 #1',
    model: { modelId: 4, modelName: 'MB-ESP-1500', manufacturer: 'MetaBeans' },
    cellType: 'SUS 304',
    powerpackCount: 1,
    purchaseDate: '2025-09-01',
    warrantyEndDate: '2027-08-31',
    dealer: { dealerId: 2, dealerName: '경기설비' },
    status: 'INACTIVE',
    connectionStatus: 'OFFLINE',
    lastSeenAt: dayjs().subtract(26, 'hour').toISOString(),
    gateway: {
      gatewayId: 3,
      gwDeviceId: 'gw-003',
      connectionStatus: 'OFFLINE',
      statusFlags: 0,
      controllerCount: 1,
    },
    controllers: [
      {
        controllerId: 6,
        ctrlDeviceId: 'ctrl-001',
        connectionStatus: 'OFFLINE',
        statusFlags: 0,
        lastSeenAt: dayjs().subtract(26, 'hour').toISOString(),
      },
    ],
    registeredBy: { userId: 1, name: '관리자' },
    createdAt: '2025-09-01T10:00:00Z',
    updatedAt: '2025-12-20T16:00:00Z',
  },
  {
    equipmentId: 5,
    equipmentSerial: 'MB-ESP-2024-00005',
    mqttEquipmentId: 'esp-001',
    store: { storeId: 3, storeName: '신촌점 (커피로스팅)', siteId: 'site-003' },
    floor: { floorId: 4, floorCode: '1F', floorName: '1층' },
    equipmentName: 'ESP 집진기 #1',
    model: { modelId: 3, modelName: 'MB-ESP-2000', manufacturer: 'MetaBeans' },
    cellType: 'SUS 316L 특수코팅',
    powerpackCount: 1,
    purchaseDate: '2025-10-05',
    warrantyEndDate: '2027-10-04',
    dealer: { dealerId: 1, dealerName: '서울환경테크' },
    status: 'NORMAL',
    connectionStatus: 'ONLINE',
    lastSeenAt: dayjs().subtract(4, 'second').toISOString(),
    gateway: {
      gatewayId: 4,
      gwDeviceId: 'gw-004',
      connectionStatus: 'ONLINE',
      statusFlags: 127,
      controllerCount: 1,
    },
    controllers: [
      {
        controllerId: 7,
        ctrlDeviceId: 'ctrl-001',
        connectionStatus: 'ONLINE',
        statusFlags: 63,
        lastSeenAt: dayjs().subtract(4, 'second').toISOString(),
      },
    ],
    registeredBy: { userId: 2, name: '김대리' },
    createdAt: '2025-10-05T11:00:00Z',
    updatedAt: '2026-02-10T08:00:00Z',
  },
];

// --- Mock API 함수 ---

// 장비 목록 조회
export async function mockGetEquipments(params?: {
  storeId?: number;
  floorId?: number;
  status?: string;
  connectionStatus?: string;
  search?: string;
}): Promise<ApiResponse<EquipmentListItem[]>> {
  let filtered = mockEquipmentDetails;

  if (params?.storeId) {
    filtered = filtered.filter((e) => e.store.storeId === params.storeId);
  }
  if (params?.floorId) {
    filtered = filtered.filter((e) => e.floor.floorId === params.floorId);
  }
  if (params?.status) {
    filtered = filtered.filter((e) => e.status === params.status);
  }
  if (params?.connectionStatus) {
    filtered = filtered.filter((e) => e.connectionStatus === params.connectionStatus);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.equipmentName.toLowerCase().includes(q) ||
        e.equipmentSerial.toLowerCase().includes(q),
    );
  }

  const items: EquipmentListItem[] = filtered.map((e) => ({
    equipmentId: e.equipmentId,
    equipmentSerial: e.equipmentSerial,
    mqttEquipmentId: e.mqttEquipmentId,
    storeName: e.store.storeName,
    floorName: e.floor.floorName,
    equipmentName: e.equipmentName,
    modelName: e.model.modelName,
    cellType: e.cellType,
    powerpackCount: e.powerpackCount,
    purchaseDate: e.purchaseDate,
    warrantyEndDate: e.warrantyEndDate,
    dealerName: e.dealer?.dealerName,
    status: e.status,
    connectionStatus: e.connectionStatus,
    lastSeenAt: e.lastSeenAt,
  }));

  return mockDelay(
    wrapResponse(items, { page: 1, pageSize: 20, totalCount: items.length }),
    400,
  );
}

// 장비 상세 조회
export async function mockGetEquipmentDetail(
  equipmentId: number,
): Promise<ApiResponse<EquipmentDetail>> {
  const equipment = mockEquipmentDetails.find((e) => e.equipmentId === equipmentId);
  if (!equipment) {
    throw new Error('RESOURCE_NOT_FOUND');
  }
  return mockDelay(wrapResponse(equipment), 300);
}

// 장비 등록
export async function mockCreateEquipment(
  req: EquipmentCreateRequest,
): Promise<ApiResponse<EquipmentDetail>> {
  const newId = Math.max(...mockEquipmentDetails.map((e) => e.equipmentId)) + 1;
  const model = mockModels.find((m) => m.modelId === req.modelId);
  const store = mockStoreOptions.find((s) => s.storeId === req.storeId);
  const floors = mockFloorOptions[req.storeId] ?? [];
  const floor = floors.find((f) => f.floorId === req.floorId);
  const dealer = mockDealerOptions.find((d) => d.dealerId === req.dealerId);

  const newEquipment: EquipmentDetail = {
    equipmentId: newId,
    equipmentSerial: req.equipmentSerial,
    mqttEquipmentId: req.mqttEquipmentId,
    store: {
      storeId: req.storeId,
      storeName: store?.storeName ?? '알 수 없음',
      siteId: store?.siteId ?? '',
    },
    floor: {
      floorId: req.floorId,
      floorCode: floor?.floorCode ?? '',
      floorName: floor?.floorName ?? '',
    },
    equipmentName: req.equipmentName,
    model: {
      modelId: req.modelId,
      modelName: model?.modelName ?? '알 수 없음',
      manufacturer: model?.manufacturer ?? '',
    },
    cellType: req.cellType,
    powerpackCount: req.controllers.length,
    purchaseDate: req.purchaseDate,
    warrantyEndDate: req.warrantyEndDate,
    dealer: dealer ? { dealerId: dealer.dealerId, dealerName: dealer.dealerName } : undefined,
    status: 'NORMAL',
    connectionStatus: 'OFFLINE',
    lastSeenAt: undefined,
    gateway: {
      gatewayId: req.controllers[0]?.gatewayId ?? 0,
      gwDeviceId: '',
      connectionStatus: 'OFFLINE',
      statusFlags: 0,
      controllerCount: req.controllers.length,
    },
    controllers: req.controllers.map((c, idx) => ({
      controllerId: newId * 100 + idx + 1,
      ctrlDeviceId: c.ctrlDeviceId,
      connectionStatus: 'OFFLINE' as const,
      statusFlags: 0,
      lastSeenAt: undefined,
    })),
    registeredBy: { userId: 1, name: '관리자' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockEquipmentDetails.push(newEquipment);
  return mockDelay(wrapResponse(newEquipment), 500);
}

// 장비 수정
export async function mockUpdateEquipment(
  equipmentId: number,
  req: EquipmentUpdateRequest,
): Promise<ApiResponse<EquipmentDetail>> {
  const idx = mockEquipmentDetails.findIndex((e) => e.equipmentId === equipmentId);
  if (idx === -1) {
    throw new Error('RESOURCE_NOT_FOUND');
  }

  const existing = mockEquipmentDetails[idx]!;

  if (req.equipmentName !== undefined) {
    existing.equipmentName = req.equipmentName;
  }
  if (req.cellType !== undefined) {
    existing.cellType = req.cellType;
  }
  if (req.modelId !== undefined) {
    const model = mockModels.find((m) => m.modelId === req.modelId);
    if (model) {
      existing.model = {
        modelId: model.modelId,
        modelName: model.modelName,
        manufacturer: model.manufacturer ?? '',
      };
    }
  }
  if (req.dealerId !== undefined) {
    const dealer = mockDealerOptions.find((d) => d.dealerId === req.dealerId);
    existing.dealer = dealer
      ? { dealerId: dealer.dealerId, dealerName: dealer.dealerName }
      : undefined;
  }
  if (req.controllers) {
    existing.controllers = req.controllers.map((c, i) => ({
      controllerId: equipmentId * 100 + i + 1,
      ctrlDeviceId: c.ctrlDeviceId,
      connectionStatus: 'OFFLINE' as const,
      statusFlags: 0,
      lastSeenAt: undefined,
    }));
    existing.powerpackCount = req.controllers.length;
  }

  existing.updatedAt = new Date().toISOString();
  mockEquipmentDetails[idx] = existing;

  return mockDelay(wrapResponse(existing), 400);
}

// 장비 삭제
export async function mockDeleteEquipment(
  equipmentId: number,
): Promise<ApiResponse<{ deleted: boolean }>> {
  const idx = mockEquipmentDetails.findIndex((e) => e.equipmentId === equipmentId);
  if (idx === -1) {
    throw new Error('RESOURCE_NOT_FOUND');
  }
  mockEquipmentDetails.splice(idx, 1);
  return mockDelay(wrapResponse({ deleted: true }), 300);
}

// 장비 모델 목록
export async function mockGetEquipmentModels(): Promise<ApiResponse<EquipmentModel[]>> {
  const activeModels = mockModels.filter((m) => m.isActive);
  return mockDelay(wrapResponse(activeModels), 200);
}

// 매장 옵션 목록
export async function mockGetStoreOptions(): Promise<StoreOption[]> {
  return mockDelay(mockStoreOptions, 200);
}

// 층 옵션 목록
export async function mockGetFloorOptions(storeId: number): Promise<FloorOption[]> {
  return mockDelay(mockFloorOptions[storeId] ?? [], 200);
}

// 게이트웨이 옵션 목록
export async function mockGetGatewayOptions(floorId: number): Promise<GatewayOption[]> {
  return mockDelay(mockGatewayOptions[floorId] ?? [], 200);
}

// 대리점 옵션 목록
export async function mockGetDealerOptions(): Promise<DealerOption[]> {
  return mockDelay(mockDealerOptions, 200);
}
