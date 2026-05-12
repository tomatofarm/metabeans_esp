import type { StoreStatus } from '../types/store.types';
import { STATUS_COLORS } from './constants';

/** API가 위·경도를 안 주면 (0,0) 등 — 지도에 찍지 않음 */
export function isPlottableLatLng(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
  return true;
}

/** Google Maps 마커 아이콘 — Maps API 로드 여부와 무관하게 사용 가능 */
export function createCustomerMarkerIcon(status: StoreStatus): string {
  const color =
    status === 'ACTIVE'
      ? STATUS_COLORS.GOOD.color
      : status === 'PENDING'
        ? STATUS_COLORS.WARNING.color
        : '#bfbfbf';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
