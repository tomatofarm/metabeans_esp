import { useMemo } from 'react';
import { usePermissionMatrix } from '../api/system.api';
import { useAuthStore } from '../stores/authStore';
import { getAccessibleMenus } from '../utils/roleHelper';
import { FEATURE_CODE_LIST } from '../types/system.types';
import type { FeatureCode } from '../types/system.types';
import type { UserRole } from '../types/auth.types';

/** 상단 메뉴 키 → 권한 매트릭스 `category` (FEATURE_CODE_LIST와 동일 문자열) */
const CATEGORY_BY_MENU_KEY: Record<string, string> = {
  dashboard: '대시보드',
  equipment: '장비관리',
  'as-service': 'A/S관리',
  customer: '고객현황',
  system: '시스템관리',
};

function featureCodesForCategory(category: string): FeatureCode[] {
  return FEATURE_CODE_LIST.filter((f) => f.category === category).map((f) => f.code);
}

/**
 * 상단 메뉴: 해당 섹터(카테고리)에 속한 기능 권한이 하나도 없으면 메뉴 숨김.
 * 로딩 중에는 메뉴를 숨겨 "잠깐 보였다 사라지는" 깜빡임을 방지한다.
 * ADMIN은 매트릭스 로딩 완료 후에도 항상 모든 섹터 표시.
 *
 * `GET /system/permissions`가 403(비관리자 조회 금지)·실패·못 읽는 응답이면 `matrix`가 전부 `false`로 남는다.
 * 그때 “어드민에서 전부 체크”와 무관하게 상단이 비는 현상이 난다 → **조회 실패·역할에 허용 0건**이면 `getAccessibleMenus`로 내비만 복구.
 */
export function useTopMenuSectionVisibility() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading, isError } = usePermissionMatrix();

  return useMemo(() => {
    const matrix = data?.data ?? [];
    const hasAnyFeatureForRole =
      !isError &&
      role &&
      role !== 'ADMIN' &&
      matrix.some((m) => m.permissions[role as UserRole] === true);

    const showSectionForMenuKey = (menuKey: string): boolean => {
      if (!role) return false;
      // 매트릭스 로딩 중: ADMIN이면 바로 표시, 그 외 역할은 로딩 완료까지 숨김
      if (isLoading) return role === 'ADMIN';
      if (role === 'ADMIN') return true;
      // 매트릭스 없음(오류) 또는 이 역할에 true가 전혀 없음(미반영) → roleHelper 기본 메뉴
      if (isError || !hasAnyFeatureForRole) {
        return (getAccessibleMenus(role as UserRole) as string[]).includes(menuKey);
      }
      const category = CATEGORY_BY_MENU_KEY[menuKey];
      if (!category) return true;
      const codes = featureCodesForCategory(category);
      if (codes.length === 0) return false;
      return codes.some((code) => {
        const row = matrix.find((m) => m.featureCode === code);
        return row?.permissions[role as UserRole] ?? false;
      });
    };

    return {
      isLoading,
      showMenuKey: showSectionForMenuKey,
    };
  }, [data?.data, isError, isLoading, role]);
}
