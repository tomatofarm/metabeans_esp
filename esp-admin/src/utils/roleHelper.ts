import type { UserRole } from '../types/auth.types';

/** A/S 관리 탭 키 — `ASServicePage`에서 권한(as.view / as.create / as.process / as.report)과 1:1 매핑. 처리 목록 수정 버튼은 `as.process_edit`. */
export type AsServiceTabKey = 'alerts' | 'request' | 'status' | 'report';

// 역할별 메뉴 접근 맵
/** 상단 메뉴 후보 키. `customer`는 `customer.access` 권한으로 Header에서 추가 필터 */
export const roleMenuMap: Record<UserRole, string[]> = {
  ADMIN: ['dashboard', 'equipment', 'as-service', 'customer', 'system'],
  DEALER: ['dashboard', 'equipment', 'as-service', 'customer'],
  HQ: ['dashboard', 'equipment', 'as-service', 'customer'],
  OWNER: ['dashboard', 'equipment', 'as-service', 'customer'],
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
  return menu === 'system';
}

// 메뉴 정의
export const MENU_ITEMS = [
  { key: 'dashboard', label: '대시보드', path: '/dashboard' },
  { key: 'equipment', label: '장비관리', path: '/equipment' },
  { key: 'as-service', label: 'A/S관리', path: '/as-service' },
  { key: 'customer', label: '고객현황', path: '/customer' },
  { key: 'system', label: '시스템관리', path: '/system' },
] as const;
