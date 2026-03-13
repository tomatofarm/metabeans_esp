import type { UserRole } from '../../types/auth.types';
import type {
  FeatureCode,
  PermissionMatrix,
  PermissionUpdateRequest,
  PendingApproval,
  PasswordResetRequestItem,
  UserPermissionOverride,
  SystemUserItem,
  SystemUserDetail,
  SystemUserUpdateRequest,
  UserListParams,
  ThresholdSettings,
  MonitoringThreshold,
  CleaningThreshold,
  DamperAutoSetting,
} from '../../types/system.types';
import { FEATURE_CODE_LIST } from '../../types/system.types';
import { mockDelay, wrapResponse, type ApiResponse } from './common.mock';

// ========== 1. 권한 관리 Mock 데이터 ==========

// 역할별 기본 권한 매트릭스
const defaultPermissions: Record<FeatureCode, Record<UserRole, boolean>> = {
  'dashboard.view': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'equipment.view': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'equipment.create': { ADMIN: true, DEALER: true, HQ: false, OWNER: false },
  'equipment.edit': { ADMIN: true, DEALER: true, HQ: false, OWNER: false },
  'equipment.delete': { ADMIN: true, DEALER: true, HQ: false, OWNER: false },
  'monitoring.view': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'monitoring.board_temp': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'monitoring.spark': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'monitoring.filter_status': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'monitoring.fire_detection': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'monitoring.esg': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'monitoring.equipment_status': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'control.power': { ADMIN: true, DEALER: true, HQ: false, OWNER: true },
  'control.damper': { ADMIN: true, DEALER: true, HQ: false, OWNER: true },
  'control.fan': { ADMIN: true, DEALER: true, HQ: false, OWNER: true },
  'history.view': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'as.view': { ADMIN: true, DEALER: true, HQ: true, OWNER: true },
  'as.create': { ADMIN: true, DEALER: false, HQ: false, OWNER: true },
  'as.process': { ADMIN: true, DEALER: true, HQ: false, OWNER: false },
  'as.report': { ADMIN: true, DEALER: true, HQ: false, OWNER: false },
  'customer.view': { ADMIN: true, DEALER: false, HQ: false, OWNER: false },
  'customer.edit': { ADMIN: true, DEALER: false, HQ: false, OWNER: false },
  'system.permission': { ADMIN: true, DEALER: false, HQ: false, OWNER: false },
  'system.user': { ADMIN: true, DEALER: false, HQ: false, OWNER: false },
};

// 권한 매트릭스를 mutable copy로 관리
const permissionState = JSON.parse(JSON.stringify(defaultPermissions)) as typeof defaultPermissions;

export async function mockGetPermissionMatrix(): Promise<ApiResponse<PermissionMatrix[]>> {
  const matrix: PermissionMatrix[] = FEATURE_CODE_LIST.map((info) => {
    const perms = permissionState[info.code];
    return {
      featureCode: info.code,
      label: info.label,
      category: info.category,
      permissions: perms
        ? { ...perms }
        : { ADMIN: false, DEALER: false, HQ: false, OWNER: false },
    };
  });

  return mockDelay(wrapResponse(matrix), 400);
}

export async function mockUpdatePermissions(
  request: PermissionUpdateRequest,
): Promise<ApiResponse<{ success: boolean }>> {
  for (const change of request.changes) {
    const perms = permissionState[change.featureCode];
    if (perms) {
      perms[change.role] = change.isAllowed;
    }
  }
  return mockDelay(wrapResponse({ success: true }), 500);
}

// ========== 2. 가입 승인 Mock 데이터 ==========

const mockPendingApprovals: PendingApproval[] = [
  {
    userId: 10,
    loginId: 'new_dealer1',
    name: '최대리',
    role: 'DEALER',
    email: 'choi.dealer@example.com',
    phone: '010-5555-1234',
    businessName: '강남환경설비',
    businessNumber: '123-45-67890',
    createdAt: '2026-02-10T09:00:00Z',
  },
  {
    userId: 11,
    loginId: 'new_admin1',
    name: '정관리',
    role: 'ADMIN',
    email: 'jung.admin@metabeans.co.kr',
    phone: '010-6666-2345',
    businessName: '메타빈즈',
    businessNumber: '234-56-78901',
    createdAt: '2026-02-11T14:30:00Z',
  },
  {
    userId: 12,
    loginId: 'new_dealer2',
    name: '한대리',
    role: 'DEALER',
    email: 'han.dealer@example.com',
    phone: '010-7777-3456',
    businessName: '서초설비서비스',
    businessNumber: '345-67-89012',
    createdAt: '2026-02-12T10:15:00Z',
  },
  {
    userId: 13,
    loginId: 'new_hq1',
    name: '송본사',
    role: 'HQ',
    email: 'song.hq@franchise.com',
    phone: '010-8888-4567',
    businessName: '맛나프랜차이즈',
    businessNumber: '456-78-90123',
    createdAt: '2026-02-13T16:45:00Z',
  },
];

const mockPasswordResetRequests: PasswordResetRequestItem[] = [
  {
    requestId: 1,
    userId: 4,
    loginId: 'owner',
    name: '이점주',
    email: 'owner@metabeans.co.kr',
    requestedAt: '2026-02-12T08:00:00Z',
  },
  {
    requestId: 2,
    userId: 2,
    loginId: 'dealer',
    name: '김대리',
    email: 'dealer@metabeans.co.kr',
    requestedAt: '2026-02-13T11:20:00Z',
  },
];

export async function mockGetPendingApprovals(): Promise<ApiResponse<PendingApproval[]>> {
  return mockDelay(wrapResponse([...mockPendingApprovals]), 400);
}

export async function mockApproveUser(
  userId: number,
): Promise<ApiResponse<{ success: boolean }>> {
  const idx = mockPendingApprovals.findIndex((a) => a.userId === userId);
  if (idx !== -1) {
    mockPendingApprovals.splice(idx, 1);
  }
  return mockDelay(wrapResponse({ success: true }), 500);
}

export async function mockRejectUser(
  userId: number,
  _reason: string,
): Promise<ApiResponse<{ success: boolean }>> {
  const idx = mockPendingApprovals.findIndex((a) => a.userId === userId);
  if (idx !== -1) {
    mockPendingApprovals.splice(idx, 1);
  }
  return mockDelay(wrapResponse({ success: true }), 500);
}

export async function mockGetPasswordResetRequests(): Promise<ApiResponse<PasswordResetRequestItem[]>> {
  return mockDelay(wrapResponse([...mockPasswordResetRequests]), 300);
}

export async function mockApprovePasswordReset(
  requestId: number,
): Promise<ApiResponse<{ success: boolean; tempPassword: string }>> {
  const idx = mockPasswordResetRequests.findIndex((r) => r.requestId === requestId);
  if (idx !== -1) {
    mockPasswordResetRequests.splice(idx, 1);
  }
  return mockDelay(wrapResponse({ success: true, tempPassword: 'temp1234!' }), 500);
}

// ========== 3. 사용자 관리 Mock 데이터 ==========

const mockUsers: SystemUserItem[] = [
  {
    userId: 1,
    loginId: 'admin',
    name: '관리자',
    role: 'ADMIN',
    email: 'admin@metabeans.co.kr',
    phone: '010-1234-5678',
    accountStatus: 'ACTIVE',
    lastLoginAt: '2026-02-14T08:30:00Z',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    userId: 2,
    loginId: 'dealer',
    name: '김대리',
    role: 'DEALER',
    email: 'dealer@metabeans.co.kr',
    phone: '010-2345-6789',
    accountStatus: 'ACTIVE',
    lastLoginAt: '2026-02-13T17:00:00Z',
    createdAt: '2025-03-15T00:00:00Z',
  },
  {
    userId: 3,
    loginId: 'hq',
    name: '박본사',
    role: 'HQ',
    email: 'hq@metabeans.co.kr',
    phone: '010-3456-7890',
    accountStatus: 'ACTIVE',
    lastLoginAt: '2026-02-12T10:00:00Z',
    createdAt: '2025-05-20T00:00:00Z',
  },
  {
    userId: 4,
    loginId: 'owner',
    name: '이점주',
    role: 'OWNER',
    email: 'owner@metabeans.co.kr',
    phone: '010-4567-8901',
    accountStatus: 'ACTIVE',
    lastLoginAt: '2026-02-14T07:00:00Z',
    createdAt: '2025-06-01T00:00:00Z',
  },
  {
    userId: 5,
    loginId: 'dealer2',
    name: '최대리',
    role: 'DEALER',
    email: 'choi@envtech.com',
    phone: '010-5678-1234',
    accountStatus: 'ACTIVE',
    lastLoginAt: '2026-02-10T14:30:00Z',
    createdAt: '2025-07-10T00:00:00Z',
  },
  {
    userId: 6,
    loginId: 'owner2',
    name: '정점주',
    role: 'OWNER',
    email: 'jung.owner@example.com',
    phone: '010-6789-2345',
    accountStatus: 'SUSPENDED',
    lastLoginAt: '2026-01-20T09:00:00Z',
    createdAt: '2025-08-01T00:00:00Z',
  },
  {
    userId: 7,
    loginId: 'hq2',
    name: '강본사',
    role: 'HQ',
    email: 'kang.hq@franchise.com',
    phone: '010-7890-3456',
    accountStatus: 'ACTIVE',
    lastLoginAt: '2026-02-11T11:00:00Z',
    createdAt: '2025-09-15T00:00:00Z',
  },
  {
    userId: 8,
    loginId: 'owner3',
    name: '윤점주',
    role: 'OWNER',
    email: 'yoon@example.com',
    phone: '010-8901-4567',
    accountStatus: 'ACTIVE',
    lastLoginAt: '2026-02-13T16:00:00Z',
    createdAt: '2025-10-01T00:00:00Z',
  },
  {
    userId: 9,
    loginId: 'dealer3',
    name: '임대리',
    role: 'DEALER',
    email: 'lim@envservice.com',
    phone: '010-9012-5678',
    accountStatus: 'DELETED',
    lastLoginAt: '2025-12-01T10:00:00Z',
    createdAt: '2025-04-01T00:00:00Z',
  },
];

// 사용자별 권한 오버라이드 (userId → overrides)
const mockUserOverrides: Record<number, UserPermissionOverride[]> = {
  3: [
    {
      overrideId: 1,
      userId: 3,
      featureCode: 'control.power',
      isAllowed: true,
      reason: 'HQ 본사 요청으로 전원 제어 권한 부여',
      setBy: 1,
      createdAt: '2026-01-15T10:00:00Z',
    },
  ],
  6: [
    {
      overrideId: 2,
      userId: 6,
      featureCode: 'equipment.create',
      isAllowed: true,
      reason: '임시 장비 등록 권한 부여',
      setBy: 1,
      createdAt: '2026-02-01T09:00:00Z',
    },
  ],
};

export async function mockGetUsers(
  params?: UserListParams,
): Promise<ApiResponse<SystemUserItem[]>> {
  let filtered = [...mockUsers];

  if (params?.role) {
    filtered = filtered.filter((u) => u.role === params.role);
  }
  if (params?.accountStatus) {
    filtered = filtered.filter((u) => u.accountStatus === params.accountStatus);
  }
  if (params?.search) {
    const keyword = params.search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(keyword) ||
        u.loginId.toLowerCase().includes(keyword),
    );
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return mockDelay(
    wrapResponse(paged, { page, pageSize, totalCount: filtered.length }),
    400,
  );
}

export async function mockGetUserDetail(
  userId: number,
): Promise<ApiResponse<SystemUserDetail | null>> {
  const user = mockUsers.find((u) => u.userId === userId);
  if (!user) {
    return mockDelay(wrapResponse(null), 300);
  }

  const detail: SystemUserDetail = {
    ...user,
    businessName: user.role === 'ADMIN' ? '메타빈즈' : `사업체_${user.userId}`,
    businessNumber: `${100 + user.userId}-${20 + user.userId}-${30000 + user.userId}`,
    overrides: mockUserOverrides[user.userId] ?? [],
  };

  return mockDelay(wrapResponse(detail), 400);
}

export async function mockUpdateUser(
  userId: number,
  data: SystemUserUpdateRequest,
): Promise<ApiResponse<{ success: boolean }>> {
  const user = mockUsers.find((u) => u.userId === userId);
  if (user) {
    if (data.role !== undefined) user.role = data.role;
    if (data.accountStatus !== undefined) user.accountStatus = data.accountStatus;
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.phone !== undefined) user.phone = data.phone;
  }
  return mockDelay(wrapResponse({ success: true }), 500);
}

export async function mockGetUserPermissionOverrides(
  userId: number,
): Promise<ApiResponse<UserPermissionOverride[]>> {
  return mockDelay(wrapResponse(mockUserOverrides[userId] ?? []), 300);
}

export async function mockSaveUserPermissionOverride(
  userId: number,
  featureCode: FeatureCode,
  isAllowed: boolean,
  reason?: string,
): Promise<ApiResponse<{ success: boolean }>> {
  if (!mockUserOverrides[userId]) {
    mockUserOverrides[userId] = [];
  }
  const overrides = mockUserOverrides[userId]!;
  const existing = overrides.findIndex(
    (o) => o.featureCode === featureCode,
  );
  const existingItem = existing !== -1 ? overrides[existing] : undefined;
  if (existingItem) {
    existingItem.isAllowed = isAllowed;
    existingItem.reason = reason;
  } else {
    overrides.push({
      overrideId: Date.now(),
      userId,
      featureCode,
      isAllowed,
      reason,
      setBy: 1,
      createdAt: new Date().toISOString(),
    });
  }
  return mockDelay(wrapResponse({ success: true }), 400);
}

export async function mockDeleteUserPermissionOverride(
  userId: number,
  featureCode: FeatureCode,
): Promise<ApiResponse<{ success: boolean }>> {
  const existing = mockUserOverrides[userId];
  if (existing) {
    mockUserOverrides[userId] = existing.filter(
      (o) => o.featureCode !== featureCode,
    );
  }
  return mockDelay(wrapResponse({ success: true }), 300);
}

// ========== 4. 기준수치 관리 Mock 데이터 ==========

const mockMonitoringThresholds: MonitoringThreshold[] = [
  {
    thresholdId: 1,
    metricName: '보드 온도',
    unit: '°C',
    yellowMin: 60,
    redMin: 80,
    description: '파워팩 보드 온도 기준',
    setBy: 1,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    thresholdId: 2,
    metricName: '스파크',
    unit: '회',
    yellowMin: 30,
    redMin: 60,
    description: '스파크 발생 수치 기준',
    setBy: 1,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    thresholdId: 3,
    metricName: 'PM2.5',
    unit: 'µg/m³',
    yellowMin: 35,
    redMin: 75,
    description: 'PM2.5 배출 먼지 제거 성능',
    setBy: 1,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    thresholdId: 4,
    metricName: 'PM10',
    unit: 'µg/m³',
    yellowMin: 75,
    redMin: 100,
    description: 'PM10 배출 먼지 제거 성능',
    setBy: 1,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    thresholdId: 5,
    metricName: '차압 (필터 점검)',
    unit: 'Pa',
    yellowMin: 30,
    redMin: undefined,
    description: '필터 점검 기준 차압',
    setBy: 1,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    thresholdId: 6,
    metricName: '유입 온도',
    unit: '°C',
    yellowMin: 70,
    redMin: 100,
    description: '유입 온도 기준',
    setBy: 1,
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const mockCleaningThresholds: CleaningThreshold[] = [
  {
    thresholdId: 1,
    equipmentId: 0,
    sparkThreshold: 70,
    sparkTimeWindow: 600,
    pressureBase: 20,
    pressureRate: 10,
    setBy: 1,
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const mockDamperAutoSettings: DamperAutoSetting[] = [
  {
    settingId: 1,
    equipmentId: 0,
    equipmentName: '기본값 (전체 장비)',
    targetFlowCmh: 850,
    targetVelocity: 3.5,
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    settingId: 2,
    equipmentId: 1,
    equipmentName: '강남점 ESP 집진기 #1',
    targetFlowCmh: 900,
    targetVelocity: 4.0,
    updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    settingId: 3,
    equipmentId: 3,
    equipmentName: '홍대점 ESP 집진기 #1',
    targetFlowCmh: 800,
    targetVelocity: 3.2,
    updatedAt: '2026-02-01T00:00:00Z',
  },
];

let mockSparkBaseTime = 600; // 기본 10분 (초)

export async function mockGetThresholds(): Promise<ApiResponse<ThresholdSettings>> {
  return mockDelay(
    wrapResponse({
      monitoringThresholds: [...mockMonitoringThresholds],
      cleaningThresholds: [...mockCleaningThresholds],
      damperAutoSettings: [...mockDamperAutoSettings],
      sparkBaseTime: mockSparkBaseTime,
    }),
    400,
  );
}

export async function mockUpdateThresholds(
  data: Partial<ThresholdSettings>,
): Promise<ApiResponse<{ success: boolean }>> {
  if (data.monitoringThresholds) {
    for (const updated of data.monitoringThresholds) {
      const idx = mockMonitoringThresholds.findIndex(
        (t) => t.thresholdId === updated.thresholdId,
      );
      if (idx !== -1) {
        mockMonitoringThresholds[idx] = { ...updated, updatedAt: new Date().toISOString() };
      }
    }
  }
  if (data.cleaningThresholds) {
    for (const updated of data.cleaningThresholds) {
      const idx = mockCleaningThresholds.findIndex(
        (t) => t.thresholdId === updated.thresholdId,
      );
      if (idx !== -1) {
        mockCleaningThresholds[idx] = { ...updated, updatedAt: new Date().toISOString() };
      }
    }
  }
  if (data.damperAutoSettings) {
    for (const updated of data.damperAutoSettings) {
      const idx = mockDamperAutoSettings.findIndex(
        (s) => s.settingId === updated.settingId,
      );
      if (idx !== -1) {
        mockDamperAutoSettings[idx] = { ...updated, updatedAt: new Date().toISOString() };
      }
    }
  }
  if (data.sparkBaseTime !== undefined) {
    mockSparkBaseTime = data.sparkBaseTime;
  }
  return mockDelay(wrapResponse({ success: true }), 500);
}
