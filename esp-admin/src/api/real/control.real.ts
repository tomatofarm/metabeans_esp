import { apiRequest } from './apiHelpers';
import type {
  SendControlRequest,
  SendControlResponse,
  ControlCommand,
  FanAutoSettings,
  ConfigCommand,
  ConfigAck,
} from '../../types/control.types';

type ApiCommandDispatchResponse = {
  cmdId: string;
  status?: 'SENT' | 'PENDING' | 'SUCCESS' | 'FAILED';
};

type ApiCommandStatusResponse = {
  cmdId: string;
  result?: 'PENDING' | 'SUCCESS' | 'FAIL';
  reason?: string | null;
};

type ApiFanAutoSettingsRow = {
  equipmentId: number;
  fanControlMode?: 'AUTO' | 'MANUAL' | null;
  targetVelocity?: number | null;
  damperControlMode?: 'AUTO' | 'MANUAL' | null;
  targetFlow?: number | null;
  updatedAt?: string | null;
};

const POLL_INTERVAL_MS = 700;
const POLL_TIMEOUT_MS = 7000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendControlCommand(request: SendControlRequest): Promise<SendControlResponse> {
  if (!request.gatewayId || request.gatewayId <= 0) {
    throw new Error('gatewayId is required');
  }

  const dispatched = await apiRequest<ApiCommandDispatchResponse>({
    method: 'post',
    url: '/control/command',
    data: {
      gatewayId: request.gatewayId,
      equipmentId: request.equipmentId,
      controllerId: request.controllerId,
      target: request.target,
      action: request.action,
      ...(request.value !== undefined ? { value: request.value } : {}),
    },
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const status = await apiRequest<ApiCommandStatusResponse>({
      method: 'get',
      url: `/control/command/${encodeURIComponent(dispatched.cmdId)}/status`,
    });

    if (status.result === 'SUCCESS') {
      return { cmdId: status.cmdId, result: 'SUCCESS' };
    }
    if (status.result === 'FAIL') {
      return { cmdId: status.cmdId, result: 'FAIL', failReason: status.reason ?? undefined };
    }
    await sleep(POLL_INTERVAL_MS);
  }

  return { cmdId: dispatched.cmdId, result: 'PENDING' };
}

export async function fetchControlHistory(equipmentId: number): Promise<ControlCommand[]> {
  return apiRequest<ControlCommand[]>({
    method: 'get',
    url: `/control/history?equipmentId=${equipmentId}`,
  });
}

export async function fetchFanAutoSettings(equipmentId: number): Promise<FanAutoSettings> {
  const rows = await apiRequest<ApiFanAutoSettingsRow[]>({
    method: 'get',
    url: `/control/equipment/${equipmentId}/fan-auto-settings`,
  });

  const row = rows[0];
  return {
    equipmentId,
    fanControlMode: row?.fanControlMode ?? 'MANUAL',
    targetVelocity: row?.targetVelocity ?? undefined,
    damperControlMode: row?.damperControlMode ?? 'MANUAL',
    targetFlow: row?.targetFlow ?? undefined,
    updatedAt: row?.updatedAt ?? new Date().toISOString(),
  };
}

export async function updateFanAutoSettings(
  equipmentId: number,
  settings: Partial<FanAutoSettings>,
): Promise<FanAutoSettings> {
  await apiRequest<unknown>({
    method: 'put',
    url: `/control/equipment/${equipmentId}/fan-auto-settings`,
    data: settings,
  });
  return fetchFanAutoSettings(equipmentId);
}

export async function sendGatewayConfig(
  gatewayId: number,
  config: Partial<ConfigCommand>,
): Promise<ConfigAck> {
  return apiRequest<ConfigAck>({
    method: 'post',
    url: `/control/gateway/${gatewayId}/config`,
    data: config,
  });
}
