import dayjs from 'dayjs';
import type {
  CustomerListItem,
  CustomerDetail,
  CustomerMapItem,
  CustomerListParams,
  CustomerUpdateRequest,
  CustomerEquipmentItem,
} from '../../types/customer.types';
import { mockDelay, wrapResponse, type ApiResponse } from './common.mock';

// --- Mock 고객(매장) 데이터 ---

const mockCustomers: CustomerListItem[] = [
  {
    storeId: 1,
    siteId: 'site-001',
    storeName: '김밥천국 강남점',
    ownerName: '김점주',
    address: '서울특별시 강남구 테헤란로 123',
    latitude: 37.5012,
    longitude: 127.0396,
    phone: '02-1234-5678',
    businessType: '한식',
    equipmentCount: 3,
    status: 'ACTIVE',
    dealerName: '서울환경테크',
    registeredAt: '2025-06-01T00:00:00Z',
  },
  {
    storeId: 2,
    siteId: 'site-002',
    storeName: '맛있는 중화 홍대점',
    ownerName: '이중화',
    address: '서울특별시 마포구 홍익로 67',
    latitude: 37.5568,
    longitude: 126.9237,
    phone: '02-2345-6789',
    businessType: '중식',
    equipmentCount: 2,
    status: 'ACTIVE',
    dealerName: '서울환경테크',
    registeredAt: '2025-07-15T00:00:00Z',
  },
  {
    storeId: 3,
    siteId: 'site-003',
    storeName: '빈스카페 신촌점',
    ownerName: '박카페',
    address: '서울특별시 서대문구 연세로 30',
    latitude: 37.5598,
    longitude: 126.9425,
    phone: '02-3456-7890',
    businessType: '커피로스팅',
    equipmentCount: 2,
    status: 'ACTIVE',
    dealerName: '서울환경테크',
    registeredAt: '2025-08-01T00:00:00Z',
  },
  {
    storeId: 4,
    siteId: 'site-004',
    storeName: '우동천하 종로점',
    ownerName: '최우동',
    address: '서울특별시 종로구 종로 100',
    latitude: 37.5700,
    longitude: 126.9832,
    phone: '02-4567-8901',
    businessType: '일식',
    equipmentCount: 1,
    status: 'ACTIVE',
    dealerName: '경기설비',
    registeredAt: '2025-09-10T00:00:00Z',
  },
  {
    storeId: 5,
    siteId: 'site-005',
    storeName: '화덕피자 이태원점',
    ownerName: '정피자',
    address: '서울특별시 용산구 이태원로 200',
    latitude: 37.5345,
    longitude: 126.9946,
    phone: '02-5678-9012',
    businessType: '양식',
    equipmentCount: 2,
    status: 'INACTIVE',
    dealerName: '서울환경테크',
    registeredAt: '2025-06-20T00:00:00Z',
  },
  {
    storeId: 6,
    siteId: 'site-006',
    storeName: '떡볶이 명가 신림점',
    ownerName: '한분식',
    address: '서울특별시 관악구 신림로 350',
    latitude: 37.4847,
    longitude: 126.9297,
    phone: '02-6789-0123',
    businessType: '분식',
    equipmentCount: 1,
    status: 'ACTIVE',
    dealerName: '경기설비',
    registeredAt: '2025-10-05T00:00:00Z',
  },
  {
    storeId: 7,
    siteId: 'site-007',
    storeName: '바비큐빌리지 수원점',
    ownerName: '강바비',
    address: '경기도 수원시 팔달구 인계로 150',
    latitude: 37.2636,
    longitude: 127.0286,
    phone: '031-1234-5678',
    businessType: '한식',
    equipmentCount: 4,
    status: 'ACTIVE',
    dealerName: '경기설비',
    registeredAt: '2025-07-01T00:00:00Z',
  },
  {
    storeId: 8,
    siteId: 'site-008',
    storeName: '더버거 판교점',
    ownerName: '윤버거',
    address: '경기도 성남시 분당구 판교로 256',
    latitude: 37.3947,
    longitude: 127.1112,
    phone: '031-2345-6789',
    businessType: '패스트푸드',
    equipmentCount: 2,
    status: 'ACTIVE',
    dealerName: '경기설비',
    registeredAt: '2025-08-20T00:00:00Z',
  },
  {
    storeId: 9,
    siteId: 'site-009',
    storeName: '고기리막국수 일산점',
    ownerName: '배막국',
    address: '경기도 고양시 일산동구 중앙로 1200',
    latitude: 37.6584,
    longitude: 126.7730,
    phone: '031-3456-7890',
    businessType: '한식',
    equipmentCount: 1,
    status: 'INACTIVE',
    dealerName: '인천환경서비스',
    registeredAt: '2025-05-15T00:00:00Z',
  },
  {
    storeId: 10,
    siteId: 'site-010',
    storeName: '해물찜 인천점',
    ownerName: '오해물',
    address: '인천광역시 남동구 구월로 180',
    latitude: 37.4499,
    longitude: 126.7052,
    phone: '032-1234-5678',
    businessType: '한식',
    equipmentCount: 2,
    status: 'ACTIVE',
    dealerName: '인천환경서비스',
    registeredAt: '2025-09-01T00:00:00Z',
  },
  {
    storeId: 11,
    siteId: 'site-011',
    storeName: '라멘공방 강동점',
    ownerName: '송라멘',
    address: '서울특별시 강동구 천호대로 1080',
    latitude: 37.5387,
    longitude: 127.1237,
    phone: '02-7890-1234',
    businessType: '일식',
    equipmentCount: 1,
    status: 'ACTIVE',
    dealerName: '서울환경테크',
    registeredAt: '2025-11-01T00:00:00Z',
  },
  {
    storeId: 12,
    siteId: 'site-012',
    storeName: '뷔페월드 잠실점',
    ownerName: '임뷔페',
    address: '서울특별시 송파구 올림픽로 300',
    latitude: 37.5139,
    longitude: 127.1001,
    phone: '02-8901-2345',
    businessType: '뷔페',
    equipmentCount: 5,
    status: 'ACTIVE',
    dealerName: '서울환경테크',
    registeredAt: '2025-06-10T00:00:00Z',
  },
  {
    storeId: 13,
    siteId: 'site-013',
    storeName: '카페모카 부산점',
    ownerName: '조카페',
    address: '부산광역시 해운대구 해운대로 500',
    latitude: 35.1631,
    longitude: 129.1635,
    phone: '051-1234-5678',
    businessType: '카페',
    equipmentCount: 1,
    status: 'INACTIVE',
    dealerName: '부산환경설비',
    registeredAt: '2025-10-20T00:00:00Z',
  },
  {
    storeId: 14,
    siteId: 'site-014',
    storeName: '치킨마을 대구점',
    ownerName: '유치킨',
    address: '대구광역시 중구 동성로 80',
    latitude: 35.8714,
    longitude: 128.5963,
    phone: '053-1234-5678',
    businessType: '기타',
    equipmentCount: 2,
    status: 'ACTIVE',
    dealerName: '대구환경설비',
    registeredAt: '2025-11-15T00:00:00Z',
  },
  {
    storeId: 15,
    siteId: 'site-015',
    storeName: '로스터리 성수점',
    ownerName: '권로스',
    address: '서울특별시 성동구 성수이로 100',
    latitude: 37.5445,
    longitude: 127.0569,
    phone: '02-9012-3456',
    businessType: '커피로스팅',
    equipmentCount: 3,
    status: 'ACTIVE',
    dealerName: '서울환경테크',
    registeredAt: '2025-12-01T00:00:00Z',
  },
];

// --- Mock 대리점 옵션 ---

export interface CustomerDealerOption {
  dealerId: number;
  dealerName: string;
}

const mockDealerOptions: CustomerDealerOption[] = [
  { dealerId: 1, dealerName: '서울환경테크' },
  { dealerId: 2, dealerName: '경기설비' },
  { dealerId: 3, dealerName: '인천환경서비스' },
  { dealerId: 4, dealerName: '부산환경설비' },
  { dealerId: 5, dealerName: '대구환경설비' },
];

// --- Mock 장비 데이터 (고객 상세용) ---

const mockEquipmentsByStore: Record<number, CustomerEquipmentItem[]> = {
  1: [
    { equipmentId: 1, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 2, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 3, equipmentName: 'ESP 집진기 #3', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
  ],
  2: [
    { equipmentId: 4, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 5, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
  ],
  3: [
    { equipmentId: 6, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
    { equipmentId: 7, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
  ],
  4: [
    { equipmentId: 8, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-1000', status: 'ACTIVE' },
  ],
  5: [
    { equipmentId: 9, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-3000', status: 'INACTIVE' },
    { equipmentId: 10, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-2000', status: 'INACTIVE' },
  ],
  6: [
    { equipmentId: 11, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-1000', status: 'ACTIVE' },
  ],
  7: [
    { equipmentId: 12, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 13, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 14, equipmentName: 'ESP 집진기 #3', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
    { equipmentId: 15, equipmentName: 'ESP 집진기 #4', modelName: 'MB-ESP-1000', status: 'ACTIVE' },
  ],
  8: [
    { equipmentId: 16, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
    { equipmentId: 17, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
  ],
  9: [
    { equipmentId: 18, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-1000', status: 'INACTIVE' },
  ],
  10: [
    { equipmentId: 19, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
    { equipmentId: 20, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
  ],
  11: [
    { equipmentId: 21, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-1000', status: 'ACTIVE' },
  ],
  12: [
    { equipmentId: 22, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 23, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 24, equipmentName: 'ESP 집진기 #3', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 25, equipmentName: 'ESP 집진기 #4', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
    { equipmentId: 26, equipmentName: 'ESP 집진기 #5', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
  ],
  13: [
    { equipmentId: 27, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-1000', status: 'INACTIVE' },
  ],
  14: [
    { equipmentId: 28, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
    { equipmentId: 29, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
  ],
  15: [
    { equipmentId: 30, equipmentName: 'ESP 집진기 #1', modelName: 'MB-ESP-3000', status: 'ACTIVE' },
    { equipmentId: 31, equipmentName: 'ESP 집진기 #2', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
    { equipmentId: 32, equipmentName: 'ESP 집진기 #3', modelName: 'MB-ESP-2000', status: 'ACTIVE' },
  ],
};

// --- Mock 점주 정보 ---

const mockOwnerInfo: Record<number, { name: string; email: string; phone: string }> = {
  1: { name: '김점주', email: 'kim@example.com', phone: '010-1111-2222' },
  2: { name: '이중화', email: 'lee@example.com', phone: '010-2222-3333' },
  3: { name: '박카페', email: 'park@example.com', phone: '010-3333-4444' },
  4: { name: '최우동', email: 'choi@example.com', phone: '010-4444-5555' },
  5: { name: '정피자', email: 'jung@example.com', phone: '010-5555-6666' },
  6: { name: '한분식', email: 'han@example.com', phone: '010-6666-7777' },
  7: { name: '강바비', email: 'kang@example.com', phone: '010-7777-8888' },
  8: { name: '윤버거', email: 'yoon@example.com', phone: '010-8888-9999' },
  9: { name: '배막국', email: 'bae@example.com', phone: '010-9999-0000' },
  10: { name: '오해물', email: 'oh@example.com', phone: '010-1010-2020' },
  11: { name: '송라멘', email: 'song@example.com', phone: '010-1111-3333' },
  12: { name: '임뷔페', email: 'lim@example.com', phone: '010-1212-3434' },
  13: { name: '조카페', email: 'jo@example.com', phone: '010-1313-4545' },
  14: { name: '유치킨', email: 'yu@example.com', phone: '010-1414-5656' },
  15: { name: '권로스', email: 'kwon@example.com', phone: '010-1515-6767' },
};

// --- Mock 메모 ---

const mockMemos: Record<number, string> = {
  5: '장비 노후화로 인한 비활성 전환. 교체 예정.',
  9: '매장 리모델링 중. 2026년 3월 재오픈 예정.',
  13: '계약 종료.',
};

// --- 지역 추출 헬퍼 ---

function extractRegion(address: string): string {
  if (address.startsWith('서울')) return '서울';
  if (address.startsWith('경기')) return '경기';
  if (address.startsWith('인천')) return '인천';
  if (address.startsWith('부산')) return '부산';
  if (address.startsWith('대구')) return '대구';
  if (address.startsWith('광주')) return '광주';
  if (address.startsWith('대전')) return '대전';
  return '기타';
}

// --- 대리점 이름→ID 매핑 ---

function getDealerIdByName(dealerName: string): number | undefined {
  return mockDealerOptions.find((d) => d.dealerName === dealerName)?.dealerId;
}

// --- Mock API 함수 ---

// 고객 목록 조회
export async function mockGetCustomerList(
  params?: CustomerListParams,
): Promise<ApiResponse<CustomerListItem[]>> {
  let filtered = [...mockCustomers];

  if (params?.search) {
    const keyword = params.search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.storeName.toLowerCase().includes(keyword) ||
        c.ownerName.toLowerCase().includes(keyword),
    );
  }
  if (params?.status) {
    filtered = filtered.filter((c) => c.status === params.status);
  }
  if (params?.region) {
    filtered = filtered.filter((c) => extractRegion(c.address) === params.region);
  }
  if (params?.dealerId) {
    const dealer = mockDealerOptions.find((d) => d.dealerId === params.dealerId);
    if (dealer) {
      filtered = filtered.filter((c) => c.dealerName === dealer.dealerName);
    }
  }

  // 정렬
  const sortBy = params?.sortBy ?? 'registeredAt';
  const sortOrder = params?.sortOrder ?? 'desc';
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'storeName') {
      cmp = a.storeName.localeCompare(b.storeName);
    } else if (sortBy === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else {
      cmp = dayjs(a.registeredAt).valueOf() - dayjs(b.registeredAt).valueOf();
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return mockDelay(
    wrapResponse(paged, { page, pageSize, totalCount: filtered.length }),
    400,
  );
}

// 고객 상세 조회
export async function mockGetCustomerDetail(
  storeId: number,
): Promise<ApiResponse<CustomerDetail | null>> {
  const customer = mockCustomers.find((c) => c.storeId === storeId);
  if (!customer) {
    return mockDelay(wrapResponse(null), 300);
  }

  const detail: CustomerDetail = {
    storeId: customer.storeId,
    siteId: customer.siteId,
    storeName: customer.storeName,
    businessType: customer.businessType,
    address: customer.address,
    latitude: customer.latitude,
    longitude: customer.longitude,
    phone: customer.phone,
    status: customer.status,
    dealerId: getDealerIdByName(customer.dealerName),
    dealerName: customer.dealerName,
    memo: mockMemos[customer.storeId],
    registeredAt: customer.registeredAt,
    updatedAt: dayjs(customer.registeredAt).add(30, 'day').toISOString(),
    owner: mockOwnerInfo[customer.storeId] ?? { name: '-', email: '-', phone: '-' },
    equipments: mockEquipmentsByStore[customer.storeId] ?? [],
  };

  return mockDelay(wrapResponse(detail), 400);
}

// 고객 정보 수정
export async function mockUpdateCustomer(
  storeId: number,
  data: CustomerUpdateRequest,
): Promise<ApiResponse<{ success: boolean }>> {
  const customer = mockCustomers.find((c) => c.storeId === storeId);
  if (customer) {
    if (data.storeName !== undefined) customer.storeName = data.storeName;
    if (data.address !== undefined) customer.address = data.address;
    if (data.latitude !== undefined) customer.latitude = data.latitude;
    if (data.longitude !== undefined) customer.longitude = data.longitude;
    if (data.phone !== undefined) customer.phone = data.phone;
    if (data.businessType !== undefined) customer.businessType = data.businessType;
    if (data.status !== undefined) customer.status = data.status;
    if (data.dealerId !== undefined) {
      const dealer = mockDealerOptions.find((d) => d.dealerId === data.dealerId);
      if (dealer) customer.dealerName = dealer.dealerName;
    }
    if (data.memo !== undefined) {
      mockMemos[storeId] = data.memo;
    }
  }
  return mockDelay(wrapResponse({ success: true }), 500);
}

// 지도 마커 데이터 조회
export async function mockGetCustomerMapData(): Promise<ApiResponse<CustomerMapItem[]>> {
  const mapData: CustomerMapItem[] = mockCustomers.map((c) => ({
    storeId: c.storeId,
    storeName: c.storeName,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
    status: c.status,
    equipmentCount: c.equipmentCount,
  }));

  return mockDelay(wrapResponse(mapData), 300);
}

// 대리점 옵션 조회
export async function mockGetCustomerDealerOptions(): Promise<CustomerDealerOption[]> {
  return mockDelay(mockDealerOptions, 200);
}

// 지역 옵션 (필터용)
export const REGION_OPTIONS = [
  { value: '서울', label: '서울' },
  { value: '경기', label: '경기' },
  { value: '인천', label: '인천' },
  { value: '부산', label: '부산' },
  { value: '대구', label: '대구' },
  { value: '광주', label: '광주' },
  { value: '대전', label: '대전' },
];
