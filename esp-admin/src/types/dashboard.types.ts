import type { StatusLevel } from '../utils/constants';
import type { AlarmType, AlarmSeverity, AlarmStatus } from './system.types';
import type { ControllerSensorData, GatewaySensorData } from './sensor.types';
import type { ASStatus, IssueType } from './as-service.types';

// 대시보드 요약 카드 데이터
export interface DashboardSummary {
  totalStores: number;
  activeStores: number;
  totalEquipments: number;
  normalEquipments: number;
  pendingAsRequests: number;
  emergencyAlarms: number;
}

// 대시보드 이슈 항목
export type DashboardIssueType =
  | 'COMM_ERROR'         // 통신 연결 상태 점검
  | 'INLET_TEMP'         // 유입 온도 이상
  | 'FILTER_CHECK'       // 필터 청소 상태 점검
  | 'DUST_REMOVAL';      // 먼지제거 성능 점검

export interface DashboardIssueItem {
  issueId: number;
  storeId: number;
  storeName: string;
  equipmentId: number;
  equipmentName: string;
  issueType: DashboardIssueType;
  severity: StatusLevel;
  currentValue?: number;
  unit?: string;
  message: string;
  occurredAt: string;
}

export interface DashboardIssueCategory {
  type: DashboardIssueType;
  label: string;
  description: string;
  items: DashboardIssueItem[];
  yellowCount: number;
  redCount: number;
}

// ESG 지표 요약
export interface EsgSummary {
  totalOilCollected: number;    // 유증기 포집량 합계 (L)
  energySavingRate: number;     // 에너지 절감률 (%)
  co2Reduction: number;         // CO2 저감량 (kg)
}

// 매장 지도 데이터
export interface StoreMapItem {
  storeId: number;
  storeName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: StatusLevel;
  equipmentCount: number;
  issueCount: number;
}

// 층별 IAQ 데이터
export interface FloorIaqData {
  floorId: number;
  floorCode: string;
  floorName: string;
  iaqData: GatewaySensorData;
}

// 개별 매장 대시보드
export interface StoreDashboard {
  storeId: number;
  storeName: string;
  address: string;
  businessType: string;
  iaqData: GatewaySensorData | null;
  floorIaqList: FloorIaqData[];
  equipments: StoreEquipmentStatus[];
  issues: DashboardIssueItem[];
  recentAsRequests: StoreAsRequest[];
}

export interface StoreEquipmentStatus {
  equipmentId: number;
  equipmentName: string;
  status: StatusLevel;
  connectionStatus: 'ONLINE' | 'OFFLINE';
  controllerCount: number;
  normalControllers: number;
  lastSeenAt: string;
}

export interface StoreAsRequest {
  requestId: number;
  equipmentName?: string;
  issueType: IssueType;
  status: ASStatus;
  createdAt: string;
  description: string;
}

// 장비별 대시보드
export interface EquipmentDashboard {
  equipmentId: number;
  equipmentName: string;
  modelName: string;
  installDate: string;
  dealerName: string;
  storeName: string;
  status: StatusLevel;
  controllers: ControllerStatus[];
  sensorHistory: SensorHistoryPoint[];
}

export interface ControllerStatus {
  controllerId: number;
  controllerName: string;
  connectionStatus: 'ONLINE' | 'OFFLINE';
  status: StatusLevel;
  sensorData: ControllerSensorData;
  lastSeenAt: string;
}

// 센서 이력 차트 포인트
export interface SensorHistoryPoint {
  timestamp: number;
  controllerId: string;
  ppTemp: number;
  ppSpark: number;
}

// 긴급 알람 (Red만)
export interface EmergencyAlarm {
  alarmId: number;
  storeId: number;
  storeName: string;
  equipmentId: number;
  equipmentName: string;
  controllerId?: number;
  controllerName?: string;
  alarmType: AlarmType;
  severity: 'RED';
  message: string;
  occurredAt: string;
  status: AlarmStatus;
}
