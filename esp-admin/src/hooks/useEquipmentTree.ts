import { useQuery } from '@tanstack/react-query';
import { mockStoreTree } from '../api/mock/common.mock';
import { apiRequest } from '../api/real/apiHelpers';
import type { StoreTreeNode } from '../types/equipment.types';

const useRealApi =
  import.meta.env.VITE_USE_MOCK_API !== 'true' && Boolean(import.meta.env.VITE_API_BASE_URL?.trim());

export function useEquipmentTree(): {
  data: StoreTreeNode[];
  isLoading: boolean;
} {
  const q = useQuery({
    queryKey: ['equipment-tree'],
    queryFn: () =>
      useRealApi ? apiRequest<StoreTreeNode[]>({ method: 'get', url: '/dashboard/store-tree' }) : Promise.resolve(mockStoreTree),
    staleTime: 30 * 1000,
  });

  return {
    data: q.data ?? [],
    isLoading: q.isLoading,
  };
}
