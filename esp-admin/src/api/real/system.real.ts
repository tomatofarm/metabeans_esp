import { apiRequest } from './apiHelpers';
import type { ApiResponse } from '../mock/common.mock';
import type { AccountStatus, UserRole } from '../../types/auth.types';
import type {
  FeatureCode,
  SystemUserDetail,
  SystemUserItem,
  SystemUserUpdateRequest,
  UserListParams,
  UserPermissionOverride,
} from '../../types/system.types';

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
