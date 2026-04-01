import { useMemo } from 'react';
import { usePermissionMatrix } from '../api/system.api';
import { useAuthStore } from '../stores/authStore';
import type { FeatureCode } from '../types/system.types';

/**
 * 시스템 권한 매트릭스 기반 기능 접근 권한 조회
 * - ADMIN: 매트릭스와 무관하게 항상 허용
 * - 그 외 역할: 어드민이 설정한 매트릭스만 적용 (역할별 코드 하드코딩 없음)
 */
export function useFeaturePermission(featureCode: FeatureCode) {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = usePermissionMatrix();

  const isAllowed = useMemo(() => {
    if (!role) return false;
    if (role === 'ADMIN') return true;
    const matrix = data?.data ?? [];
    const row = matrix.find((m) => m.featureCode === featureCode);
    return row?.permissions[role] ?? false;
  }, [data?.data, featureCode, role]);

  return { isAllowed, isLoading };
}

