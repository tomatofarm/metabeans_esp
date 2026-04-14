import dayjs from 'dayjs';
import { apiRequest } from './apiHelpers';
import { fetchAllStoreRows } from './customer.real';
import type { ApiResponse } from '../mock/common.mock';
import type { ASStoreOption } from '../mock/as-service.mock';
import {
  filterItemsByStoreAccess,
  filterStoreOptionsByAccess,
  isStoreIdAllowed,
  type AuthorizedStoresParam,
} from '../../utils/mockAccess';
import type {
  ASAlert,
  ASRequestListItem,
  ASCreateRequest,
  ASCreateResponse,
  ASDetail,
  ASReport,
  ASReportAttachment,
  ASReportCreateRequest,
  ASStatus,
  ASStatusUpdateRequest,
  AlertSeverity,
  AlertType,
  DealerOption,
  EquipmentOption,
  FaultType,
  RepairType,
  Urgency,
} from '../../types/as-service.types';

function iso(d: string | Date | null | undefined): string {
  if (d == null) return '';
  return typeof d === 'string' ? d : new Date(d).toISOString();
}

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'object' && v !== null && 'toString' in v) return Number(v);
  return Number(v);
}

const FAULT_TYPES: FaultType[] = ['POWER', 'SPARK', 'TEMPERATURE', 'COMM_ERROR', 'NOISE', 'OTHER'];

function parseFaultType(s: string): FaultType {
  return (FAULT_TYPES as string[]).includes(s) ? (s as FaultType) : 'OTHER';
}

function mapStatus(s: string): ASStatus {
  return s as ASStatus;
}

interface ApiAsRequestRow {
  requestId: number;
  storeId: number;
  equipmentId: number | null;
  issueType: string;
  description: string;
  preferredVisitDatetime: string | null;
  status: string;
  dealerId: number | null;
  dealerName?: string | null;
  visitScheduledDatetime?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  store: { storeName: string };
  equipment: { equipmentName: string | null } | null;
}

function mapListItem(r: ApiAsRequestRow): ASRequestListItem {
  return {
    requestId: r.requestId,
    storeId: r.storeId,
    storeName: r.store.storeName,
    equipmentId: r.equipmentId ?? undefined,
    equipmentName: r.equipment?.equipmentName ?? undefined,
    urgency: 'NORMAL' as Urgency,
    faultType: parseFaultType(r.issueType),
    description: r.description,
    status: mapStatus(r.status),
    dealerId: r.dealerId ?? undefined,
    dealerName: r.dealerName ?? undefined,
    preferredVisitDatetime: r.preferredVisitDatetime ? iso(r.preferredVisitDatetime) : undefined,
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  };
}

export async function fetchASAlerts(params?: {
  severity?: AlertSeverity;
  alertType?: AlertType;
  storeId?: number;
  isResolved?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  authorizedStoreIds?: AuthorizedStoresParam;
}): Promise<ApiResponse<ASAlert[]>> {
  let filtered: ASAlert[] = [];
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  return {
    success: true,
    data: filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    meta: { page, pageSize, totalCount: 0 },
  };
}

export async function fetchASRequests(params?: {
  status?: ASStatus;
  urgency?: Urgency;
  storeId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  authorizedStoreIds?: AuthorizedStoresParam;
}): Promise<ApiResponse<ASRequestListItem[]>> {
  const rows = await apiRequest<ApiAsRequestRow[]>({ method: 'get', url: '/as-service/requests' });
  let mapped = rows.map(mapListItem);
  mapped = filterItemsByStoreAccess(mapped, params?.authorizedStoreIds ?? null, params?.storeId);

  if (params?.status) {
    mapped = mapped.filter((r) => r.status === params.status);
  }
  if (params?.urgency) {
    mapped = mapped.filter((r) => r.urgency === params.urgency);
  }
  if (params?.from) {
    const fromDate = dayjs(params.from);
    mapped = mapped.filter(
      (r) => dayjs(r.createdAt).isAfter(fromDate) || dayjs(r.createdAt).isSame(fromDate),
    );
  }
  if (params?.to) {
    const toDate = dayjs(params.to);
    mapped = mapped.filter(
      (r) => dayjs(r.createdAt).isBefore(toDate) || dayjs(r.createdAt).isSame(toDate),
    );
  }

  mapped.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const totalCount = mapped.length;
  const start = (page - 1) * pageSize;
  const paged = mapped.slice(start, start + pageSize);

  return {
    success: true,
    data: paged,
    meta: { page, pageSize, totalCount },
  };
}

export async function createASRequest(
  req: ASCreateRequest,
  authorizedStoreIds?: AuthorizedStoresParam,
): Promise<ApiResponse<ASCreateResponse>> {
  if (!isStoreIdAllowed(req.storeId, authorizedStoreIds ?? null)) {
    throw new Error('AUTH_FORBIDDEN');
  }
  const created = await apiRequest<ApiAsRequestRow>({
    method: 'post',
    url: '/as-service/requests',
    data: {
      storeId: req.storeId,
      equipmentId: req.equipmentId,
      issueType: req.faultType,
      description: req.description,
      preferredVisitDatetime: req.preferredVisitDatetime,
    },
  });
  const item = mapListItem(created);
  return {
    success: true,
    data: {
      requestId: item.requestId,
      status: item.status,
      assignedDealerId: item.dealerId,
      assignedDealerName: item.dealerName,
      message: '접수되었습니다.',
    },
  };
}

export async function fetchASStoreOptions(
  authorizedStoreIds?: AuthorizedStoresParam,
): Promise<ASStoreOption[]> {
  const rows = await fetchAllStoreRows();
  const opts: ASStoreOption[] = rows.map((s) => {
    const hqName = s.hq?.hqProfile?.hqName ?? s.hq?.hqProfile?.brandName ?? undefined;
    const label = hqName ? `${s.storeName} (${hqName})` : s.storeName;
    return { storeId: s.storeId, storeName: label };
  });
  return filterStoreOptionsByAccess(opts, authorizedStoreIds ?? null);
}

export async function fetchEquipmentOptionsByStore(
  storeId: number,
  authorizedStoreIds?: AuthorizedStoresParam,
): Promise<EquipmentOption[]> {
  if (!isStoreIdAllowed(storeId, authorizedStoreIds ?? null)) {
    return [];
  }
  const rows = await apiRequest<
    Array<{ equipmentId: number; equipmentName: string | null }>
  >({ method: 'get', url: `/equipment?storeId=${storeId}` });
  return rows.map((e) => ({
    equipmentId: e.equipmentId,
    equipmentName: e.equipmentName ?? '-',
  }));
}

export async function fetchASStatusList(params?: {
  status?: ASStatus;
  urgency?: Urgency;
  storeId?: number;
  dealerId?: number;
  reportOnly?: boolean;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  authorizedStoreIds?: AuthorizedStoresParam;
}): Promise<ApiResponse<ASRequestListItem[]>> {
  const base = await fetchASRequests({
    status: params?.status,
    urgency: params?.urgency,
    storeId: params?.storeId,
    from: params?.from,
    to: params?.to,
    page: 1,
    pageSize: 5000,
    authorizedStoreIds: params?.authorizedStoreIds,
  });
  let data = base.data ?? [];
  if (params?.dealerId != null) {
    data = data.filter((r) => r.dealerId === params.dealerId);
  }
  if (params?.reportOnly) {
    data = data.filter((r) =>
      ['COMPLETED', 'REPORT_SUBMITTED', 'CLOSED'].includes(r.status),
    );
  }
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const totalCount = data.length;
  const start = (page - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);
  return {
    success: true,
    data: paged,
    meta: { page, pageSize, totalCount },
  };
}

export async function fetchASDetail(
  requestId: number,
  _authorizedStoreIds?: AuthorizedStoresParam,
): Promise<ApiResponse<ASDetail | null>> {
  const row = await apiRequest<ApiAsRequestRow>({
    method: 'get',
    url: `/as-service/requests/${requestId}`,
  });
  const reportData = await apiRequest<Record<string, unknown> | null>({
    method: 'get',
    url: `/as-service/requests/${requestId}/report`,
  });

  const item = mapListItem(row);
  const detail: ASDetail = {
    requestId: item.requestId,
    store: { storeId: item.storeId, storeName: item.storeName },
    equipment: {
      equipmentId: item.equipmentId ?? 0,
      equipmentName: item.equipmentName ?? '알 수 없음',
    },
    urgency: item.urgency,
    faultType: item.faultType,
    description: item.description,
    preferredVisitDatetime: item.preferredVisitDatetime,
    visitScheduledDatetime: row.visitScheduledDatetime
      ? iso(row.visitScheduledDatetime)
      : undefined,
    contactName: '-',
    contactPhone: '-',
    status: item.status,
    assignedDealer:
      item.dealerId != null
        ? { dealerId: item.dealerId, dealerName: item.dealerName ?? '알 수 없음' }
        : undefined,
    attachments: [],
    report: undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };

  if (reportData && typeof reportData === 'object' && 'reportId' in reportData) {
    const ru = reportData as Record<string, unknown>;
    const parts = ru.partsUsed as Array<{ partName: string; unitPrice: number; quantity: number }>;
    detail.report = {
      reportId: num(ru.reportId),
      requestId: num(ru.requestId),
      dealerId: num(ru.dealerId),
      repairType: String(ru.repairType) as RepairType,
      repairDescription: ru.repairDescription != null ? String(ru.repairDescription) : undefined,
      partsUsed: Array.isArray(parts) ? parts : [],
      totalPartsCost: ru.totalPartsCost != null ? num(ru.totalPartsCost) : undefined,
      createdAt: iso(ru.createdAt as string | Date),
      attachments: [],
    };
  }

  return { success: true, data: detail };
}

export async function updateASStatus(
  requestId: number,
  update: ASStatusUpdateRequest,
  _authorizedStoreIds?: AuthorizedStoresParam,
): Promise<ApiResponse<{ success: boolean }>> {
  await apiRequest<unknown>({
    method: 'patch',
    url: `/as-service/requests/${requestId}/status`,
    data: {
      status: update.status,
      memo: update.memo,
      visitScheduledDatetime: update.visitScheduledDatetime,
      dealerId: update.dealerId,
    },
  });
  return { success: true, data: { success: true } };
}

export async function assignDealer(
  requestId: number,
  dealerId: number,
  _authorizedStoreIds?: AuthorizedStoresParam,
): Promise<ApiResponse<{ success: boolean }>> {
  await apiRequest<unknown>({
    method: 'patch',
    url: `/as-service/requests/${requestId}/dealer`,
    data: { dealerId },
  });
  return { success: true, data: { success: true } };
}

export async function fetchDealerOptions(): Promise<DealerOption[]> {
  const rows = await apiRequest<Array<{ dealerId: number; name: string }>>({
    method: 'get',
    url: '/registration/dealer-list',
  });
  return rows.map((r) => ({ dealerId: r.dealerId, dealerName: r.name }));
}

interface ApiReportRow {
  reportId: number;
  requestId: number;
  dealerId: number;
  repairType: string;
  repairDescription: string | null;
  partsUsed: Array<{ partName: string; unitPrice: number; quantity: number }>;
  totalPartsCost: unknown;
  createdAt: string | Date;
  dealer?: { name: string };
}

export async function fetchASReport(
  requestId: number,
  _authorizedStoreIds?: AuthorizedStoresParam,
): Promise<
  ApiResponse<
    | (ASReport & {
        attachments: ASReportAttachment[];
        result?: string;
        remarks?: string;
        laborCost?: number;
        totalCost?: number;
      })
    | null
  >
> {
  const report = await apiRequest<ApiReportRow | null>({
    method: 'get',
    url: `/as-service/requests/${requestId}/report`,
  });
  if (!report) {
    return { success: true, data: null };
  }
  const mapped = {
    reportId: report.reportId,
    requestId: report.requestId,
    dealerId: report.dealerId,
    repairType: report.repairType as RepairType,
    repairDescription: report.repairDescription ?? undefined,
    partsUsed: report.partsUsed ?? [],
    totalPartsCost: report.totalPartsCost != null ? num(report.totalPartsCost) : undefined,
    createdAt: iso(report.createdAt),
    attachments: [] as ASReportAttachment[],
    result: 'COMPLETED',
  };
  return { success: true, data: mapped };
}

export async function createASReport(
  requestId: number,
  data: ASReportCreateRequest,
  _authorizedStoreIds?: AuthorizedStoresParam,
): Promise<ApiResponse<{ reportId: number }>> {
  const report = await apiRequest<{ reportId: number }>({
    method: 'post',
    url: `/as-service/requests/${requestId}/report`,
    data: {
      repairType: data.repairType,
      repairDetail: data.repairDescription,
      partsUsed: data.partsUsed,
      totalPartsCost: data.totalPartsCost,
    },
  });
  return { success: true, data: { reportId: report.reportId } };
}
