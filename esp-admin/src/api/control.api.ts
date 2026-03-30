/**
 * 제어 API — REST 설계서 §6
 *
 * | 훅 | REST |
 * |----|------|
 * | useSendControlCommand | POST /control/command |
 * | useControlHistory | GET /control/history (equipmentId 필터 — Phase 2에서 from/to 등 쿼리 확장) |
 * | useFanAutoSettings / useUpdateFanAutoSettings | GET/PUT /control/equipment/:id/fan-auto-settings |
 * | useSendGatewayConfig | POST /control/gateway/:gatewayId/config |
 *
 * 미구현: GET /control/command/:cmdId/status, GET/PUT damper-auto-settings, GET /control/gateway-config/:cmdId/status
 */
import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockSendControlCommand,
  mockGetControlHistory,
  mockGetFanAutoSettings,
  mockUpdateFanAutoSettings,
  mockSendGatewayConfig,
} from './mock/control.mock';
import type { SendControlRequest, FanAutoSettings, ConfigCommand } from '../types/control.types';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthorizedNumericStoreIds } from '../utils/mockAccess';

function getAuthorizedStoresSnapshot() {
  return resolveAuthorizedNumericStoreIds(useAuthStore.getState().user?.storeIds);
}

function useMockAuthorizedStores() {
  const storeIds = useAuthStore((s) => s.user?.storeIds);
  return useMemo(() => resolveAuthorizedNumericStoreIds(storeIds), [storeIds]);
}

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
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['control', 'history', user?.userId, authorizedStoreIds, equipmentId],
    queryFn: () => mockGetControlHistory(equipmentId!, authorizedStoreIds),
    enabled: equipmentId !== null,
    staleTime: 30 * 1000,
  });
}

// 팬 자동제어 설정 조회
export function useFanAutoSettings(equipmentId: number | null) {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMockAuthorizedStores();
  return useQuery({
    queryKey: ['control', 'fan-auto-settings', user?.userId, authorizedStoreIds, equipmentId],
    queryFn: () => mockGetFanAutoSettings(equipmentId!, authorizedStoreIds),
    enabled: equipmentId !== null,
    staleTime: 60 * 1000,
  });
}

// 팬 자동제어 설정 수정
export function useUpdateFanAutoSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ equipmentId, settings }: { equipmentId: number; settings: Partial<FanAutoSettings> }) =>
      mockUpdateFanAutoSettings(equipmentId, settings, getAuthorizedStoresSnapshot()),
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
