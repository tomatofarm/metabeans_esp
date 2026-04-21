import { apiRequest, apiRequestWithMeta } from './apiHelpers';
import type { ApiResponse } from '../mock/common.mock';
import type {
  CustomerListItem,
  CustomerDetail,
  CustomerListParams,
  CustomerUpdateRequest,
  CustomerMapItem,
} from '../../types/customer.types';
import type { StoreStatus } from '../../types/store.types';
import type { BusinessType } from '../../types/store.types';

function num(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  return Number(v);
}

function iso(d: string | Date | null | undefined): string {
  if (d == null) return '';
  return typeof d === 'string' ? d : new Date(d).toISOString();
}

function extractRegion(address: string): string {
  if (address.startsWith('서울')) return '서울';
  if (address.startsWith('경기')) return '경기';
  if (address.startsWith('인천')) return '인천';
  if (address.startsWith('부산')) return '부산';
  if (address.startsWith('대구')) return '대구';
  if (address.startsWith('광주')) return '광주';
  if (address.startsWith('대전')) return '대전';
  return '기타';
}

interface ApiStoreListRow {
  storeId: number;
  siteId: string;
  storeName: string;
  address: string;
  latitude: unknown;
  longitude: unknown;
  contactPhone: string | null;
  businessType: string | null;
  status: string;
  createdAt: string | Date;
  owner?: { name: string } | null;
  dealer?: { name: string } | null;
  hq?: { hqProfile: { hqName: string; brandName: string } | null } | null;
  _count: { equipment: number };
}

function mapListRow(s: ApiStoreListRow): CustomerListItem {
  const hqName = s.hq?.hqProfile?.hqName ?? s.hq?.hqProfile?.brandName ?? undefined;
  return {
    storeId: s.storeId,
    siteId: s.siteId,
    storeName: s.storeName,
    hqName,
    ownerName: s.owner?.name ?? '-',
    address: s.address,
    latitude: num(s.latitude),
    longitude: num(s.longitude),
    phone: s.contactPhone ?? '-',
    businessType: (s.businessType as string) ?? undefined,
    equipmentCount: s._count.equipment,
    status: s.status as StoreStatus,
    dealerName: s.dealer?.name ?? '-',
    registeredAt: iso(s.createdAt),
  };
}

/** A/S 매장 옵션 등에서 재사용 */
export async function fetchAllStoreRows(): Promise<ApiStoreListRow[]> {
  const out: ApiStoreListRow[] = [];
  let page = 1;
  const pageSize = 100;
  for (;;) {
    const { data, meta } = await apiRequestWithMeta<ApiStoreListRow[]>({
      method: 'get',
      url: `/customers/stores?page=${page}&pageSize=${pageSize}`,
    });
    out.push(...data);
    const totalPages = meta?.totalPages as number | undefined;
    const totalCount = meta?.totalCount as number | undefined;
    if (data.length < pageSize) break;
    if (totalPages !== undefined && page >= totalPages) break;
    if (totalCount !== undefined && out.length >= totalCount) break;
    page += 1;
    if (page > 1000) break;
  }
  return out;
}

export async function fetchCustomerList(
  params?: CustomerListParams,
): Promise<ApiResponse<CustomerListItem[]>> {
  const rows = await fetchAllStoreRows();
  let filtered = rows.map(mapListRow);

  if (params?.search) {
    const keyword = params.search.toLowerCase().replace(/\s/g, '');
    const norm = (s: string) => s.toLowerCase().replace(/[-\s]/g, '');
    filtered = filtered.filter(
      (c) =>
        c.storeName.toLowerCase().includes(keyword) ||
        c.ownerName.toLowerCase().includes(keyword) ||
        c.address.toLowerCase().includes(keyword) ||
        norm(c.phone).includes(norm(params.search!)),
    );
  }
  if (params?.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }
  if (params?.hqName) {
    filtered = filtered.filter((c) => c.hqName === params.hqName);
  }
  if (params?.region) {
    filtered = filtered.filter((c) => extractRegion(c.address) === params.region);
  }
  if (params?.dealerId != null) {
    const opts = await fetchCustomerDealerOptions();
    const name = opts.find((d) => d.dealerId === params.dealerId)?.dealerName;
    if (name) {
      filtered = filtered.filter((c) => c.dealerName === name);
    }
  }

  const sortBy = params?.sortBy ?? 'registeredAt';
  const sortOrder = params?.sortOrder ?? 'desc';
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'storeName') {
      cmp = a.storeName.localeCompare(b.storeName);
    } else if (sortBy === 'hqName') {
      cmp = (a.hqName ?? '').localeCompare(b.hqName ?? '');
    } else if (sortBy === 'dealerName') {
      cmp = a.dealerName.localeCompare(b.dealerName);
    } else if (sortBy === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else {
      cmp = new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

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

interface ApiStoreDetail {
  storeId: number;
  siteId: string;
  storeName: string;
  brandName: string | null;
  businessType: string | null;
  address: string;
  latitude: unknown;
  longitude: unknown;
  contactPhone: string | null;
  status: string;
  dealerId: number | null;
  hqId: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  owner?: { name: string; email: string | null; phone: string } | null;
  dealer?: { name: string; userId: number } | null;
  hq?: { hqProfile: { hqName: string; brandName: string } | null } | null;
}

interface ApiEquipmentRow {
  equipmentId: number;
  equipmentName: string | null;
  status: string;
  model: { modelName: string | null } | null;
}

function mapEquipmentStatus(s: string): StoreStatus {
  if (s === 'INACTIVE') return 'INACTIVE';
  return 'ACTIVE';
}

export async function fetchCustomerDetail(storeId: number): Promise<ApiResponse<CustomerDetail | null>> {
  const [store, equipments] = await Promise.all([
    apiRequest<ApiStoreDetail>({ method: 'get', url: `/customers/stores/${storeId}` }),
    apiRequest<ApiEquipmentRow[]>({ method: 'get', url: `/equipment?storeId=${storeId}` }),
  ]);

  const hqName = store.hq?.hqProfile?.hqName ?? store.hq?.hqProfile?.brandName;
  const detail: CustomerDetail = {
    storeId: store.storeId,
    siteId: store.siteId,
    storeName: store.storeName,
    brandName: store.brandName ?? undefined,
    businessType: (store.businessType as string) ?? undefined,
    address: store.address,
    latitude: num(store.latitude),
    longitude: num(store.longitude),
    phone: store.contactPhone ?? '-',
    status: store.status as StoreStatus,
    dealerId: store.dealerId ?? undefined,
    dealerName: store.dealer?.name,
    hqId: store.hqId ?? undefined,
    hqName,
    registeredAt: iso(store.createdAt),
    updatedAt: iso(store.updatedAt),
    owner: {
      name: store.owner?.name ?? '-',
      email: store.owner?.email ?? '-',
      phone: store.owner?.phone ?? '-',
    },
    equipments: equipments.map((e) => ({
      equipmentId: e.equipmentId,
      equipmentName: e.equipmentName ?? '-',
      modelName: e.model?.modelName ?? '-',
      status: mapEquipmentStatus(e.status),
    })),
  };

  return { success: true, data: detail };
}

export async function updateCustomer(
  storeId: number,
  data: CustomerUpdateRequest,
): Promise<ApiResponse<{ success: boolean }>> {
  const body: Record<string, unknown> = {};
  if (data.storeName !== undefined) body.storeName = data.storeName;
  if (data.address !== undefined) body.address = data.address;
  if (data.phone !== undefined) body.contactPhone = data.phone;
  if (data.businessType && data.businessType !== '-') {
    body.businessType = data.businessType as BusinessType;
  }
  if (data.status !== undefined) body.status = data.status;
  if (data.dealerId !== undefined) body.dealerId = data.dealerId;
  if (data.latitude !== undefined) body.latitude = data.latitude;
  if (data.longitude !== undefined) body.longitude = data.longitude;

  await apiRequest<unknown>({ method: 'put', url: `/customers/stores/${storeId}`, data: body });
  return { success: true, data: { success: true } };
}

export async function fetchCustomerMapData(): Promise<ApiResponse<CustomerMapItem[]>> {
  const rows = await fetchAllStoreRows();
  const mapped: CustomerMapItem[] = rows.map((s) => {
    const item = mapListRow(s);
    return {
      storeId: item.storeId,
      storeName: item.storeName,
      hqName: item.hqName,
      address: item.address,
      latitude: item.latitude,
      longitude: item.longitude,
      status: item.status,
      equipmentCount: item.equipmentCount,
    };
  });
  return { success: true, data: mapped };
}

export async function fetchCustomerDealerOptions(): Promise<{ dealerId: number; dealerName: string }[]> {
  const rows = await apiRequest<Array<{ dealerId: number; name: string }>>({
    method: 'get',
    url: '/registration/dealer-list',
  });
  return rows.map((r) => ({ dealerId: r.dealerId, dealerName: r.name }));
}
