import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockSendControlCommand,
  mockGetControlHistory,
  mockGetFanAutoSettings,
  mockUpdateFanAutoSettings,
  mockSendGatewayConfig,
} from './mock/control.mock';
import type { SendControlRequest, FanAutoSettings, ConfigCommand } from '../types/control.types';

// 제어 명령 전송
export function useSendControlCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: SendControlRequest) => mockSendControlCommand(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['control', 'history'] });
    },
  });
}

// 제어 이력 조회
export function useControlHistory(equipmentId: number | null) {
  return useQuery({
    queryKey: ['control', 'history', equipmentId],
    queryFn: () => mockGetControlHistory(equipmentId!),
    enabled: equipmentId !== null,
    staleTime: 30 * 1000,
  });
}

// 팬 자동제어 설정 조회
export function useFanAutoSettings(equipmentId: number | null) {
  return useQuery({
    queryKey: ['control', 'fan-auto-settings', equipmentId],
    queryFn: () => mockGetFanAutoSettings(equipmentId!),
    enabled: equipmentId !== null,
    staleTime: 60 * 1000,
  });
}

// 팬 자동제어 설정 수정
export function useUpdateFanAutoSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ equipmentId, settings }: { equipmentId: number; settings: Partial<FanAutoSettings> }) =>
      mockUpdateFanAutoSettings(equipmentId, settings),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['control', 'fan-auto-settings', variables.equipmentId] });
    },
  });
}

// 게이트웨이 원격 설정 변경
export function useSendGatewayConfig() {
  return useMutation({
    mutationFn: ({ gatewayId, config }: { gatewayId: number; config: Partial<ConfigCommand> }) =>
      mockSendGatewayConfig(gatewayId, config),
  });
}
