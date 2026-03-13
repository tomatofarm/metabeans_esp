// 업종 타입
export type BusinessType = '튀김' | '굽기' | '볶음' | '복합' | '커피로스팅';

// 매장 상태
export type StoreStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

// 매장 등록 방법
export type RegisteredBy = 'OWNER' | 'DEALER' | 'ADMIN';

// 매장 정보 (stores 테이블)
export interface Store {
  storeId: number;
  siteId: string;
  storeName: string;
  brandName?: string;
  businessType?: BusinessType;
  address: string;
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  districtCode?: string;
  ownerId?: number;
  hqId?: number;
  dealerId?: number;
  contactName?: string;
  contactPhone?: string;
  floorCount: number;
  status: StoreStatus;
  registeredBy: RegisteredBy;
  createdAt: string;
  updatedAt: string;
}

// 매장 층 정보 (store_floors 테이블)
export interface StoreFloor {
  floorId: number;
  storeId: number;
  floorCode: string;
  floorName?: string;
}
