// 장비 운용 상태
export type EquipmentStatus = 'NORMAL' | 'INSPECTION' | 'CLEANING' | 'INACTIVE';

// 연결 상태
export type ConnectionStatus = 'ONLINE' | 'OFFLINE';

// 장비 정보 (equipment 테이블)
export interface Equipment {
  equipmentId: number;
  equipmentSerial: string;
  mqttEquipmentId: string;
  storeId?: number;
  floorId?: number;
  equipmentName?: string;
  modelId?: number;
  cellType?: string;
  powerpackCount: number;
  purchaseDate?: string;
  warrantyEndDate?: string;
  dealerId?: number;
  status: EquipmentStatus;
  connectionStatus: ConnectionStatus;
  lastSeenAt?: string;
  registeredBy: number;
  createdAt: string;
  updatedAt: string;
}

// 장비 모델 (equipment_models 테이블)
export interface EquipmentModel {
  modelId: number;
  modelName: string;
  manufacturer?: string;
  specifications?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

// 게이트웨이 (gateways 테이블)
export interface Gateway {
  gatewayId: number;
  gwDeviceId: string;
  storeId: number;
  floorId: number;
  macAddress?: string;
  firmwareVersion?: string;
  controllerCount: number;
  statusFlags: number;
  connectionStatus: ConnectionStatus;
  lastSeenAt?: string;
  createdAt: string;
}

// 컨트롤러/파워팩 (controllers 테이블)
export interface Controller {
  controllerId: number;
  ctrlDeviceId: string;
  equipmentId: number;
  gatewayId: number;
  statusFlags: number;
  connectionStatus: ConnectionStatus;
  lastSeenAt?: string;
  createdAt: string;
}

// 장비 이력 (equipment_history 테이블)
export interface EquipmentHistory {
  historyId: number;
  equipmentId: number;
  description: string;
  cost?: number;
  asRequestId?: number;
  sparkValue?: number;
  pressureValue?: number;
  occurredAt: string;
}

// 장비 변경 이력 (이력 조회 > 장비 변경 이력 탭)
export interface EquipmentChangeHistory {
  changeId: number;
  equipmentId: number;
  changedField: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

// 알람 이벤트 (alarm_events 테이블)
export type AlarmType = 'COMM_ERROR' | 'INLET_TEMP' | 'FILTER_CHECK' | 'DUST_PERFORMANCE' | 'SPARK' | 'OVER_TEMP';
export type AlarmSeverity = 'YELLOW' | 'RED';

export interface AlarmEvent {
  alarmId: number;
  storeId: number;
  storeName: string;
  equipmentId: number;
  equipmentName: string;
  controllerId?: number;
  controllerName?: string;
  alarmType: AlarmType;
  severity: AlarmSeverity;
  value?: number;
  message: string;
  occurredAt: string;
  resolvedAt?: string;
}

// 소모품 교체 주기 (consumable_schedules 테이블)
export interface ConsumableSchedule {
  scheduleId: number;
  equipmentId: number;
  consumableType: string;
  replacementCycleDays: number;
  lastReplacedAt?: string;
  nextDueDate?: string;
  alertDaysBefore: number;
  createdAt: string;
}

// --- API 응답 타입 ---

// 장비 목록 아이템 (GET /equipment 응답)
export interface EquipmentListItem {
  equipmentId: number;
  equipmentSerial: string;
  mqttEquipmentId: string;
  storeName: string;
  floorName: string;
  equipmentName: string;
  modelName: string;
  cellType?: string;
  powerpackCount: number;
  purchaseDate?: string;
  warrantyEndDate?: string;
  dealerName?: string;
  status: EquipmentStatus;
  connectionStatus: ConnectionStatus;
  lastSeenAt?: string;
}

// 장비 상세 (GET /equipment/:id 응답)
export interface EquipmentDetail {
  equipmentId: number;
  equipmentSerial: string;
  mqttEquipmentId: string;
  store: { storeId: number; storeName: string; siteId: string };
  floor: { floorId: number; floorCode: string; floorName: string };
  equipmentName: string;
  model: { modelId: number; modelName: string; manufacturer: string };
  cellType?: string;
  powerpackCount: number;
  purchaseDate?: string;
  warrantyEndDate?: string;
  dealer?: { dealerId: number; dealerName: string };
  status: EquipmentStatus;
  connectionStatus: ConnectionStatus;
  lastSeenAt?: string;
  gateway: {
    gatewayId: number;
    gwDeviceId: string;
    connectionStatus: ConnectionStatus;
    statusFlags: number;
    controllerCount: number;
  };
  controllers: {
    controllerId: number;
    ctrlDeviceId: string;
    connectionStatus: ConnectionStatus;
    statusFlags: number;
    lastSeenAt?: string;
  }[];
  registeredBy: { userId: number; name: string };
  createdAt: string;
  updatedAt: string;
}

// 장비 등록 요청 (POST /equipment)
export interface EquipmentCreateRequest {
  equipmentSerial: string;
  mqttEquipmentId: string;
  storeId: number;
  floorId: number;
  equipmentName: string;
  modelId: number;
  cellType?: string;
  powerpackCount: number;
  purchaseDate?: string;
  warrantyEndDate?: string;
  dealerId?: number;
  controllers: { ctrlDeviceId: string; gatewayId: number }[];
}

// 장비 수정 요청 (PUT /equipment/:id)
export interface EquipmentUpdateRequest {
  equipmentName?: string;
  modelId?: number;
  cellType?: string;
  dealerId?: number;
  controllers?: { ctrlDeviceId: string; gatewayId: number }[];
}

// 매장 드롭다운용 (등록 폼에서 사용)
export interface StoreOption {
  storeId: number;
  storeName: string;
  siteId: string;
}

// 층 드롭다운용
export interface FloorOption {
  floorId: number;
  floorCode: string;
  floorName?: string;
}

// 게이트웨이 드롭다운용
export interface GatewayOption {
  gatewayId: number;
  gwDeviceId: string;
  connectionStatus: ConnectionStatus;
}

// 대리점 드롭다운용
export interface DealerOption {
  dealerId: number;
  dealerName: string;
}

// 사이드바 트리 구조를 위한 계층형 타입
export interface StoreTreeNode {
  storeId: number;
  storeName: string;
  siteId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  floors: FloorTreeNode[];
}

export interface FloorTreeNode {
  floorId: number;
  floorCode: string;
  floorName?: string;
  gateways: GatewayTreeNode[];
}

export interface GatewayTreeNode {
  gatewayId: number;
  gwDeviceId: string;
  connectionStatus: ConnectionStatus;
  equipments: EquipmentTreeNode[];
}

export interface EquipmentTreeNode {
  equipmentId: number;
  equipmentName?: string;
  mqttEquipmentId: string;
  connectionStatus: ConnectionStatus;
  controllers: ControllerTreeNode[];
}

export interface ControllerTreeNode {
  controllerId: number;
  ctrlDeviceId: string;
  connectionStatus: ConnectionStatus;
}
