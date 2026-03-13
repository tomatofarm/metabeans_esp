import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * ISO 8601 또는 UTC 날짜 → 로컬 시간 변환
 */
export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  return dayjs.utc(dateStr).local().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 날짜만 표시
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  return dayjs.utc(dateStr).local().format('YYYY-MM-DD');
}

/**
 * 날짜+시간 표시 (초 제외)
 */
export function formatDateTimeShort(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  return dayjs.utc(dateStr).local().format('YYYY-MM-DD HH:mm');
}

/**
 * 날짜 콤팩트 표시 (YYYYMMDD, A/S 접수번호 등)
 */
export function formatDateCompact(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  return dayjs.utc(dateStr).local().format('YYYYMMDD');
}

/**
 * 시간만 표시
 */
export function formatTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  return dayjs.utc(dateStr).local().format('HH:mm:ss');
}

/**
 * Unix epoch (초) → 로컬 시간 변환
 */
export function formatEpoch(epoch: number): string {
  return dayjs.unix(epoch).format('YYYY-MM-DD HH:mm:ss');
}

/**
 * 숫자 포맷 (소수점 지정)
 */
export function formatNumber(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null) return '-';
  return value.toFixed(decimals);
}

/**
 * 온도 표시
 */
export function formatTemp(value: number | undefined | null, decimals = 1): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(decimals)}°C`;
}

/**
 * 습도 표시
 */
export function formatHumidity(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(1)}%`;
}

/**
 * 풍량 표시 (CMH)
 */
export function formatFlow(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(1)} CMH`;
}

/**
 * 풍속 표시 (m/s)
 */
export function formatVelocity(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(1)} m/s`;
}

/**
 * 압력 표시 (Pa)
 */
export function formatPressure(value: number | undefined | null): string {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(1)} Pa`;
}

/**
 * 상대적인 시간 표시 (예: "5분 전")
 */
export function formatRelativeTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  const diff = dayjs().diff(dayjs.utc(dateStr).local(), 'second');
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}
