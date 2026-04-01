import { DAMPER_STEPS } from '../types/control.types';

// 상태 색상 체계
export const STATUS_COLORS = {
  GOOD: { color: '#52c41a', label: '정상', level: 'green' as const },
  WARNING: { color: '#faad14', label: '주의', level: 'yellow' as const },
  DANGER: { color: '#ff4d4f', label: '위험', level: 'red' as const },
} as const;

export type StatusLevel = 'green' | 'yellow' | 'red';

// IAQ 판단 기준 (환경부 기준)
export const IAQ_THRESHOLDS = {
  pm10: { unit: 'µg/m³', good: 30, moderate: 75, bad: 76 },
  pm2_5: { unit: 'µg/m³', good: 15, moderate: 35, bad: 36 },
  co2: { unit: 'ppm', good: 700, moderate: 1000, bad: 1001 },
  hcho: { unit: 'ppb', good: 30, moderate: 81, bad: 82 },
  co: { unit: 'ppm', good: 4, moderate: 10, bad: 11 },
} as const;

// 유입온도 기준
export const INLET_TEMP_THRESHOLDS = {
  yellowMin: 70,
  redMin: 100,
} as const;

// 필터 점검 판단 파라미터 (AND 조건: 스파크 + 차압 동시 충족 시 청소 필요)
// 관리자 설정 화면 구축 후 DB 저장값으로 교체 예정
export const FILTER_CHECK_PARAMS = {
  sparkWindowMin: 120,          // 스파크 관측 시간 창 (분)
  sparkThreshold: 3000,         // 스파크 기준값 (0~9999 스케일; 표시값 30/99에 해당)
  pressureBaseline: 20,         // 차압 기준값 (Pa)
  pressureIncreaseRate: 0.10,   // 차압 증가율 임계값 (10%)
} as const;

// 통신 오류 판정 기준 (초)
export const COMM_TIMEOUT_SEC = 30;
export const COMM_ISSUE_YELLOW_SEC = 3600; // 1시간
export const COMM_ISSUE_RED_SEC = 86400; // 1일(하루)

// 센서 데이터 갱신 주기 (ms)
export const SENSOR_INTERVAL_MS = 10000;

/** UI·센서 피드백 매칭용 — `DAMPER_STEPS`와 동일 (0~7단계 ↔ 개도율%) */
export const DAMPER_STEP_MAP = DAMPER_STEPS.map((s) => ({
  step: s.step,
  label: `${s.step}단계`,
  opening: s.opening,
}));

// 팬 속도 라벨
export const FAN_SPEED_LABELS: Record<number, string> = {
  0: 'OFF',
  1: 'LOW',
  2: 'MID',
  3: 'HIGH',
};

// Ant Design 기본 Primary 색상 (UI 하이라이트/선택 표시용)
export const PRIMARY_COLOR = '#1890ff';

// 차트용 컨트롤러 색상 팔레트
export const CHART_COLORS = ['#1890ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96'] as const;

// StatusLevel → BadgeStatus 매핑
export const LEVEL_TO_BADGE = {
  green: 'success',
  yellow: 'warning',
  red: 'danger',
} as const;

// 역할별 라벨/색상
export const ROLE_CONFIG = {
  ADMIN: { label: '시스템 관리자', color: '#722ed1' },
  DEALER: { label: '대리점', color: '#1890ff' },
  HQ: { label: '매장 본사', color: '#52c41a' },
  OWNER: { label: '매장 점주', color: '#fa8c16' },
} as const;

// A/S 고장 유형 라벨
export const FAULT_TYPE_LABELS: Record<string, string> = {
  POWER: '전원불량',
  SPARK: '스파크',
  TEMPERATURE: '온도이상',
  COMM_ERROR: '통신오류',
  NOISE: '소음',
  OTHER: '기타',
};

// 알람 유형 라벨 (equipment.types + system.types AlarmType 통합)
export const ALARM_TYPE_LABELS: Record<string, string> = {
  COMM_ERROR: '통신 오류',
  INLET_TEMP: '유입 온도 이상',
  INLET_TEMP_ABNORMAL: '유입 온도 위험',
  FILTER_CHECK: '필터 청소 상태 점검',
  DUST_PERFORMANCE: '먼지제거 성능 점검',
  SPARK: '스파크 이상',
  OVER_TEMP: '보드 과온도',
};

// A/S 상태 라벨
export const AS_STATUS_LABELS: Record<string, string> = {
  PENDING: '접수대기',
  ACCEPTED: '접수완료',
  ASSIGNED: '배정완료',
  VISIT_SCHEDULED: '방문예정',
  IN_PROGRESS: '처리중',
  COMPLETED: '처리완료',
  REPORT_SUBMITTED: '보고서제출',
  CLOSED: '종결',
  CANCELLED: '취소',
};

// A/S 상태별 색상 (Ant Design Tag color)
export const AS_STATUS_COLORS: Record<string, string> = {
  PENDING: 'default',
  ACCEPTED: 'blue',
  ASSIGNED: 'gold',
  VISIT_SCHEDULED: 'cyan',
  IN_PROGRESS: 'orange',
  COMPLETED: 'green',
  REPORT_SUBMITTED: 'purple',
  CLOSED: 'default',
  CANCELLED: 'default',
};

// 서비스 가능 지역
export const SERVICE_REGIONS = [
  '서울 동부',
  '서울 서부',
  '서울 남부',
  '서울 북부',
  '경기 동부',
  '경기 서부',
  '경기 북부',
  '경기 남부',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

// Mock 센서 데이터 범위
export const SENSOR_RANGES = {
  pm25: { min: 5, max: 80, decimals: 1 },
  pm10: { min: 10, max: 100, decimals: 1 },
  diffPressure: { min: 5, max: 50, decimals: 1 },
  oilLevel: { values: [0, 1] },                   // v3.2: 0=정상, 1=만수 (float→int 변경)
  ppTemp: { min: 30, max: 70, decimals: 0 },
  ppSpark: { min: 0, max: 9999, decimals: 0 },     // v3.2: 0-99→0-9999 (rev2.1 대응)
  ppPower: { values: [0, 1] },
  ppAlarm: { values: [0, 1] },
  fanSpeed: { values: [0, 1, 2, 3] },
  fanMode: { values: [0, 1] },
  fanRunning: { values: [0, 1] },                   // v3.2 신규: 0=정지, 1=운전중
  fanFreq: { min: 0, max: 50, decimals: 2 },        // v3.2 신규: Hz (0~50.00)
  fanTargetPct: { min: 0, max: 100, decimals: 1 },  // v3.2 신규: % (자동 모드에서만 유의미)
  damperMode: { values: [0, 1] },
  flow: { min: 300, max: 1200, decimals: 1 },
  damperCtrl: { min: 0, max: 100, decimals: 1 },    // v3.2 신규: 댐퍼 제어 명령값
  damper: { min: 0, max: 100, decimals: 1 },
  inletTemp: { min: 15, max: 50, decimals: 1 },
  velocity: { min: 2, max: 15, decimals: 1 },
  ductDp: { min: 50, max: 500, decimals: 1 },
  statusFlags: { default: 63 },
} as const;
