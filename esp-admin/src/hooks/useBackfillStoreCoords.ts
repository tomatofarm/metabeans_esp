import { useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CustomerListItem } from '../types/customer.types';
import { geocodeAddressToLatLng } from '../utils/geocodeGoogle';
import { isPlottableLatLng } from '../utils/customerMapGeo';
import * as customerReal from '../api/real/customer.real';

const PERSIST_GAP_MS = 200;

const isRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' &&
  Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

/**
 * 좌표(lat/lng) 없는 매장을 감지해 Google Geocoding → 백엔드에 자동 저장.
 * - 실서버 모드에서만 동작 (Mock 시 스킵).
 * - 세션 내 중복 처리 방지 (processedRef).
 * - 저장 완료 후 customer 쿼리 자동 갱신.
 * - useCustomerMapGeocode의 인메모리 fallback과 병행 동작.
 */
export function useBackfillStoreCoords(customers: CustomerListItem[]) {
  const queryClient = useQueryClient();
  const customersRef = useRef(customers);
  const processedRef = useRef(new Set<number>());
  customersRef.current = customers;

  const backfillKey = useMemo(
    () =>
      customers
        .filter((c) => !isPlottableLatLng(c.latitude, c.longitude))
        .map((c) => c.storeId)
        .sort()
        .join(','),
    [customers],
  );

  useEffect(() => {
    if (!isRealApi || !backfillKey) return;

    const need = customersRef.current.filter(
      (c) =>
        !isPlottableLatLng(c.latitude, c.longitude) &&
        !processedRef.current.has(c.storeId) &&
        (c.address?.trim().length ?? 0) >= 4,
    );
    if (need.length === 0) return;

    let cancelled = false;
    let anyUpdated = false;

    (async () => {
      for (const c of need) {
        if (cancelled) return;
        processedRef.current.add(c.storeId);

        const pos = await geocodeAddressToLatLng(c.address);
        if (cancelled) return;

        if (pos && isPlottableLatLng(pos.lat, pos.lng)) {
          try {
            await customerReal.updateCustomer(c.storeId, {
              latitude: pos.lat,
              longitude: pos.lng,
            });
            anyUpdated = true;
          } catch {
            // 저장 실패 — 이번 세션은 useCustomerMapGeocode가 인메모리로 보완
          }
        }

        if (cancelled) return;
        await new Promise<void>((r) => setTimeout(r, PERSIST_GAP_MS));
      }

      if (anyUpdated && !cancelled) {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['customer-map'] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [backfillKey, queryClient]);
}
