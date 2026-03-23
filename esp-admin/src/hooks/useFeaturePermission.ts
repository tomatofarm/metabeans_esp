import { useMemo } from 'react';
import { usePermissionMatrix } from '../api/system.api';
import { useAuthStore } from '../stores/authStore';
import type { FeatureCode } from '../types/system.types';

/**
 * 시스템 권한 매트릭스 기반 기능 접근 권한 조회
 * - role + featureCode 조합으로 현재 로그인 사용자의 허용 여부를 반환
 */
export function useFeaturePermission(featureCode: FeatureCode) {
  const role = useAuthStore((s) => s.user?.role);
  const { data, isLoading } = usePermissionMatrix();

  const isAllowed = useMemo(() => {
    if (!role) return false;
    const matrix = data?.data ?? [];
    const row = matrix.find((m) => m.featureCode === featureCode);
    return row?.permissions[role] ?? false;
  }, [data?.data, featureCode, role]);

  return { isAllowed, isLoading };
}

