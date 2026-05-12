import type { StoreStatus } from '../types/store.types';
import { STATUS_COLORS } from './constants';

/** API가 위·경도를 안 주면 (0,0) 등 — 지도에 찍지 않음 */
export function isPlottableLatLng(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}

/** Google Maps 마커 아이콘 — google.maps 로드 후에만 호출 */
export function createCustomerMarkerIcon(status: StoreStatus): google.maps.Icon {
  const color =
    status === 'ACTIVE'
      ? STATUS_COLORS.GOOD.color
      : status === 'PENDING'
        ? STATUS_COLORS.WARNING.color
        : '#bfbfbf';
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">` +
      `<circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="3"/>` +
      `</svg>`,
  );
  return {
    url: `data:image/svg+xml;charset=UTF-8,${svg}`,
    scaledSize: new window.google.maps.Size(24, 24),
    anchor: new window.google.maps.Point(12, 12),
  };
}
