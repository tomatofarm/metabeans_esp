import type { StoreStatus } from './store.types';

// 고객(매장) 목록 아이템
export interface CustomerListItem {
  storeId: number;
  siteId: string;
  storeName: string;
  /** 매장본사(프랜차이즈/브랜드) — 목록·지도 팝업 표시용 */
  hqName?: string;
  ownerName: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  businessType: string;
  equipmentCount: number;
  status: StoreStatus;
  dealerName: string;
  registeredAt: string;
}

// 고객 상세 정보
export interface CustomerDetail {
  storeId: number;
  siteId: string;
  storeName: string;
  brandName?: string;
  businessType: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  status: StoreStatus;
  dealerId?: number;
  dealerName?: string;
  hqId?: number;
  hqName?: string;
  memo?: string;
  registeredAt: string;
  updatedAt: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  equipments: CustomerEquipmentItem[];
}

// 고객 상세 내 장비 요약
export interface CustomerEquipmentItem {
  equipmentId: number;
  equipmentName: string;
  modelName: string;
  status: StoreStatus;
}

// 고객 수정 요청
export interface CustomerUpdateRequest {
  storeName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  businessType?: string;
  status?: StoreStatus;
  dealerId?: number;
  memo?: string;
}

// 지도 마커 데이터
export interface CustomerMapItem {
  storeId: number;
  storeName: string;
  hqName?: string;
  address: string;
  latitude: number;
  longitude: number;
  status: StoreStatus;
  equipmentCount: number;
}

// 고객 목록 필터
export interface CustomerListParams {
  search?: string;
  status?: StoreStatus;
  /** 매장본사명 필터 */
  hqName?: string;
  region?: string;
  dealerId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
