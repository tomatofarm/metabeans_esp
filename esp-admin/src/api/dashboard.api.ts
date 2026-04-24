/**
 * 대시보드 API
 *
 * `VITE_API_BASE_URL` 설정 + `VITE_USE_MOCK_API !== 'true'` 이면 `real/dashboard.real.ts`로 백엔드 호출.
 * 장비 상세는 `GET /equipment/:id` + `GET /monitoring/equipment/:id/latest`(+ history) 조합.
 *
 * | 훅 | 백엔드 |
 * |----|--------|
 * | useDashboardSummary | GET /dashboard/summary |
 * | useDashboardIssues | GET /dashboard/issues |
 * | useStoreMapData / useRoleStoreList | GET /dashboard/store-tree + issues 집계 |
 * | useStoreDashboard | store-tree + iaq + issues + as-service/requests |
 * | useEquipmentDashboard | equipment + monitoring latest/history |
 * | useEsgSummary | GET /dashboard/esg-summary |
 * | useEmergencyAlarms | GET /dashboard/alarms |
 * | useDashboardPendingAs / useRoleDashboardPendingAs | `GET /as-service/requests` → 최신순·접근 매장만(역할). 대시보드 «A/S 요청 현황» 목록 |
 */
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
import * as dashboardReal from './real/dashboard.real';

const useRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' && Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => (useRealApi ? dashboardReal.fetchDashboardSummary() : mockGetDashboardSummary()),
    staleTime: 30 * 1000,
  });
}

export function useDashboardIssues() {
  return useQuery({
    queryKey: ['dashboard', 'issues'],
    queryFn: () => (useRealApi ? dashboardReal.fetchDashboardIssues() : mockGetIssueList()),
    staleTime: 30 * 1000,
  });
}

export function useStoreMapData() {
  return useQuery({
    queryKey: ['dashboard', 'storeMap'],
    queryFn: () => (useRealApi ? dashboardReal.fetchStoreMapData() : mockGetStoreMapData()),
    staleTime: 60 * 1000,
  });
}

export function useStoreDashboard(storeId: number | null) {
  return useQuery({
    queryKey: ['dashboard', 'store', storeId],
    queryFn: () =>
      useRealApi ? dashboardReal.fetchStoreDashboard(storeId!) : mockGetStoreDashboard(storeId!),
    enabled: storeId !== null,
    staleTime: 30 * 1000,
  });
}

export function useEquipmentDashboard(equipmentId: number | null) {
  return useQuery({
    queryKey: ['dashboard', 'equipment', equipmentId],
    queryFn: () =>
      useRealApi
        ? dashboardReal.fetchEquipmentDashboard(equipmentId!)
        : mockGetEquipmentDashboard(equipmentId!),
    enabled: equipmentId !== null,
    staleTime: 30 * 1000,
  });
}

export function useEsgSummary() {
  return useQuery({
    queryKey: ['dashboard', 'esg'],
    queryFn: () => (useRealApi ? dashboardReal.fetchEsgSummary() : mockGetEsgSummary()),
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
    queryFn: () =>
      useRealApi
        ? dashboardReal.fetchEmergencyAlarms(authorizedStoreIds)
        : mockGetEmergencyAlarms(authorizedStoreIds),
    staleTime: 30 * 1000,
  });
}

// --- 역할별 대시보드 훅 ---

export function useRoleDashboardSummary(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleSummary', storeIds],
    queryFn: () =>
      useRealApi ? dashboardReal.fetchRoleDashboardSummary(storeIds) : mockGetRoleDashboardSummary(storeIds),
    staleTime: 30 * 1000,
  });
}

export function useRoleDashboardIssues(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleIssues', storeIds],
    queryFn: () =>
      useRealApi ? dashboardReal.fetchRoleDashboardIssues(storeIds) : mockGetRoleIssueList(storeIds),
    staleTime: 30 * 1000,
  });
}

export function useRoleStoreList(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleStores', storeIds],
    queryFn: () =>
      useRealApi ? dashboardReal.fetchRoleStoreList(storeIds) : mockGetRoleStoreList(storeIds),
    staleTime: 60 * 1000,
  });
}

export function useRoleRecentAs(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleRecentAs', storeIds],
    queryFn: () =>
      useRealApi ? dashboardReal.fetchRoleRecentAs(storeIds) : mockGetRoleRecentAs(storeIds),
    staleTime: 30 * 1000,
  });
}

export function useRoleEmergencyAlarms(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'roleEmergencyAlarms', storeIds],
    queryFn: () =>
      useRealApi ? dashboardReal.fetchRoleEmergencyAlarms(storeIds) : mockGetRoleEmergencyAlarms(storeIds),
    staleTime: 30 * 1000,
  });
}

// --- 대시보드 미처리 A/S 목록 ---

export function useDashboardPendingAs() {
  return useQuery({
    queryKey: ['dashboard', 'pendingAs'],
    queryFn: () =>
      useRealApi ? dashboardReal.fetchDashboardPendingAs() : mockGetDashboardPendingAs(),
    staleTime: 30 * 1000,
  });
}

export function useRoleDashboardPendingAs(storeIds: string[]) {
  return useQuery({
    queryKey: ['dashboard', 'rolePendingAs', storeIds],
    queryFn: () =>
      useRealApi
        ? dashboardReal.fetchRoleDashboardPendingAs(storeIds)
        : mockGetRoleDashboardPendingAs(storeIds),
    staleTime: 30 * 1000,
  });
}
