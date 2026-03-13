import type { StoreTreeNode } from '../../types/equipment.types';
import type { LoginUser } from '../../types/auth.types';

// storeId 문자열 → 숫자 매핑 (Phase 2에서 불필요, 서버에서 처리)
export const STORE_ID_MAP: Record<string, number> = {
  'store-001': 1,
  'store-002': 2,
  'store-003': 3,
};

// Mock 사용자 데이터 (역할별)
export const mockUsers: Record<string, { user: LoginUser; password: string }> = {
  admin: {
    user: {
      userId: 1,
      loginId: 'admin',
      role: 'ADMIN',
      name: '관리자',
      phone: '010-1234-5678',
      email: 'admin@metabeans.co.kr',
      storeIds: ['*'],
    },
    password: 'admin123',
  },
  dealer: {
    user: {
      userId: 2,
      loginId: 'dealer',
      role: 'DEALER',
      name: '김대리',
      phone: '010-2345-6789',
      email: 'dealer@metabeans.co.kr',
      storeIds: ['store-001', 'store-002'],
    },
    password: 'dealer123',
  },
  hq: {
    user: {
      userId: 3,
      loginId: 'hq',
      role: 'HQ',
      name: '박본사',
      phone: '010-3456-7890',
      email: 'hq@metabeans.co.kr',
      storeIds: ['store-001', 'store-003'],
    },
    password: 'hq123',
  },
  owner: {
    user: {
      userId: 4,
      loginId: 'owner',
      role: 'OWNER',
      name: '이점주',
      phone: '010-4567-8901',
      email: 'owner@metabeans.co.kr',
      storeIds: ['store-001'],
    },
    password: 'owner123',
  },
};

// Mock 매장-장비 트리 데이터
export const mockStoreTree: StoreTreeNode[] = [
  {
    storeId: 1,
    storeName: '바삭치킨 강남점',
    siteId: 'site-001',
    status: 'ACTIVE',
    floors: [
      {
        floorId: 1,
        floorCode: '1F',
        floorName: '1층 주방',
        gateways: [
          {
            gatewayId: 1,
            gwDeviceId: 'gw-001',
            connectionStatus: 'ONLINE',
            equipments: [
              {
                equipmentId: 1,
                equipmentName: 'ESP 집진기 #1',
                mqttEquipmentId: 'esp-001',
                connectionStatus: 'ONLINE',
                controllers: [
                  { controllerId: 1, ctrlDeviceId: 'ctrl-001', connectionStatus: 'ONLINE' },
                  { controllerId: 2, ctrlDeviceId: 'ctrl-002', connectionStatus: 'ONLINE' },
                ],
              },
              {
                equipmentId: 2,
                equipmentName: 'ESP 집진기 #2',
                mqttEquipmentId: 'esp-002',
                connectionStatus: 'ONLINE',
                controllers: [
                  { controllerId: 3, ctrlDeviceId: 'ctrl-003', connectionStatus: 'ONLINE' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    storeId: 2,
    storeName: '숯불갈비 홍대점',
    siteId: 'site-002',
    status: 'ACTIVE',
    floors: [
      {
        floorId: 2,
        floorCode: '1F',
        floorName: '1층',
        gateways: [
          {
            gatewayId: 2,
            gwDeviceId: 'gw-002',
            connectionStatus: 'ONLINE',
            equipments: [
              {
                equipmentId: 3,
                equipmentName: 'ESP 집진기 #1',
                mqttEquipmentId: 'esp-001',
                connectionStatus: 'ONLINE',
                controllers: [
                  { controllerId: 4, ctrlDeviceId: 'ctrl-001', connectionStatus: 'ONLINE' },
                  { controllerId: 5, ctrlDeviceId: 'ctrl-002', connectionStatus: 'OFFLINE' },
                ],
              },
            ],
          },
        ],
      },
      {
        floorId: 3,
        floorCode: 'B1',
        floorName: '지하 1층',
        gateways: [
          {
            gatewayId: 3,
            gwDeviceId: 'gw-003',
            connectionStatus: 'OFFLINE',
            equipments: [
              {
                equipmentId: 4,
                equipmentName: 'ESP 집진기 #1',
                mqttEquipmentId: 'esp-001',
                connectionStatus: 'OFFLINE',
                controllers: [
                  { controllerId: 6, ctrlDeviceId: 'ctrl-001', connectionStatus: 'OFFLINE' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    storeId: 3,
    storeName: '로스팅하우스 신촌점',
    siteId: 'site-003',
    status: 'ACTIVE',
    floors: [
      {
        floorId: 4,
        floorCode: '1F',
        floorName: '1층',
        gateways: [
          {
            gatewayId: 4,
            gwDeviceId: 'gw-004',
            connectionStatus: 'ONLINE',
            equipments: [
              {
                equipmentId: 5,
                equipmentName: 'ESP 집진기 #1',
                mqttEquipmentId: 'esp-001',
                connectionStatus: 'ONLINE',
                controllers: [
                  { controllerId: 7, ctrlDeviceId: 'ctrl-001', connectionStatus: 'ONLINE' },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// API 응답 시뮬레이션 헬퍼
export function mockDelay<T>(data: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

// 공통 API 응답 형식
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    pageSize: number;
    totalCount: number;
  };
}

export function wrapResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return { success: true, data, meta };
}
