import type { UserRole, AccountStatus } from './auth.types';

// 기능 코드 (24개 — 프롬프트 정의 + 피드백 추가 항목)
export type FeatureCode =
  // 대시보드
  | 'dashboard.view'
  // 장비관리
  | 'equipment.view'
  | 'equipment.create'
  | 'equipment.edit'
  | 'equipment.delete'
  // 모니터링
  | 'monitoring.view'
  | 'monitoring.board_temp'
  | 'monitoring.spark'
  | 'monitoring.filter_status'
  | 'monitoring.fire_detection'
  | 'monitoring.esg'
  | 'monitoring.equipment_status'
  // 제어
  | 'control.power'
  | 'control.damper'
  | 'control.fan'
  // 이력
  | 'history.view'
  // A/S
  | 'as.view'
  | 'as.create'
  | 'as.process'
  | 'as.report'
  // 고객
  | 'customer.view'
  | 'customer.edit'
  // 시스템
  | 'system.permission'
  | 'system.user';

// 기능 코드 카테고리 정의
export interface FeatureCodeInfo {
  code: FeatureCode;
  label: string;
  category: string;
}

// 전체 기능 코드 목록 (카테고리별 정렬)
export const FEATURE_CODE_LIST: FeatureCodeInfo[] = [
  { code: 'dashboard.view', label: '대시보드 조회', category: '대시보드' },
  { code: 'equipment.view', label: '장비 정보 조회', category: '장비관리' },
  { code: 'equipment.create', label: '장비 등록', category: '장비관리' },
  { code: 'equipment.edit', label: '장비 수정', category: '장비관리' },
  { code: 'equipment.delete', label: '장비 삭제', category: '장비관리' },
  { code: 'monitoring.view', label: '실시간 모니터링', category: '장비관리' },
  { code: 'monitoring.board_temp', label: '보드 온도', category: '장비관리' },
  { code: 'monitoring.spark', label: '스파크 발생', category: '장비관리' },
  { code: 'monitoring.filter_status', label: '필터 점검 상태', category: '장비관리' },
  { code: 'monitoring.fire_detection', label: '화재 감지 센서', category: '장비관리' },
  { code: 'monitoring.esg', label: 'ESG 지표', category: '장비관리' },
  { code: 'monitoring.equipment_status', label: '장비 기본 상태', category: '장비관리' },
  { code: 'control.power', label: '전원 제어', category: '장비관리' },
  { code: 'control.damper', label: '방화셔터 제어', category: '장비관리' },
  { code: 'control.fan', label: '송풍기 팬 모터 제어', category: '장비관리' },
  { code: 'history.view', label: '이력 조회', category: '장비관리' },
  { code: 'as.view', label: 'A/S 조회', category: 'A/S관리' },
  { code: 'as.create', label: 'A/S 신청', category: 'A/S관리' },
  { code: 'as.process', label: 'A/S 처리', category: 'A/S관리' },
  { code: 'as.report', label: '보고서 작성', category: 'A/S관리' },
  { code: 'customer.view', label: '고객 조회', category: '고객현황' },
  { code: 'customer.edit', label: '고객 수정', category: '고객현황' },
  { code: 'system.permission', label: '권한 관리', category: '시스템관리' },
  { code: 'system.user', label: '사용자 관리', category: '시스템관리' },
];

// 역할별 기본 권한 (role_permissions 테이블)
export interface RolePermission {
  rolePermissionId: number;
  role: UserRole;
  featureCode: FeatureCode;
  isAllowed: boolean;
}

// 권한 매트릭스 (UI 표시용)
export interface PermissionMatrix {
  featureCode: FeatureCode;
  label: string;
  category: string;
  permissions: Record<UserRole, boolean>;
}

// 권한 업데이트 요청
export interface PermissionUpdateRequest {
  changes: Array<{
    role: UserRole;
    featureCode: FeatureCode;
    isAllowed: boolean;
  }>;
}

// 개별 사용자 권한 오버라이드 (user_permission_overrides 테이블)
export interface UserPermissionOverride {
  overrideId: number;
  userId: number;
  featureCode: FeatureCode;
  isAllowed: boolean;
  reason?: string;
  setBy: number;
  createdAt: string;
}

// 가입 승인 대기 항목
export interface PendingApproval {
  userId: number;
  loginId: string;
  name: string;
  role: UserRole;
  email: string;
  phone: string;
  businessName?: string;
  businessNumber?: string;
  createdAt: string;
}

// 승인/반려 요청
export interface ApprovalActionRequest {
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

// 비밀번호 초기화 요청 항목
export interface PasswordResetRequestItem {
  requestId: number;
  userId: number;
  loginId: string;
  name: string;
  email: string;
  requestedAt: string;
}

// 사용자 목록 조회 필터
export interface UserListParams {
  role?: UserRole;
  accountStatus?: AccountStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

// 사용자 목록 아이템
export interface SystemUserItem {
  userId: number;
  loginId: string;
  name: string;
  role: UserRole;
  email?: string;
  phone: string;
  accountStatus: AccountStatus;
  lastLoginAt?: string;
  createdAt: string;
}

// 사용자 상세 (편집용)
export interface SystemUserDetail extends SystemUserItem {
  businessName?: string;
  businessNumber?: string;
  overrides: UserPermissionOverride[];
}

// 사용자 수정 요청
export interface SystemUserUpdateRequest {
  role?: UserRole;
  accountStatus?: AccountStatus;
  name?: string;
  email?: string;
  phone?: string;
}

// 청소/필터 판단 기준값 (cleaning_thresholds 테이블)
export interface CleaningThreshold {
  thresholdId: number;
  equipmentId: number;
  sparkThreshold: number;
  sparkTimeWindow: number;
  pressureBase?: number;
  pressureRate: number;
  setBy: number;
  updatedAt: string;
}

// 모니터링 지표 기준값 (monitoring_thresholds 테이블)
export interface MonitoringThreshold {
  thresholdId: number;
  metricName: string;
  unit: string;
  yellowMin?: number;
  redMin?: number;
  description?: string;
  setBy: number;
  updatedAt: string;
}

// 댐퍼 자동제어 기본 설정
export interface DamperAutoSetting {
  settingId: number;
  equipmentId: number;
  equipmentName: string;
  targetFlowCmh: number;
  targetVelocity: number;
  updatedAt: string;
}

// 전체 기준수치 묶음
export interface ThresholdSettings {
  monitoringThresholds: MonitoringThreshold[];
  cleaningThresholds: CleaningThreshold[];
  damperAutoSettings: DamperAutoSetting[];
  sparkBaseTime: number; // 스파크 기준 시간 (초)
}

// 알람 심각도
export type AlarmSeverity = 'YELLOW' | 'RED';

// 알람 상태
export type AlarmStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

// 알람 타입
export type AlarmType =
  | 'COMM_ERROR'
  | 'INLET_TEMP_ABNORMAL'
  | 'FILTER_CHECK'
  | 'DUST_REMOVAL_CHECK'
  | 'PP_ALARM';

// 알람 이벤트 (alarm_events 테이블)
export interface AlarmEvent {
  alarmId: number;
  storeId: number;
  gatewayId?: number;
  equipmentId?: number;
  controllerId?: number;
  alarmType: AlarmType;
  severity: AlarmSeverity;
  message?: string;
  occurredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: number;
  resolvedAt?: string;
  status: AlarmStatus;
}

// ESG 지표 (esg_metrics 테이블)
export interface EsgMetric {
  metricId: number;
  storeId: number;
  equipmentId: number;
  date: string;
  oilCollectedVolume?: number;
  wasteOilCollected?: number;
  totalCollected?: number;
  createdAt: string;
}

// 실외 공기질 (outdoor_air_quality 테이블)
export interface OutdoorAirQuality {
  recordId: number;
  stationName: string;
  regionCode: string;
  pm10?: number;
  pm25?: number;
  o3?: number;
  co?: number;
  no2?: number;
  so2?: number;
  overallIndex?: number;
  measuredAt: string;
  fetchedAt: string;
}

// 알림 설정 (notification_settings 테이블)
export interface NotificationSetting {
  settingId: number;
  userId: number;
  alarmType: string;
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
}
