import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  mockGetDashboardSummary,
  mockGetIssueList,
  mockGetStoreMapData,
  mockGetStoreDashboard,
  mockGetEquipmentDashboard,
  mockGetEsgSummary,
  mockGetEmergencyAlarms,
  mockGetRoleDashboardSummary,
  mockGetRoleIssueList,
  mockGetRoleStoreList,
  mockGetRoleRecentAs,
  mockGetRoleEmergencyAlarms,
  mockGetDashboardPendingAs,
  mockGetRoleDashboardPendingAs,
} from './mock/dashboard.mock';
import { useAuthStore } from '../stores/authStore';
import { resolveAuthorizedNumericStoreIds } from '../utils/mockAccess';

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => mockGetDashboardSummary(),
    staleTime: 30 * 1000,
  });
}

export function useDashboardIssues() {
  return useQuery({
    queryKey: ['dashboard', 'issues'],
    queryFn: () => mockGetIssueList(),
    staleTime: 30 * 1000,
  });
}

export function useStoreMapData() {
  return useQuery({
    queryKey: ['dashboard', 'storeMap'],
    queryFn: () => mockGetStoreMapData(),
    staleTime: 60 * 1000,
  });
}

export function useStoreDashboard(storeId: number | null) {
  return useQuery({
    queryKey: ['dashboard', 'store', storeId],
    queryFn: () => mockGetStoreDashboard(storeId!),
    enabled: storeId !== null,
    staleTime: 30 * 1000,
  });
}

export function useEquipmentDashboard(equipmentId: number | null) {
  return useQuery({
    queryKey: ['dashboard', 'equipment', equipmentId],
    queryFn: () => mockGetEquipmentDashboard(equipmentId!),
    enabled: equipmentId !== null,
    staleTime: 30 * 1000,
  });
}

export function useEsgSummary() {
  return useQuery({
    queryKey: ['dashboard', 'esg'],
    queryFn: () => mockGetEsgSummary(),
    staleTime: 60 * 1000,
  });
}

export function useEmergencyAlarms() {
  const user = useAuthStore((s) => s.user);
  const authorizedStoreIds = useMemo(
    () => resolveAuthorizedNumericStoreIds(user?.storeIds),
    [user?.storeIds],
  );
  return useQuery({
    queryKey: ['dashboard', 'emergencyAlarms', user?.userId, authorizedStoreIds],
    queryFn: () => mockGetEmergencyAlarms(authorizedStoreIds),
    staleTime: 30 * 1000,
  });
}

// --- 역할별 대시보드 훅 ---

export function useRoleDashboardSummary(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleSummary', storeIds],
    queryFn: () => mockGetRoleDashboardSummary(storeIds),
    staleTime: 30 * 1000,
  });
}

export function useRoleDashboardIssues(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleIssues', storeIds],
    queryFn: () => mockGetRoleIssueList(storeIds),
    staleTime: 30 * 1000,
  });
}

export function useRoleStoreList(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleStores', storeIds],
    queryFn: () => mockGetRoleStoreList(storeIds),
    staleTime: 60 * 1000,
  });
}

export function useRoleRecentAs(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleRecentAs', storeIds],
    queryFn: () => mockGetRoleRecentAs(storeIds),
    staleTime: 30 * 1000,
  });
}

export function useRoleEmergencyAlarms(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleEmergencyAlarms', storeIds],
    queryFn: () => mockGetRoleEmergencyAlarms(storeIds),
    staleTime: 30 * 1000,
  });
}

// --- 대시보드 미처리 A/S 목록 ---

export function useDashboardPendingAs() {
  return useQuery({
    queryKey: ['dashboard', 'pendingAs'],
    queryFn: () => mockGetDashboardPendingAs(),
    staleTime: 30 * 1000,
  });
}

export function useRoleDashboardPendingAs(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'rolePendingAs', storeIds],
    queryFn: () => mockGetRoleDashboardPendingAs(storeIds),
    staleTime: 30 * 1000,
  });
}
