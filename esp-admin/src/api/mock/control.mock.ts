// UUID 생성 (crypto.randomUUID 사용)
import type {
  ControlCommand,
  ControlTarget,
  ControlResult,
  SendControlRequest,
  SendControlResponse,
  FanAutoSettings,
  ConfigCommand,
  ConfigAck,
} from '../../types/control.types';
import {
  CONTROL_TARGET_LABELS,
  POWERPACK_ACTION_LABELS,
  DAMPER_ACTION_LABELS,
  FAN_ACTION_LABELS,
} from '../../types/control.types';
import { mockDelay } from './common.mock';

// --- 유틸 ---
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function generateCmdId(): string {
  return crypto.randomUUID();
}

// 액션 라벨 헬퍼
function getActionLabel(target: ControlTarget, action: number): string {
  switch (target) {
    case 0: return POWERPACK_ACTION_LABELS[action] ?? `action=${action}`;
    case 1: return DAMPER_ACTION_LABELS[action] ?? `action=${action}`;
    case 2: return FAN_ACTION_LABELS[action] ?? `action=${action}`;
    default: return `action=${action}`;
  }
}

// --- Mock 제어 이력 데이터 생성 ---
function generateMockControlHistory(equipmentId: number): ControlCommand[] {
  const history: ControlCommand[] = [];
  const now = Date.now();
  const targets: ControlTarget[] = [0, 1, 2];
  const results: ControlResult[] = ['SUCCESS', 'SUCCESS', 'SUCCESS', 'FAIL'];

  for (let i = 0; i < 20; i++) {
    const target = randomChoice(targets);
    const result = randomChoice(results);
    let action = 0;
    let value: number | undefined;

    switch (target) {
      case 0: // 파워팩
        action = randomChoice([0, 1, 2]);
        break;
      case 1: // 댐퍼
        action = randomChoice([1, 2, 3]);
        if (action === 1) value = randomChoice([0, 10, 25, 40, 60, 75, 90, 100]);
        if (action === 2) value = randomChoice([0, 1]);
        if (action === 3) value = parseFloat((Math.random() * 600 + 400).toFixed(1));
        break;
      case 2: // 팬
        action = randomChoice([0, 1, 2, 3, 4, 5]);
        if (action === 4) value = randomChoice([0, 1]);
        if (action === 5) value = parseFloat((Math.random() * 10 + 2).toFixed(1));
        break;
    }

    const requestedAt = new Date(now - i * 300000).toISOString(); // 5분 간격
    history.push({
      commandId: 100 + i,
      cmdId: generateCmdId(),
      storeId: 1,
      gatewayId: 1,
      equipmentIdMqtt: `esp-${String(Math.ceil(Math.random() * 2)).padStart(3, '0')}`,
      controllerIdMqtt: `ctrl-${String(Math.ceil(Math.random() * 3)).padStart(3, '0')}`,
      target,
      action,
      value,
      controlMode: (target === 1 && action >= 2) || (target === 2 && action >= 4) ? 'AUTO' : 'MANUAL',
      requestedBy: 1,
      result,
      failReason: result === 'FAIL' ? '장치 응답 없음' : undefined,
      requestedAt,
      respondedAt: result !== 'PENDING'
        ? new Date(new Date(requestedAt).getTime() + Math.random() * 2000 + 500).toISOString()
        : undefined,
    });
  }

  return history;
}

// --- Mock 팬 자동제어 설정 ---
const mockFanAutoSettingsMap: Record<number, FanAutoSettings> = {
  1: {
    equipmentId: 1,
    fanControlMode: 'MANUAL',
    targetVelocity: 5.0,
    damperControlMode: 'MANUAL',
    targetFlow: 800.0,
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  2: {
    equipmentId: 2,
    fanControlMode: 'AUTO',
    targetVelocity: 3.5,
    damperControlMode: 'AUTO',
    targetFlow: 650.0,
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
};

// --- Mock API 함수들 ---

/**
 * 제어 명령 전송 (ACK 시뮬레이션: 1~3초 딜레이)
 */
export async function mockSendControlCommand(request: SendControlRequest): Promise<SendControlResponse> {
  const cmdId = generateCmdId();
  const success = Math.random() > 0.1; // 90% 성공률

  // ACK 딜레이 시뮬레이션 (1~3초)
  const delay = 1000 + Math.random() * 2000;
  return mockDelay(
    {
      cmdId,
      result: success ? ('SUCCESS' as ControlResult) : ('FAIL' as ControlResult),
      failReason: success ? undefined : '장치 응답 시간 초과',
    },
    delay,
  );
}

/**
 * 제어 이력 조회
 */
export async function mockGetControlHistory(equipmentId: number): Promise<ControlCommand[]> {
  return mockDelay(generateMockControlHistory(equipmentId), 300);
}

/**
 * 팬 자동제어 설정 조회
 */
export async function mockGetFanAutoSettings(equipmentId: number): Promise<FanAutoSettings> {
  const settings = mockFanAutoSettingsMap[equipmentId] ?? {
    equipmentId,
    fanControlMode: 'MANUAL' as const,
    targetVelocity: 5.0,
    damperControlMode: 'MANUAL' as const,
    targetFlow: 800.0,
    updatedAt: new Date().toISOString(),
  };
  return mockDelay(settings, 200);
}

/**
 * 팬 자동제어 설정 수정
 */
export async function mockUpdateFanAutoSettings(
  equipmentId: number,
  settings: Partial<FanAutoSettings>,
): Promise<FanAutoSettings> {
  const current = mockFanAutoSettingsMap[equipmentId] ?? {
    equipmentId,
    fanControlMode: 'MANUAL' as const,
    targetVelocity: 5.0,
    damperControlMode: 'MANUAL' as const,
    targetFlow: 800.0,
    updatedAt: new Date().toISOString(),
  };
  const updated: FanAutoSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString(),
  };
  mockFanAutoSettingsMap[equipmentId] = updated;
  return mockDelay(updated, 300);
}

/**
 * 게이트웨이 원격 설정 변경
 */
export async function mockSendGatewayConfig(
  _gatewayId: number,
  _config: Partial<ConfigCommand>,
): Promise<ConfigAck> {
  const cmdId = generateCmdId();
  const success = Math.random() > 0.05; // 95% 성공률
  const delay = 1500 + Math.random() * 1500;
  return mockDelay(
    {
      cmdId,
      result: success ? ('success' as const) : ('fail' as const),
      reason: success ? 'OK' : 'Gateway timeout',
      needsReboot: false,
    },
    delay,
  );
}

export { getActionLabel };
