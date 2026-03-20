import { mockStoreTree, STORE_ID_MAP, MOCK_STORE_DISPLAY_NAME } from '../api/mock/common.mock';

/** storeId → 공식 Mock 매장명 */
export function getMockStoreDisplayName(storeId: number): string {
  return MOCK_STORE_DISPLAY_NAME[storeId] ?? `매장 #${storeId}`;
}

/**
 * Mock 전용: 접근 가능한 숫자 매장 ID 목록.
 * - `null`: 전체 접근 (ADMIN 등 storeIds에 `*`).
 * - `[]`: 매핑 실패 등으로 접근 매장 없음.
 * - `[1,2]`: 해당 매장만.
 */
export type AuthorizedStoresParam = number[] | null;

/** JWT storeIds → 숫자 매장 ID. `*` 또는 비로그인(undefined)이면 null(전체). */
export function resolveAuthorizedNumericStoreIds(
  storeIds: string[] | undefined | null,
): AuthorizedStoresParam {
  if (!storeIds?.length) return null;
  if (storeIds.includes('*')) return null;
  const nums = storeIds
    .map((sid) => STORE_ID_MAP[sid])
    .filter((id): id is number => id !== undefined);
  return nums.length ? nums : [];
}

export function isStoreIdAllowed(
  storeId: number,
  authorizedStoreIds: AuthorizedStoresParam,
): boolean {
  if (authorizedStoreIds === null) return true;
  return authorizedStoreIds.includes(storeId);
}

/** 알림·A/S 등 storeId 필드가 있는 목록 */
export function filterItemsByStoreAccess<T extends { storeId: number }>(
  items: T[],
  authorizedStoreIds: AuthorizedStoresParam,
  requestedStoreId?: number,
): T[] {
  let out = items;
  if (authorizedStoreIds !== null) {
    if (authorizedStoreIds.length === 0) return [];
    const set = new Set(authorizedStoreIds);
    out = out.filter((x) => set.has(x.storeId));
  }
  if (requestedStoreId !== undefined) {
    if (
      authorizedStoreIds !== null &&
      authorizedStoreIds.length > 0 &&
      !authorizedStoreIds.includes(requestedStoreId)
    ) {
      return [];
    }
    out = out.filter((x) => x.storeId === requestedStoreId);
  }
  return out;
}

export function filterStoreOptionsByAccess<T extends { storeId: number }>(
  options: T[],
  authorizedStoreIds: AuthorizedStoresParam,
): T[] {
  if (authorizedStoreIds === null) return options;
  if (authorizedStoreIds.length === 0) return [];
  const set = new Set(authorizedStoreIds);
  return options.filter((o) => set.has(o.storeId));
}

/** mockStoreTree 기준 장비가 속한 매장 ID */
export function getMockEquipmentStoreId(equipmentId: number): number | null {
  for (const store of mockStoreTree) {
    for (const floor of store.floors) {
      for (const gw of floor.gateways) {
        for (const eq of gw.equipments) {
          if (eq.equipmentId === equipmentId) return store.storeId;
        }
      }
    }
  }
  return null;
}

export function assertMockEquipmentStoreAccess(
  equipmentId: number,
  authorizedStoreIds: AuthorizedStoresParam,
): void {
  if (authorizedStoreIds === null) return;
  const sid = getMockEquipmentStoreId(equipmentId);
  if (sid === null || !authorizedStoreIds.includes(sid)) {
    throw new Error('RESOURCE_NOT_FOUND');
  }
}
