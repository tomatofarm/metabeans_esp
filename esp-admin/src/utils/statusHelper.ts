import type { StatusLevel } from './constants';
import {
  STATUS_COLORS,
  IAQ_THRESHOLDS,
  INLET_TEMP_THRESHOLDS,
  COMM_TIMEOUT_SEC,
  COMM_ISSUE_YELLOW_SEC,
  COMM_ISSUE_RED_SEC,
} from './constants';

/**
 * 상태 전파 규칙: 하위 중 가장 높은 위험도를 상위에 전파
 * Controller → Equipment → Site
 */
export function propagateStatus(statuses: StatusLevel[]): StatusLevel {
  if (statuses.includes('red')) return 'red';
  if (statuses.includes('yellow')) return 'yellow';
  return 'green';
}

/**
 * 통신 오류 판정: 30초 미수신 시 OFFLINE(Red)
 */
export function getConnectionStatus(lastSeenAt: string | undefined | null): StatusLevel {
  if (!lastSeenAt) return 'red';
  const elapsed = (Date.now() - new Date(lastSeenAt).getTime()) / 1000;
  if (elapsed > COMM_TIMEOUT_SEC) return 'red';
  return 'green';
}

/**
 * 대시보드 이슈 - 통신 연결 상태 점검
 * Yellow: 끊김 1시간 이상, Red: 끊김 하루 이상
 */
export function getCommIssueLevel(lastSeenAt: string | undefined | null): StatusLevel | null {
  if (!lastSeenAt) return 'red';
  const elapsed = (Date.now() - new Date(lastSeenAt).getTime()) / 1000;
  if (elapsed >= COMM_ISSUE_RED_SEC) return 'red';
  if (elapsed >= COMM_ISSUE_YELLOW_SEC) return 'yellow';
  return null;
}

/**
 * 유입 온도 이상 판정
 * Yellow: 70°C 이상, Red: 100°C 이상
 */
export function getInletTempLevel(inletTemp: number): StatusLevel {
  if (inletTemp >= INLET_TEMP_THRESHOLDS.redMin) return 'red';
  if (inletTemp >= INLET_TEMP_THRESHOLDS.yellowMin) return 'yellow';
  return 'green';
}

/**
 * IAQ 지표 상태 판정
 */
export function getIAQLevel(
  metric: keyof typeof IAQ_THRESHOLDS,
  value: number,
): StatusLevel {
  const threshold = IAQ_THRESHOLDS[metric];
  if (value >= threshold.bad) return 'red';
  if (value > threshold.good) return 'yellow';
  return 'green';
}

/**
 * 상태 레벨 → 색상/라벨 변환
 */
export function getStatusConfig(level: StatusLevel) {
  switch (level) {
    case 'green':
      return STATUS_COLORS.GOOD;
    case 'yellow':
      return STATUS_COLORS.WARNING;
    case 'red':
      return STATUS_COLORS.DANGER;
  }
}

/**
 * 보드 온도 상태 판정 (기준값은 시스템 관리에서 설정)
 * 기본값: yellowMin=60, redMin=80
 */
export function getBoardTempLevel(
  temp: number,
  yellowMin = 60,
  redMin = 80,
): StatusLevel {
  if (temp >= redMin) return 'red';
  if (temp >= yellowMin) return 'yellow';
  return 'green';
}

/**
 * 스파크 상태 판정 (기준값은 시스템 관리에서 설정)
 * 기본값: yellowMin=3000, redMin=7000 (v3.2: 0-9999 스케일)
 */
export function getSparkLevel(
  spark: number,
  yellowMin = 3000,
  redMin = 7000,
): StatusLevel {
  if (spark >= redMin) return 'red';
  if (spark >= yellowMin) return 'yellow';
  return 'green';
}

/**
 * 전원 상태 판정
 */
export function getPowerStatus(ppPower: number): StatusLevel {
  return ppPower === 1 ? 'green' : 'red';
}

/**
 * PM2.5 먼지 제거 성능 판정 (배출부)
 * 기본값: yellowMax=35, redMin=50
 */
export function getPM25Level(
  pm25: number,
  yellowMax = 35,
  redMin = 50,
): StatusLevel {
  if (pm25 >= redMin) return 'red';
  if (pm25 >= yellowMax) return 'yellow';
  return 'green';
}

/**
 * PM10 먼지 제거 성능 판정 (배출부)
 * 기본값: yellowMax=75, redMin=80
 */
export function getPM10Level(
  pm10: number,
  yellowMax = 75,
  redMin = 80,
): StatusLevel {
  if (pm10 >= redMin) return 'red';
  if (pm10 >= yellowMax) return 'yellow';
  return 'green';
}

/**
 * 필터 점검 상태 판정 (차압 기준)
 * 기본값: yellowMin=35 Pa
 */
export function getFilterCheckLevel(
  diffPressure: number,
  yellowMin = 35,
): StatusLevel {
  if (diffPressure >= yellowMin) return 'yellow';
  return 'green';
}

/**
 * 통신 연결 상태 판정 (epoch 타임스탬프 기반, 30초 미수신 시 OFFLINE)
 */
export function getConnectionStatusFromEpoch(lastTimestamp: number): StatusLevel {
  const elapsed = (Date.now() / 1000) - lastTimestamp;
  if (elapsed > COMM_TIMEOUT_SEC) return 'red';
  return 'green';
}

/**
 * 오일 레벨 상태 판정 (v3.2: 0=정상, 1=만수)
 */
export function getOilLevelStatus(oilLevel: number): { level: StatusLevel; label: string } {
  return oilLevel === 1
    ? { level: 'red', label: '만수' }
    : { level: 'green', label: '정상' };
}

/**
 * 필터 점검 상태 메시지
 */
export const FILTER_CHECK_MESSAGE =
  '필터 점검 필요: 스파크 발생 부위 및 필터 오염 상태를 확인하십시오. 오염 확인 시 필터 세척과 장비 내부 청소가 필요합니다.';
