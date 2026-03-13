// A/S 고장 유형
export type IssueType = 'MALFUNCTION' | 'CLEANING' | 'REPLACEMENT' | 'INSPECTION' | 'OTHER';

// A/S 처리 상태 (7단계 + 보고서 + 완료)
export type ASStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'VISIT_SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REPORT_SUBMITTED'
  | 'CLOSED'
  | 'CANCELLED';

// 수리 유형
export type RepairType = 'FILTER_REPLACE' | 'PART_REPLACE' | 'CLEANING' | 'WIRING' | 'OTHER';

// 첨부파일 유형
export type FileType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

// A/S 접수 (as_requests 테이블)
export interface ASRequest {
  requestId: number;
  storeId: number;
  equipmentId?: number;
  requestedBy: number;
  issueType: IssueType;
  description: string;
  preferredVisitDatetime?: string;
  status: ASStatus;
  dealerId?: number;
  acceptedAt?: string;
  visitScheduledDatetime?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// A/S 첨부파일 (as_attachments 테이블)
export interface ASAttachment {
  attachmentId: number;
  requestId: number;
  fileType: FileType;
  filePath: string;
  fileName: string;
  uploadedAt: string;
}

// 교체 부품 상세
export interface PartUsed {
  partName: string;
  unitPrice: number;
  quantity: number;
}

// A/S 완료 보고서 (as_reports 테이블)
export interface ASReport {
  reportId: number;
  requestId: number;
  dealerId: number;
  repairType: RepairType;
  repairDescription?: string;
  partsUsed: PartUsed[];
  totalPartsCost?: number;
  createdAt: string;
}

// 보고서 첨부파일 (as_report_attachments 테이블)
export interface ASReportAttachment {
  attachmentId: number;
  reportId: number;
  fileType: 'IMAGE' | 'VIDEO';
  filePath: string;
  fileName: string;
  uploadedAt: string;
}

// A/S 고장 유형 (API faultType) — UI 신청 폼에서 사용
export type FaultType = 'POWER' | 'SPARK' | 'TEMPERATURE' | 'COMM_ERROR' | 'NOISE' | 'OTHER';

// A/S 긴급도
export type Urgency = 'HIGH' | 'NORMAL';

// 알림 심각도
export type AlertSeverity = 'WARNING' | 'CRITICAL';

// 알림 유형
export type AlertType =
  | 'COMM_ERROR'
  | 'INLET_TEMP'
  | 'FILTER_CHECK'
  | 'DUST_REMOVAL'
  | 'SPARK';

// A/S 알림 현황 항목
export interface ASAlert {
  alertId: number;
  storeId: number;
  storeName: string;
  equipmentId: number;
  equipmentName: string;
  controllerId?: number;
  controllerName?: string;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  currentValue?: number;
  unit?: string;
  isResolved: boolean;
  createdAt: string;
}

// A/S 요청 목록 항목 (API 응답)
export interface ASRequestListItem {
  requestId: number;
  storeId: number;
  storeName: string;
  equipmentId?: number;
  equipmentName?: string;
  urgency: Urgency;
  faultType: FaultType;
  description: string;
  status: ASStatus;
  dealerId?: number;
  dealerName?: string;
  preferredVisitDatetime?: string;
  createdAt: string;
  updatedAt: string;
}

// A/S 신청 요청 (API 요청 body)
export interface ASCreateRequest {
  storeId: number;
  equipmentId?: number;
  faultType: FaultType;
  description: string;
  preferredVisitDatetime?: string;
  urgency: Urgency;
  contactName: string;
  contactPhone: string;
}

// A/S 신청 응답
export interface ASCreateResponse {
  requestId: number;
  status: ASStatus;
  assignedDealerId?: number;
  assignedDealerName?: string;
  message: string;
}

// 매장별 장비 옵션 (A/S 신청 폼)
export interface EquipmentOption {
  equipmentId: number;
  equipmentName: string;
}

// A/S 상세 조회 응답
export interface ASDetail {
  requestId: number;
  store: { storeId: number; storeName: string };
  equipment: { equipmentId: number; equipmentName: string };
  urgency: Urgency;
  faultType: FaultType;
  description: string;
  preferredVisitDatetime?: string;
  visitScheduledDatetime?: string;
  contactName: string;
  contactPhone: string;
  status: ASStatus;
  assignedDealer?: { dealerId: number; dealerName: string };
  attachments: ASAttachment[];
  report?: ASReport & { attachments: ASReportAttachment[] };
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

// A/S 상태 변경 요청
export interface ASStatusUpdateRequest {
  status: ASStatus;
  memo?: string;
  visitScheduledDatetime?: string;
  dealerId?: number;
}

// A/S 보고서 작성 요청
export interface ASReportCreateRequest {
  visitDate: string;
  repairType: RepairType;
  repairDescription: string;
  result: 'COMPLETED' | 'PARTIAL' | 'REVISIT_NEEDED';
  partsUsed: PartUsed[];
  totalPartsCost: number;
  laborCost?: number;
  totalCost?: number;
  remarks?: string;
}

// 처리 결과 유형
export type ASRepairResult = 'COMPLETED' | 'PARTIAL' | 'REVISIT_NEEDED';

// 대리점 옵션
export interface DealerOption {
  dealerId: number;
  dealerName: string;
}
