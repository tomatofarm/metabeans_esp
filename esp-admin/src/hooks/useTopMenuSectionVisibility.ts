import { useMemo } from 'react';
import { usePermissionMatrix } from '../api/system.api';
import { useAuthStore } from '../stores/authStore';
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
 * 로딩 중에는 낙관적으로 모두 표시. ADMIN은 항상 해당 섹터 표시.
 */
export function useTopMenuSectionVisibility() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = usePermissionMatrix();
  const matrix = data?.data ?? [];

  return useMemo(() => {
    const showSectionForMenuKey = (menuKey: string): boolean => {
      if (!role) return false;
      const category = CATEGORY_BY_MENU_KEY[menuKey];
      if (!category) return true;
      const codes = featureCodesForCategory(category);
      if (codes.length === 0) return false;
      if (isLoading) return true;
      if (role === 'ADMIN') return true;
      return codes.some((code) => {
        const row = matrix.find((m) => m.featureCode === code);
        return row?.permissions[role as UserRole] ?? false;
      });
    };

    return {
      isLoading,
      showMenuKey: showSectionForMenuKey,
    };
  }, [isLoading, matrix, role]);
}
