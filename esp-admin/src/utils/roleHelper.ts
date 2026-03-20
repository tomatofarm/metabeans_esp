import type { UserRole } from '../types/auth.types';

/** A/S 관리 하위 탭 (system.mock 권한: as.create / as.process / as.report 와 정합) */
export type AsServiceTabKey = 'alerts' | 'request' | 'status' | 'report';

/**
 * 역할별로 보이는 A/S 탭 키 (같은 페이지·다른 탭 = 데이터는 mockAccess로 매장 스코프)
 * - 알림: as.view (전 역할)
 * - A/S 신청: as.create → ADMIN, OWNER
 * - 처리 현황: as.view (전 역할, 목록은 접근 매장만)
 * - 완료 보고서: as.report → ADMIN, DEALER
 */
export function getVisibleAsServiceTabs(role: UserRole | null | undefined): AsServiceTabKey[] {
  if (!role) return ['alerts'];
  const tabs: AsServiceTabKey[] = ['alerts'];
  if (role === 'ADMIN' || role === 'OWNER') {
    tabs.push('request');
  }
  tabs.push('status');
  if (role === 'ADMIN' || role === 'DEALER') {
    tabs.push('report');
  }
  return tabs;
}

// 역할별 메뉴 접근 맵
export const roleMenuMap: Record<UserRole, string[]> = {
  ADMIN: ['dashboard', 'equipment', 'as-service', 'customer', 'system'],
  DEALER: ['dashboard', 'equipment', 'as-service'],
  HQ: ['dashboard', 'equipment', 'as-service'],
  OWNER: ['dashboard', 'equipment', 'as-service'],
};

/**
 * 사용자 역할에 따라 접근 가능한 메뉴 목록을 반환
 */
export function getAccessibleMenus(role: UserRole): string[] {
  return roleMenuMap[role] ?? [];
}

/**
 * 사용자 역할이 특정 메뉴에 접근 가능한지 확인
 */
export function hasMenuAccess(role: UserRole, menu: string): boolean {
  return roleMenuMap[role]?.includes(menu) ?? false;
}

/**
 * ADMIN 전용 메뉴인지 확인
 */
export function isAdminOnlyMenu(menu: string): boolean {
  return menu === 'customer' || menu === 'system';
}

// 메뉴 정의
export const MENU_ITEMS = [
  { key: 'dashboard', label: '대시보드', path: '/dashboard' },
  { key: 'equipment', label: '장비관리', path: '/equipment' },
  { key: 'as-service', label: 'A/S관리', path: '/as-service' },
  { key: 'customer', label: '고객현황', path: '/customer' },
  { key: 'system', label: '시스템관리', path: '/system' },
] as const;
