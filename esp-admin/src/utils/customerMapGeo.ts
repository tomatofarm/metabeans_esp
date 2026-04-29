import L from 'leaflet';
import type { StoreStatus } from '../types/store.types';
import { STATUS_COLORS } from './constants';

/** 지오코드 캐시·주소 비교용 — Photon 루프의 `normAddr`와 동일 규칙 */
export function normalizeCustomerAddressKey(address: string | undefined): string {
  return (address ?? '').trim().replace(/\s+/g, ' ');
}

/** API가 위·경도를 안 주면 (0,0) 등 — 지도에 찍지 않음 */
export function isPlottableLatLng(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}

export function createCustomerMarkerIcon(status: StoreStatus): L.DivIcon {
  const color =
    status === 'ACTIVE'
      ? STATUS_COLORS.GOOD.color
      : status === 'PENDING'
        ? STATUS_COLORS.WARNING.color
        : '#bfbfbf';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px; height: 24px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}
