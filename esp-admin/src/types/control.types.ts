// 제어 대상
export type ControlTarget = 0 | 1 | 2; // 0=파워팩, 1=댐퍼, 2=시로코팬

// 제어 모드
export type ControlMode = 'AUTO' | 'MANUAL';

// 제어 결과
export type ControlResult = 'PENDING' | 'SUCCESS' | 'FAIL';

// 제어 명령 (control_commands 테이블)
export interface ControlCommand {
  commandId: number;
  cmdId: string;
  storeId: number;
  gatewayId: number;
  equipmentIdMqtt: string;
  controllerIdMqtt: string;
  target: ControlTarget;
  action: number;
  value?: number;
  controlMode: ControlMode;
  requestedBy?: number;
  result: ControlResult;
  failReason?: string;
  requestedAt: string;
  respondedAt?: string;
}

// MQTT 제어 명령 페이로드
export interface MqttControlPayload {
  cmd_id: string;
  equipment_id: string;
  controller_id: string;
  target: ControlTarget;
  action: number;
  value?: number;
}

// MQTT 제어 응답 페이로드
export interface MqttControlAck {
  cmd_id: string;
  result: 'success' | 'fail';
  reason: string;
}

// 댐퍼 자동 제어 설정 (damper_auto_settings 테이블)
export interface DamperAutoSettings {
  settingId: number;
  equipmentId: number;
  controllerId?: number;
  controlMode: ControlMode;
  targetFlow?: number;
  targetVelocity?: number;
  fanControlMode: ControlMode;
  damperControlMode: ControlMode;
  setBy: number;
  updatedAt: string;
}

// config 명령 페이로드 (config 토픽)
export interface ConfigCommand {
  cmdId: string;
  siteId?: string;
  floorId?: string;
  gatewayId?: string;
  sensorIntervalMs?: number;
  mqttIntervalMs?: number;
  mqttBrokerUri?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  reboot?: boolean;
}

// config 응답 (config/ack 토픽)
export interface ConfigAck {
  cmdId: string;
  result: 'success' | 'fail';
  reason: string;
  needsReboot: boolean;
}

// 파워팩 제어 액션 (target=0)
export const POWERPACK_ACTIONS = {
  OFF: 0,
  ON: 1,
  RESET: 2,
} as const;

// 댐퍼 제어 액션 (target=1)
export const DAMPER_ACTIONS = {
  SET_OPENING: 1,
  SET_MODE: 2,
  SET_TARGET_FLOW: 3,
} as const;

// 시로코팬 제어 액션 (target=2)
export const FAN_ACTIONS = {
  OFF: 0,
  LOW: 1,
  MID: 2,
  HIGH: 3,
  SET_MODE: 4,
  SET_TARGET_VELOCITY: 5,
} as const;

// 방화셔터 8단계 매핑
export const DAMPER_STEPS = [
  { step: 0, opening: 0, value: 0 },
  { step: 1, opening: 10, value: 10 },
  { step: 2, opening: 25, value: 25 },
  { step: 3, opening: 40, value: 40 },
  { step: 4, opening: 60, value: 60 },
  { step: 5, opening: 75, value: 75 },
  { step: 6, opening: 90, value: 90 },
  { step: 7, opening: 100, value: 100 },
] as const;

// 제어 명령 요청 (프론트→API)
export interface SendControlRequest {
  target: ControlTarget;
  action: number;
  value?: number;
  equipmentId: string;   // MQTT equipment_id ("all" for batch)
  controllerId: string;  // MQTT controller_id ("all" for batch)
}

// 제어 명령 응답 (ACK 포함)
export interface SendControlResponse {
  cmdId: string;
  result: ControlResult;
  failReason?: string;
}

// 팬 자동제어 설정 (조회/수정용)
export interface FanAutoSettings {
  equipmentId: number;
  fanControlMode: ControlMode;
  targetVelocity?: number;
  damperControlMode: ControlMode;
  targetFlow?: number;
  updatedAt: string;
}

// 제어 대상 라벨
export const CONTROL_TARGET_LABELS: Record<ControlTarget, string> = {
  0: '파워팩',
  1: '댐퍼',
  2: '시로코팬',
};

// 파워팩 액션 라벨
export const POWERPACK_ACTION_LABELS: Record<number, string> = {
  0: '전원 OFF',
  1: '전원 ON',
  2: '리셋',
};

// 댐퍼 액션 라벨
export const DAMPER_ACTION_LABELS: Record<number, string> = {
  1: '개도율 설정',
  2: '모드 전환',
  3: '목표 풍량 설정',
};

// 팬 액션 라벨
export const FAN_ACTION_LABELS: Record<number, string> = {
  0: '팬 OFF',
  1: '팬 LOW',
  2: '팬 MID',
  3: '팬 HIGH',
  4: '모드 전환',
  5: '목표 풍속 설정',
};
