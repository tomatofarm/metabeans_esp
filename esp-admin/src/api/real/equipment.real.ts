import { apiRequest } from './apiHelpers';
import type { ApiResponse } from '../mock/common.mock';
import type {
  ConnectionStatus,
  DealerOption,
  EquipmentCreateRequest,
  EquipmentDetail,
  EquipmentListItem,
  EquipmentModel,
  EquipmentStatus,
  EquipmentUpdateRequest,
  FloorOption,
  GatewayOption,
  StoreOption,
} from '../../types/equipment.types';
import type { AuthorizedStoresParam } from '../../utils/mockAccess';
import { filterStoreOptionsByAccess, isStoreIdAllowed } from '../../utils/mockAccess';

function iso(d: string | Date | null | undefined): string {
  if (d == null) return '';
  return typeof d === 'string' ? d : new Date(d).toISOString();
}

function dateOnly(d: string | Date | null | undefined): string | undefined {
  if (d == null) return undefined;
  const s = typeof d === 'string' ? d : new Date(d).toISOString();
  return s.slice(0, 10);
}

type ApiEquipmentListRow = {
  equipmentId: number;
  equipmentSerial: string;
  mqttEquipmentId: string;
  storeId: number | null;
  floorId: number | null;
  equipmentName: string | null;
  cellType: string | null;
  powerpackCount: number;
  purchaseDate: string | Date | null;
  warrantyEndDate: string | Date | null;
  status: string;
  connectionStatus: string;
  lastSeenAt: string | Date | null;
  store: { storeName: string } | null;
  floor: { floorCode: string; floorName: string | null } | null;
  model: { modelName: string } | null;
  dealer: { name: string; userId: number } | null;
};

function mapListItem(e: ApiEquipmentListRow): EquipmentListItem {
  return {
    equipmentId: e.equipmentId,
    equipmentSerial: e.equipmentSerial,
    mqttEquipmentId: e.mqttEquipmentId,
    storeName: e.store?.storeName ?? '',
    floorName: e.floor?.floorName ?? e.floor?.floorCode ?? '',
    equipmentName: e.equipmentName ?? '',
    modelName: e.model?.modelName ?? '\u2014',
    cellType: e.cellType ?? undefined,
    powerpackCount: e.powerpackCount,
    purchaseDate: dateOnly(e.purchaseDate),
    warrantyEndDate: dateOnly(e.warrantyEndDate),
    dealerName: e.dealer?.name,
    status: e.status as EquipmentStatus,
    connectionStatus: e.connectionStatus as ConnectionStatus,
    lastSeenAt: e.lastSeenAt ? iso(e.lastSeenAt) : undefined,
  };
}

export async function fetchEquipments(params?: {
  storeId?: number;
  floorId?: number;
  status?: string;
  connectionStatus?: string;
  search?: string;
  authorizedStoreIds?: AuthorizedStoresParam;
}): Promise<ApiResponse<EquipmentListItem[]>> {
  const auth = params?.authorizedStoreIds;
  if (auth !== null && auth !== undefined && auth.length === 0) {
    return {
      success: true,
      data: [],
      meta: { page: 1, pageSize: 20, totalCount: 0 },
    };
  }

  const q = params?.storeId != null ? `?storeId=${params.storeId}` : '';
  let rows = await apiRequest<ApiEquipmentListRow[]>({ method: 'get', url: `/equipment${q}` });

  if (auth !== null && auth !== undefined) {
    const set = new Set(auth);
    rows = rows.filter((r) => r.storeId != null && set.has(r.storeId));
  }

  if (params?.floorId != null) {
    rows = rows.filter((r) => r.floorId === params.floorId);
  }
  if (params?.status) {
    rows = rows.filter((r) => r.status === params.status);
  }
  if (params?.connectionStatus) {
    rows = rows.filter((r) => r.connectionStatus === params.connectionStatus);
  }
  if (params?.search?.trim()) {
    const qkw = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.equipmentName?.toLowerCase().includes(qkw) ?? false) ||
        r.equipmentSerial.toLowerCase().includes(qkw) ||
        r.mqttEquipmentId.toLowerCase().includes(qkw),
    );
  }

  const items = rows.map(mapListItem);
  return {
    success: true,
    data: items,
    meta: { page: 1, pageSize: 20, totalCount: items.length },
  };
}

type ApiEquipmentDetailPayload = {
  equipmentId: number;
  equipmentSerial: string;
  mqttEquipmentId: string;
  storeId: number | null;
  floorId: number | null;
  equipmentName: string | null;
  modelId: number | null;
  cellType: string | null;
  powerpackCount: number;
  purchaseDate: string | Date | null;
  warrantyEndDate: string | Date | null;
  status: string;
  connectionStatus: string;
  lastSeenAt: string | Date | null;
  registeredBy: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  store: { storeId: number; storeName: string; siteId: string } | null;
  floor: { floorId: number; floorCode: string; floorName: string | null } | null;
  model: { modelId: number; modelName: string; manufacturer: string | null } | null;
  dealer: { userId: number; name: string } | null;
  registrar: { userId: number; name: string } | null;
  controllers: Array<{
    controllerId: number;
    ctrlDeviceId: string;
    connectionStatus: string;
    statusFlags: number;
    lastSeenAt: string | Date | null;
  }>;
  gateway: {
    gatewayId: number;
    gwDeviceId: string;
    connectionStatus: string;
    statusFlags: number;
    controllerCount: number;
  } | null;
};

function mapDetailPayload(p: ApiEquipmentDetailPayload): EquipmentDetail {
  const ctrls = p.controllers ?? [];
  const gw = p.gateway;
  return {
    equipmentId: p.equipmentId,
    equipmentSerial: p.equipmentSerial,
    mqttEquipmentId: p.mqttEquipmentId,
    store: p.store ?? { storeId: p.storeId ?? 0, storeName: '', siteId: '' },
    floor: p.floor
      ? {
          floorId: p.floor.floorId,
          floorCode: p.floor.floorCode,
          floorName: p.floor.floorName ?? '',
        }
      : { floorId: p.floorId ?? 0, floorCode: '', floorName: '' },
    equipmentName: p.equipmentName ?? '',
    model: p.model
      ? {
          modelId: p.model.modelId,
          modelName: p.model.modelName,
          manufacturer: p.model.manufacturer ?? '',
        }
      : {
          modelId: p.modelId ?? 0,
          modelName: '\u2014',
          manufacturer: '',
        },
    cellType: p.cellType ?? undefined,
    powerpackCount: p.powerpackCount,
    purchaseDate: dateOnly(p.purchaseDate),
    warrantyEndDate: dateOnly(p.warrantyEndDate),
    dealer: p.dealer ? { dealerId: p.dealer.userId, dealerName: p.dealer.name } : undefined,
    status: p.status as EquipmentStatus,
    connectionStatus: p.connectionStatus as ConnectionStatus,
    lastSeenAt: p.lastSeenAt ? iso(p.lastSeenAt) : undefined,
    gateway: gw
      ? {
          gatewayId: gw.gatewayId,
          gwDeviceId: gw.gwDeviceId,
          connectionStatus: gw.connectionStatus as ConnectionStatus,
          statusFlags: gw.statusFlags,
          controllerCount: gw.controllerCount,
        }
      : {
          gatewayId: 0,
          gwDeviceId: '',
          connectionStatus: 'OFFLINE' as ConnectionStatus,
          statusFlags: 0,
          controllerCount: ctrls.length,
        },
    controllers: ctrls.map((c) => ({
      controllerId: c.controllerId,
      ctrlDeviceId: c.ctrlDeviceId,
      connectionStatus: c.connectionStatus as ConnectionStatus,
      statusFlags: c.statusFlags,
      lastSeenAt: c.lastSeenAt ? iso(c.lastSeenAt) : undefined,
    })),
    registeredBy: p.registrar ?? { userId: p.registeredBy, name: '\u2014' },
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  };
}

export async function fetchEquipmentDetail(
  equipmentId: number,
  _authorizedStoreIds?: AuthorizedStoresParam,
): Promise<ApiResponse<EquipmentDetail>> {
  const payload = await apiRequest<ApiEquipmentDetailPayload>({
    method: 'get',
    url: `/equipment/${equipmentId}`,
  });
  return { success: true, data: mapDetailPayload(payload) };
}

export async function fetchEquipmentModels(): Promise<ApiResponse<EquipmentModel[]>> {
  const rows = await apiRequest<
    Array<{
      modelId: number;
      modelName: string;
      manufacturer: string | null;
      specifications: unknown;
      isActive: boolean;
      createdAt: string | Date;
    }>
  >({ method: 'get', url: '/equipment/models' });
  const data: EquipmentModel[] = rows.map((m) => ({
    modelId: m.modelId,
    modelName: m.modelName,
    manufacturer: m.manufacturer ?? undefined,
    specifications: (m.specifications as Record<string, unknown>) ?? undefined,
    isActive: m.isActive,
    createdAt: iso(m.createdAt),
  }));
  return { success: true, data };
}

type StoreTreeRow = {
  storeId: number;
  storeName: string;
  siteId: string;
  floors: Array<{ floorId: number; floorCode: string; floorName: string | null }>;
};

export async function fetchStoreOptions(authorizedStoreIds?: AuthorizedStoresParam): Promise<StoreOption[]> {
  const tree = await apiRequest<StoreTreeRow[]>({ method: 'get', url: '/dashboard/store-tree' });
  const options: StoreOption[] = tree.map((s) => ({
    storeId: s.storeId,
    storeName: s.storeName,
    siteId: s.siteId,
  }));
  return filterStoreOptionsByAccess(options, authorizedStoreIds ?? null);
}

export async function fetchFloorOptions(
  storeId: number,
  authorizedStoreIds?: AuthorizedStoresParam,
): Promise<FloorOption[]> {
  if (!isStoreIdAllowed(storeId, authorizedStoreIds ?? null)) return [];
  const tree = await apiRequest<StoreTreeRow[]>({ method: 'get', url: '/dashboard/store-tree' });
  const store = tree.find((s) => s.storeId === storeId);
  if (!store) return [];
  return store.floors.map((f) => ({
    floorId: f.floorId,
    floorCode: f.floorCode,
    floorName: f.floorName ?? undefined,
  }));
}

type ApiGatewayRow = {
  gatewayId: number;
  gwDeviceId: string;
  floorId: number;
  connectionStatus: string;
};

export async function fetchGatewayOptions(floorId: number): Promise<GatewayOption[]> {
  const rows = await apiRequest<ApiGatewayRow[]>({ method: 'get', url: '/gateways' });
  return rows
    .filter((g) => g.floorId === floorId)
    .map((g) => ({
      gatewayId: g.gatewayId,
      gwDeviceId: g.gwDeviceId,
      connectionStatus: g.connectionStatus as ConnectionStatus,
    }));
}

export async function fetchDealerOptions(): Promise<DealerOption[]> {
  const rows = await apiRequest<Array<{ dealerId: number; name: string }>>({
    method: 'get',
    url: '/registration/dealer-list',
  });
  return rows.map((d) => ({ dealerId: d.dealerId, dealerName: d.name }));
}

export async function createEquipment(req: EquipmentCreateRequest): Promise<ApiResponse<EquipmentDetail>> {
  const created = await apiRequest<{ equipmentId: number }>({
    method: 'post',
    url: '/equipment',
    data: {
      equipmentSerial: req.equipmentSerial,
      mqttEquipmentId: req.mqttEquipmentId,
      storeId: req.storeId,
      floorId: req.floorId,
      equipmentName: req.equipmentName,
      modelId: req.modelId,
      cellType: req.cellType,
      powerpackCount: req.powerpackCount,
      purchaseDate: req.purchaseDate,
      warrantyEndDate: req.warrantyEndDate,
      dealerId: req.dealerId,
      controllers: req.controllers,
    },
  });
  return fetchEquipmentDetail(created.equipmentId);
}

export async function updateEquipment(
  equipmentId: number,
  data: EquipmentUpdateRequest,
): Promise<ApiResponse<EquipmentDetail>> {
  await apiRequest<ApiEquipmentDetailPayload>({
    method: 'put',
    url: `/equipment/${equipmentId}`,
    data: {
      ...(data.equipmentName !== undefined ? { equipmentName: data.equipmentName } : {}),
      ...(data.modelId !== undefined ? { modelId: data.modelId } : {}),
      ...(data.cellType !== undefined ? { cellType: data.cellType } : {}),
      ...(data.dealerId !== undefined ? { dealerId: data.dealerId } : {}),
      ...(data.controllers !== undefined ? { controllers: data.controllers } : {}),
    },
  });
  return fetchEquipmentDetail(equipmentId);
}

export async function deleteEquipment(equipmentId: number): Promise<ApiResponse<{ deleted: boolean }>> {
  await apiRequest<unknown>({ method: 'delete', url: `/equipment/${equipmentId}` });
  return { success: true, data: { deleted: true } };
}
