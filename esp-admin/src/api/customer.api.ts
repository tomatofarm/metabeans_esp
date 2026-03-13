import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  mockGetCustomerList,
  mockGetCustomerDetail,
  mockUpdateCustomer,
  mockGetCustomerMapData,
  mockGetCustomerDealerOptions,
} from './mock/customer.mock';
import type { CustomerListParams, CustomerUpdateRequest } from '../types/customer.types';

// 고객 목록 조회
export function useCustomerList(params?: CustomerListParams) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => mockGetCustomerList(params),
    staleTime: 30 * 1000,
  });
}

// 고객 상세 조회
export function useCustomerDetail(storeId: number | null) {
  return useQuery({
    queryKey: ['customer-detail', storeId],
    queryFn: () => mockGetCustomerDetail(storeId!),
    enabled: storeId !== null,
    staleTime: 30 * 1000,
  });
}

// 고객 정보 수정
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, data }: { storeId: number; data: CustomerUpdateRequest }) =>
      mockUpdateCustomer(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-detail'] });
      queryClient.invalidateQueries({ queryKey: ['customer-map'] });
    },
  });
}

// 지도 마커 데이터 조회
export function useCustomerMapData() {
  return useQuery({
    queryKey: ['customer-map'],
    queryFn: () => mockGetCustomerMapData(),
    staleTime: 60 * 1000,
  });
}

// 대리점 옵션 조회
export function useCustomerDealerOptions() {
  return useQuery({
    queryKey: ['customer-dealer-options'],
    queryFn: () => mockGetCustomerDealerOptions(),
    staleTime: 5 * 60 * 1000,
  });
}
