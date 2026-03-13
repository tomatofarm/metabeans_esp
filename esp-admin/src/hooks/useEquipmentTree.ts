import { mockStoreTree } from '../api/mock/common.mock';
import type { StoreTreeNode } from '../types/equipment.types';

/**
 * 장비 트리 데이터 훅 (Phase 1: Mock 기반)
 * Phase 2에서 TanStack Query로 교체
 */
export function useEquipmentTree(): {
  data: StoreTreeNode[];
  isLoading: boolean;
} {
  return {
    data: mockStoreTree,
    isLoading: false,
  };
}
