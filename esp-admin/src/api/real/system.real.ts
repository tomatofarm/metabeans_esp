import { apiRequest } from './apiHelpers';
import type { ApiResponse } from '../mock/common.mock';
import type { AccountStatus, UserRole } from '../../types/auth.types';
import type {
  FeatureCode,
  PermissionMatrix,
  PermissionUpdateRequest,
  PendingApproval,
  PasswordResetRequestItem,
  SystemUserDetail,
  SystemUserItem,
  SystemUserUpdateRequest,
  ThresholdSettings,
  UserListParams,
  UserPermissionOverride,
} from '../../types/system.types';
import { FEATURE_CODE_LIST } from '../../types/system.types';

interface ApiUserListRow {
  userId: number;
  loginId: string;
  name: string;
  role: string;
  email: string | null;
  phone: string;
  accountStatus: string;
  lastLoginAt: string | null;
  createdAt: string;
}

function iso(d: string | Date | null | undefined): string {
  if (d == null) return '';
  return typeof d === 'string' ? d : new Date(d).toISOString();
}

function mapListRow(r: ApiUserListRow): SystemUserItem {
  return {
    userId: r.userId,
    loginId: r.loginId,
    name: r.name,
    role: r.role as UserRole,
    email: r.email ?? undefined,
    phone: r.phone ?? '',
    accountStatus: r.accountStatus as AccountStatus,
    lastLoginAt: r.lastLoginAt ? iso(r.lastLoginAt) : undefined,
    createdAt: iso(r.createdAt),
  };
}

export async function fetchSystemUsers(params?: UserListParams): Promise<ApiResponse<SystemUserItem[]>> {
  const rows = await apiRequest<ApiUserListRow[]>({ method: 'get', url: '/system/users' });
  let filtered = rows.map(mapListRow);

  if (params?.role) {
    filtered = filtered.filter((u) => u.role === params.role);
  }
  if (params?.accountStatus) {
    filtered = filtered.filter((u) => u.accountStatus === params.accountStatus);
  }
  if (params?.search?.trim()) {
    const keyword = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(keyword) ||
        u.loginId.toLowerCase().includes(keyword) ||
        (u.email?.toLowerCase().includes(keyword) ?? false),
    );
  }

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const totalCount = filtered.length;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    success: true,
    data: paged,
    meta: { page, pageSize, totalCount },
  };
}

interface ApiUserDetail {
  userId: number;
  loginId: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  accountStatus: string;
  lastLoginAt: string | null;
  createdAt: string;
  businessInfo?: { businessName: string; businessNumber: string } | null;
  dealerProfile?: unknown;
  hqProfile?: unknown;
  ownerProfile?: unknown;
}

interface ApiOverrideRow {
  overrideId: number;
  userId: number;
  featureCode: string;
  isAllowed: boolean;
  reason: string | null;
  setBy: number;
  createdAt: string;
}

function mapOverride(r: ApiOverrideRow): UserPermissionOverride {
  return {
    overrideId: r.overrideId,
    userId: r.userId,
    featureCode: r.featureCode as FeatureCode,
    isAllowed: r.isAllowed,
    reason: r.reason ?? undefined,
    setBy: r.setBy,
    createdAt: iso(r.createdAt),
  };
}

export async function fetchSystemUserDetail(userId: number): Promise<ApiResponse<SystemUserDetail | null>> {
  const [user, overrides] = await Promise.all([
    apiRequest<ApiUserDetail>({ method: 'get', url: `/system/users/${userId}` }),
    apiRequest<ApiOverrideRow[]>({ method: 'get', url: `/system/permissions/overrides/${userId}` }),
  ]);

  const base = mapListRow({
    userId: user.userId,
    loginId: user.loginId,
    name: user.name,
    role: user.role,
    email: user.email,
    phone: user.phone,
    accountStatus: user.accountStatus,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  });

  const detail: SystemUserDetail = {
    ...base,
    businessName: user.businessInfo?.businessName,
    businessNumber: user.businessInfo?.businessNumber,
    overrides: overrides.map(mapOverride),
  };

  return { success: true, data: detail };
}

export async function updateSystemUser(
  userId: number,
  data: SystemUserUpdateRequest,
): Promise<ApiResponse<{ success: boolean }>> {
  const hasProfile =
    data.name !== undefined ||
    data.phone !== undefined ||
    data.email !== undefined ||
    data.role !== undefined;
  if (hasProfile) {
    await apiRequest<unknown>({
      method: 'put',
      url: `/system/users/${userId}`,
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
      },
    });
  }
  if (data.accountStatus !== undefined) {
    await apiRequest<unknown>({
      method: 'patch',
      url: `/system/users/${userId}/status`,
      data: { accountStatus: data.accountStatus },
    });
  }
  return { success: true, data: { success: true } };
}

interface ApiRolePermissionRow {
  rolePermissionId: number;
  role: string;
  featureCode: string;
  isAllowed: boolean;
}

export async function fetchPermissionMatrix(): Promise<ApiResponse<PermissionMatrix[]>> {
  const raw = await apiRequest<{ featureCodes: ApiRolePermissionRow[] }>({
    method: 'get',
    url: '/system/permissions',
  });
  const byFeature = new Map<string, Record<UserRole, boolean>>();
  for (const info of FEATURE_CODE_LIST) {
    byFeature.set(info.code, {
      ADMIN: true,
      DEALER: false,
      HQ: false,
      OWNER: false,
    });
  }
  for (const row of raw.featureCodes) {
    if (row.role === 'ADMIN') continue;
    const perms = byFeature.get(row.featureCode);
    if (perms && row.role in perms) {
      (perms as Record<string, boolean>)[row.role] = row.isAllowed;
    }
  }
  const matrix: PermissionMatrix[] = FEATURE_CODE_LIST.map((info) => ({
    featureCode: info.code,
    label: info.label,
    category: info.category,
    permissions: byFeature.get(info.code)!,
  }));
  return { success: true, data: matrix };
}

export async function updatePermissions(
  request: PermissionUpdateRequest,
): Promise<ApiResponse<{ success: boolean }>> {
  await apiRequest<unknown>({
    method: 'put',
    url: '/system/permissions',
    data: { changes: request.changes },
  });
  return { success: true, data: { success: true } };
}

interface ApiPendingUser {
  userId: number;
  loginId: string;
  name: string;
  role: string;
  email: string | null;
  phone: string;
  createdAt: string | Date;
  businessInfo: { businessName: string; businessNumber: string } | null;
}

export async function fetchPendingApprovals(): Promise<ApiResponse<PendingApproval[]>> {
  const rows = await apiRequest<ApiPendingUser[]>({ method: 'get', url: '/system/approvals' });
  const data: PendingApproval[] = rows.map((u) => ({
    userId: u.userId,
    loginId: u.loginId,
    name: u.name,
    role: u.role as PendingApproval['role'],
    email: u.email ?? '',
    phone: u.phone,
    businessName: u.businessInfo?.businessName,
    businessNumber: u.businessInfo?.businessNumber,
    createdAt: iso(u.createdAt),
  }));
  return { success: true, data };
}

export async function approveUser(userId: number): Promise<ApiResponse<{ success: boolean }>> {
  await apiRequest<unknown>({
    method: 'patch',
    url: `/system/approvals/${userId}`,
    data: { action: 'APPROVE' },
  });
  return { success: true, data: { success: true } };
}

export async function rejectUser(
  userId: number,
  reason: string,
): Promise<ApiResponse<{ success: boolean }>> {
  await apiRequest<unknown>({
    method: 'patch',
    url: `/system/approvals/${userId}`,
    data: { action: 'REJECT', reason },
  });
  return { success: true, data: { success: true } };
}

export async function fetchPasswordResetRequests(): Promise<
  ApiResponse<PasswordResetRequestItem[]>
> {
  return { success: true, data: [] };
}

export async function approvePasswordReset(
  _requestId: number,
): Promise<ApiResponse<{ success: boolean; tempPassword: string }>> {
  throw new Error('비밀번호 재설정 승인 API가 아직 연결되지 않았습니다.');
}

export async function fetchUserPermissionOverrides(
  userId: number,
): Promise<ApiResponse<UserPermissionOverride[]>> {
  const rows = await apiRequest<
    Array<{
      overrideId: number;
      userId: number;
      featureCode: string;
      isAllowed: boolean;
      reason: string | null;
      setBy: number;
      createdAt: string | Date;
    }>
  >({ method: 'get', url: `/system/permissions/overrides/${userId}` });
  const data = rows.map((r) => ({
    overrideId: r.overrideId,
    userId: r.userId,
    featureCode: r.featureCode as FeatureCode,
    isAllowed: r.isAllowed,
    reason: r.reason ?? undefined,
    setBy: r.setBy,
    createdAt: iso(r.createdAt),
  }));
  return { success: true, data };
}

export async function saveUserPermissionOverride(
  userId: number,
  featureCode: FeatureCode,
  isAllowed: boolean,
  reason?: string,
): Promise<ApiResponse<{ success: boolean }>> {
  await apiRequest<unknown>({
    method: 'post',
    url: `/system/permissions/overrides/${userId}`,
    data: { featureCode, isAllowed, reason },
  });
  return { success: true, data: { success: true } };
}

export async function deleteUserPermissionOverride(
  userId: number,
  featureCode: FeatureCode,
): Promise<ApiResponse<{ success: boolean }>> {
  await apiRequest<unknown>({
    method: 'delete',
    url: `/system/permissions/overrides/${userId}/${encodeURIComponent(featureCode)}`,
  });
  return { success: true, data: { success: true } };
}

interface ApiCleaningThresholdRow {
  thresholdId: number;
  equipmentId: number;
  sparkThreshold: number;
  sparkTimeWindow: number;
  pressureBase: number | null;
  pressureRate: number;
  setBy: number;
  updatedAt: string | Date;
}

export async function fetchThresholdSettings(): Promise<ApiResponse<ThresholdSettings>> {
  const cleaningRows = await apiRequest<ApiCleaningThresholdRow[]>({
    method: 'get',
    url: '/system/thresholds/cleaning',
  });
  return {
    success: true,
    data: {
      monitoringThresholds: [],
      cleaningThresholds: cleaningRows.map((r) => ({
        thresholdId: r.thresholdId,
        equipmentId: r.equipmentId,
        sparkThreshold: r.sparkThreshold,
        sparkTimeWindow: r.sparkTimeWindow,
        pressureBase: r.pressureBase ?? undefined,
        pressureRate: r.pressureRate,
        setBy: r.setBy,
        updatedAt: iso(r.updatedAt),
      })),
      damperAutoSettings: [],
      sparkBaseTime: 600,
    },
  };
}

export async function updateThresholds(
  data: Partial<ThresholdSettings>,
): Promise<ApiResponse<{ success: boolean }>> {
  if (data.cleaningThresholds?.length) {
    for (const c of data.cleaningThresholds) {
      await apiRequest<unknown>({
        method: 'put',
        url: '/system/thresholds/cleaning',
        data: {
          equipmentId: c.equipmentId,
          sparkThreshold: c.sparkThreshold,
          sparkTimeWindow: c.sparkTimeWindow,
          pressureBase: c.pressureBase,
          pressureRate: c.pressureRate,
        },
      });
    }
  }
  return { success: true, data: { success: true } };
}
