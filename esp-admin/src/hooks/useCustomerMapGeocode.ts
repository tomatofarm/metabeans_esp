import { useMemo, useState, useEffect, useRef } from 'react';
import type { CustomerListItem } from '../types/customer.types';
import { geocodeAddressToLatLng } from '../utils/geocodePhoton';
import {
  isPlottableLatLng,
  normalizeCustomerAddressKey,
} from '../utils/customerMapGeo';

const PHOTON_REQUEST_GAP_MS = 120;

/**
 * 고객현황·대시보드 지도 공통: API 좌표 없을 때 Photon으로 주소 → 좌표 보강.
 * @param prioritizeStoreId 테이블/지도에서 선택한 매장을 지오코딩 순서 앞으로.
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
      const addrKey = normalizeCustomerAddressKey(c.address);
      const g = geocodeOverrides[c.storeId];
      if (g && g.addressKey === addrKey && isPlottableLatLng(g.lat, g.lng))
        return [{ ...c, latitude: g.lat, longitude: g.lng }];
      return [];
    });
  }, [allCustomers, geocodeOverrides]);

  const geoStillPendingCount = useMemo(() => {
    return allCustomers.filter((c) => {
      if (isPlottableLatLng(c.latitude, c.longitude)) return false;
      const ak = normalizeCustomerAddressKey(c.address);
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
            normalizeCustomerAddressKey(c.address).length >= 4,
        )
        .map((c) => `${c.storeId}:${normalizeCustomerAddressKey(c.address)}`)
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
          normalizeCustomerAddressKey(c.address).length >= 4,
      );
      need = [...need].sort((a, b) => {
        if (prioritizeStoreId == null) return 0;
        if (a.storeId === prioritizeStoreId) return -1;
        if (b.storeId === prioritizeStoreId) return 1;
        return 0;
      });

      let gapBeforeNextPhoton = false;

      for (const c of need) {
        if (cancelled) return;

        const normAddr = normalizeCustomerAddressKey(c.address);
        let pos = addressGeocodeDedupeRef.current.get(normAddr);
        if (!pos) {
          if (gapBeforeNextPhoton) {
            await new Promise((r) => setTimeout(r, PHOTON_REQUEST_GAP_MS));
            if (cancelled) return;
          }
          const hit = await geocodeAddressToLatLng(normAddr);
          gapBeforeNextPhoton = true;
          if (cancelled) return;
          if (hit && isPlottableLatLng(hit.lat, hit.lng)) {
            addressGeocodeDedupeRef.current.set(normAddr, hit);
            pos = hit;
          }
        }
        if (pos && isPlottableLatLng(pos.lat, pos.lng)) {
          setGeocodeOverrides((prev) => ({
            ...prev,
            [c.storeId]: { lat: pos.lat, lng: pos.lng, addressKey: normAddr },
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
