import dayjs from 'dayjs';
import type {
  ASAlert,
  AlertType,
  AlertSeverity,
  ASRequestListItem,
  ASCreateRequest,
  ASCreateResponse,
  ASStatus,
  FaultType,
  Urgency,
  EquipmentOption,
  ASDetail,
  ASReport,
  ASReportAttachment,
  ASReportCreateRequest,
  ASStatusUpdateRequest,
  DealerOption,
  RepairType,
} from '../../types/as-service.types';
import { mockDelay, wrapResponse, type ApiResponse } from './common.mock';
import { FILTER_CHECK_MESSAGE } from '../../utils/statusHelper';

// --- Mock 알림 데이터 ---

const now = dayjs();

const mockAlerts: ASAlert[] = [
  {
    alertId: 1,
    storeId: 2,
    storeName: '홍대점 (굽기)',
    equipmentId: 4,
    equipmentName: 'ESP 집진기 #1 (B1)',
    controllerId: 6,
    controllerName: 'ctrl-001',
    alertType: 'COMM_ERROR',
    severity: 'CRITICAL',
    message: '통신 끊김 1일 이상 — 즉시 점검 필요',
    isResolved: false,
    createdAt: now.subtract(26, 'hour').toISOString(),
  },
  {
    alertId: 2,
    storeId: 2,
    storeName: '홍대점 (굽기)',
    equipmentId: 3,
    equipmentName: 'ESP 집진기 #1 (1F)',
    controllerId: 5,
    controllerName: 'ctrl-002',
    alertType: 'COMM_ERROR',
    severity: 'WARNING',
    message: '통신 끊김 2시간 — 연결 상태 확인 필요',
    isResolved: false,
    createdAt: now.subtract(2, 'hour').toISOString(),
  },
  {
    alertId: 3,
    storeId: 1,
    storeName: '강남점 (튀김)',
    equipmentId: 1,
    equipmentName: 'ESP 집진기 #1',
    controllerId: 1,
    controllerName: 'ctrl-001',
    alertType: 'INLET_TEMP',
    severity: 'CRITICAL',
    currentValue: 105.3,
    unit: '°C',
    message: '유입 온도 105.3°C — 100°C 이상 위험',
    isResolved: false,
    createdAt: now.subtract(30, 'minute').toISOString(),
  },
  {
    alertId: 4,
    storeId: 3,
    storeName: '신촌점 (커피로스팅)',
    equipmentId: 5,
    equipmentName: 'ESP 집진기 #1',
    controllerId: 7,
    controllerName: 'ctrl-001',
    alertType: 'INLET_TEMP',
    severity: 'WARNING',
    currentValue: 78.5,
    unit: '°C',
    message: '유입 온도 78.5°C — 70°C 이상 주의',
    isResolved: false,
    createdAt: now.subtract(1, 'hour').toISOString(),
  },
  {
    alertId: 5,
    storeId: 1,
    storeName: '강남점 (튀김)',
    equipmentId: 2,
    equipmentName: 'ESP 집진기 #2',
    alertType: 'FILTER_CHECK',
    severity: 'WARNING',
    currentValue: 42.5,
    unit: 'Pa',
    message: FILTER_CHECK_MESSAGE,
    isResolved: false,
    createdAt: now.subtract(3, 'hour').toISOString(),
  },
  {
    alertId: 6,
    storeId: 2,
    storeName: '홍대점 (굽기)',
    equipmentId: 3,
    equipmentName: 'ESP 집진기 #1 (1F)',
    alertType: 'DUST_REMOVAL',
    severity: 'CRITICAL',
    currentValue: 68.5,
    unit: 'µg/m³',
    message: '먼지제거 성능 점검 필요 — PM2.5 68.5µg/m³',
    isResolved: false,
    createdAt: now.subtract(45, 'minute').toISOString(),
  },
  {
    alertId: 7,
    storeId: 1,
    storeName: '강남점 (튀김)',
    equipmentId: 1,
    equipmentName: 'ESP 집진기 #1',
    controllerId: 2,
    controllerName: 'ctrl-002',
    alertType: 'SPARK',
    severity: 'WARNING',
    currentValue: 45,
    message: '스파크 수치 기준 초과 (45회)',
    isResolved: false,
    createdAt: now.subtract(4, 'hour').toISOString(),
  },
  {
    alertId: 8,
    storeId: 1,
    storeName: '강남점 (튀김)',
    equipmentId: 2,
    equipmentName: 'ESP 집진기 #2',
    controllerId: 3,
    controllerName: 'ctrl-003',
    alertType: 'INLET_TEMP',
    severity: 'WARNING',
    currentValue: 72.1,
    unit: '°C',
    message: '유입 온도 72.1°C — 70°C 이상 주의',
    isResolved: true,
    createdAt: now.subtract(1, 'day').toISOString(),
  },
];

// --- Mock A/S 요청 데이터 ---

const mockASRequests: ASRequestListItem[] = [
  {
    requestId: 9001,
    storeId: 1,
    storeName: '강남점 (튀김)',
    equipmentId: 1,
    equipmentName: 'ESP 집진기 #1',
    urgency: 'HIGH',
    faultType: 'TEMPERATURE',
    description: '유입 온도가 지속적으로 100°C를 초과합니다. 즉시 점검이 필요합니다.',
    status: 'IN_PROGRESS',
    dealerId: 1,
    dealerName: '서울환경테크',
    preferredVisitDatetime: '2026-02-14T10:00:00Z',
    createdAt: now.subtract(2, 'day').toISOString(),
    updatedAt: now.subtract(1, 'day').toISOString(),
  },
  {
    requestId: 9002,
    storeId: 1,
    storeName: '강남점 (튀김)',
    equipmentId: 2,
    equipmentName: 'ESP 집진기 #2',
    urgency: 'NORMAL',
    faultType: 'SPARK',
    description: '주기적으로 스파크 감지 알람이 발생합니다. 필터 세척이 필요해 보입니다.',
    status: 'PENDING',
    dealerId: 1,
    dealerName: '서울환경테크',
    preferredVisitDatetime: '2026-02-18T14:00:00Z',
    createdAt: now.subtract(1, 'day').toISOString(),
    updatedAt: now.subtract(1, 'day').toISOString(),
  },
  {
    requestId: 9003,
    storeId: 2,
    storeName: '홍대점 (굽기)',
    equipmentId: 4,
    equipmentName: 'ESP 집진기 #1 (B1)',
    urgency: 'HIGH',
    faultType: 'COMM_ERROR',
    description: '장비 통신이 하루 이상 끊긴 상태입니다. 게이트웨이 점검 바랍니다.',
    status: 'ACCEPTED',
    dealerId: 2,
    dealerName: '경기설비',
    preferredVisitDatetime: '2026-02-15T09:00:00Z',
    createdAt: now.subtract(26, 'hour').toISOString(),
    updatedAt: now.subtract(20, 'hour').toISOString(),
  },
  {
    requestId: 9004,
    storeId: 3,
    storeName: '신촌점 (커피로스팅)',
    equipmentId: 5,
    equipmentName: 'ESP 집진기 #1',
    urgency: 'NORMAL',
    faultType: 'NOISE',
    description: '팬 작동 시 비정상적인 소음이 발생합니다.',
    status: 'COMPLETED',
    dealerId: 1,
    dealerName: '서울환경테크',
    preferredVisitDatetime: '2026-02-10T11:00:00Z',
    createdAt: now.subtract(5, 'day').toISOString(),
    updatedAt: now.subtract(2, 'day').toISOString(),
  },
  {
    requestId: 9005,
    storeId: 2,
    storeName: '홍대점 (굽기)',
    equipmentId: 3,
    equipmentName: 'ESP 집진기 #1 (1F)',
    urgency: 'NORMAL',
    faultType: 'OTHER',
    description: '먼지제거 성능이 저하된 것으로 보입니다. PM2.5 수치가 높게 나옵니다.',
    status: 'ASSIGNED',
    dealerId: 2,
    dealerName: '경기설비',
    preferredVisitDatetime: '2026-02-16T15:00:00Z',
    createdAt: now.subtract(3, 'day').toISOString(),
    updatedAt: now.subtract(1, 'day').toISOString(),
  },
  {
    requestId: 9006,
    storeId: 1,
    storeName: '강남점 (튀김)',
    equipmentId: 1,
    equipmentName: 'ESP 집진기 #1',
    urgency: 'NORMAL',
    faultType: 'POWER',
    description: '파워팩 전원이 간헐적으로 꺼지는 현상이 발생합니다.',
    status: 'CANCELLED',
    dealerId: 1,
    dealerName: '서울환경테크',
    createdAt: now.subtract(10, 'day').toISOString(),
    updatedAt: now.subtract(8, 'day').toISOString(),
  },
  {
    requestId: 9007,
    storeId: 3,
    storeName: '신촌점 (커피로스팅)',
    equipmentId: 5,
    equipmentName: 'ESP 집진기 #1',
    urgency: 'HIGH',
    faultType: 'TEMPERATURE',
    description: '유입 온도가 비정상적으로 높아 즉시 점검이 필요합니다.',
    status: 'REPORT_SUBMITTED',
    dealerId: 1,
    dealerName: '서울환경테크',
    preferredVisitDatetime: '2026-02-08T09:00:00Z',
    createdAt: now.subtract(8, 'day').toISOString(),
    updatedAt: now.subtract(3, 'day').toISOString(),
  },
  {
    requestId: 9008,
    storeId: 2,
    storeName: '홍대점 (굽기)',
    equipmentId: 3,
    equipmentName: 'ESP 집진기 #1 (1F)',
    urgency: 'NORMAL',
    faultType: 'SPARK',
    description: '스파크 감지 빈도가 높아 필터 세척 후 재확인이 필요합니다.',
    status: 'CLOSED',
    dealerId: 2,
    dealerName: '경기설비',
    preferredVisitDatetime: '2026-02-05T14:00:00Z',
    createdAt: now.subtract(12, 'day').toISOString(),
    updatedAt: now.subtract(5, 'day').toISOString(),
  },
];

// --- 매장별 장비 옵션 ---

const mockEquipmentOptions: Record<number, EquipmentOption[]> = {
  1: [
    { equipmentId: 1, equipmentName: 'ESP 집진기 #1' },
    { equipmentId: 2, equipmentName: 'ESP 집진기 #2' },
  ],
  2: [
    { equipmentId: 3, equipmentName: 'ESP 집진기 #1 (1F)' },
    { equipmentId: 4, equipmentName: 'ESP 집진기 #1 (B1)' },
  ],
  3: [
    { equipmentId: 5, equipmentName: 'ESP 집진기 #1' },
  ],
};

// --- Mock API 함수 ---

// 알림 현황 조회
export async function mockGetASAlerts(params?: {
  severity?: AlertSeverity;
  alertType?: AlertType;
  storeId?: number;
  isResolved?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<ASAlert[]>> {
  let filtered = [...mockAlerts];

  if (params?.severity) {
    filtered = filtered.filter((a) => a.severity === params.severity);
  }
  if (params?.alertType) {
    filtered = filtered.filter((a) => a.alertType === params.alertType);
  }
  if (params?.storeId) {
    filtered = filtered.filter((a) => a.storeId === params.storeId);
  }
  if (params?.isResolved !== undefined) {
    filtered = filtered.filter((a) => a.isResolved === params.isResolved);
  }
  if (params?.from) {
    const fromDate = dayjs(params.from);
    filtered = filtered.filter((a) => dayjs(a.createdAt).isAfter(fromDate) || dayjs(a.createdAt).isSame(fromDate));
  }
  if (params?.to) {
    const toDate = dayjs(params.to);
    filtered = filtered.filter((a) => dayjs(a.createdAt).isBefore(toDate) || dayjs(a.createdAt).isSame(toDate));
  }

  // 최신순 정렬
  filtered.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return mockDelay(
    wrapResponse(paged, { page, pageSize, totalCount: filtered.length }),
    400,
  );
}

// A/S 요청 목록 조회
export async function mockGetASRequests(params?: {
  status?: ASStatus;
  urgency?: Urgency;
  storeId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<ASRequestListItem[]>> {
  let filtered = [...mockASRequests];

  if (params?.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }
  if (params?.urgency) {
    filtered = filtered.filter((r) => r.urgency === params.urgency);
  }
  if (params?.storeId) {
    filtered = filtered.filter((r) => r.storeId === params.storeId);
  }
  if (params?.from) {
    const fromDate = dayjs(params.from);
    filtered = filtered.filter((r) => dayjs(r.createdAt).isAfter(fromDate) || dayjs(r.createdAt).isSame(fromDate));
  }
  if (params?.to) {
    const toDate = dayjs(params.to);
    filtered = filtered.filter((r) => dayjs(r.createdAt).isBefore(toDate) || dayjs(r.createdAt).isSame(toDate));
  }

  // 최신순 정렬
  filtered.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return mockDelay(
    wrapResponse(paged, { page, pageSize, totalCount: filtered.length }),
    400,
  );
}

// A/S 신청
let nextRequestId = 9100;

export async function mockCreateASRequest(
  req: ASCreateRequest,
): Promise<ApiResponse<ASCreateResponse>> {
  const requestId = nextRequestId++;

  // 매장 dealer 자동 매칭
  const dealerMap: Record<number, { id: number; name: string }> = {
    1: { id: 1, name: '서울환경테크' },
    2: { id: 2, name: '경기설비' },
    3: { id: 1, name: '서울환경테크' },
  };

  const dealer = dealerMap[req.storeId];

  // 내부 목록에도 추가 (목록 즉시 반영)
  const storeNames: Record<number, string> = {
    1: '강남점 (튀김)',
    2: '홍대점 (굽기)',
    3: '신촌점 (커피로스팅)',
  };

  const equipOptions = mockEquipmentOptions[req.storeId] ?? [];
  const equip = equipOptions.find((e) => e.equipmentId === req.equipmentId);

  mockASRequests.unshift({
    requestId,
    storeId: req.storeId,
    storeName: storeNames[req.storeId] ?? '알 수 없음',
    equipmentId: req.equipmentId,
    equipmentName: equip?.equipmentName,
    urgency: req.urgency,
    faultType: req.faultType,
    description: req.description,
    status: 'PENDING',
    dealerId: dealer?.id,
    dealerName: dealer?.name,
    preferredVisitDatetime: req.preferredVisitDatetime,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const response: ASCreateResponse = {
    requestId,
    status: 'PENDING',
    assignedDealerId: dealer?.id,
    assignedDealerName: dealer?.name,
    message: 'A/S 접수가 완료되었습니다.',
  };

  return mockDelay(wrapResponse(response), 500);
}

// 매장별 장비 옵션 조회
export async function mockGetEquipmentOptionsByStore(
  storeId: number,
): Promise<EquipmentOption[]> {
  return mockDelay(mockEquipmentOptions[storeId] ?? [], 200);
}

// 매장 옵션 (A/S 신청 폼용 — equipment mock의 storeOptions 재사용)
export interface ASStoreOption {
  storeId: number;
  storeName: string;
}

const mockASStoreOptions: ASStoreOption[] = [
  { storeId: 1, storeName: '강남점 (튀김)' },
  { storeId: 2, storeName: '홍대점 (굽기)' },
  { storeId: 3, storeName: '신촌점 (커피로스팅)' },
];

export async function mockGetASStoreOptions(): Promise<ASStoreOption[]> {
  return mockDelay(mockASStoreOptions, 200);
}

// --- 대리점 옵션 ---

const mockDealerOptions: DealerOption[] = [
  { dealerId: 1, dealerName: '서울환경테크' },
  { dealerId: 2, dealerName: '경기설비' },
  { dealerId: 3, dealerName: '인천환경서비스' },
];

export async function mockGetDealerOptions(): Promise<DealerOption[]> {
  return mockDelay(mockDealerOptions, 200);
}

// --- Mock 보고서 데이터 ---

const mockReports: Record<number, ASReport & { attachments: ASReportAttachment[]; result: string; remarks?: string; laborCost?: number; totalCost?: number }> = {
  9004: {
    reportId: 1001,
    requestId: 9004,
    dealerId: 1,
    repairType: 'PART_REPLACE' as RepairType,
    repairDescription: '팬 모터 베어링 교체 후 비정상 소음이 해결되었습니다. 내부 팬 블레이드 정렬도 함께 조정하였습니다.',
    partsUsed: [
      { partName: '팬 모터 베어링', unitPrice: 25000, quantity: 2 },
      { partName: '팬 블레이드 정렬 키트', unitPrice: 15000, quantity: 1 },
    ],
    totalPartsCost: 65000,
    laborCost: 80000,
    totalCost: 145000,
    result: 'COMPLETED',
    remarks: '3개월 후 재점검을 권장합니다. 팬 블레이드의 마모 상태를 지속적으로 확인해주세요.',
    createdAt: now.subtract(2, 'day').toISOString(),
    attachments: [
      {
        attachmentId: 101,
        reportId: 1001,
        fileType: 'IMAGE',
        filePath: '/files/as-report/9004/before.jpg',
        fileName: '처리_전_사진.jpg',
        uploadedAt: now.subtract(2, 'day').toISOString(),
      },
      {
        attachmentId: 102,
        reportId: 1001,
        fileType: 'IMAGE',
        filePath: '/files/as-report/9004/after.jpg',
        fileName: '처리_후_사진.jpg',
        uploadedAt: now.subtract(2, 'day').toISOString(),
      },
    ],
  },
  9007: {
    reportId: 1002,
    requestId: 9007,
    dealerId: 1,
    repairType: 'CLEANING' as RepairType,
    repairDescription: '유입구 온도센서 주변 이물질 제거 및 방열팬 청소를 실시하였습니다. 온도가 정상 범위로 복귀하였습니다.',
    partsUsed: [
      { partName: '온도센서 케이블', unitPrice: 12000, quantity: 1 },
      { partName: '방열 패드', unitPrice: 8000, quantity: 3 },
    ],
    totalPartsCost: 36000,
    laborCost: 60000,
    totalCost: 96000,
    result: 'COMPLETED',
    remarks: '정기적인 방열부 청소가 필요합니다.',
    createdAt: now.subtract(3, 'day').toISOString(),
    attachments: [
      {
        attachmentId: 103,
        reportId: 1002,
        fileType: 'IMAGE',
        filePath: '/files/as-report/9007/before.jpg',
        fileName: '처리_전_사진.jpg',
        uploadedAt: now.subtract(3, 'day').toISOString(),
      },
    ],
  },
  9008: {
    reportId: 1003,
    requestId: 9008,
    dealerId: 2,
    repairType: 'FILTER_REPLACE' as RepairType,
    repairDescription: 'ESP 필터 전체 교체 및 내부 청소를 완료하였습니다. 스파크 감지가 정상 범위로 돌아왔습니다.',
    partsUsed: [
      { partName: 'ESP 필터', unitPrice: 50000, quantity: 2 },
      { partName: '파워팩 보드', unitPrice: 150000, quantity: 1 },
    ],
    totalPartsCost: 250000,
    laborCost: 100000,
    totalCost: 350000,
    result: 'COMPLETED',
    createdAt: now.subtract(5, 'day').toISOString(),
    attachments: [
      {
        attachmentId: 104,
        reportId: 1003,
        fileType: 'IMAGE',
        filePath: '/files/as-report/9008/after.jpg',
        fileName: '처리_후_사진.jpg',
        uploadedAt: now.subtract(5, 'day').toISOString(),
      },
    ],
  },
};

// --- Mock 상세 데이터 빌더 ---

function buildASDetail(requestId: number): ASDetail | null {
  const request = mockASRequests.find((r) => r.requestId === requestId);
  if (!request) return null;

  const report = mockReports[requestId];

  return {
    requestId: request.requestId,
    store: { storeId: request.storeId, storeName: request.storeName },
    equipment: {
      equipmentId: request.equipmentId ?? 0,
      equipmentName: request.equipmentName ?? '알 수 없음',
    },
    urgency: request.urgency,
    faultType: request.faultType,
    description: request.description,
    preferredVisitDatetime: request.preferredVisitDatetime,
    visitScheduledDatetime:
      request.status === 'IN_PROGRESS' || request.status === 'COMPLETED' || request.status === 'REPORT_SUBMITTED' || request.status === 'CLOSED'
        ? request.preferredVisitDatetime
        : undefined,
    contactName: '이점주',
    contactPhone: '010-4567-8901',
    status: request.status,
    assignedDealer: request.dealerId
      ? { dealerId: request.dealerId, dealerName: request.dealerName ?? '알 수 없음' }
      : undefined,
    attachments: [
      {
        attachmentId: requestId * 10 + 1,
        requestId,
        fileType: 'IMAGE',
        filePath: `/files/as/${requestId}/photo1.jpg`,
        fileName: '장비_사진_1.jpg',
        uploadedAt: request.createdAt,
      },
    ],
    report: report ? {
      reportId: report.reportId,
      requestId: report.requestId,
      dealerId: report.dealerId,
      repairType: report.repairType,
      repairDescription: report.repairDescription,
      partsUsed: report.partsUsed,
      totalPartsCost: report.totalPartsCost,
      createdAt: report.createdAt,
      attachments: report.attachments,
    } : undefined,
    memo: request.status === 'IN_PROGRESS' ? '현장 방문 진행 중' : undefined,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

// A/S 상세 조회
export async function mockGetASDetail(
  requestId: number,
): Promise<ApiResponse<ASDetail | null>> {
  const detail = buildASDetail(requestId);
  return mockDelay(wrapResponse(detail), 400);
}

// A/S 상태 변경
export async function mockUpdateASStatus(
  requestId: number,
  update: ASStatusUpdateRequest,
): Promise<ApiResponse<{ success: boolean }>> {
  const request = mockASRequests.find((r) => r.requestId === requestId);
  if (request) {
    request.status = update.status;
    request.updatedAt = new Date().toISOString();
    if (update.dealerId) {
      const dealer = mockDealerOptions.find((d) => d.dealerId === update.dealerId);
      if (dealer) {
        request.dealerId = dealer.dealerId;
        request.dealerName = dealer.dealerName;
      }
    }
  }
  return mockDelay(wrapResponse({ success: true }), 400);
}

// 대리점 배정
export async function mockAssignDealer(
  requestId: number,
  dealerId: number,
): Promise<ApiResponse<{ success: boolean }>> {
  const request = mockASRequests.find((r) => r.requestId === requestId);
  if (request) {
    const dealer = mockDealerOptions.find((d) => d.dealerId === dealerId);
    if (dealer) {
      request.dealerId = dealer.dealerId;
      request.dealerName = dealer.dealerName;
      request.status = 'ASSIGNED';
      request.updatedAt = new Date().toISOString();
    }
  }
  return mockDelay(wrapResponse({ success: true }), 400);
}

// 보고서 조회
export async function mockGetASReport(
  requestId: number,
): Promise<ApiResponse<(ASReport & { attachments: ASReportAttachment[]; result: string; remarks?: string; laborCost?: number; totalCost?: number }) | null>> {
  const report = mockReports[requestId] ?? null;
  return mockDelay(wrapResponse(report), 400);
}

// 보고서 작성
let nextReportId = 2000;

export async function mockCreateASReport(
  requestId: number,
  data: ASReportCreateRequest,
): Promise<ApiResponse<{ reportId: number }>> {
  const reportId = nextReportId++;
  mockReports[requestId] = {
    reportId,
    requestId,
    dealerId: 1,
    repairType: data.repairType,
    repairDescription: data.repairDescription,
    partsUsed: data.partsUsed,
    totalPartsCost: data.totalPartsCost,
    laborCost: data.laborCost,
    totalCost: data.totalCost,
    result: data.result,
    remarks: data.remarks,
    createdAt: new Date().toISOString(),
    attachments: [],
  };

  // 상태를 REPORT_SUBMITTED로 변경
  const request = mockASRequests.find((r) => r.requestId === requestId);
  if (request) {
    request.status = 'REPORT_SUBMITTED';
    request.updatedAt = new Date().toISOString();
  }

  return mockDelay(wrapResponse({ reportId }), 500);
}

// 처리 현황 목록 조회 (필터 확장)
export async function mockGetASStatusList(params?: {
  status?: ASStatus;
  urgency?: Urgency;
  storeId?: number;
  dealerId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<ASRequestListItem[]>> {
  let filtered = [...mockASRequests];

  if (params?.status) {
    filtered = filtered.filter((r) => r.status === params.status);
  }
  if (params?.urgency) {
    filtered = filtered.filter((r) => r.urgency === params.urgency);
  }
  if (params?.storeId) {
    filtered = filtered.filter((r) => r.storeId === params.storeId);
  }
  if (params?.dealerId) {
    filtered = filtered.filter((r) => r.dealerId === params.dealerId);
  }
  if (params?.from) {
    const fromDate = dayjs(params.from);
    filtered = filtered.filter(
      (r) => dayjs(r.createdAt).isAfter(fromDate) || dayjs(r.createdAt).isSame(fromDate),
    );
  }
  if (params?.to) {
    const toDate = dayjs(params.to);
    filtered = filtered.filter(
      (r) => dayjs(r.createdAt).isBefore(toDate) || dayjs(r.createdAt).isSame(toDate),
    );
  }

  filtered.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return mockDelay(
    wrapResponse(paged, { page, pageSize, totalCount: filtered.length }),
    400,
  );
}
