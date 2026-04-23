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
 * 로딩 중에는 메뉴를 숨겨 "잠깐 보였다 사라지는" 깜빡임을 방지한다.
 * ADMIN은 매트릭스 로딩 완료 후에도 항상 모든 섹터 표시.
 */
export function useTopMenuSectionVisibility() {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = usePermissionMatrix();

  return useMemo(() => {
    const matrix = data?.data ?? [];

    const showSectionForMenuKey = (menuKey: string): boolean => {
      if (!role) return false;
      // 매트릭스 로딩 중: ADMIN이면 바로 표시, 그 외 역할은 로딩 완료까지 숨김
      if (isLoading) return role === 'ADMIN';
      const category = CATEGORY_BY_MENU_KEY[menuKey];
      if (!category) return true;
      const codes = featureCodesForCategory(category);
      if (codes.length === 0) return false;
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
  }, [data?.data, isLoading, role]);
}
