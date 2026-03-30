/**
 * 대시보드 API (Phase 2 시 REST 설계서 §3 와 1:1 매핑 목표)
 *
 * | 훅 | REST (문서 기준) | 비고 |
 * |----|------------------|------|
 * | useDashboardSummary | GET /dashboard/summary | 응답 필드명이 타입과 다를 수 있음 → 어댑터 필요 |
 * | useDashboardIssues | GET /dashboard/issues | 쿼리 severity/storeId |
 * | useEmergencyAlarms / useRoleEmergencyAlarms | GET /dashboard/alarms | |
 * | useStoreDashboard | GET /dashboard/stores/:storeId | IAQ·층별IAQ 등 복합 응답 |
 * | useEquipmentDashboard | (문서 단일 엔드포인트 없음) | §3 조합 또는 장비 API와 합의 |
 * | useStoreMapData / useRoleStoreList | 지도용 — §3.6 store-tree 또는 별도 API 합의 | |
 * | useEsgSummary | (문서 §3에 없음) | 백엔드 스펙 확정 필요 |
 * | useDashboardPendingAs 등 | /as-service/requests 조합 등 | |
 *
 * 미구현 독립 훅: GET /dashboard/iaq, GET /dashboard/outdoor-air → 현재는 store 대시보드 응답에 포함.
 * 사이드바 트리: GET /dashboard/store-tree → 현재 Phase 1은 useEquipmentTree + common.mock.
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
