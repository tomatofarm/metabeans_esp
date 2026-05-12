import { useMemo, useState, useEffect, useRef } from 'react';
import type { CustomerListItem } from '../types/customer.types';
import { geocodeAddressToLatLng } from '../utils/geocodeGoogle';
import { isPlottableLatLng } from '../utils/customerMapGeo';

const GEOCODE_REQUEST_GAP_MS = 100;

function normalizeAddressKey(address: string | undefined): string {
  return (address ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * 지도 표시용 고객 목록 반환.
 * - 백엔드에서 lat/lng가 없거나 (0,0)인 매장은 Google Geocoding API로 주소→좌표 보강.
 * - 백엔드가 좌표를 내려주기 시작하면 geocoding 호출 횟수가 자동으로 줄어듦.
 *
 * @param prioritizeStoreId 먼저 지오코딩할 매장 (테이블 선택 시 우선 처리)
 */
export function useCustomerMapGeocode(
  allCustomers: CustomerListItem[],
  prioritizeStoreId: number | null = null,
) {
  const [geocodeOverrides, setGeocodeOverrides] = useState<
    Record<number, { lat: number; lng: number; addressKey: string }>
  >({});
  const addressGeocodeDedupeRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  const customersForMap = useMemo(() => {
    return allCustomers.flatMap((c) => {
      if (isPlottableLatLng(c.latitude, c.longitude)) return [c];
      const addrKey = normalizeAddressKey(c.address);
      const g = geocodeOverrides[c.storeId];
      if (g && g.addressKey === addrKey && isPlottableLatLng(g.lat, g.lng))
        return [{ ...c, latitude: g.lat, longitude: g.lng }];
      return [];
    });
  }, [allCustomers, geocodeOverrides]);

  const geoStillPendingCount = useMemo(() => {
    return allCustomers.filter((c) => {
      if (isPlottableLatLng(c.latitude, c.longitude)) return false;
      const ak = normalizeAddressKey(c.address);
      if (ak.length < 4) return false;
      const g = geocodeOverrides[c.storeId];
      return !(g && g.addressKey === ak);
    }).length;
  }, [allCustomers, geocodeOverrides]);

  const geocodeWorkKey = useMemo(
    () =>
      allCustomers
        .filter(
          (c) =>
            !isPlottableLatLng(c.latitude, c.longitude) &&
            normalizeAddressKey(c.address).length >= 4,
        )
        .map((c) => `${c.storeId}:${normalizeAddressKey(c.address)}`)
        .sort()
        .join('|'),
    [allCustomers],
  );

  useEffect(() => {
    if (!geocodeWorkKey) return;
    let cancelled = false;

    (async () => {
      let need = allCustomers.filter(
        (c) =>
          !isPlottableLatLng(c.latitude, c.longitude) &&
          normalizeAddressKey(c.address).length >= 4,
      );
      need = [...need].sort((a, b) => {
        if (prioritizeStoreId == null) return 0;
        if (a.storeId === prioritizeStoreId) return -1;
        if (b.storeId === prioritizeStoreId) return 1;
        return 0;
      });

      let gapBeforeNext = false;

      for (const c of need) {
        if (cancelled) return;

        const normAddr = normalizeAddressKey(c.address);
        let pos = addressGeocodeDedupeRef.current.get(normAddr);
        if (!pos) {
          if (gapBeforeNext) {
            await new Promise((r) => setTimeout(r, GEOCODE_REQUEST_GAP_MS));
            if (cancelled) return;
          }
          const hit = await geocodeAddressToLatLng(normAddr);
          gapBeforeNext = true;
          if (cancelled) return;
          if (hit && isPlottableLatLng(hit.lat, hit.lng)) {
            addressGeocodeDedupeRef.current.set(normAddr, hit);
            pos = hit;
          }
        }
        if (pos && isPlottableLatLng(pos.lat, pos.lng)) {
          setGeocodeOverrides((prev) => ({
            ...prev,
            [c.storeId]: { lat: pos!.lat, lng: pos!.lng, addressKey: normAddr },
          }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [geocodeWorkKey, prioritizeStoreId]);

  return { customersForMap, geoStillPendingCount };
}
